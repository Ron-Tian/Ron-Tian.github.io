#!/usr/bin/env python3
"""给 C++ 目录下已有的 frontmatter 添加 id 字段"""

from pathlib import Path
import re

# 文件名 → id 映射
ID_MAP = {
    "C++  新标准【C++】.md": "cpp-new-standard",
    "C++ 四种强制类型转换【C++】.md": "cpp-type-casting",
    "C++ 基础 【C++】.md": "cpp-basics",
    "C++ 线程池【C++】.md": "cpp-thread-pool",
    "C++11多线程中std__call_once的使用【C++】.md": "cpp-call-once",
    "main函数里的argc和argv【C++】.md": "cpp-argc-argv",
    "\u201c接口\u201d与\u201c实现\u201d分离的方式【C++】.md": "cpp-interface-impl",
    "共享锁【C++】.md": "cpp-shared-lock",
    "单例模式【C++】.md": "cpp-singleton",
    "工厂模式【C++】.md": "cpp-factory",
    "智能指针【C++】.md": "cpp-smart-pointer",
    "条件变量【C++】.md": "cpp-condition-variable",
    "死锁 【C++】.md": "cpp-deadlock",
    "观察者模式【C++】.md": "cpp-observer",
    "设计模式.md": "cpp-design-patterns",
    "远程开_关机【C++】.md": "cpp-remote-power",
    "迭代器失效怎么解决【C++】.md": "cpp-iterator-invalidation",
}

cpp_dir = Path(__file__).parent.parent / 'posts' / 'C++'
count = 0

for filename, post_id in ID_MAP.items():
    filepath = cpp_dir / filename
    if not filepath.exists():
        print(f"  ✗ {filename}")
        continue

    text = filepath.read_text(encoding='utf-8')
    # 在 frontmatter 的 --- 后面第一行插入 id
    if text.startswith('---\n') and '\nid:' not in text[:200]:
        text = text.replace('---\n', f'---\nid: {post_id}\n', 1)
        filepath.write_text(text, encoding='utf-8')
        print(f"  ✓ {filename} → {post_id}")
        count += 1
    else:
        print(f"  ⊙ {filename} (已有 id 或无 frontmatter)")

print(f"\n✅ 处理 {count} 个文件")
