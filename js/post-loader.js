/**
 * 拾柴记 - Markdown 文件自动加载器
 *
 * 自动加载方案：
 * 1. 优先方案：扫描 posts/ 目录的文件列表（Python http.server 等支持目录列表的服务器）
 * 2. 备选方案：读取 posts/manifest.json（由 scripts/build.py 生成，适用于不支持目录列表的静态托管）
 *
 * 每篇文章是独立的 .md 文件，顶部包含 YAML frontmatter 元数据：
 * ---
 * title: 文章标题
 * date: 2026-07-15
 * tags: 标签1, 标签2
 * excerpt: 摘要
 * cover: linear-gradient(...)
 * readingTime: 5
 * ---
 * # Markdown 正文...
 */

const PostLoader = (function () {
  let _postsCache = null;
  let _aboutCache = null;

  /* ========================================
     Frontmatter 解析
     ======================================== */
  function parseFrontmatter(text) {
    const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
    const match = text.match(fmRegex);
    if (!match) {
      return { data: {}, content: text };
    }

    const data = {};
    const lines = match[1].split(/\r?\n/);

    lines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();

      // 去除引号
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      data[key] = value;
    });

    return { data, content: match[2] };
  }

  /* ========================================
     从目录列表中提取 .md 文件
     ======================================== */
  async function fetchFileList() {
    const response = await fetch('posts/');
    if (!response.ok) {
      throw new Error('无法访问 posts/ 目录');
    }
    const html = await response.text();

    // 解析目录列表 HTML，提取 .md 文件链接
    const mdFiles = [];
    const linkRegex = /href="([^"]+\.md)"/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      let filename = match[1];
      // 处理相对路径
      filename = filename.split('/').pop();
      // URL 解码
      filename = decodeURIComponent(filename);
      mdFiles.push(filename);
    }

    return mdFiles;
  }

  /* ========================================
     从 manifest.json 加载
     ======================================== */
  async function fetchManifest() {
    const response = await fetch('posts/manifest.json');
    if (!response.ok) {
      throw new Error('无法加载 manifest.json');
    }
    return response.json();
  }

  /* ========================================
     加载单个 .md 文件并解析
     ======================================== */
  async function fetchPost(filename) {
    const response = await fetch(`posts/${encodeURIComponent(filename)}`);
    if (!response.ok) {
      throw new Error(`无法加载文章: ${filename}`);
    }
    const text = await response.text();
    const { data, content } = parseFrontmatter(text);

    // 从文件名生成 ID（去掉 .md 后缀）
    const id = filename.replace(/\.md$/, '');

    return {
      id,
      title: data.title || id,
      date: data.date || '',
      tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      excerpt: data.excerpt || '',
      cover: data.cover || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      readingTime: parseInt(data.readingTime) || estimateReadingTime(content),
      type: data.type || 'post',
      content
    };
  }

  /* ========================================
     估算阅读时间（中文按字数，英文按词数）
     ======================================== */
  function estimateReadingTime(content) {
    // 去除 Markdown 语法标记
    const plainText = content
      .replace(/```[\s\S]*?```/g, '')   // 代码块
      .replace(/`[^`]+`/g, '')           // 行内代码
      .replace(/!\[.*?\]\(.*?\)/g, '')   // 图片
      .replace(/\[.*?\]\(.*?\)/g, '')    // 链接
      .replace(/[#>*_~|-]/g, '')         // 标记符号
      .trim();

    // 中文字符数
    const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 英文词数
    const englishWords = (plainText.match(/[a-zA-Z]+/g) || []).length;

    // 中文 300 字/分钟，英文 200 词/分钟
    const minutes = Math.ceil(chineseChars / 300 + englishWords / 200);
    return Math.max(1, minutes);
  }

  /* ========================================
     加载所有文章
     策略：manifest 优先（最可靠），目录列表备选
     ======================================== */
  async function loadAllPosts() {
    if (_postsCache) return _postsCache;

    let filenames = [];
    let loadMethod = 'manifest';

    // 方案 1（优先）：从 manifest.json 加载文件列表
    try {
      const manifest = await fetchManifest();
      if (Array.isArray(manifest)) {
        filenames = manifest;
      } else if (manifest.posts && Array.isArray(manifest.posts)) {
        // manifest.posts 是对象数组，提取文件名
        filenames = manifest.posts.map(p => p.file || p);
      }
      if (filenames.length === 0) {
        throw new Error('manifest 为空');
      }
    } catch (e) {
      console.log('[PostLoader] manifest 不可用，尝试目录列表...', e.message);
      loadMethod = 'directory';

      // 方案 2（备选）：扫描目录列表
      try {
        filenames = await fetchFileList();
        if (filenames.length === 0) {
          throw new Error('目录列表为空');
        }
      } catch (e2) {
        console.error('[PostLoader] 目录列表也不可用', e2.message);
        _postsCache = [];
        return _postsCache;
      }
    }

    console.log(`[PostLoader] 通过 ${loadMethod} 方式发现 ${filenames.length} 个文件:`, filenames);

    // 并行加载所有文件
    const results = await Promise.allSettled(
      filenames.map(filename => fetchPost(filename))
    );

    // 记录失败的文章
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.error(`[PostLoader] 加载失败: ${filenames[i]}`, r.reason);
      }
    });

    const posts = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    console.log(`[PostLoader] 成功加载 ${posts.length} 篇文章`);

    // 分离文章和页面
    _postsCache = posts.filter(p => p.type !== 'page');
    _aboutCache = posts.find(p => p.type === 'page');

    return _postsCache;
  }

  /* ========================================
     获取关于页面内容
     ======================================== */
  async function getAboutContent() {
    if (!_postsCache) {
      await loadAllPosts();
    }
    return _aboutCache;
  }

  /* ========================================
     获取所有标签
     ======================================== */
  async function getAllTags() {
    const posts = await loadAllPosts();
    const tagCounts = {};
    posts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }

  /* ========================================
     按 ID 获取单篇文章
     ======================================== */
  async function getPostById(id) {
    const posts = await loadAllPosts();
    return posts.find(p => p.id === id);
  }

  /* ========================================
     按标签筛选
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
     搜索文章
     ======================================== */
  async function searchPosts(query) {
    const posts = await loadAllPosts();
    const q = query.toLowerCase().trim();
    if (!q) return posts;

    return posts.filter(post =>
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.tags.some(tag => tag.toLowerCase().includes(q)) ||
      post.content.toLowerCase().includes(q)
    );
  }

  // 清除缓存（添加文章后调用）
  function clearCache() {
    _postsCache = null;
    _aboutCache = null;
  }

  return {
    loadAllPosts,
    getAboutContent,
    getAllTags,
    getPostById,
    getPostsByTag,
    getAdjacentPosts,
    searchPosts,
    clearCache
  };
})();
