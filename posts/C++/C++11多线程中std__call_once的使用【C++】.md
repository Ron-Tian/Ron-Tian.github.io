---
id: cpp-call-once
title: "C++11 std::call_once 的使用"
date: 2026-07-18
tags: C++,多线程
excerpt: "std::call_once 配合 std::once_flag 保证多线程环境下函数只执行一次，常用于线程安全的单例模式。"
cover: linear-gradient(135deg, #fa709a 0%, #fee140 100%)
readingTime: 1
type: post
---

### C++11中的std::call_once函数位于<mutex>头文件中。
### 在多线程编程中，有时某个任务只需要执行一次，此时可以用C++11中的std::call_once函数配合std::once_flag来实现。如果多个线程需要同时调用某个函数，std::call_once可以保证多个线程对该函数只调用一次。也可用在解决线程安全的单例模式。




例如：

```cpp
class Singleton
{
public:
    static Singleton* getInstance()
    {
        static std::once_flag onceFlag; // 必须是静态的
        std::call_once(onceFlag, [&] {m_instance = new Singleton(); }); // 只会调用一次
        return m_instance;
    }

private:
    Singleton() {} //私有构造函数，不允许使用者自己生成对象，但是必须要实现
    Singleton(const Singleton& other) = delete;
    Singleton& operator = (const Singleton& other) = delete;

private:
    static Singleton* m_instance; //静态成员变量 
};

Singleton* Singleton::m_instance = nullptr; //静态成员需要先初始化
```

