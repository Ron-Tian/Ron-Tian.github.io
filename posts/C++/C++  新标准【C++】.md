---
id: cpp-new-standard
title: "C++ 新标准特性"
date: 2026-07-18
tags: C++,新标准
excerpt: "介绍 C++11/14/17 引入的关键新特性：强类型枚举、emplace 操作、auto 类型推导等。"
cover: linear-gradient(135deg, #667eea 0%, #764ba2 100%)
readingTime: 1
type: post
---

# 1、强类型枚举 enum class
在标准C++中，枚举类型不是类型安全的。枚举类型被视为整数，这使得两种不同的枚举类型之间可以进行比较。C++03 唯一提供的安全机制是一个整数或一个枚举型值不能隐式转换到另一个枚举别型。 此外，枚举所使用整数类型及其大小都由实现方法定义，皆无法明确指定。 最后，枚举的名称全数暴露于一般范围中，因此C++03两个不同的枚举，不可以有相同的枚举名。

```cpp
例如 enum Side{ Right, Left }; 和 enum Thing{ Wrong, Right }; 不能一起使用。
C++11 引进了一种特别的 "枚举类"，可以避免上述的问题。使用 enum class 的语法来声明：
enum class Enumeration{ Val1, Val2, Val3 = 100, Val4 /* = 101 */,};
此种枚举为类型安全的。枚举类型不能隐式地转换为整数；也无法与整数数值做比较。
(表示式 Enumeration::Val4 == 101 会触发编译期错误)。
```

---

# 2、emplace 操作
emplace操作是从C++11开始引入新特性，emplace操作是直接通过参数构造元素而不是拷贝元素到容器中这样可以减少拷贝从而提高性能。对于map是没有emplace_front、emplace_after、emplace_back这些操作的。

```cpp
std::map<std::string, std::string> m;
 
// uses pair's move constructor 
// 使用移动构造
m.emplace(std::make_pair(std::string("a"), std::string("a")));
 
// uses pair's converting move constructor
// 使用隐式转换移动构造函数，和上一个区别是这里的“a”会隐式转换成std::string
m.emplace(std::make_pair("b", "abcd"));

// uses pair's template constructor
// 使用模板构造
m.emplace("d", "ddd");
 
// uses pair's piecewise constructor
m.emplace(std::piecewise_construct,std::forward_as_tuple("c"),std::forward_as_tuple(10, 'c'));
// as of C++17, m.try_emplace("c", 10, 'c'); can be used
```

# 3、<font style="color:rgb(34, 34, 38);">原子操作atomic</font>
# 4、<font style="color:rgb(68, 68, 68);"> const 和 constexpr</font>
<font style="color:rgb(68, 68, 68);">C++11 标准中，建议将 const 和 constexpr 的功能区分开，即凡是表达“只读”语义的场景都使用 const，表达“常量”语义的场景都使用 constexpr。</font>

<font style="color:rgb(68, 68, 68);"></font>

<font style="color:rgb(68, 68, 68);">5、finnal</font>





   

