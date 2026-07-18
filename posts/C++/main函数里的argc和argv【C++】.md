---
id: cpp-argc-argv
title: "main 函数里的 argc 和 argv"
date: 2026-07-18
tags: C++,基础
excerpt: "main 函数参数 argc 和 argv 的含义与使用方法，命令行参数的传递机制。"
cover: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)
readingTime: 1
type: post
---

```cpp
int main(int argc,char** argv)
{
  	// do
}
```

+ <font style="color:rgb(77, 77, 77);">arg指的是"参数"</font>
+ <font style="color:rgb(77, 77, 77);">其中argc是整数,用来统计运行程序时送给main函数的命令行参数的个数(vsiual studio默认值为一);</font>
+ 而*argv[ ]:为字符串数组,用来存放指向字符串参数的指针数组,每一个元素指向一个参数

argv[0]指向程序运行的全路径名

argv[1]指向在DOS命令行中执行程序名后的第一个字符串

argv[2]指向执行程序名后的第二个字符串

argv[3]指向执行程序名后的第三个字符串

argv[argc]为NULL

char**类型的env,为字符串数组,env[ ]的每个元素都包含ENVVAR = value形式的字符串

ENVVAR为环境变量

value为ENVVAR的对应值

这两者一般在命令行编译程序的时候有用

在C++中,main函数应该有三个形参 main(int argc, char*argv[ ],char**env) 才是标准写法

argc, argv和env是在main( )函数之前就被赋值的,所以main( )函数并不是真正的函数入口

注意:如果vsiual studio的main函数传参了的话,要在[项目属性] ->[配置属性] ->[调试] ->[命令参数],比如读取一张名为"1.jpg",就在后面的框里加上"1.jpg"即可,引号也要有,如果有多个,中间用空格隔开

