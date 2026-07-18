/**
 * 拾柴记 - SPA 应用主逻辑 v3
 * 顶部导航 + 居中内容的网站风格
 * Hash 路由：#/  #/post/:id  #/tag  #/tag/:name  #/about
 */

/* ========================================
   Giscus 评论配置
   获取 repoId / categoryId 步骤：
   1. 仓库 Settings → General → Features 勾选 Discussions
   2. 访问 https://github.com/apps/giscus 安装到本仓库
   3. 访问 https://giscus.app 输入 Ron-Tian/Ron-Tian.github.io 生成配置
   4. 把生成的 data-repo-id / data-category-id 填到下面
   ======================================== */
const GISCUS_CONFIG = {
  repo: 'Ron-Tian/Ron-Tian.github.io',
  repoId: 'R_kgDOTVTDvQ',              // ✅ 已通过 GitHub API 获取
  category: 'Comments',
  categoryId: 'DIC_kwDOTVTDvc4DBZ-a',  // ✅ 已通过 GraphQL API 获取
};

function loadGiscus(container, term) {
  if (!container) return;
  if (!GISCUS_CONFIG.repoId || !GISCUS_CONFIG.categoryId) {
    container.innerHTML = `
      <div class="comments-hint">
        评论功能待配置 · 请在 <code>js/app.js</code> 顶部 <code>GISCUS_CONFIG</code> 填入 repoId 和 categoryId
      </div>
    `;
    return;
  }

  // 先放骨架占位，避免 iframe 加载前空白跳动
  container.innerHTML = '<div class="giscus-skeleton">评论加载中…</div>';

  // 用 IntersectionObserver 懒加载：评论区滚到视口附近才真正加载 Giscus
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, observer) => {
      if (entries[0].isIntersecting) {
        observer.disconnect();
        _injectGiscus(container, term);
      }
    }, { rootMargin: '200px' }); // 提前 200px 触发，用户滚到时已加载好
    io.observe(container);
    // 保存引用，路由切换时断开（避免旧文章的观察器触发）
    container._giscusObserver = io;
  } else {
    // 降级：直接加载
    _injectGiscus(container, term);
  }
}

function _injectGiscus(container, term) {
  // 清空旧评论（SPA 切换文章时必须重建，否则 iframe 不会刷新）
  container.innerHTML = '';
  const script = document.createElement('script');
  script.src = 'https://giscus.app/client.js';
  script.setAttribute('data-repo', GISCUS_CONFIG.repo);
  script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
  script.setAttribute('data-category', GISCUS_CONFIG.category);
  script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
  script.setAttribute('data-mapping', 'specific');
  script.setAttribute('data-term', term);
  script.setAttribute('data-strict', '1');
  script.setAttribute('data-reactions-enabled', '1');
  script.setAttribute('data-emit-metadata', '0');
  script.setAttribute('data-input-position', 'top');
  script.setAttribute('data-theme', 'light');
  script.setAttribute('data-lang', 'zh-CN');
  script.setAttribute('data-loading', 'lazy');
  script.crossOrigin = 'anonymous';
  script.async = true;
  container.appendChild(script);
}

/* ========================================
   工具函数
   ======================================== */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function configureMarked() {
  if (typeof marked !== 'undefined') {
    try {
      marked.setOptions({ breaks: true, gfm: true });
    } catch (e) {
      console.warn('[Marked] setOptions failed:', e.message);
    }
  }
}

function renderMarkdown(content) {
  if (typeof marked === 'undefined') {
    return '<pre style="white-space:pre-wrap;">' + escapeHtml(content) + '</pre>';
  }
  try {
    const html = marked.parse(content);
    return html;
  } catch (e) {
    return '<pre style="white-space:pre-wrap;">' + escapeHtml(content) + '</pre>';
  }
}

function highlightCode(container) {
  if (typeof hljs === 'undefined') return;
  container.querySelectorAll('pre code').forEach(block => {
    try { hljs.highlightElement(block); } catch (e) {}
  });
}

/* ========================================
   文章目录 TOC
   ======================================== */
let _tocScrollHandler = null;

function addHeadingIds(container) {
  const headings = container.querySelectorAll('h1, h2, h3');
  const usedIds = {};
  headings.forEach(h => {
    let id = h.textContent.trim()
      .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();
    if (!id) id = 'heading';
    if (usedIds[id]) {
      usedIds[id]++;
      id = `${id}-${usedIds[id]}`;
    } else {
      usedIds[id] = 1;
    }
    h.id = id;
  });
}

function buildTOC(markdownBody) {
  const headings = markdownBody.querySelectorAll('h1, h2, h3');
  if (headings.length < 2) return; // 少于2个标题不显示目录

  // 移除旧 TOC
  const oldToc = document.querySelector('.post-toc');
  if (oldToc) oldToc.remove();

  // 清理旧 scroll handler
  if (_tocScrollHandler) {
    window.removeEventListener('scroll', _tocScrollHandler);
    _tocScrollHandler = null;
  }

  const items = Array.from(headings).map(h => {
    const level = parseInt(h.tagName[1]);
    return { id: h.id, text: h.textContent.trim(), level };
  });

  const toc = document.createElement('nav');
  toc.className = 'post-toc';
  toc.innerHTML = `
    <div class="post-toc-title">目录</div>
    <ul class="post-toc-list">
      ${items.map(item => `
        <li><a href="#${item.id}" class="toc-level-${item.level}" data-toc-id="${item.id}" onclick="document.getElementById('${item.id}').scrollIntoView({behavior:'smooth',block:'start'});return false;">${escapeHtml(item.text)}</a></li>
      `).join('')}
    </ul>
  `;
  document.body.appendChild(toc);

  // Scroll spy — 高亮当前阅读章节
  const links = toc.querySelectorAll('.post-toc-list a');
  let ticking = false;

  _tocScrollHandler = function() {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrollY = window.scrollY + 120;
        let currentIdx = 0;
        headings.forEach((h, i) => {
          if (h.offsetTop <= scrollY) currentIdx = i;
        });
        links.forEach((link, i) => {
          link.classList.toggle('active', i === currentIdx);
        });
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', _tocScrollHandler, { passive: true });
  _tocScrollHandler(); // 初始化高亮
}

/* ========================================
   返回顶部按钮
   ======================================== */
function initBackToTop() {
  const btn = document.getElementById('backToTop');
  if (!btn) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        btn.classList.toggle('visible', window.scrollY > 300);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/* ========================================
   路由
   ======================================== */
function navigate(path) {
  let hash = path ? `#/${path}` : '#/';
  window.location.hash = hash;
  // 清空搜索框（内嵌式搜索，导航时恢复）
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  window.scrollTo(0, 0);
}

function getRoute() {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === '/') return { view: 'home' };
  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'post' && parts[1]) return { view: 'post', id: decodeURIComponent(parts[1]) };
  if (parts[0] === 'tag') return parts[1] ? { view: 'tag', name: decodeURIComponent(parts[1]) } : { view: 'tags' };
  if (parts[0] === 'about') return { view: 'about' };
  return { view: 'home' };
}

/* ========================================
   导航高亮
   ======================================== */
function updateNavActive(route) {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
  });
  if (route.view === 'home') {
    document.querySelector('.nav-link[data-route=""]')?.classList.add('active');
  } else if (route.view === 'tags' || route.view === 'tag') {
    document.querySelector('.nav-link[data-route="tag"]')?.classList.add('active');
  } else if (route.view === 'about') {
    document.querySelector('.nav-link[data-route="about"]')?.classList.add('active');
  }
}

/* ========================================
   搜索 - 内嵌式（结果直接渲染到内容区）
   ======================================== */
function initSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const query = input.value.trim();
      const content = document.getElementById('content');

      if (!query) {
        // 清空搜索，恢复当前路由视图
        await renderView();
        return;
      }

      const posts = await PostLoader.searchPosts(query);
      const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

      document.title = `搜索: ${query} — 拾柴记`;
      // 搜索时不高亮导航
      document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

      if (sorted.length === 0) {
        content.innerHTML = `
          <div class="fade-in" style="max-width:var(--content-width);margin:0 auto;">
            <div class="page-header">
              <h1>搜索结果</h1>
              <div class="desc">关键词「${escapeHtml(query)}」· 未找到匹配文章</div>
            </div>
            <div class="empty-state">
              <div class="empty-state-icon">🔍</div>
              <p>没有找到相关文章</p>
              <p style="margin-top:8px;font-size:0.8rem;color:var(--c-text-3);">试试其他关键词？</p>
            </div>
          </div>
        `;
      } else {
        content.innerHTML = `
          <div class="fade-in" style="max-width:var(--content-width);margin:0 auto;">
            <div class="page-header">
              <h1>搜索结果</h1>
              <div class="desc">关键词「${escapeHtml(query)}」· 找到 ${sorted.length} 篇文章</div>
            </div>
            <div class="post-list" id="postList"></div>
          </div>
        `;

        const list = document.getElementById('postList');
        list.innerHTML = sorted.map(post => `
          <div class="post-row" onclick="navigate('post/${encodeURIComponent(post.id)}')">
            <div class="post-row-meta">
              <span>${formatDateShort(post.date)}</span>
              <span class="dot"></span>
              <span>${post.readingTime} 分钟</span>
              ${post.format === 'pdf' ? '<span class="dot"></span><span class="format-badge pdf">PDF</span>' : ''}
            </div>
            <h3 class="post-row-title">${escapeHtml(post.title)}</h3>
            <p class="post-row-excerpt">${escapeHtml(post.excerpt)}</p>
            <div class="post-row-tags">
              ${post.tags.map(tag => `<span class="tag-mini" onclick="event.stopPropagation(); navigate('tag/${encodeURIComponent(tag)}')">${escapeHtml(tag)}</span>`).join('')}
            </div>
          </div>
        `).join('');
      }
    }, 200);
  });

  // ESC 清空搜索
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      input.blur();
      renderView();
    }
  });
}

/* ========================================
   渲染视图
   ======================================== */
let _scrollHandler = null; // 全局 scroll handler 引用，便于清理

async function renderView() {
  const route = getRoute();
  const content = document.getElementById('content');
  const progressBar = document.getElementById('progressBar');

  progressBar.style.display = route.view === 'post' ? 'block' : 'none';
  updateNavActive(route);

  // 离开文章页时清理 TOC
  if (route.view !== 'post') {
    const oldToc = document.querySelector('.post-toc');
    if (oldToc) oldToc.remove();
    if (_tocScrollHandler) {
      window.removeEventListener('scroll', _tocScrollHandler);
      _tocScrollHandler = null;
    }
  }

  // 只有真正需要网络请求时才显示 loading
  // 首页/标签/搜索：manifest 已缓存就不显示 loading
  const hasCache = PostLoader.loadAllPosts && localStorage.getItem('shichaiji_meta_cache');
  if (!hasCache) {
    content.innerHTML = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>加载中...</p>
      </div>
    `;
  }

  try {
    switch (route.view) {
      case 'home': await renderHome(content); break;
      case 'post': await renderPost(content, route.id); break;
      case 'tags': await renderTags(content); break;
      case 'tag': await renderTagFilter(content, route.name); break;
      case 'about': await renderAbout(content); break;
    }
  } catch (err) {
    console.error('渲染失败:', err);
    content.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">😵</div>
        <p>加载失败</p>
        <p style="margin-top:8px;font-size:0.8rem;color:var(--c-text-3);">${escapeHtml(err.message)}</p>
      </div>
    `;
  }
}

/* ========================================
   视图：首页
   ======================================== */
async function renderHome(container) {
  const posts = await PostLoader.loadAllPosts();
  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));

  document.title = '拾柴记 — 一点一滴，记录生活';

  container.innerHTML = `
    <div class="list-header">
      <h2>文章</h2>
      <span class="count">共 ${sorted.length} 篇</span>
    </div>
    <div class="post-list" id="postList"></div>
  `;

  const list = document.getElementById('postList');
  list.innerHTML = sorted.map(post => `
    <div class="post-row" onclick="navigate('post/${encodeURIComponent(post.id)}')">
      <div class="post-row-meta">
        <span>${formatDateShort(post.date)}</span>
        <span class="dot"></span>
        <span>${post.readingTime} 分钟</span>
        ${post.format === 'pdf' ? '<span class="dot"></span><span class="format-badge pdf">PDF</span>' : ''}
      </div>
      <h3 class="post-row-title">${escapeHtml(post.title)}</h3>
      <p class="post-row-excerpt">${escapeHtml(post.excerpt)}</p>
      <div class="post-row-tags">
        ${post.tags.map(tag => `<span class="tag-mini" onclick="event.stopPropagation(); navigate('tag/${encodeURIComponent(tag)}')">${escapeHtml(tag)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

/* ========================================
   视图：文章详情
   ======================================== */
async function renderPost(container, postId) {
  const post = await PostLoader.getPostById(postId);

  if (!post) {
    document.title = '文章不存在 — 拾柴记';
    container.innerHTML = `
      <div class="post-detail">
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <p>文章不存在</p>
          <p style="margin-top:12px;"><a href="#/" onclick="navigate(''); return false;">← 返回首页</a></p>
        </div>
      </div>
    `;
    return;
  }

  document.title = `${post.title} — 拾柴记`;

  const { prev, next } = await PostLoader.getAdjacentPosts(postId);

  // PDF 文章：用 iframe 内嵌浏览器原生 PDF 阅读器
  if (post.format === 'pdf') {
    container.innerHTML = `
      <div class="post-detail fade-in">
        <a class="back-link" onclick="navigate('')">← 返回</a>
        <div class="post-detail-header">
          <div class="post-detail-tags">
            <span class="format-badge pdf">PDF</span>
            ${post.tags.map(tag => `<span class="tag-mini" onclick="navigate('tag/${encodeURIComponent(tag)}')">${escapeHtml(tag)}</span>`).join('')}
          </div>
          <h1 class="post-detail-title">${escapeHtml(post.title)}</h1>
          <div class="post-detail-meta">
            <span>${formatDate(post.date)}</span>
            <span class="dot"></span>
            <a href="${post.pdfUrl}" download class="pdf-download-link">下载 PDF</a>
          </div>
        </div>
        <div class="pdf-viewer-wrapper">
          <iframe src="${post.pdfUrl}" class="pdf-viewer" title="${escapeHtml(post.title)}"></iframe>
        </div>
        <nav class="post-nav">
          ${prev ? `
            <div class="post-nav-item prev" onclick="navigate('post/${encodeURIComponent(prev.id)}')">
              <div class="post-nav-label">← 上一篇</div>
              <div class="post-nav-title">${escapeHtml(prev.title)}</div>
            </div>
          ` : '<div></div>'}
          ${next ? `
            <div class="post-nav-item next" onclick="navigate('post/${encodeURIComponent(next.id)}')">
              <div class="post-nav-label">下一篇 →</div>
              <div class="post-nav-title">${escapeHtml(next.title)}</div>
            </div>
          ` : '<div></div>'}
        </nav>
        <section class="comments-section">
          <h2 class="comments-title">评论</h2>
          <div class="giscus" id="giscusContainer"></div>
        </section>
      </div>
    `;

    initReadingProgress();
    loadGiscus(document.getElementById('giscusContainer'), postId);
    if (next) PostLoader.prefetchPost(next.id);
    return;
  }

  // Markdown 文章：渲染正文
  const htmlContent = renderMarkdown(post.content);

  container.innerHTML = `
    <div class="post-detail fade-in">
      <a class="back-link" onclick="navigate('')">← 返回</a>
      <div class="post-detail-header">
        <div class="post-detail-tags">
          ${post.tags.map(tag => `<span class="tag-mini" onclick="navigate('tag/${encodeURIComponent(tag)}')">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <h1 class="post-detail-title">${escapeHtml(post.title)}</h1>
        <div class="post-detail-meta">
          <span>${formatDate(post.date)}</span>
          <span class="dot"></span>
          <span>${post.readingTime} 分钟阅读</span>
        </div>
      </div>
      <div class="markdown-body" id="markdownBody">
        ${htmlContent}
      </div>
      <nav class="post-nav">
        ${prev ? `
          <div class="post-nav-item prev" onclick="navigate('post/${encodeURIComponent(prev.id)}')">
            <div class="post-nav-label">← 上一篇</div>
            <div class="post-nav-title">${escapeHtml(prev.title)}</div>
          </div>
        ` : '<div></div>'}
        ${next ? `
          <div class="post-nav-item next" onclick="navigate('post/${encodeURIComponent(next.id)}')">
            <div class="post-nav-label">下一篇 →</div>
            <div class="post-nav-title">${escapeHtml(next.title)}</div>
          </div>
        ` : '<div></div>'}
      </nav>
      <section class="comments-section">
        <h2 class="comments-title">评论</h2>
        <div class="giscus" id="giscusContainer"></div>
      </section>
    </div>
  `;

  // 代码高亮
  const markdownBody = document.getElementById('markdownBody');
  if (markdownBody) {
    addHeadingIds(markdownBody);
    highlightCode(markdownBody);
    buildTOC(markdownBody);
  }

  initReadingProgress();

  // 加载 Giscus 评论（用文章 id 作为 discussion 标识）
  loadGiscus(document.getElementById('giscusContainer'), postId);

  // 预加载下一篇文章（后台静默，不阻塞当前渲染）
  if (next) PostLoader.prefetchPost(next.id);
}

/* ========================================
   视图：标签总览
   ======================================== */
async function renderTags(container) {
  const tags = await PostLoader.getAllTags();
  document.title = '标签 — 拾柴记';

  container.innerHTML = `
    <div class="tag-cloud-page fade-in">
      <div class="page-header">
        <h1>标签</h1>
        <div class="desc">按主题浏览 · 共 ${tags.length} 个标签</div>
      </div>
      <div class="tag-cloud">
        ${tags.map(tag => `
          <span class="tag-cloud-item" onclick="navigate('tag/${encodeURIComponent(tag.name)}')">
            ${escapeHtml(tag.name)}
            <span class="count">${tag.count}</span>
          </span>
        `).join('')}
      </div>
    </div>
  `;
}

/* ========================================
   视图：标签筛选
   ======================================== */
async function renderTagFilter(container, tagName) {
  const posts = await PostLoader.getPostsByTag(tagName);
  const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
  const allTags = await PostLoader.getAllTags();

  document.title = `标签: ${tagName} — 拾柴记`;

  container.innerHTML = `
    <div class="fade-in">
      <div class="page-header">
        <h1>「${escapeHtml(tagName)}」</h1>
        <div class="desc">${sorted.length} 篇文章</div>
      </div>
      <div class="tag-cloud" style="margin-bottom:32px;">
        ${allTags.map(tag => `
          <span class="tag-cloud-item ${tag.name === tagName ? 'active' : ''}" onclick="navigate('tag/${encodeURIComponent(tag.name)}')">
            ${escapeHtml(tag.name)}
            <span class="count">${tag.count}</span>
          </span>
        `).join('')}
      </div>
      <div class="post-list" id="postList"></div>
    </div>
  `;

  const list = document.getElementById('postList');
  if (sorted.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>该标签下暂无文章</p>
      </div>
    `;
    return;
  }

  list.innerHTML = sorted.map(post => `
    <div class="post-row" onclick="navigate('post/${encodeURIComponent(post.id)}')">
      <div class="post-row-meta">
        <span>${formatDateShort(post.date)}</span>
        <span class="dot"></span>
        <span>${post.readingTime} 分钟</span>
      </div>
      <h3 class="post-row-title">${escapeHtml(post.title)}</h3>
      <p class="post-row-excerpt">${escapeHtml(post.excerpt)}</p>
      <div class="post-row-tags">
        ${post.tags.map(tag => `<span class="tag-mini" onclick="event.stopPropagation(); navigate('tag/${encodeURIComponent(tag)}')">${escapeHtml(tag)}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

/* ========================================
   视图：关于页面
   ======================================== */
async function renderAbout(container) {
  document.title = '关于 — 拾柴记';

  const aboutData = await PostLoader.getAboutContent();
  let aboutHtml = '';
  if (aboutData) {
    aboutHtml = renderMarkdown(aboutData.content);
  } else {
    aboutHtml = '<p>关于页面内容加载中...</p>';
  }

  container.innerHTML = `
    <div class="about-page fade-in">
      <div class="about-header">
        <div class="about-avatar">拾</div>
        <h1 class="about-name">拾柴记</h1>
        <p class="about-bio">一点一滴，记录生活</p>
      </div>
      <div class="markdown-body">
        ${aboutHtml}
      </div>
    </div>
  `;
}

/* ========================================
   阅读进度条（rAF 节流 + 自动清理旧监听器）
   ======================================== */
function initReadingProgress() {
  const fill = document.getElementById('progressBarFill');
  if (!fill) return;

  // 清理上一次的 scroll 监听器（避免多次绑定）
  if (_scrollHandler) {
    window.removeEventListener('scroll', _scrollHandler);
    _scrollHandler = null;
  }

  let ticking = false;
  function updateProgress() {
    const scrollTop = window.scrollY;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    fill.style.width = `${Math.min(100, progress)}%`;
    ticking = false;
  }

  _scrollHandler = function() {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  };

  window.addEventListener('scroll', _scrollHandler, { passive: true });
  updateProgress();
}

/* ========================================
   初始化
   ======================================== */
async function init() {
  try {
    configureMarked();
    initSearch();
    initBackToTop();

    // 预加载文章元数据（manifest 优先，localStorage 缓存秒开）
    await PostLoader.loadAllPosts();

    // 监听路由变化
    window.addEventListener('hashchange', renderView);

    // 首次渲染
    await renderView();
  } catch (err) {
    console.error('[Init] 初始化失败:', err);
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">😵</div>
          <p>初始化失败</p>
          <p style="margin-top:8px;font-size:0.8rem;color:var(--c-text-3);">${escapeHtml(err.message || String(err))}</p>
        </div>
      `;
    }
  }
}

// 全局错误捕获
window.addEventListener('error', function(e) {
  console.error('[Global Error]', e.error || e.message);
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('[Unhandled Rejection]', e.reason);
});

// 启动
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
