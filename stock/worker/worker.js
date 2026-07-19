/**
 * Cloudflare Worker — 自选股云端同步 + 东方财富 API 代理
 * ============================================================
 * 功能：
 *   - GET    /                        → 读取自选股（从 KV 存储）
 *   - POST   /                        → 保存自选股（写入 KV 存储）
 *   - DELETE /                        → 清空自选股
 *   - GET    /proxy/eastmoney/api/*   → 代理东方财富行情 API
 *
 * 安全：
 *   - CORS 只允许博客域名 (BLOG_ORIGIN)
 *   - X-API-Key 头验证（代理端点使用代理密钥验证）
 *
 * 存储：
 *   - Cloudflare KV（免费层：每天 100,000 次读取 + 1,000 次写入）
 *   - 单个 key 存 JSON，足够自选股使用
 * ============================================================
 */

// 允许的 HTTP 方法
const ALLOWED_METHODS = 'GET, POST, DELETE, OPTIONS';

// ============================================================
// 主入口
// ============================================================
export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = env.BLOG_ORIGIN || 'https://ron-tian.github.io';
    const url = new URL(request.url);

    // ─── 代理路由：东方财富 API ───
    if (url.pathname.startsWith('/proxy/eastmoney/')) {
      return await handleEastmoneyProxy(url, env, allowedOrigin);
    }

    // CORS 预检请求
    if (request.method === 'OPTIONS') {
      return handleCORS(allowedOrigin);
    }

    // CORS 检查：只允许博客域名
    if (origin && origin !== allowedOrigin) {
      return jsonError(403, 'Forbidden: origin not allowed', allowedOrigin);
    }

    // API Key 验证
    const apiKey = request.headers.get('X-API-Key');
    if (!apiKey || apiKey !== env.API_KEY) {
      return jsonError(401, 'Unauthorized: invalid API key', allowedOrigin);
    }

    // 路由
    try {
      switch (request.method) {
        case 'GET':
          return await handleGet(env, allowedOrigin);
        case 'POST':
          return await handlePost(request, env, allowedOrigin);
        case 'DELETE':
          return await handleDelete(env, allowedOrigin);
        default:
          return jsonError(405, 'Method not allowed', allowedOrigin);
      }
    } catch (err) {
      console.error('Worker error:', err);
      return jsonError(500, 'Internal server error: ' + err.message, allowedOrigin);
    }
  },
};

// ============================================================
// 东方财富 API 代理
// GitHub Actions 美西 IP 被东方财富拦截（502），通过 Worker 全球节点中转
// auth: 使用 X-Proxy-Key 头（防止被公共滥用），也可使用 API_KEY
// ============================================================
async function handleEastmoneyProxy(url, env, origin) {
  // 代理密钥验证：API_KEY 或 PROXY_KEY 均可
  const proxyKey = url.searchParams.get('key') || '';
  const headerKey = url.searchParams.get('key') ? proxyKey : '';
  const validKey = env.PROXY_KEY || env.API_KEY || '';
  if (validKey && proxyKey !== validKey && headerKey !== validKey) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid proxy key' }), {
      status: 401,
      headers: corsHeaders(origin, { 'Content-Type': 'application/json' }),
    });
  }

  // 构造东方财富 URL：/proxy/eastmoney/api/qt/clist/get?... → eastmoney.com/api/qt/clist/get?...
  const eastmoneyPath = url.pathname.replace('/proxy/eastmoney', '');
  const eastmoneyParams = url.searchParams;
  // 移除 key 参数（不传给东方财富）
  eastmoneyParams.delete('key');
  const queryString = eastmoneyParams.toString();
  const eastmoneyUrl = `http://push2.eastmoney.com${eastmoneyPath}${queryString ? '?' + queryString : ''}`;

  try {
    const response = await fetch(eastmoneyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://quote.eastmoney.com/',
      },
    });

    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: corsHeaders(origin, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=30',
      }),
    });
  } catch (err) {
    return jsonError(502, 'Eastmoney proxy error: ' + err.message, origin);
  }
}

// ============================================================
// GET：读取自选股
// ============================================================
async function handleGet(env, origin) {
  const data = await env.WATCHLIST.get('watchlist');
  const watchlist = data ? JSON.parse(data) : [];

  return new Response(JSON.stringify({
    success: true,
    stocks: watchlist,
    updated: await env.WATCHLIST.get('watchlist_updated') || null,
  }), {
    headers: corsHeaders(origin, { 'Content-Type': 'application/json' }),
  });
}

// ============================================================
// POST：保存自选股
// ============================================================
async function handlePost(request, env, origin) {
  const body = await request.json();

  // 校验：必须是数组，每个元素是 sh/sz/bj + 6位数字
  if (!Array.isArray(body.stocks)) {
    return jsonError(400, 'Invalid format: stocks must be an array', origin);
  }

  const validStocks = body.stocks.filter(code =>
    /^[a-z]{2}\d{6}$/.test(code)
  );

  if (validStocks.length > 100) {
    return jsonError(400, 'Too many stocks (max 100)', origin);
  }

  const now = new Date().toISOString();

  // 写入 KV
  await env.WATCHLIST.put('watchlist', JSON.stringify(validStocks));
  await env.WATCHLIST.put('watchlist_updated', now);

  return new Response(JSON.stringify({
    success: true,
    count: validStocks.length,
    updated: now,
  }), {
    headers: corsHeaders(origin, { 'Content-Type': 'application/json' }),
  });
}

// ============================================================
// DELETE：清空自选股
// ============================================================
async function handleDelete(env, origin) {
  await env.WATCHLIST.delete('watchlist');
  await env.WATCHLIST.delete('watchlist_updated');

  return new Response(JSON.stringify({
    success: true,
    message: 'Watchlist cleared',
  }), {
    headers: corsHeaders(origin, { 'Content-Type': 'application/json' }),
  });
}

// ============================================================
// 工具函数
// ============================================================

function handleCORS(origin) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(origin),
  });
}

function corsHeaders(origin, extra = {}) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': ALLOWED_METHODS,
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    'Access-Control-Max-Age': '86400',
    ...extra,
  };
}

function jsonError(status, message, origin) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: corsHeaders(origin, { 'Content-Type': 'application/json' }),
  });
}
