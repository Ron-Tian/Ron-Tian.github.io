/**
 * 拾柴记 - Markdown 文件自动加载器 v2
 *
 * 性能优化策略：
 * 1. 列表页（首页/标签/搜索）只用 manifest.json 元数据（1 个请求）
 * 2. 文章详情页按需加载单个 .md 正文（懒加载）
 * 3. localStorage 缓存 manifest 和文章正文，刷新时先渲染缓存再后台更新
 */

const PostLoader = (function () {
  const CACHE_KEY_META = 'shichaiji_meta_cache';
  const CACHE_KEY_POST = 'shichaiji_post_';
  const CACHE_TTL = 10 * 60 * 1000; // 10 分钟

  let _metaCache = null;   // manifest 元数据列表（不含正文）
  let _postCache = {};      // { id: { ...meta, content } } 已加载的完整文章

  /* ========================================
     localStorage 缓存读写
     ======================================== */
  function lsGet(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.ts > CACHE_TTL) return null;
      return data.value;
    } catch { return null; }
  }

  function lsSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify({ ts: Date.now(), value }));
    } catch { /* quota exceeded — ignore */ }
  }

  /* ========================================
     Frontmatter 解析
     ======================================== */
  function parseFrontmatter(text) {
    const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
    const match = text.match(fmRegex);
    if (!match) return { data: {}, content: text };

    const data = {};
    const lines = match[1].split(/\r?\n/);
    lines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      data[key] = value;
    });
    return { data, content: match[2] };
  }

  /* ========================================
     估算阅读时间
     ======================================== */
  function estimateReadingTime(content) {
    const plainText = content
      .replace(/```[\s\S]*?```/g, '').replace(/`[^`]+`/g, '')
      .replace(/!\[.*?\]\(.*?\)/g, '').replace(/\[.*?\]\(.*?\)/g, '')
      .replace(/[#>*_~|-]/g, '').trim();
    const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (plainText.match(/[a-zA-Z]+/g) || []).length;
    return Math.max(1, Math.ceil(chineseChars / 300 + englishWords / 200));
  }

  /* ========================================
     从 manifest.json 加载元数据（列表页用）
     ======================================== */
  async function fetchManifest() {
    // 加 bust 参数确保获取最新版本（配合 localStorage 缓存使用）
    const response = await fetch('posts/manifest.json');
    if (!response.ok) throw new Error('无法加载 manifest.json');
    return response.json();
  }

  /* ========================================
     从目录列表中提取 .md 文件（备选）
     ======================================== */
  async function fetchFileList() {
    const response = await fetch('posts/');
    if (!response.ok) throw new Error('无法访问 posts/ 目录');
    const html = await response.text();
    const mdFiles = [];
    const linkRegex = /href="([^"]+\.md)"/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      mdFiles.push(decodeURIComponent(match[1].split('/').pop()));
    }
    return mdFiles;
  }

  /* ========================================
     加载单个 .md 文件并解析（文章详情页用）
     ======================================== */
  async function fetchPostContent(file) {
    // 分段编码：保留路径分隔符 /，只编码每段中的特殊字符
    const encodedFile = file.split('/').map(encodeURIComponent).join('/');
    const response = await fetch(`posts/${encodedFile}`);
    if (!response.ok) throw new Error(`无法加载文章: ${file}`);
    const text = await response.text();
    const { data, content } = parseFrontmatter(text);
    return {
      content,
      readingTime: parseInt(data.readingTime) || estimateReadingTime(content)
    };
  }

  /* ========================================
     加载所有文章元数据（不含正文）
     ======================================== */
  async function loadAllPosts() {
    if (_metaCache) return _metaCache;

    // 1. 先尝试 localStorage 缓存（刷新页面时秒开）
    const cached = lsGet(CACHE_KEY_META);
    if (cached && cached.length > 0) {
      _metaCache = cached.filter(p => p.type !== 'page');
      // 后台静默更新（不阻塞渲染）
      fetchManifest().then(manifest => {
        const posts = extractPostsFromManifest(manifest);
        if (posts && posts.length > 0) {
          _metaCache = posts.filter(p => p.type !== 'page');
          lsSet(CACHE_KEY_META, posts);
        }
      }).catch(() => {});
      return _metaCache;
    }

    // 2. 无缓存，从 manifest 加载
    let manifest;
    try {
      manifest = await fetchManifest();
    } catch (e) {
      // 备选：目录列表（仅本地开发有效）
      const filenames = await fetchFileList();
      const results = await Promise.allSettled(
        filenames.map(async f => {
          const { content } = await fetchPostContent(f);
          const { data } = parseFrontmatter(content);
          return buildMetaFromFrontmatter(f, data);
        })
      );
      _metaCache = results.filter(r => r.status === 'fulfilled')
        .map(r => r.value).filter(p => p.type !== 'page');
      return _metaCache;
    }

    _metaCache = extractPostsFromManifest(manifest).filter(p => p.type !== 'page');
    lsSet(CACHE_KEY_META, extractPostsFromManifest(manifest));
    return _metaCache;
  }

  function extractPostsFromManifest(manifest) {
    if (Array.isArray(manifest)) return manifest;
    if (manifest.posts && Array.isArray(manifest.posts)) return manifest.posts;
    return [];
  }

  function buildMetaFromFrontmatter(file, data) {
    const id = file.replace(/\.md$/, '');
    return {
      id,
      file,
      title: data.title || id,
      date: data.date || '',
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      excerpt: data.excerpt || '',
      cover: data.cover || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      readingTime: parseInt(data.readingTime) || 5,
      type: data.type || 'post'
    };
  }

  /* ========================================
     获取关于页面内容
     ======================================== */
  async function getAboutContent() {
    if (!_metaCache) await loadAllPosts();

    // 从 manifest 找 about 的 file 名
    const allPosts = _metaCache;
    // about 可能在 _metaCache 被过滤掉了，从完整 manifest 缓存找
    const fullCache = lsGet(CACHE_KEY_META) || _metaCache;
    const aboutMeta = fullCache.find(p => p.type === 'page') || allPosts.find(p => p.type === 'page');
    if (!aboutMeta) return null;

    // 按需加载正文
    return await getPostById(aboutMeta.id);
  }

  /* ========================================
     按 ID 获取单篇文章（含正文，懒加载）
     ======================================== */
  async function getPostById(id) {
    // 1. 内存缓存
    if (_postCache[id]) return _postCache[id];

    // 2. localStorage 缓存
    const cachedPost = lsGet(CACHE_KEY_POST + id);
    if (cachedPost) {
      _postCache[id] = cachedPost;
      return cachedPost;
    }

    // 3. 确保元数据已加载
    if (!_metaCache) await loadAllPosts();

    // 4. 从缓存中找元数据
    let fullCache = lsGet(CACHE_KEY_META) || _metaCache;
    let meta = fullCache.find(p => p.id === id);

    // 5. 缓存中找不到 → 强制刷新 manifest（新文章可能还没进缓存）
    if (!meta) {
      try {
        const manifest = await fetchManifest();
        const posts = extractPostsFromManifest(manifest);
        if (posts && posts.length > 0) {
          _metaCache = posts;
          lsSet(CACHE_KEY_META, posts);
          meta = posts.find(p => p.id === id);
        }
      } catch (e) {
        console.warn('刷新 manifest 失败:', e);
      }
    }

    if (!meta) return null;

    // 6. PDF 文章：不需要加载 Markdown 正文，直接返回元数据 + pdfUrl
    if (meta.format === 'pdf') {
      // 分段编码路径，保留 / 分隔符
      const encodedFile = meta.file.split('/').map(encodeURIComponent).join('/');
      const post = { ...meta, content: '', pdfUrl: `posts/${encodedFile}` };
      _postCache[id] = post;
      lsSet(CACHE_KEY_POST + id, post);
      return post;
    }

    // 7. Markdown 文章：按需加载正文
    const { content, readingTime } = await fetchPostContent(meta.file);
    const post = { ...meta, content, readingTime };

    _postCache[id] = post;
    lsSet(CACHE_KEY_POST + id, post);
    return post;
  }

  /* ========================================
     获取所有标签
     ======================================== */
  async function getAllTags() {
    const posts = await loadAllPosts();
    const tagCounts = {};
    posts.forEach(post => {
      post.tags.forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  /* ========================================
     按标签筛选（只用元数据，不含正文）
     ======================================== */
  async function getPostsByTag(tag) {
    const posts = await loadAllPosts();
    return posts.filter(p => p.tags.includes(tag));
  }

  /* ========================================
     获取上一篇/下一篇
     ======================================== */
  async function getAdjacentPosts(currentId) {
    const posts = await loadAllPosts();
    const sorted = [...posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    const index = sorted.findIndex(p => p.id === currentId);
    return {
      prev: index < sorted.length - 1 ? sorted[index + 1] : null,
      next: index > 0 ? sorted[index - 1] : null
    };
  }

  /* ========================================
     搜索文章（只用元数据，不含正文）
     ======================================== */
  async function searchPosts(query) {
    const posts = await loadAllPosts();
    const q = query.toLowerCase().trim();
    if (!q) return posts;
    return posts.filter(post =>
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }

  /* ========================================
     预加载文章（后台静默加载，不阻塞）
     ======================================== */
  function prefetchPost(id) {
    if (_postCache[id]) return;
    getPostById(id).catch(() => {});
  }

  return {
    loadAllPosts, getAboutContent, getAllTags,
    getPostById, getPostsByTag, getAdjacentPosts,
    searchPosts, prefetchPost
  };
})();
