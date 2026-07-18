---
id: cpp-singleton
title: "单例模式"
date: 2026-07-18
tags: C++,设计模式
excerpt: "单例模式：保证一个类只有一个实例，提供全局访问节点。多种实现方式及线程安全讨论。"
cover: linear-gradient(135deg, #c471f5 0%, #fa71cd 100%)
readingTime: 11
type: post
---

## <font style="color:rgb(68, 68, 68);">意图</font>
**<font style="color:rgb(68, 68, 68);">单例模式</font>**<font style="color:rgb(68, 68, 68);">是一种创建型设计模式， 让你能够保证一个类只有一个实例， 并提供一个访问该实例的全局节点。</font>

## <font style="color:rgb(68, 68, 68);">问题</font>
<font style="color:rgb(68, 68, 68);">单例模式同时解决了两个问题</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">所以违反了</font>_<font style="color:rgb(68, 68, 68);">单</font>__<font style="color:rgb(68, 68, 68);">一</font>__<font style="color:rgb(68, 68, 68);">职</font>__<font style="color:rgb(68, 68, 68);">责</font>__<font style="color:rgb(68, 68, 68);">原</font>__<font style="color:rgb(68, 68, 68);">则</font>_<font style="color:rgb(68, 68, 68);">：</font>

1. **<font style="color:rgb(68, 68, 68);">保证一个类只有一个实例</font>**<font style="color:rgb(68, 68, 68);">。 为什么会有人想要控制一个类所拥有的实例数量？ 最常见的原因是控制某些共享资源 （例如数据库或文件） 的访问权限。它的运作方式是这样的： 如果你创建了一个对象， 同时过一会儿后你决定再创建一个新对象， 此时你会获得之前已创建的对象， 而不是一个新对象。注意， 普通构造函数无法实现上述行为， 因为构造函数的设计决定了它</font>**<font style="color:rgb(68, 68, 68);">必须</font>**<font style="color:rgb(68, 68, 68);">总是返回一个新对象。</font>
2. **<font style="color:rgb(68, 68, 68);">为该实例提供一个全局访问节点</font>**<font style="color:rgb(68, 68, 68);">。 还记得你 （好吧，其实是我自己） 用过的那些存储重要对象的全局变量吗？ 它们在使用上十分方便， 但同时也非常不安全， 因为任何代码都有可能覆盖掉那些变量的内容， 从而引发程序崩溃。和全局变量一样， 单例模式也允许在程序的任何地方访问特定对象。 但是它可以保护该实例不被其他代码覆盖。还有一点： 你不会希望解决同一个问题的代码分散在程序各处的。 因此更好的方式是将其放在同一个类中， 特别是当其他代码已经依赖这个类时更应该如此。</font>

<font style="color:rgb(68, 68, 68);">如今， 单例模式已经变得非常流行， 以至于人们会将只解决上文描述中任意一个问题的东西称为</font>_<font style="color:rgb(68, 68, 68);">单例</font>_<font style="color:rgb(68, 68, 68);">。</font>

## <font style="color:rgb(68, 68, 68);">解决方案</font>
<font style="color:rgb(68, 68, 68);">所有单例的实现都包含以下两个相同的步骤</font><font style="color:rgb(68, 68, 68);">：</font>

+ <font style="color:rgb(68, 68, 68);">将默认构造函数设为私有</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">防止其他对象使用单例类的</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);background-color:rgb(238, 238, 238);">new</font><font style="color:rgb(68, 68, 68);">运算符</font><font style="color:rgb(68, 68, 68);">。</font>
+ <font style="color:rgb(68, 68, 68);">新建一个静态构建方法作为构造函数</font><font style="color:rgb(68, 68, 68);">。</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">该函数会</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">“</font><font style="color:rgb(68, 68, 68);">偷偷</font><font style="color:rgb(68, 68, 68);">”</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">调用私有构造函数来创建对象</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">并将其保存在一个静态成员变量中</font><font style="color:rgb(68, 68, 68);">。</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">此后所有对于该函数的调用都将返回这一缓存对象</font><font style="color:rgb(68, 68, 68);">。</font>

<font style="color:rgb(68, 68, 68);">如果你的代码能够访问单例类， 那它就能调用单例类的静态方法。 无论何时调用该方法， 它总是会返回相同的对象。</font>

## <font style="color:rgb(68, 68, 68);">单例模式结构</font>
1. **<font style="color:rgb(68, 68, 68);background-color:rgb(245, 245, 245);">单例</font>**<font style="color:rgb(68, 68, 68);background-color:rgb(245, 245, 245);"> （Singleton） 类声明了一个名为 </font><font style="color:rgb(68, 68, 68);background-color:rgb(238, 238, 238);">get­Instance</font><font style="color:rgb(68, 68, 68);background-color:rgb(221, 221, 221);">获取实例</font><font style="color:rgb(68, 68, 68);background-color:rgb(245, 245, 245);">的静态方法来返回其所属类的一个相同实例。单例的构造函数必须对客户端 （Client） 代码隐藏。 调用 </font><font style="color:rgb(68, 68, 68);background-color:rgb(238, 238, 238);">获取实例</font><font style="color:rgb(68, 68, 68);background-color:rgb(245, 245, 245);">方法必须是获取单例对象的唯一方式。</font>

## <font style="color:rgb(68, 68, 68);">单例模式适合应用场景</font>
**<font style="color:rgb(68, 68, 68);"></font>****<font style="color:rgb(68, 68, 68);">如果程序中的某个类对于所有客户端只有一个可用的实例</font>****<font style="color:rgb(68, 68, 68);">，</font>****<font style="color:rgb(68, 68, 68);"> </font>****<font style="color:rgb(68, 68, 68);">可以使用单例模式</font>****<font style="color:rgb(68, 68, 68);">。</font>**

<font style="color:rgb(68, 68, 68);"></font><font style="color:rgb(68, 68, 68);">单例模式禁止通过除特殊构建方法以外的任何方式来创建自身类的对象</font><font style="color:rgb(68, 68, 68);">。</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">该方法可以创建一个新对象</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">但如果该对象已经被创建</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">则返回已有的对象</font><font style="color:rgb(68, 68, 68);">。</font>

**<font style="color:rgb(68, 68, 68);"></font>****<font style="color:rgb(68, 68, 68);">如果你需要更加严格地控制全局变量</font>****<font style="color:rgb(68, 68, 68);">，</font>****<font style="color:rgb(68, 68, 68);"> </font>****<font style="color:rgb(68, 68, 68);">可以使用单例模式</font>****<font style="color:rgb(68, 68, 68);">。</font>**

<font style="color:rgb(68, 68, 68);"></font><font style="color:rgb(68, 68, 68);">单例模式与全局变量不同</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">它保证类只存在一个实例</font><font style="color:rgb(68, 68, 68);">。</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">除了单例类自己以外</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">无法通过任何方式替换缓存的实例</font><font style="color:rgb(68, 68, 68);">。</font>

<font style="color:rgb(68, 68, 68);">请注意， 你可以随时调整限制并设定生成单例实例的数量， 只需修改 </font><font style="color:rgb(68, 68, 68);background-color:rgb(238, 238, 238);">获取实例</font><font style="color:rgb(68, 68, 68);">方法， 即 getInstance 中的代码即可实现。</font>

## <font style="color:rgb(68, 68, 68);"></font><font style="color:rgb(68, 68, 68);">实现方式</font>
1. <font style="color:rgb(68, 68, 68);">在类中添加一个私有静态成员变量用于保存单例实例</font><font style="color:rgb(68, 68, 68);">。</font>
2. <font style="color:rgb(68, 68, 68);">声明一个公有静态构建方法用于获取单例实例</font><font style="color:rgb(68, 68, 68);">。</font>
3. <font style="color:rgb(68, 68, 68);">在静态方法中实现"延迟初始化"</font><font style="color:rgb(68, 68, 68);">。</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">该方法会在首次被调用时创建一个新对象</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">并将其存储在静态成员变量中</font><font style="color:rgb(68, 68, 68);">。</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">此后该方法每次被调用时都返回该实例</font><font style="color:rgb(68, 68, 68);">。</font>
4. <font style="color:rgb(68, 68, 68);">将类的构造函数设为私有</font><font style="color:rgb(68, 68, 68);">。</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">类的静态方法仍能调用构造函数</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">但是其他对象不能调用</font><font style="color:rgb(68, 68, 68);">。</font>
5. <font style="color:rgb(68, 68, 68);">检查客户端代码， 将对单例的构造函数的调用替换为对其静态构建方法的调用。</font>

## <font style="color:rgb(68, 68, 68);">单例模式优缺点</font>
优点：

+ <font style="color:rgb(68, 68, 68);">你可以保证一个类只有一个实例</font><font style="color:rgb(68, 68, 68);">。</font>
+ <font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">你获得了一个指向该实例的全局访问节点</font><font style="color:rgb(68, 68, 68);">。</font>
+ <font style="color:rgb(68, 68, 68);"> 仅在首次请求单例对象时对其进行初始化。</font>

<font style="color:rgb(68, 68, 68);">缺点</font>

+ <font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">违反了</font>_<font style="color:rgb(68, 68, 68);">单</font>__<font style="color:rgb(68, 68, 68);">一</font>__<font style="color:rgb(68, 68, 68);">职</font>__<font style="color:rgb(68, 68, 68);">责</font>__<font style="color:rgb(68, 68, 68);">原</font>__<font style="color:rgb(68, 68, 68);">则</font>_<font style="color:rgb(68, 68, 68);">。</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">该模式同时解决了两个问题</font><font style="color:rgb(68, 68, 68);">。</font>
+ <font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">单例模式可能掩盖不良设计</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">比如程序各组件之间相互了解过多等</font><font style="color:rgb(68, 68, 68);">。</font>
+ <font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">该模式在多线程环境下需要进行特殊处理</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">避免多个线程多次创建单例对象</font><font style="color:rgb(68, 68, 68);">。</font>
+ <font style="color:rgb(68, 68, 68);"> 单例的客户端代码单元测试可能会比较困难， 因为许多测试框架以基于继承的方式创建模拟对象。 由于单例类的构造函数是私有的， 而且绝大部分语言无法重写静态方法， 所以你需要想出仔细考虑模拟单例的方法。 要么干脆不编写测试代码， 或者不使用单例模式。</font>

---

<font style="color:rgb(68, 68, 68);">补充：</font>

为了便于读者更好的理解这些概念，下面给出这么一段内容叙述：

在计算机系统中，线程池、缓存、日志对象、对话框、打印机、显卡的驱动程序对象常被设计成单例。这些应用都或多或少具有资源管理器的功能。每台计算机可以有若干个打印机，但只能有一个Printer Spooler，以避免两个打印作业同时输出到打印机中。每台计算机可以有若干通信端口，系统应当集中管理这些通信端口，以避免一个通信端口同时被两个请求同时调用。总之，选择单例模式就是为了避免不一致状态，避免政出多头。

正是由于这个特点，单例对象通常作为程序中的存放配置信息的载体，因为它能保证其他对象读到一致的信息。例如在某个服务器程序中，该服务器的配置信息可能存放在数据库或文件中，这些配置数据由某个单例对象统一读取，服务进程中的其他对象如果要获取这些配置信息，只需访问该单例对象即可。这种方式极大地简化了在复杂环境 下，尤其是多线程环境下的配置管理，但是随着应用场景的不同，也可能带来一些同步问题。



<font style="color:rgb(51, 51, 51);">单例模式可以分为</font>**<font style="color:rgb(51, 51, 51);">懒汉式</font>**<font style="color:rgb(51, 51, 51);">和</font>**<font style="color:rgb(51, 51, 51);">饿汉式</font>**<font style="color:rgb(51, 51, 51);">，两者之间的区别在于</font>**<font style="color:rgb(51, 51, 51);">创建实例的时间不同</font>**<font style="color:rgb(51, 51, 51);">：</font>

+ **<font style="color:rgb(51, 51, 51);">懒汉式</font>**<font style="color:rgb(51, 51, 51);">：指系统运行中，实例并不存在，只有当需要使用该实例时，才会去创建并使用实例。</font>**<font style="color:rgb(51, 51, 51);">（这种方式要考虑线程安全）</font>**
+ **<font style="color:rgb(51, 51, 51);">饿汉式</font>**<font style="color:rgb(51, 51, 51);">：指系统一运行，就初始化创建实例，当需要时，直接调用即可。</font>**<font style="color:rgb(51, 51, 51);">（本身就线程安全，没有多线程的问题）</font>**

---

   

参考：[https://zhuanlan.zhihu.com/p/62014096](https://zhuanlan.zhihu.com/p/62014096)

