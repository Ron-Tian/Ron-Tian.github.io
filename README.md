# 拾柴记

> 一点一滴，记录生活

一个纯静态的个人博客，Markdown 文件驱动，零后端依赖，部署在 GitHub Pages。

🔗 线上地址：https://ron-tian.github.io/

## 特性

- **Markdown 文件驱动** — 每篇文章是独立的 `.md` 文件，放进 `posts/` 即自动加载
- **SPA 单页应用** — 原生 HTML/CSS/JS 实现，无构建依赖，切换页面不刷新
- **完整 Markdown 渲染** — 代码高亮、表格、引用块、列表等全语法支持
- **标签分类** — 标签云 + 按标签筛选文章
- **内嵌搜索** — 实时搜索文章标题、摘要、正文
- **阅读进度条** — 文章页顶部跟随滚动
- **Giscus 评论** — 基于 GitHub Discussions，评论数据存本仓库
- **响应式设计** — 移动端自适应
- **GitHub Pages 一键部署** — push 自动构建部署

## 目录结构

```
blog/
├── index.html              # SPA 入口
├── css/
│   └── style.css           # 全站样式
├── js/
│   ├── app.js              # SPA 路由 + 视图渲染 + Giscus 评论
│   ├── post-loader.js      # Markdown 自动加载器（manifest 优先 + 目录列表回退）
│   └── marked.min.js       # Markdown 解析库（本地）
├── posts/                  # ← 文章文件夹（Markdown）
│   ├── hello-world.md
│   ├── markdown-guide.md
│   ├── ...
│   └── manifest.json       # 构建生成的文章清单
├── scripts/
│   └── build.py            # manifest.json 构建脚本
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions 自动部署工作流
├── .nojekyll               # 禁用 Jekyll 处理
└── .gitignore
```

## 本地运行

需要 Python 3（仅用于启动静态文件服务器）：

```bash
cd blog
python -m http.server 8080
```

浏览器打开 http://localhost:8080/

## 添加新文章

1. 在 `posts/` 目录新建一个 `.md` 文件，文件头使用 YAML frontmatter：

```markdown
---
title: 文章标题
date: 2026-07-18
tags: 技术, JavaScript
excerpt: 这是一段摘要，会显示在文章列表中。
cover: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
readingTime: 5
---

# 正文从这里开始

用 Markdown 写正文...
```

2. 运行构建脚本更新清单：

```bash
python scripts/build.py
```

3. 刷新页面即可看到新文章。

### 字段说明

| 字段 | 必填 | 说明 |
|------|------|------|
| `title` | 是 | 文章标题 |
| `date` | 是 | 发布日期，格式 `YYYY-MM-DD` |
| `tags` | 是 | 标签，逗号分隔 |
| `excerpt` | 是 | 摘要，显示在列表页 |
| `cover` | 否 | 封面渐变色（CSS gradient） |
| `readingTime` | 否 | 预计阅读时长（分钟） |
| `type` | 否 | 设为 `page` 表示非文章页面（如关于页） |

## 部署到 GitHub Pages

本项目已配置 GitHub Actions 自动部署，push 到 `main` 分支即自动构建并发布。

### 首次部署

1. 推送代码到 GitHub 仓库
2. 仓库 `Settings` → `Pages` → `Source` 选择 **"GitHub Actions"**
3. 等待 Actions 运行完成（1-2 分钟）

### 后续更新

往 `posts/` 加 `.md` 文件 → `git push` → 自动部署完成，无需手动运行构建脚本。

## 评论功能配置（Giscus）

评论基于 Giscus，数据存储在仓库的 GitHub Discussions 中。首次使用需配置：

1. **开启 Discussions** — 仓库 `Settings` → `General` → `Features` 勾选 `Discussions`
2. **创建分类** — 进入 `Discussions` 标签页，新建名为 `Comments` 的分类，格式选 `Announcements`
3. **安装 Giscus App** — 访问 https://github.com/apps/giscus ，安装到本仓库
4. **获取 ID** — 访问 https://giscus.app ，填入仓库名，Mapping 选 "Specific term"，复制生成的 `data-repo-id` 和 `data-category-id`
5. **填入配置** — 编辑 `js/app.js`，填入 `GISCUS_CONFIG` 的 `repoId` 和 `categoryId`

```javascript
const GISCUS_CONFIG = {
  repo: 'Ron-Tian/Ron-Tian.github.io',
  repoId: '你的_repo_id',
  category: 'Comments',
  categoryId: '你的_category_id',
};
```

配置完成后 `git push`，评论功能即生效。访客用 GitHub 账号登录即可评论，支持 Markdown 和 emoji 反应。

## 自动加载机制

`post-loader.js` 采用双重加载策略：

1. **优先读 manifest.json** — 构建生成的文章清单，最可靠
2. **回退扫描目录列表** — 当 manifest 不存在时，fetch `posts/` 目录列表自动发现 `.md` 文件

这意味着本地开发时即使忘记运行构建脚本，文章也能通过目录列表加载；部署到 GitHub Pages 时则依赖 manifest.json（GitHub Pages 不支持目录列表）。

## 技术栈

| 类别 | 技术 |
|------|------|
| 前端 | 原生 HTML / CSS / JavaScript（无框架） |
| Markdown 解析 | [marked](https://marked.js.org/) v12（本地引入） |
| 评论 | [Giscus](https://giscus.app)（GitHub Discussions） |
| 部署 | GitHub Pages + GitHub Actions |
| 构建 | Python 脚本（生成 manifest.json） |

## License

个人博客项目，保留所有权利。
