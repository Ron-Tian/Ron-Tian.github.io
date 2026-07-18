---
id: cpp-thread-pool
title: "C++ 线程池实现"
date: 2026-07-18
tags: C++,多线程,线程池
excerpt: "C++ 线程池的完整实现，包括任务队列、工作线程管理、同步机制等。"
cover: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)
readingTime: 1
type: post
---

```cpp
#ifndef THREAD_POOL_THREAD_POOL_H
#define THREAD_POOL_THREAD_POOL_H

#include <map>

#include "thread_item.h"

#define ANY_THREAD_ID -1

namespace thread_pool {

class ThreadPool {

public:
static ThreadPool* GetInstance(int thread_num = 4);
static void Destroy();
void Start();
void ReAssignLightestThreadId();

template<class Fun, class... Args>
int Call(int threadid, Fun fun, Args... args) 
{
    if (threadid < ANY_THREAD_ID)
        return -1;


    if (threadid == ANY_THREAD_ID)
        threadid = lightest_threadid_;

    if (threads_.count(threadid) == 0)
        return -1;

    ThreadItem::Fun bind_fun = std::bind(fun, args...);
    size_t fun_nums = threads_[threadid]->CallFun(bind_fun);
    ReAssignLightestThreadId();
    return threadid;
}

template<class Fun, class... Args>
int RegisterTimer(int threadid, time_t seconds_after, Fun fun, Args... args) {
    if (threadid < ANY_THREAD_ID)
        return -1;

    if (threadid == ANY_THREAD_ID)
        threadid = lightest_threadid_;

    if (threads_.count(threadid) == 0)
        return -1;

    ThreadItem::Fun bind_fun = std::bind(fun, args...);
    size_t fun_nums = threads_[threadid]->RegisterTimer(bind_fun, seconds_after);
    return threadid;
}   
protected:
ThreadPool(int thread_num);
~ThreadPool() = default;
private:
int thread_num_ = 0;
volatile bool start_ = false;
int lightest_threadid_ = 0;
std::map<int, std::shared_ptr<ThreadItem> > threads_;
static ThreadPool* instan_;
};
} // namespace thread_pool
#endif // !THREAD_POOL_THREAD_POOL_H
```

```cpp
#include "thread_pool.h"

namespace thread_pool {

    ThreadPool* ThreadPool::instan_ = nullptr;

    ThreadPool* ThreadPool::GetInstance(int thread_num)
    {
        if (!instan_)
        {
            instan_ = new ThreadPool(thread_num);
            instan_->Start();
        }
        return instan_;
    }
    void ThreadPool::Destroy() 
    {
        if (instan_)
            delete instan_;
        instan_ = nullptr;
    }

    void ThreadPool::Start()
    {
        if (start_)
            return;
        if (thread_num_ < 1 || thread_num_ > 1000)
            thread_num_ = 8;

        for (int i = 0; i < thread_num_; i++) 
        {
            threads_[i] = std::make_shared<ThreadItem>();
            threads_[i]->Start();
        }
        start_ = true;
    }
    ThreadPool::ThreadPool(int thread_num) 
    {
        if (thread_num < 1 || thread_num > 1000)
            thread_num = 8;
        thread_num_ = thread_num;
    }
    // TODO: in mul thread, it sames not exact
    void ThreadPool::ReAssignLightestThreadId() {
        size_t lightest_fun_nums = threads_[lightest_threadid_]->GetFunNum();
        for (auto thread_item : threads_) {
            size_t num = thread_item.second->GetFunNum();
            if (num < lightest_fun_nums) {
                lightest_threadid_ = thread_item.first;
                lightest_fun_nums = num;
            }
        }
    }
} // namespace thread_pool


```

```cpp
#ifndef THREAD_POOL_THREAD_ITEM_H
#define THREAD_POOL_THREAD_ITEM_H

#include <thread>
#include <list>
#include <map>
#include <functional>
#include <mutex>
#include <condition_variable>

namespace thread_pool {

    class ThreadItem 
    {
    public:
        struct WorkCallStep 
        {
            virtual void ThreadStep() = 0;
        };

    public:
        using Fun = std::function<int()>;
   public:
        ~ThreadItem();
        size_t CallFun(Fun fun);
        size_t RegisterTimer(Fun fun, size_t seconds_after);
        bool Start();
        size_t GetFunNum();
    private:
        size_t AddFun(Fun fun);
        size_t CopyTmpFunToFun();
        size_t GetTmpFunSize();
        std::list<Fun> GetTmpFuns();
        size_t GetAllFunSize();
        void CallWorkStep();
        void Work();
        size_t AddTimer(Fun fun, size_t seconds_after);
        size_t CopyTmpTimerToTimer();
        std::map<time_t, std::list<Fun> > GetTmpTimer();

    private:
        std::list<Fun> tmp_list_fun_;
        std::mutex tmp_list_fun_mutex_;

        std::list<Fun> funs_;
        std::mutex funs_mutex_;

        std::mutex cv_lock_;
        std::condition_variable cv_;

       std::shared_ptr<WorkCallStep> work_step_;

        std::map<time_t, std::list<Fun> > timers_;
        std::map<time_t, std::list<Fun> > tmp_timers_;
        std::mutex timer_lock_;

        std::thread* work_thread_ = nullptr;
        volatile size_t last_funs_size_ = 0;
        volatile bool start_ = false;
    };
} // namespace thread_pool
#endif
```

```cpp
#include "thread_item.h"
#include <time.h>

namespace thread_pool {

    ThreadItem::~ThreadItem() {
        if (!start_)
            return;
        start_ = false;
        cv_.notify_all();
        work_thread_->join();
        delete work_thread_;
    }
    size_t ThreadItem::GetFunNum() {
        size_t size = GetTmpFunSize();
        return size + last_funs_size_;
    }

    size_t ThreadItem::CallFun(Fun fun) {
        int size = AddFun(fun);
        cv_.notify_all();
        return size + last_funs_size_;
    }
    size_t ThreadItem::RegisterTimer(Fun fun, size_t seconds_after) {
        return AddTimer(fun, seconds_after);
    }


    size_t ThreadItem::AddTimer(Fun fun, size_t seconds_after) {
        std::lock_guard<std::mutex> timer_lock(timer_lock_);
        time_t seconds = time(nullptr);
        seconds += seconds_after;
        tmp_timers_[seconds].push_back(fun);
        return tmp_timers_.size();
    }

   std::map<time_t, std::list<ThreadItem::Fun> > ThreadItem::GetTmpTimer() {
        std::lock_guard<std::mutex> timer_lock(timer_lock_);
        return std::move(tmp_timers_);
    }

    size_t ThreadItem::CopyTmpTimerToTimer() {
        auto tmp_timers = GetTmpTimer();
        for (auto tmp_timer : tmp_timers)
            timers_[tmp_timer.first].insert(timers_[tmp_timer.first].end(), tmp_timer.second.begin(), tmp_timer.second.end());
        return timers_.size();
    }

   bool ThreadItem::Start() {
        if (start_)
            return true;
        start_ = true;
        work_thread_ = new std::thread(&ThreadItem::Work, this);
    }

    size_t ThreadItem::AddFun(Fun fun) {
        if (!start_)
            return 0;
        std::lock_guard<std::mutex> tmp_list_lock(tmp_list_fun_mutex_);
        tmp_list_fun_.push_back(fun);
    }

   std::list<ThreadItem::Fun> ThreadItem::GetTmpFuns() {
        std::lock_guard<std::mutex> tmp_list_lock(tmp_list_fun_mutex_);

        return std::move(tmp_list_fun_);
    }

    size_t ThreadItem::CopyTmpFunToFun() {
        std::list<Fun> tmp_funs = std::move(GetTmpFuns());
        size_t fun_size = tmp_funs.size();
        funs_.insert(funs_.end(), tmp_funs.begin(), tmp_funs.end());
        return fun_size;
    }

   size_t ThreadItem::GetTmpFunSize() {
        std::lock_guard<std::mutex> tmp_list_lock(tmp_list_fun_mutex_);
        return tmp_list_fun_.size();
    }

    size_t ThreadItem::GetAllFunSize() {
        size_t totle_size = GetTmpFunSize();
        totle_size += funs_.size();
        return totle_size;
    }

    void ThreadItem::CallWorkStep() {
        if (work_step_)
            work_step_->ThreadStep();
        // timer
        CopyTmpTimerToTimer();
        time_t seconds_time = time(nullptr);
        auto time_end = timers_.upper_bound(seconds_time);
        for (auto time_start = timers_.begin(); time_start != time_end; time_start++) {
            for (auto& fun : time_start->second)
                fun();
        }
        timers_.erase(timers_.begin(), time_end);
    }

   void ThreadItem::Work() {

        while (start_) {
            CallWorkStep();
            if (funs_.size() == 0 && GetAllFunSize() == 0) {
                std::unique_lock<std::mutex> cv_lock(cv_lock_);
                if (std::cv_status::timeout == cv_.wait_for(cv_lock, std::chrono::seconds(1)))
                    continue;
            }
            CopyTmpFunToFun();
            last_funs_size_ = funs_.size();
            for (auto iter = funs_.begin(); iter != funs_.end(); ) {
                auto& fun_item = *iter;
                if (fun_item() == 0) {
                    iter = funs_.erase(iter);
                    continue;
                }
                iter++;
            }
        }
    }
} // namespace thread_pool
```

