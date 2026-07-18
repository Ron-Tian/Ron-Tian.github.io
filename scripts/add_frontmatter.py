#!/usr/bin/env python3
"""一次性脚本：给 posts/C++/ 目录下所有 .md 文件添加 frontmatter"""

import os
from pathlib import Path

# 每个文件的元数据：(文件名, id, title, tags, excerpt, cover)
METADATA = [
    ("C++  新标准【C++】.md", "cpp-new-standard", "C++ 新标准特性",
     "C++,新标准",
     "介绍 C++11/14/17 引入的关键新特性：强类型枚举、emplace 操作、auto 类型推导等。",
     "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"),

    ("C++ 四种强制类型转换【C++】.md", "cpp-type-casting", "C++ 四种强制类型转换",
     "C++,类型转换",
     "static_cast、const_cast、dynamic_cast、reinterpret_cast 四种类型转换的使用场景与区别。",
     "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"),

    ("C++ 基础 【C++】.md", "cpp-basics", "C++ 基础知识",
     "C++,基础",
     "C++ 基础概念：引用与指针的区别、const 限定符、内存管理等核心知识点。",
     "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"),

    ("C++ 线程池【C++】.md", "cpp-thread-pool", "C++ 线程池实现",
     "C++,多线程,线程池",
     "C++ 线程池的完整实现，包括任务队列、工作线程管理、同步机制等。",
     "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)"),

    ("C++11多线程中std__call_once的使用【C++】.md", "cpp-call-once", "C++11 std::call_once 的使用",
     "C++,多线程",
     "std::call_once 配合 std::once_flag 保证多线程环境下函数只执行一次，常用于线程安全的单例模式。",
     "linear-gradient(135deg, #fa709a 0%, #fee140 100%)"),

    ("main函数里的argc和argv【C++】.md", "cpp-argc-argv", "main 函数里的 argc 和 argv",
     "C++,基础",
     "main 函数参数 argc 和 argv 的含义与使用方法，命令行参数的传递机制。",
     "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)"),

    ("\u201c接口\u201d与\u201c实现\u201d分离的方式【C++】.md", "cpp-interface-impl", "\u201c接口\u201d与\u201c实现\u201d分离的方式",
     "C++,设计",
     "C++ 中接口与实现分离的两种方法：Pimpl Idiom 和抽象类接口（Object Interface）。",
     "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)"),

    ("共享锁【C++】.md", "cpp-shared-lock", "C++ 共享锁（读写锁）",
     "C++,多线程",
     "std::shared_mutex 与 std::shared_lock 实现读写锁，允许多读单写场景下的高效并发。",
     "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)"),

    ("单例模式【C++】.md", "cpp-singleton", "单例模式",
     "C++,设计模式",
     "单例模式：保证一个类只有一个实例，提供全局访问节点。多种实现方式及线程安全讨论。",
     "linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)"),

    ("工厂模式【C++】.md", "cpp-factory", "工厂模式",
     "C++,设计模式",
     "简单工厂、工厂方法、抽象工厂三种工厂模式的结构、应用场景与优缺点对比。",
     "linear-gradient(135deg, #f6d365 0%, #fda085 100%)"),

    ("智能指针【C++】.md", "cpp-smart-pointer", "C++ 智能指针",
     "C++,内存管理",
     "auto_ptr、unique_ptr、shared_ptr、weak_ptr 四种智能指针的原理、用法与最佳实践。",
     "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)"),

    ("条件变量【C++】.md", "cpp-condition-variable", "C++ 条件变量",
     "C++,多线程",
     "条件变量实现线程间通信，配合互斥量实现等待-通知机制。",
     "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)"),

    ("死锁 【C++】.md", "cpp-deadlock", "C++ 死锁问题",
     "C++,多线程",
     "死锁的定义、产生条件、常见场景及避免策略。",
     "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)"),

    ("观察者模式【C++】.md", "cpp-observer", "观察者模式",
     "C++,设计模式",
     "观察者模式：定义订阅机制，在对象状态变化时通知多个观察者，实现发布-订阅解耦。",
     "linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)"),

    ("设计模式.md", "cpp-design-patterns", "设计模式概述",
     "C++,设计模式",
     "设计模式概述：23 种设计模式的分类（创建型、结构型、行为型）及各自的意义。",
     "linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)"),

    ("远程开_关机【C++】.md", "cpp-remote-power", "远程开机与关机",
     "C++,网络",
     "通过局域网唤醒（Wake-on-LAN）实现远程开机，通过套接字编程实现远程关机。",
     "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)"),

    ("迭代器失效怎么解决【C++】.md", "cpp-iterator-invalidation", "C++ 迭代器失效怎么解决",
     "C++,STL",
     "序列式容器和关联式容器迭代器失效的不同处理方式，erase 返回下一个有效迭代器。",
     "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)"),
]


def estimate_reading_time(text):
    import re
    plain = re.sub(r'```[\s\S]*?```', '', text)
    plain = re.sub(r'`[^`]+`', '', plain)
    plain = re.sub(r'!\[.*?\]\(.*?\)', '', plain)
    plain = re.sub(r'\[.*?\]\(.*?\)', '', plain)
    plain = re.sub(r'[#>*_~|-]', '', plain).strip()
    chinese = len(re.findall(r'[\u4e00-\u9fa5]', plain))
    english = len(re.findall(r'[a-zA-Z]+', plain))
    return max(1, (chinese // 300 + english // 200) + 1)


def main():
    cpp_dir = Path(__file__).parent.parent / 'posts' / 'C++'
    if not cpp_dir.exists():
        print(f"目录不存在: {cpp_dir}")
        return

    count = 0
    for filename, post_id, title, tags, excerpt, cover in METADATA:
        filepath = cpp_dir / filename
        if not filepath.exists():
            print(f"  ✗ 文件不存在: {filename}")
            continue

        text = filepath.read_text(encoding='utf-8')

        # 检查是否已有 frontmatter
        if text.startswith('---'):
            print(f"  ⊙ 已有 frontmatter，跳过: {filename}")
            continue

        reading_time = estimate_reading_time(text)

        frontmatter = f"""---
title: "{title}"
date: 2026-07-18
tags: {tags}
excerpt: "{excerpt}"
cover: {cover}
readingTime: {reading_time}
type: post
---

"""
        filepath.write_text(frontmatter + text, encoding='utf-8')
        print(f"  ✓ {filename} — {title} ({reading_time}min)")
        count += 1

    print(f"\n✅ 完成，共处理 {count} 个文件")


if __name__ == '__main__':
    print("添加 frontmatter 到 C++ 目录下的 .md 文件\n")
    main()
