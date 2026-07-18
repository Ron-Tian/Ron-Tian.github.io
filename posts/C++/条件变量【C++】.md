---
id: cpp-condition-variable
title: "C++ 条件变量"
date: 2026-07-18
tags: C++,多线程
excerpt: "条件变量实现线程间通信，配合互斥量实现等待-通知机制。"
cover: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)
readingTime: 2
type: post
---

1、条件变量是一种用于等待的同步机制，可以实现线程间通信，它必须与互斥量配合使用。



2、boost::thread提供的两种条件变量对象condition_variable、condition_variable_any。

他们的区别是：condition_variable只能配合boost::mutex互斥量；

    condition_variable_any可以适应更广泛的互斥量类型。



3、wait_for(lock_type& lock)函数的执行流程阻塞当前线程，内部自动调用lock.unlock()解锁互斥锁,释放对锁的所有权，当收到其它线程notify_one()或是notify_all()的通知时，再次重新获取互斥锁的使用权（lock.lock()），执行当前线程工作。



4、wait(lock_type& lock, predicate_type predicate)条件等待函数执行流程

只有在参数2中的predicate返回为false的时候才会阻塞线程，并释放锁，当收到其它线程notify_one()或是notify_all()的通知时并且参数2中的predicate返回为true时才能解除阻塞，并占用锁的使用权。



5、其它的等待函数是这两个等待函数的拓展，只是加了一个时间点或是时间段。



6、主要接口

<!-- 这是一张图片，ocr 内容为：classcondition_variabie_any public: /通知一个等待中的线程 voidnotifyone); notify_all(); /通知所有等待中的线程 void //等待 voidwait(1ock_typelock); voidwait(ocktypelock)件等待 //等待相对时间 cvstatuswaitfor( 1ocktypelock,c k,constdurationd): //条件等待相对时间 cv_statuswaitfor( 1ocktypes1ockon //等待绝对时间点 cv_statuswaituntil( 1ocktypeiock,consttimepoit //条件等待绝对时间点 cvstatuswaituntil( 1ocktypet1ockcntm -->
![](https://cdn.nlark.com/yuque/0/2021/png/1443385/1636128779557-c739c038-7838-40bf-b70d-6ed4ddc75cc4.png)

6、示例

6、1 非条件等待：

```cpp
#include <iostream>
#include <boost/thread.hpp>
#include <boost/thread/mutex.hpp>
#include <boost/thread/condition_variable.hpp>
#include <Windows.h>
boost::mutex mtx;                 // 全局相互排斥锁.
boost::condition_variable cv;     // 全局条件变量.

void do_print_id(int id)
{
boost::unique_lock <boost::mutex> lck(mtx);
//阻塞当前线程，内部自动调用lck.unlock()解锁互斥锁,释放对锁的所有权
cv.wait(lck);

std::cout << "thread " << id << '\n';
}
void go()
{
boost::unique_lock <boost::mutex> lck(mtx);
// 唤醒全部线程.
cv.notify_all();
}
int main()
{
boost::thread threads[10];
// spawn 10 threads:
for (int i = 0; i < 10; ++i)
threads[i] = boost::thread(do_print_id, i);
std::cout << "10 threads ready to race...\n";
Sleep(10000);
go(); // go!
for (auto & th : threads)
th.join();
return 0;
}
6、2 条件等待
#include <iostream>
#include <boost/thread/condition_variable.hpp>
#include <boost/thread/mutex.hpp>
#include <boost/thread.hpp>
#include <Windows.h>

boost::mutex mutex_;
boost::condition_variable condVar;
bool dataReady = false;

void waitingForWork(int n) {
boost::unique_lock<boost::mutex> lck(mutex_);
condVar.wait(lck, [] {return dataReady; });

std::cout << "Work done:" << n << std::endl;
}

void setDataReady() {
boost::lock_guard<boost::mutex> lck(mutex_);
Sleep(1000);

dataReady = true;
condVar.notify_all();
}

int main() {
boost::thread t[5];
for(int i = 0;i < 5;++i)
t[i] = boost::thread(waitingForWork, i);
boost::thread t2(setDataReady);

for(int i = 0;i < 5;++i)
t[i].join();
t2.join();
}
参考：https://www.freesion.com/article/7699987157/
https://www.jianshu.com/p/e179caefbb0f
```

```cpp
std::deque<int> q;
std::mutex mu;
std::condition_variable cond;

void function_1() //生产者
{
    int count = 10;
    while (count > 0) 
    {
        std::unique_lock<std::mutex> locker(mu);
        q.push_front(count);
        locker.unlock();
        cond.notify_one();  // Notify one waiting thread, if there is one.
        std::this_thread::sleep_for(std::chrono::seconds(1));
        count--;
    }
}

void function_2() //消费者
{
    int data = 0;
    while (data != 1) 
    {
        std::unique_lock<std::mutex> locker(mu);
        while (q.empty())
            cond.wait(locker); // Unlock mu and wait to be notified
        data = q.back();
        q.pop_back();
        locker.unlock();
        std::cout << "t2 got a value from t1: " << data << std::endl;
    }
}
```

## 1、虚假唤醒
为什么会出现虚假唤醒，为什么要用while来避免虚假唤醒？

虚假唤醒的出现在于生产者的notify并不在临界区内，也就是说，生产者使用临界区保护了修改流水线的这个操作，然后解锁，解锁完毕后才notify。而在这之间是非原子的。

在以下情况：

1).生产者对临界区加锁

2).修改流水线状态

3).生产者解锁

4).notify通知生产者线程

在3)与4)间是有空隙的，如果在3)进行后突然此刻加入了一个新的消费者，这个生产者察觉到流水线的变化，对他进行了消费，然后消费者才notify,notify唤醒了原有的消费者，但流水线已经为空了，实际上这就是一个虚假唤醒，唤醒后并无工作可做。

因此不能用if来进行条件判断，加入while就可以避免虚假唤醒，在每次唤醒后先判断流水线条件，这样避免了虚假唤醒的情况。

