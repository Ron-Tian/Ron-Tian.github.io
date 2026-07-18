---
id: cpp-shared-lock
title: "C++ 共享锁（读写锁）"
date: 2026-07-18
tags: C++,多线程
excerpt: "std::shared_mutex 与 std::shared_lock 实现读写锁，允许多读单写场景下的高效并发。"
cover: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)
readingTime: 1
type: post
---

共享互斥量，当作读写锁使用。不可以嵌套使用锁

    std::shared_lock<std::shared_mutex> lock_guard(m_shareMutex2mediaNodes);  //相当于读锁

    std::lock_guard<std::shared_mutex> lock_guard(m_shareMutex2mediaNodes);   //相当于写锁 

    std::shared_mutex m_shareMutex2mediaNodes; //为了保护 m_mediaNodes







C++11提供如下4种语义的互斥量（mutex）

std::mutex，独占的互斥量，不能递归使用。

std::time_mutex，带超时的独占互斥量，不能递归使用。

std::recursive_mutex，递归互斥量，不带超时功能。

std::recursive_timed_mutex，带超时的递归互斥量。

