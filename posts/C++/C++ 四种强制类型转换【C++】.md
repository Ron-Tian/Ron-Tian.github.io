---
id: cpp-type-casting
title: "C++ 四种强制类型转换"
date: 2026-07-18
tags: C++,类型转换
excerpt: "static_cast、const_cast、dynamic_cast、reinterpret_cast 四种类型转换的使用场景与区别。"
cover: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)
readingTime: 3
type: post
---

<font style="color:rgb(51, 51, 51);">C++关于类型转换引入了四种方式</font>

+ <font style="color:rgb(51, 51, 51);">static_cast</font>
+ <font style="color:rgb(51, 51, 51);">const_cast</font>
+ <font style="color:rgb(51, 51, 51);">dynamic_cast</font>
+ <font style="color:rgb(51, 51, 51);">reinterpret_cast</font>

---

### 问题1 ：<font style="color:rgb(51, 51, 51);">为什么要引入这几种类型转换，它与C语言中的强制类型转换有什么区别？</font>
<font style="color:rgb(51, 51, 51);">C++完全兼容C语言，C语言的转换方式很简单，可以在任意类型之间转换，但这也恰恰是缺点，因为极其不安全，可能不经意间将指向const对象的指针转换成非const对象的指针，可能将基类对象指针转成了派生类对象的指针，这种转换很容易出bug，需要严格审查代码才能消除这种隐患，但是C这种转换方式不利于我们审查代码，且程序运行时也可能会出bug。</font>

<font style="color:rgb(51, 51, 51);">而C++引入的这几种类型转换可以完美的解决上述问题，不同场景下不同需求使用不同的类型转换方式，</font>

<font style="color:rgb(51, 51, 51);">同时有利于代码审查。</font>

---

### 问题2：<font style="color:rgb(51, 51, 51);">这四种类型转换分别应用在什么场景</font>
**<font style="color:rgb(51, 51, 51);">（1）、static_cast</font>**

<font style="color:rgb(51, 51, 51);">a、基本数据类型之间的转换使用，例如float转int，int转char等</font>

<font style="color:rgb(51, 51, 51);">b、在有类型指针和void*之间转换使用</font>

<font style="color:rgb(51, 51, 51);">c、子类对象指针转换成父类对象指针也可以使用static_cast。</font>

<font style="color:rgb(18, 18, 18);">static_cast 进行上行转换是安全的，即把派生类的指针转换为基类的；</font>

<font style="color:rgb(18, 18, 18);">static_cast 进行下行转换是不安全的，即把基类的指针转换为派生类的。</font>

<font style="color:rgb(51, 51, 51);">注：非多态类型转换一般都使用static_cast，而且最好把所有的隐式类型转换都是用static_cast进行显示替换</font>

**<font style="color:rgb(51, 51, 51);">（2）、</font>**<font style="color:rgb(51, 51, 51);">const_cast</font>

<font style="color:rgba(0, 0, 0, 0.75);">a、volatile 和非 volatile 指针之间转换</font>

<font style="color:rgba(0, 0, 0, 0.75);">b、const 和非 const 指针之间转换</font>

**<font style="color:rgb(51, 51, 51);">（3）、</font>**<font style="color:rgb(51, 51, 51);">dynamic_cast</font>

<font style="color:rgba(0, 0, 0, 0.75);">a、</font><font style="color:rgb(51, 51, 51);">用于将父类的指针或引用转换为子类的指针或引用，此场景下父类必须要有虚函数，因为dynamic_cast是运行时检查，检查需要运行时信息RTTI，而RTTI存储在虚函数表中</font>

<font style="color:rgb(51, 51, 51);">注：</font><font style="color:rgb(18, 18, 18);">dynamic_cast 主要用于类层次间的上行转换或下行转换。在进行上行转换时，dynamic_cast 和 static_cast 的效果是一样的，但在下行转换时，dynamic_cast 具有类型检查的功能，比 static_cast 更安全。</font>

**<font style="color:rgb(51, 51, 51);">（4）、</font>**<font style="color:rgb(51, 51, 51);">reinterpret_cast</font>

<font style="color:rgba(0, 0, 0, 0.75);">a、</font><font style="color:rgb(18, 18, 18);">该运算符可以把一个指针转换成一个整数，也可以把一个整数转换成一个指针。</font>







