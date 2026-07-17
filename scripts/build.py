#!/usr/bin/env python3
"""
拾柴记 - Manifest 构建脚本

扫描 posts/ 目录下的所有 .md 文件，解析 frontmatter 元数据，
生成 posts/manifest.json 供前端加载。

使用方法：
    python scripts/build.py

适用场景：
    - 部署到不支持目录列表的静态托管（如 GitHub Pages、Vercel 等）
    - 本地开发时使用 Python http.server 则无需运行此脚本
"""

import os
import re
import json
import sys
from pathlib import Path


def parse_frontmatter(text):
    """解析 Markdown 文件顶部的 YAML frontmatter"""
    pattern = r'^---\r?\n(.*?)\r?\n---\r?\n?(.*)$'
    match = re.match(pattern, text, re.DOTALL)
    if not match:
        return {}, text

    data = {}
    for line in match.group(1).split('\n'):
        colon_idx = line.find(':')
        if colon_idx == -1:
            continue
        key = line[:colon_idx].strip()
        value = line[colon_idx + 1:].strip()
        # 去除引号
        if (value.startswith('"') and value.endswith('"')) or \
           (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        data[key] = value

    return data, match.group(2)


def estimate_reading_time(content):
    """估算阅读时间"""
    # 去除 Markdown 语法
    plain = re.sub(r'```[\s\S]*?```', '', content)
    plain = re.sub(r'`[^`]+`', '', plain)
    plain = re.sub(r'!\[.*?\]\(.*?\)', '', plain)
    plain = re.sub(r'\[.*?\]\(.*?\)', '', plain)
    plain = re.sub(r'[#>*_~|-]', '', plain).strip()

    chinese = len(re.findall(r'[\u4e00-\u9fa5]', plain))
    english = len(re.findall(r'[a-zA-Z]+', plain))
    minutes = max(1, (chinese // 300 + english // 200) + 1)
    return minutes


def main():
    # 定位 posts 目录
    script_dir = Path(__file__).parent
    posts_dir = script_dir.parent / 'posts'

    if not posts_dir.exists():
        print(f'错误: posts 目录不存在: {posts_dir}')
        sys.exit(1)

    md_files = sorted([f for f in posts_dir.iterdir() if f.suffix == '.md'])

    if not md_files:
        print('警告: posts 目录中没有 .md 文件')
        sys.exit(0)

    manifest = {'posts': []}

    for md_file in md_files:
        with open(md_file, 'r', encoding='utf-8') as f:
            text = f.read()

        data, content = parse_frontmatter(text)

        entry = {
            'file': md_file.name,
            'id': md_file.stem,
            'title': data.get('title', md_file.stem),
            'date': data.get('date', ''),
            'tags': [t.strip() for t in data.get('tags', '').split(',') if t.strip()],
            'excerpt': data.get('excerpt', ''),
            'cover': data.get('cover', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'),
            'readingTime': int(data.get('readingTime', estimate_reading_time(content))) if data.get('readingTime') else estimate_reading_time(content),
            'type': data.get('type', 'post')
        }
        manifest['posts'].append(entry)
        print(f'  ✓ {md_file.name} — {entry["title"]}')

    # 写入 manifest.json
    output_path = posts_dir / 'manifest.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print(f'\n✅ 已生成 {output_path}')
    print(f'   共 {len(manifest["posts"])} 篇文章')


if __name__ == '__main__':
    print('拾柴记 - 构建 manifest.json\n')
    main()
