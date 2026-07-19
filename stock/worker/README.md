# Cloudflare Worker — 自选股云端同步

## 功能
- 跨设备同步自选股（手机/电脑/平板数据一致）
- 数据存在 Cloudflare KV 中，不依赖 GitHub
- 免费层：每天 100,000 次读取 + 1,000 次写入（自选股足够用）

## 部署步骤（约 10 分钟）

### 1. 注册 Cloudflare 账号
访问 https://dash.cloudflare.com/sign-up 注册（免费）

### 2. 安装 Wrangler CLI
```bash
npm install -g wrangler
wrangler login  # 浏览器授权
```

### 3. 创建 KV 命名空间
```bash
cd stock/worker
wrangler kv:namespace create WATCHLIST
```
输出会显示 `id`，把它填入 `wrangler.toml`：
```toml
[[kv_namespaces]]
binding = "WATCHLIST"
id = "这里填入实际ID"
```

### 4. 设置 API Key（密钥）
生成一个随机字符串作为 API Key：
```bash
# 生成随机密钥
node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"
```
设置为 Worker 密钥（不会暴露在代码中）：
```bash
wrangler secret put API_KEY
# 粘贴上面生成的随机字符串
```

### 5. 部署
```bash
wrangler deploy
```
部署后会输出 Worker URL，类似：
```
https://stock-watchlist-sync.你的子域.workers.dev
```

### 6. 配置前端
编辑 `stock/js/app.js`，找到 `CLOUD_CONFIG`，填入：
```javascript
const CLOUD_CONFIG = {
  enabled: true,
  workerUrl: 'https://stock-watchlist-sync.你的子域.workers.dev',
  apiKey: '第4步生成的随机字符串',
};
```

### 7. 推送到 GitHub
```bash
git add -A && git commit -m "feat: 启用自选股云端同步" && git push
```

完成后打开 https://ron-tian.github.io/stock/ ，添加的自选股会自动同步到云端。

## 工作原理

```
手机浏览器                    Cloudflare Worker              KV Storage
    |                              |                            |
    |--POST /watchlist------------>|                            |
    |  X-API-Key: xxx              |--PUT watchlist------------>|
    |                              |                            |
    |--GET /watchlist------------->|                            |
    |  X-API-Key: xxx              |--GET watchlist------------>|
    |<--返回自选股列表-------------|<---------------------------|
    |                              |                            |
电脑浏览器                         |                            |
    |--GET /watchlist------------->|                            |
    |  X-API-Key: xxx              |--GET watchlist------------>|
    |<--返回同步的自选股-----------|<---------------------------|
```

## 安全说明

| 防护层 | 说明 |
|--------|------|
| CORS | Worker 只接受来自 `ron-tian.github.io` 的请求 |
| API Key | 前端必须携带 `X-API-Key` 头 |
| 数据校验 | Worker 验证股票代码格式（`sh/sz/bj + 6位数字`），最多 100 只 |
| 速率限制 | Cloudflare 免费层每天 100,000 次读 + 1,000 次写 |

**API Key 暴露问题**：API Key 在前端 JS 中可见，但配合 CORS 限制，只有博客域名能调用 Worker。即使有人拿到 key，也只能改你的自选股数据，无法访问 GitHub 仓库或其他资源。

## 成本
- **完全免费**：Cloudflare Workers 免费层每天 100,000 次请求
- 自选股场景每天最多几十次请求，远远用不完
