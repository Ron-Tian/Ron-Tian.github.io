---
id: cpp-interface-impl
title: "“接口”与“实现”分离的方式"
date: 2026-07-18
tags: C++,设计
excerpt: "C++ 中接口与实现分离的两种方法：Pimpl Idiom 和抽象类接口（Object Interface）。"
cover: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)
readingTime: 1
type: post
---

c++中实现对接口与实现进行分离有两种方法，一种是将对象的实现细目隐藏于指针背后，简单的说就是将其分成两个类，一个类只提供接口，另一个负责实现该接口，这种设计手法常称为Pimpl Idiom(pointer to implementation)。

另一种方法就是将接口定义为抽象类，接口全被定义为纯虚函数（纯虚函数没有具体的实现方法），派生类的成员函数负责实现这些接口。这种设计手法称为Object Interface。千万不要忘记把抽象接口类的析构函数定义为virtual函数，可能会造成内存泄漏。

[  
](https://blog.csdn.net/TAOKONG1017/article/details/79561856)

