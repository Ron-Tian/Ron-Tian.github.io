---
id: cpp-iterator-invalidation
title: "C++ 迭代器失效怎么解决"
date: 2026-07-18
tags: C++,STL
excerpt: "序列式容器和关联式容器迭代器失效的不同处理方式，erase 返回下一个有效迭代器。"
cover: linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)
readingTime: 1
type: post
---

<font style="color:rgb(38, 38, 38);background-color:rgb(232, 247, 207);">（1）序列式容器（数组式容器如array、vector、queue）： 使用erase方法可以返回下一个有效的iterator </font>  
<font style="color:rgb(38, 38, 38);background-color:rgb(232, 247, 207);"> // 序列式容器</font>

```cpp
 vector<int> vecTemp = {1,2,3};
 for (auto iter = vecTemp.begin(); iter != vecTemp.end(); ++iter)
 {
 	if (*iter == 2)
 	{
 		iter = vecTemp.erase(iter);
 	}
 }
```

<font style="color:rgb(38, 38, 38);background-color:rgb(232, 247, 207);">（2）关联式容器：使用erase方法可以返回下一个有效的iterator或者删除之后再次++</font>  
<font style="color:rgb(38, 38, 38);background-color:rgb(232, 247, 207);"> // 关联式容器</font>

```cpp
 map<int, int> mapTemp = { {1,1},{2,2 },{3,3} };
 for (auto iter = mapTemp.begin(); iter != mapTemp.end(); ++iter)
 {
 	if (iter->first == 2)
 	{
 	iter = mapTemp.erase(iter);
 	// OR mapTemp.erase(iter++);
 	}
 }
```

  


