---
id: cpp-observer
title: "观察者模式"
date: 2026-07-18
tags: C++,设计模式
excerpt: "观察者模式：定义订阅机制，在对象状态变化时通知多个观察者，实现发布-订阅解耦。"
cover: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)
readingTime: 4
type: post
---

### 1、意图
观察者模式是一种行为设计模式，允许定义一种订阅机制，可在对象事件发生时通知多个观察该对象的其他对象。

### 2、理解方面或者解决的问题
假设有两种类型的对象，“顾客”和“商店"。顾客对某个产品特别感兴趣，暂时没有货

（1）顾客可以每天来商店看看是否有货，但是如果没有货，则空手而归

（2）商店记录对商品感兴趣的每个客户电话，这样到货之后，立即进行通知。

### 3、解决方案
（1）_<font style="color:rgb(68, 68, 68);">发布者</font>_<font style="color:rgb(68, 68, 68);">（publisher）：拥有一些值得关注的状态的对象</font>

（2）_<font style="color:rgb(68, 68, 68);">订阅者</font>_<font style="color:rgb(68, 68, 68);">（subscribers）：关注发布者状态变化的其他对象</font>

<font style="color:rgb(68, 68, 68);">观察者模式建议你问发布者类添加订阅机制，让每个对象都能订阅或者取消订阅发布者事件流</font>

<!-- 这是一张图片，ocr 内容为：嘿,请把 我登记上! PUBLISHER SUBSCRIBER - SUBSCRIBERS[ +ADDSUBSCRIBER(SUBSCRIBER) SUBSCRIBER +REMOVESUBSCRIBER(SUBSCRIBER) 我也一样! -->
![](https://cdn.nlark.com/yuque/0/2023/png/1443385/1676880857858-54d0b50e-98a8-411d-80f6-dd87e698d173.png)

<font style="color:rgb(68, 68, 68);">机制包括 1） 一个用于存储订阅者对象引用的列表成员变量； 2） 几个用于添加或删除该列表中订阅者的公有方法</font>

<font style="color:rgb(68, 68, 68);">现在， 无论何时发生了重要的发布者事件， 它都要遍历订阅者并调用其对象的特定通知方法</font>

<font style="color:rgb(68, 68, 68);">所有订阅者都必须实现同样的接口， 发布者仅通过该接口与订阅者交互。 接口中必须声明通知方法及其参数， 这样发布者在发出通知时还能传递一些上下文数据。</font>

### <font style="color:rgb(68, 68, 68);">4、观察者模式适合应用场景</font>
**<font style="color:rgb(68, 68, 68);">当一个对象状态的改变需要改变其他对象</font>****<font style="color:rgb(68, 68, 68);">，</font>****<font style="color:rgb(68, 68, 68);"> </font>****<font style="color:rgb(68, 68, 68);">或实际对象是事先未知的或动态变化的时</font>****<font style="color:rgb(68, 68, 68);">，</font>****<font style="color:rgb(68, 68, 68);"> </font>****<font style="color:rgb(68, 68, 68);">可使用观察者模式</font>****<font style="color:rgb(68, 68, 68);">。</font>**

<font style="color:rgb(68, 68, 68);"></font><font style="color:rgb(68, 68, 68);">当你使用图形用户界面类时通常会遇到一个问题</font><font style="color:rgb(68, 68, 68);">。</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">比如</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">你创建了自定义按钮类并允许客户端在按钮中注入自定义代码</font><font style="color:rgb(68, 68, 68);">，</font><font style="color:rgb(68, 68, 68);"> </font><font style="color:rgb(68, 68, 68);">这样当用户按下按钮时就会触发这些代码</font><font style="color:rgb(68, 68, 68);">。</font>

<font style="color:rgb(68, 68, 68);">观察者模式允许任何实现了订阅者接口的对象订阅发布者对象的事件通知。 你可在按钮中添加订阅机制， 允许客户端通过自定义订阅类注入自定义代码。</font>

**<font style="color:rgb(68, 68, 68);">当应用中的一些对象必须观察其他对象时</font>****<font style="color:rgb(68, 68, 68);">，</font>****<font style="color:rgb(68, 68, 68);"> </font>****<font style="color:rgb(68, 68, 68);">可使用该模式</font>****<font style="color:rgb(68, 68, 68);">。</font>****<font style="color:rgb(68, 68, 68);"> </font>****<font style="color:rgb(68, 68, 68);">但仅能在有限时间内或特定情况下使用</font>****<font style="color:rgb(68, 68, 68);">。</font>**

<font style="color:rgb(68, 68, 68);">订阅列表是动态的， 因此订阅者可随时加入或离开该列表。</font>

### <font style="color:rgb(68, 68, 68);">5、观察者模式优缺点</font>
_<font style="color:rgb(68, 68, 68);">开闭原则</font>_<font style="color:rgb(68, 68, 68);">。 你无需修改发布者代码就能引入新的订阅者类 （如果是发布者接口则可轻松引入发布者类）。</font>

<font style="color:rgb(68, 68, 68);">你可以在运行时建立对象之间的联系。</font>

<font style="color:rgb(68, 68, 68);">订阅者的通知顺序是随机的。</font>

### <font style="color:rgb(68, 68, 68);">6、C++ 实现方式</font>
```cpp
#include <iostream>
#include <list>
#include <string>

class IObserver
{
public:
    virtual ~IObserver() {};
    virtual void Update(const std::string& message_from_subject) = 0;
};

class ISubject
{
public:
    virtual ~ISubject() {};
    virtual void Attach(IObserver* observer) = 0;
    virtual void Detach(IObserver* observer) = 0;
    virtual void Notify() = 0;
};

class Subject : public ISubject
{
public:
    virtual ~Subject()
    {
        std::cout << "Goodbye, I was the Subject.\n";
    }

    void Attach(IObserver* observer) override
    {
        list_observer_.push_back(observer);
    }
    void Detach(IObserver* observer) override
    {
        list_observer_.remove(observer);
    }
    void Notify() override
    {
        std::list<IObserver*>::iterator iterator = list_observer_.begin();
        HowManyObserver();
        while (iterator != list_observer_.end())
        {
            (*iterator)->Update(message_);
            ++iterator;
        }
    }

    void CreateMessage(std::string message = "Empty")
    {
        this->message_ = message;
        Notify();
    }
    void HowManyObserver()
    {
        std::cout << "There are " << list_observer_.size() << " observers in the list.\n";
    }

    void SomeBusinessLogic()
    {
        this->message_ = "change message message";
        Notify();
        std::cout << "I'm about to do some thing important\n";
    }

private:
    std::list<IObserver*> list_observer_;
    std::string message_;
};

class Observer : public IObserver
{
public:
    Observer(Subject& subject)
        : subject_(subject)
    {
        this->subject_.Attach(this);
        std::cout << "Hi, I'm the Observer \"" << ++Observer::static_number_ << "\".\n";
        this->number_ = Observer::static_number_;
    }
    virtual ~Observer()
    {
        std::cout << "Goodbye, I was the Observer \"" << this->number_ << "\".\n";
    }

    void Update(const std::string& message_from_subject) override
    {
        message_from_subject_ = message_from_subject;
        PrintInfo();
    }
    void RemoveMeFromTheList()
    {
        subject_.Detach(this);
        std::cout << "Observer \"" << number_ << "\" removed from the list.\n";
    }
    void PrintInfo()
    {
        std::cout << "Observer \"" << this->number_ << "\": a new message is available --> " << this->message_from_subject_ << "\n";
    }

private:
    std::string message_from_subject_;
    Subject& subject_;
    static int static_number_;
    int number_;
};

int Observer::static_number_ = 0;


void ClientCode()
{
    Subject* subject = new Subject;
    Observer* observer1 = new Observer(*subject);
    Observer* observer2 = new Observer(*subject);
    Observer* observer3 = new Observer(*subject);
    Observer* observer4;
    Observer* observer5;

    subject->CreateMessage("Hello World! :D");
    observer3->RemoveMeFromTheList();

    subject->CreateMessage("The weather is hot today! :p");
    observer4 = new Observer(*subject);

    observer2->RemoveMeFromTheList();
    observer5 = new Observer(*subject);

    subject->CreateMessage("My new car is great! ;)");
    observer5->RemoveMeFromTheList();

    observer4->RemoveMeFromTheList();
    observer1->RemoveMeFromTheList();

    delete observer5;
    delete observer4;
    delete observer3;
    delete observer2;
    delete observer1;
    delete subject;
}

int main()
{
    ClientCode();
    return 0;
}
```

