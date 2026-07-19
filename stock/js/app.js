/* ──────────────────────────────────────────────────────────
   股票每日分析 - 纯静态前端逻辑（无需后端代理）
   数据源：腾讯公开行情接口 qt.gtimg.cn（已开启 CORS）
   兜底：Script 标签注入（绕过 CORS）+ 第三方代理
   ────────────────────────────────────────────────────────── */

// ─── 常量 ───
const INDICES = ['sh000001', 'sz399001', 'sz399006', 'sh000300', 'sh000016'];
const INDEX_NAMES = {
  'sh000001': '上证指数',
  'sz399001': '深证成指',
  'sz399006': '创业板指',
  'sh000300': '沪深300',
  'sh000016': '上证50',
};

// 第三方 CORS 代理（仅作最后兜底，不太可靠）
const CORS_PROXIES = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`,
];

// ─── 自选股管理（localStorage 持久化） ───
const STORAGE_KEY = 'xiaowuzi_stock_watchlist'; // 带项目前缀，避免与其他站点冲突

function getWatchlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveWatchlist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function addToWatchlist(code) {
  code = code.trim().toLowerCase();
  if (!code) return;
  const list = getWatchlist();
  if (list.includes(code)) {
    showToast('已在自选股中：' + code);
    return;
  }
  list.push(code);
  saveWatchlist(list);
  refreshAll();
  showToast('已添加：' + code);
}

function removeFromWatchlist(code) {
  let list = getWatchlist();
  list = list.filter((c) => c !== code);
  saveWatchlist(list);
  refreshAll();
}

// 导出自选股（生成分享链接）
function exportWatchlist() {
  const list = getWatchlist();
  if (list.length === 0) {
    showToast('自选股为空，无可导出内容');
    return;
  }
  // 生成带自选股的分享URL
  const shareUrl = window.location.origin + window.location.pathname + '?watchlist=' + list.join(',');
  const text = list.join(',');
  // 尝试复制到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast(`已复制 ${list.length} 只自选股的分享链接`);
    }).catch(() => {
      prompt('请手动复制分享链接（含自选股，换设备打开即可）：', shareUrl);
    });
  } else {
    prompt('请手动复制分享链接：', shareUrl);
  }
}

// 从URL参数加载自选股（跨设备迁移）
function loadWatchlistFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const watchlistParam = params.get('watchlist');
    if (!watchlistParam) return false;

    const codes = watchlistParam
      .split(/[,\n\r\s]+/)
      .map(c => c.trim().toLowerCase())
      .filter(c => /^[a-z]{2}\d{6}$/.test(c));

    if (codes.length === 0) return false;

    const existing = getWatchlist();
    let added = 0;
    for (const code of codes) {
      if (!existing.includes(code)) {
        existing.push(code);
        added++;
      }
    }
    saveWatchlist(existing);
    // 清理URL参数，避免重复导入
    const url = new URL(window.location.href);
    url.searchParams.delete('watchlist');
    window.history.replaceState({}, '', url.toString());
    showToast(`已从链接导入 ${added} 只自选股，共 ${existing.length} 只`);
    return true;
  } catch (e) {
    console.warn('URL参数解析失败:', e);
    return false;
  }
}

// 导入自选股（从文本解析，逗号或换行分隔）
function importWatchlist() {
  const text = prompt('请输入股票代码（逗号或换行分隔）：\n如：sh601318, sz000001, sh600519');
  if (!text || !text.trim()) return;

  const codes = text
    .split(/[,\n\r\s]+/)
    .map(c => c.trim().toLowerCase())
    .filter(c => /^[a-z]{2}\d{6}$/.test(c)); // 验证格式：sh/sz/bj + 6位数字

  if (codes.length === 0) {
    showToast('未识别到有效代码（格式：sh601318）');
    return;
  }

  const list = getWatchlist();
  let added = 0;
  for (const code of codes) {
    if (!list.includes(code)) {
      list.push(code);
      added++;
    }
  }
  saveWatchlist(list);
  refreshAll();
  showToast(`导入完成：新增 ${added} 只，共 ${list.length} 只`);
}

// 清空自选股
function clearWatchlist() {
  const list = getWatchlist();
  if (list.length === 0) {
    showToast('自选股已为空');
    return;
  }
  if (confirm(`确定清空全部 ${list.length} 只自选股？此操作不可撤销。`)) {
    saveWatchlist([]);
    refreshAll();
    showToast('已清空自选股');
  }
}

// ─── Toast 提示 ───
function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: #222633; color: #e4e6eb; padding: 10px 20px;
      border-radius: 8px; font-size: 14px; z-index: 9999;
      border: 1px solid #2a2e3c; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transition: opacity 0.3s; opacity: 0;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// ─── 数据解析（腾讯行情格式） ───
function parseTencentFields(fields, code) {
  if (!fields || fields.length < 10) return null;
  const price = parseFloat(fields[3]);
  const prevClose = parseFloat(fields[4]);
  if (isNaN(price) || price === 0) return null;

  const change = price - prevClose;
  const changePercent = prevClose ? (change / prevClose * 100) : 0;

  return {
    code: code,
    market: fields[0],
    name: fields[1],
    symbol: fields[2],
    price: price,
    prevClose: prevClose,
    change: parseFloat(change.toFixed(4)),
    changePercent: parseFloat(changePercent.toFixed(4)),
    volume: parseFloat(fields[6]) || 0,
    amount: parseFloat(fields[37]) || parseFloat(fields[8]) || 0,
    date: fields[30] || '',
  };
}

function parseTencentText(raw, codes) {
  const results = [];
  for (const code of codes) {
    const regex = new RegExp(`v_${code}\\s*=\\s*"([^"]*)"`);
    const match = raw.match(regex);
    if (!match) continue;
    const parsed = parseTencentFields(match[1].split('~'), code);
    if (parsed) results.push(parsed);
  }
  return results;
}

// ─── 方式1：直接请求（腾讯接口已开启 CORS） ───
async function fetchDirect(codes) {
  const apiUrl = `https://qt.gtimg.cn/q=${codes.join(',')}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(apiUrl, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const buffer = await res.arrayBuffer();
    const text = new TextDecoder('gbk').decode(buffer);
    return parseTencentText(text, codes);
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// ─── 方式2：Script 标签注入（完全绕过 CORS） ───
function fetchViaScript(codes) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://qt.gtimg.cn/q=${codes.join(',')}`;
    const script = document.createElement('script');
    script.charset = 'gbk';

    const varNames = codes.map((c) => 'v_' + c);
    let settled = false;

    const cleanup = () => {
      clearTimeout(timer);
      if (script.parentNode) script.parentNode.removeChild(script);
      varNames.forEach((vn) => {
        try { delete window[vn]; } catch (e) { window[vn] = undefined; }
      });
    };

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Script 标签请求超时'));
    }, 10000);

    script.onload = () => {
      if (settled) return;
      settled = true;
      const results = [];
      for (let i = 0; i < codes.length; i++) {
        const raw = window[varNames[i]];
        if (!raw || typeof raw !== 'string') continue;
        const parsed = parseTencentFields(raw.split('~'), codes[i]);
        if (parsed) results.push(parsed);
      }
      cleanup();
      if (results.length > 0) resolve(results);
      else reject(new Error('Script 标签未获取到有效数据'));
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Script 标签加载失败'));
    };

    script.src = apiUrl;
    document.head.appendChild(script);
  });
}

// ─── 方式3：第三方 CORS 代理兜底 ───
async function fetchViaProxy(codes) {
  const apiUrl = `https://qt.gtimg.cn/q=${codes.join(',')}`;
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = CORS_PROXIES[i](apiUrl);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const buffer = await res.arrayBuffer();
      const text = new TextDecoder('gbk').decode(buffer);
      const results = parseTencentText(text, codes);
      if (results.length > 0) return results;
    } catch (e) {
      console.warn(`CORS 代理 ${i} 失败:`, e.message);
    }
  }
  return [];
}

// ─── 统一数据获取入口（多重兜底） ───
async function loadQuotes(codes) {
  if (codes.length === 0) return [];

  // 方式1：直接请求
  try {
    const results = await fetchDirect(codes);
    if (results.length > 0) return results;
  } catch (e) {
    console.warn('直接请求失败，尝试 Script 标签:', e.message);
  }

  // 方式2：Script 标签注入
  try {
    const results = await fetchViaScript(codes);
    if (results.length > 0) return results;
  } catch (e) {
    console.warn('Script 标签失败，尝试 CORS 代理:', e.message);
  }

  // 方式3：第三方代理兜底
  try {
    const results = await fetchViaProxy(codes);
    if (results.length > 0) return results;
  } catch (e) {
    console.warn('CORS 代理全部失败:', e.message);
  }

  throw new Error('所有数据源均不可用，请稍后重试');
}

// ─── 分析报告生成（前端） ───
function generateAnalysis(quotes) {
  const reports = quotes.map((q) => {
    const pct = q.changePercent || 0;
    let trend, suggestion;

    if (pct > 5) {
      trend = '强势上涨';
      suggestion = '涨幅较大，注意获利回吐风险，谨慎追高。';
    } else if (pct > 1) {
      trend = '上涨';
      suggestion = '走势偏强，可关注成交量配合情况。';
    } else if (pct > -1) {
      trend = '震荡';
      suggestion = '窄幅震荡，建议观望等待方向选择。';
    } else if (pct > -5) {
      trend = '下跌';
      suggestion = '走势偏弱，注意支撑位，控制仓位。';
    } else {
      trend = '大幅下跌';
      suggestion = '跌幅较大，注意风险，不宜盲目抄底。';
    }

    const amplitude = q.price && q.prevClose
      ? Math.abs(q.price - q.prevClose) / q.prevClose * 100
      : 0;

    return {
      code: q.code,
      name: q.name,
      price: q.price,
      changePercent: pct,
      trend,
      amplitude: amplitude.toFixed(2),
      volume: q.volume,
      amount: q.amount,
      suggestion,
    };
  });

  const upCount = reports.filter((r) => r.changePercent > 0).length;
  const downCount = reports.filter((r) => r.changePercent < 0).length;
  const avgChange = reports.length
    ? (reports.reduce((s, r) => s + r.changePercent, 0) / reports.length).toFixed(2)
    : 0;

  return {
    summary: {
      total: reports.length,
      upCount,
      downCount,
      flatCount: reports.length - upCount - downCount,
      avgChange: parseFloat(avgChange),
      marketTrend: avgChange > 0.5 ? '偏多' : avgChange < -0.5 ? '偏空' : '震荡',
      date: new Date().toLocaleDateString('zh-CN'),
    },
    reports,
  };
}

// ─── 选股（前端） ───
function generatePicks(quotes) {
  return quotes
    .filter((q) => q.price > 0 && q.changePercent > 2 && q.amount > 10000)
    .sort((a, b) => b.changePercent - a.changePercent)
    .map((q) => ({
      code: q.code,
      name: q.name,
      price: q.price,
      changePercent: q.changePercent,
      volume: q.volume,
      amount: q.amount,
      reason: `涨幅 ${q.changePercent.toFixed(2)}%，成交额 ${(q.amount / 10000).toFixed(2)}亿，量价齐升。`,
    }));
}

// ─── 渲染：大盘指数 ───
function renderIndices(data) {
  const grid = document.getElementById('indicesGrid');
  if (!data || data.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><p>行情加载失败，请稍后重试</p></div>`;
    return;
  }
  grid.innerHTML = data.map((q) => {
    const cls = q.changePercent > 0 ? 'up' : q.changePercent < 0 ? 'down' : 'flat';
    const sign = q.changePercent > 0 ? '+' : '';
    return `
      <div class="index-card" data-code="${q.code}">
        <div class="index-name">${INDEX_NAMES[q.code] || q.name || q.code}</div>
        <div class="index-price ${cls}">${q.price.toFixed(2)}</div>
        <div class="index-change ${cls}">${sign}${q.change.toFixed(2)} (${sign}${q.changePercent.toFixed(2)}%)</div>
      </div>
    `;
  }).join('');
}

// ─── 渲染：自选股 ───
function renderWatchlist(data) {
  const tbody = document.getElementById('watchlistBody');
  const empty = document.getElementById('watchlistEmpty');
  const list = getWatchlist();

  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--red)">加载失败，请稍后重试</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((q) => {
    const cls = q.changePercent > 0 ? 'up' : q.changePercent < 0 ? 'down' : 'flat';
    const sign = q.changePercent > 0 ? '+' : '';
    return `
      <tr>
        <td class="stock-name">${q.name || '--'}</td>
        <td class="stock-code">${q.symbol || q.code}</td>
        <td class="${cls}">${q.price ? q.price.toFixed(2) : '--'}</td>
        <td class="${cls}">${sign}${q.change.toFixed(2)}</td>
        <td class="${cls}">${sign}${q.changePercent.toFixed(2)}%</td>
        <td>${q.volume ? q.volume.toLocaleString() : '--'}</td>
        <td>${q.amount ? q.amount.toLocaleString() : '--'}</td>
        <td><button class="btn btn-sm btn-danger" onclick="removeFromWatchlist('${q.code}')">删除</button></td>
      </tr>
    `;
  }).join('');

  const returnedCodes = data.map((q) => q.code);
  const missing = list.filter((c) => !returnedCodes.includes(c));
  if (missing.length) {
    tbody.innerHTML += missing.map((code) => `
      <tr>
        <td class="stock-name muted">--</td>
        <td class="stock-code">${code}</td>
        <td colspan="5" class="muted" style="color:var(--text-muted)">无法获取数据（请检查代码是否正确）</td>
        <td><button class="btn btn-sm btn-danger" onclick="removeFromWatchlist('${code}')">删除</button></td>
      </tr>
    `).join('');
  }
}

// ─── 渲染：分析报告 ───
function renderAnalysis(data) {
  const list = getWatchlist();
  const summaryEl = document.getElementById('summaryCards');
  const analysisEl = document.getElementById('analysisList');
  const dateEl = document.getElementById('analysisDate');

  if (list.length === 0) {
    summaryEl.innerHTML = '';
    analysisEl.innerHTML = '<div class="empty-state"><p>添加自选股后自动生成分析报告</p></div>';
    dateEl.textContent = '--';
    return;
  }

  if (!data || data.length === 0) {
    summaryEl.innerHTML = '';
    analysisEl.innerHTML = '<div class="empty-state"><p style="color:var(--red)">数据加载失败，请稍后重试</p></div>';
    dateEl.textContent = '--';
    return;
  }

  const { summary, reports } = generateAnalysis(data);

  dateEl.textContent = summary.date;
  summaryEl.innerHTML = `
    <div class="summary-card">
      <div class="summary-label">市场趋势</div>
      <div class="summary-value ${summary.avgChange > 0 ? 'up' : summary.avgChange < 0 ? 'down' : 'flat'}">${summary.marketTrend}</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">平均涨跌幅</div>
      <div class="summary-value ${summary.avgChange > 0 ? 'up' : summary.avgChange < 0 ? 'down' : 'flat'}">${summary.avgChange > 0 ? '+' : ''}${summary.avgChange}%</div>
    </div>
    <div class="summary-card">
      <div class="summary-label">上涨 / 下跌</div>
      <div class="summary-value"><span class="up">${summary.upCount}</span> / <span class="down">${summary.downCount}</span></div>
    </div>
    <div class="summary-card">
      <div class="summary-label">平盘</div>
      <div class="summary-value flat">${summary.flatCount}</div>
    </div>
  `;

  analysisEl.innerHTML = reports.map((r) => {
    const cls = r.changePercent > 0 ? 'up' : r.changePercent < 0 ? 'down' : 'flat';
    const tag = r.changePercent > 0 ? 'tag-up' : r.changePercent < 0 ? 'tag-down' : 'tag-flat';
    const sign = r.changePercent > 0 ? '+' : '';
    return `
      <div class="analysis-card">
        <div class="analysis-info">
          <div class="analysis-name">${r.name} <span class="stock-code">${r.code}</span></div>
          <div class="analysis-suggestion">${r.suggestion}</div>
        </div>
        <div class="analysis-metrics">
          <span>最新价 <b class="${cls}">${r.price ? r.price.toFixed(2) : '--'}</b></span>
          <span>涨跌幅 <b class="${cls}">${sign}${r.changePercent}%</b></span>
          <span>振幅 <b>${r.amplitude}%</b></span>
          <span class="${tag}">${r.trend}</span>
        </div>
      </div>
    `;
  }).join('');
}

// ─── 渲染：选股结果 ───
function renderPicks(data) {
  const list = getWatchlist();
  const tbody = document.getElementById('picksBody');
  const empty = document.getElementById('picksEmpty');

  if (list.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--red)">数据加载失败</td></tr>`;
    empty.style.display = 'none';
    return;
  }

  const picks = generatePicks(data);
  if (picks.length === 0) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = picks.map((p) => {
    const cls = p.changePercent > 0 ? 'up' : 'down';
    return `
      <tr>
        <td class="stock-name">${p.name}</td>
        <td class="stock-code">${p.code}</td>
        <td>${p.price.toFixed(2)}</td>
        <td class="${cls}">+${p.changePercent.toFixed(2)}%</td>
        <td>${(p.amount / 10000).toFixed(2)}</td>
        <td style="color:var(--text-dim);font-size:13px">${p.reason}</td>
      </tr>
    `;
  }).join('');
}

// ─── 价值筛选：加载 PE<30 且 市值>10亿 的股票 ───

let valuationData = [];      // 缓存筛选数据
let valuationSortKey = 'pe'; // 当前排序字段
let valuationSortAsc = true; // 升序/降序

async function loadValuation() {
  try {
    // 加载 GitHub Pages 上的静态 JSON 文件
    const res = await fetch('data/valuation.json?t=' + Date.now(), { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    valuationData = data.stocks || [];
    renderValuation(data);
  } catch (e) {
    console.warn('价值筛选数据加载失败:', e.message);
    const empty = document.getElementById('valuationEmpty');
    if (empty) {
      empty.innerHTML = `
        <p>数据暂未生成</p>
        <p class="muted">每日收盘后自动更新，或稍后刷新重试</p>
      `;
    }
  }
}

function renderValuation(data) {
  const tbody = document.getElementById('valuationBody');
  const empty = document.getElementById('valuationEmpty');
  const meta = document.getElementById('valuationMeta');

  if (!valuationData.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  // 显示更新时间和总数
  meta.innerHTML = `
    <span class="valuation-time">📅 更新于 ${data.update_time}</span>
    <span class="valuation-count">共 <b>${data.total}</b> 只符合条件的股票</span>
    <span class="valuation-cond">${data.filters.pe_min || 0} < PE(TTM) < ${data.filters.pe_max} · 市值 > ${data.filters.market_cap_min_yi}亿 · 已排除 ST/亏损</span>
  `;

  renderValuationRows();
}

function renderValuationRows() {
  const tbody = document.getElementById('valuationBody');

  // 排序
  const sorted = [...valuationData].sort((a, b) => {
    let va = a[valuationSortKey];
    let vb = b[valuationSortKey];
    // 字符串比较
    if (typeof va === 'string') {
      return valuationSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
    }
    return valuationSortAsc ? va - vb : vb - va;
  });

  tbody.innerHTML = sorted.map((s) => {
    const cls = s.change_pct > 0 ? 'up' : s.change_pct < 0 ? 'down' : 'flat';
    const sign = s.change_pct > 0 ? '+' : '';
    return `
      <tr>
        <td><b>${s.pe.toFixed(2)}</b></td>
        <td>${s.market_cap.toFixed(2)}</td>
        <td class="stock-name">${s.name}</td>
        <td class="stock-code">${s.code}</td>
        <td>${s.price.toFixed(2)}</td>
        <td class="${cls}">${sign}${s.change_pct.toFixed(2)}%</td>
        <td style="color:var(--text-dim);font-size:13px">${s.industry || '--'}</td>
      </tr>
    `;
  }).join('');
}

function sortValuation(key) {
  if (valuationSortKey === key) {
    valuationSortAsc = !valuationSortAsc;
  } else {
    valuationSortKey = key;
    valuationSortAsc = true;
  }
  renderValuationRows();
}

// ─── 刷新全部（统一获取数据，避免重复请求） ───
async function refreshAll() {
  updateTimestamp();
  const watchlist = getWatchlist();

  // 更新自选股数量
  const countEl = document.getElementById('watchlistCount');
  if (countEl) countEl.textContent = watchlist.length;

  // 并行获取指数和自选股数据
  const [indicesData, watchlistData] = await Promise.all([
    loadQuotes(INDICES).catch(() => null),
    watchlist.length > 0 ? loadQuotes(watchlist).catch(() => null) : Promise.resolve(null),
  ]);

  renderIndices(indicesData);
  renderWatchlist(watchlistData);
  renderAnalysis(watchlistData);
  renderPicks(watchlistData);

  // 加载价值筛选数据（静态 JSON，每日更新）
  loadValuation();

  updateTimestamp();
}

function updateTimestamp() {
  const el = document.getElementById('lastUpdate');
  const now = new Date();
  el.textContent = '更新于 ' + now.toLocaleTimeString('zh-CN');
}

// ─── 事件绑定 ───
document.getElementById('addStockBtn').addEventListener('click', () => {
  const input = document.getElementById('stockInput');
  addToWatchlist(input.value);
  input.value = '';
  input.focus();
});

document.getElementById('stockInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('addStockBtn').click();
});

document.getElementById('refreshBtn').addEventListener('click', refreshAll);

// ─── 初始化 ───
// 1. 从URL参数导入自选股（跨设备迁移）
loadWatchlistFromUrl();

// 2. 如果仍为空，设置默认自选股
if (getWatchlist().length === 0) {
  saveWatchlist(['sh601318', 'sz000001', 'sh600519', 'sz000858', 'sz300750']);
}

refreshAll();

// 每 60 秒自动刷新
setInterval(refreshAll, 60000);
