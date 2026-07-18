---
id: cpp-deadlock
title: "C++ 死锁问题"
date: 2026-07-18
tags: C++,多线程
excerpt: "死锁的定义、产生条件、常见场景及避免策略。"
cover: linear-gradient(135deg, #f5576c 0%, #f093fb 100%)
readingTime: 11
type: post
---

# <font style="color:#ff4635;">1、什么是死锁：</font>
**<font style="color:black;">死锁是指多个线程因竞争资源而造成的一种僵局（互相等待），若无外力作用，这些进程都将无法向前推进。</font>**

情况1：

如果同一个线程先后两次调用<font style="background-color:#FFFFFF;">lock</font>，在第二次调用时，由于锁已经被占用，该线程会挂起等待别的线程释放锁，然而锁正是被自己占用着的，该线程又被挂起而没有机会释放锁，因此就永远处于挂起等待状态了，这叫做死锁。

例如： 

<font style="background-color:#fbfaf8;">pthread_mutex_lock( &mutex1);  </font>

<font style="background-color:#fbfaf8;">.......很长代码.......</font>

<font style="background-color:#fbfaf8;">pthread_mutex_lock( &mutex1);//锁两次  </font>

<font style="background-color:#fbfaf8;">count++;  </font>

<font style="background-color:#fbfaf8;">sleep(1);</font>

<font style="background-color:#fbfaf8;">pthread_mutex_unlock(&mutex1); </font><font style="background-color:#FFFFFF;"> </font>

<font style="background-color:#fbfaf8;">pthread_mutex_unlock(&mutex1); </font>

<font style="background-color:#fbfaf8;">备注：实际开发中代码量很大的情况下，在后面申请时忘记前面已经申请过，导致重复申请，造成死锁。</font>

情况2：

若<font style="background-color:#FFFFFF;">线程</font><font style="background-color:#FFFFFF;">A</font><font style="background-color:#FFFFFF;">获得了锁</font><font style="background-color:#FFFFFF;">1</font>，线程<font style="background-color:#FFFFFF;">B</font><font style="background-color:#FFFFFF;">获得了锁</font><font style="background-color:#FFFFFF;">2</font>，这时线程<font style="background-color:#FFFFFF;">A</font><font style="background-color:#FFFFFF;">调用</font><font style="background-color:#FFFFFF;">lock</font><font style="background-color:#FFFFFF;">试图获得锁</font><font style="background-color:#FFFFFF;">2</font>，结果是需要挂起等待线程<font style="background-color:#FFFFFF;">B</font><font style="background-color:#FFFFFF;">释放锁</font><font style="background-color:#FFFFFF;">2</font><font style="background-color:#FFFFFF;">，而这时线程</font><font style="background-color:#FFFFFF;">B</font><font style="background-color:#FFFFFF;">也调用</font><font style="background-color:#FFFFFF;">lock</font><font style="background-color:#FFFFFF;">试图获得锁</font><font style="background-color:#FFFFFF;">1</font><font style="background-color:#FFFFFF;">，结果是需要挂起等待线程</font><font style="background-color:#FFFFFF;">A</font><font style="background-color:#FFFFFF;">释放锁</font><font style="background-color:#FFFFFF;">1</font><font style="background-color:#FFFFFF;">，于是线程</font><font style="background-color:#FFFFFF;">A</font>和<font style="background-color:#FFFFFF;">B</font><font style="background-color:#FFFFFF;">都</font>永远处于挂起状态了。

# <font style="color:#ff4635;">2、产生死锁的四个必要条件（</font><font style="background-color:#FFFFFF;">互斥条件、不可抢占条件、占有且申请条件、循环等待条件</font><font style="color:#ff4635;">）</font>
<font style="background-color:#FFFFFF;">〈1〉互斥条件</font>

<font style="background-color:#FFFFFF;">即某个资源在一段时间内只能由一个进程占有，不能同时被两个或两个以上的进程占有。这种独占资源如CD-ROM驱动器，打印机等等，必须在占有该资源的进程主动释放它之后，其它进程才能占有该资源。这是由资源本身的属性所决定的。如独木桥就是一种独占资源，两方的人不能同时过桥。</font>

<font style="background-color:#FFFFFF;">〈2〉不可抢占条件</font>

<font style="background-color:#FFFFFF;">进程所获得的资源在未使用完毕之前，资源申请者不能强行地从资源占有者手中夺取资源，而只能由该资源的占有者进程自行释放。如过独木桥的人不能强迫对方后退，也不能非法地将对方推下桥，必须是桥上的人自己过桥后空出桥面（即主动释放占有资源），对方的人才能过桥。</font>

<font style="background-color:#FFFFFF;">〈3〉占有且申请条件</font>

<font style="background-color:#FFFFFF;">进程至少已经占有一个资源，但又申请新的资源；由于该资源已被另外进程占有，此时该进程阻塞；但是，它在等待新资源之时，仍继续占用已占有的资源。还以过独木桥为例，甲乙两人在桥上相遇。甲走过一段桥面（即占有了一些资源），还需要走其余的桥面（申请新的资源），但那部分桥面被乙占有（乙走过一段桥面）。甲过不去，前进不能，又不后退；乙也处于同样的状况。</font>

<font style="background-color:#FFFFFF;">〈4〉循环等待条件</font>

<font style="background-color:#FFFFFF;">存在一个进程等待序列{P1，P2，...，Pn}，其中P1等待P2所占有的某一资源，P2等待P3所占有的某一源，......，而Pn等待P1所占有的的某一资源，形成一个进程循环等待环。就像前面的过独木桥问题，甲等待乙占有的桥面，而乙又等待甲占有的桥面，从而彼此循环等待。</font>

# <font style="color:#ff4635;">3、死锁如何预防</font>
<font style="color:#70ad47;">只要破坏这四个必要条件中的任意一个条件</font>，死锁就不会发生。这就为我们解决死锁问题提供了可能。一般地，解决死锁的方法分为死锁的预防，避免，检测与恢复三种（注意：死锁的检测与恢复是一个方法）。我们将在下面分别加以介绍。

死锁的预防是保证系统不进入死锁状态的一种策略。它的基本思想是要求进程申请资源时遵循某种协议，从而打破产生死锁的四个必要条件中的一个或几个，保证系统不会进入死锁状态。

〈1〉打破互斥条件

即允许进程同时访问某些资源。但是，有的资源是不允许被同时访问的，像打印机等等，这是由资源本身的属性所决定的。所以，这种办法并无实用价值。

〈2〉打破不可抢占条件

即允许进程强行从占有者那里夺取某些资源。就是说，当一个进程已占有了某些资源，它又申请新的资源，但不能立即被满足时，它必须释放所占有的全部资源，以后再重新申请。它所释放的资源可以分配给其它进程。这就相当于该进程占有的资源被隐蔽地强占了。这种预防死锁的方法实现起来困难，会降低系统性能。

〈3〉打破占有且申请条件

可以实行资源预先分配策略。即进程在运行前一次性地向系统申请它所需要的全部资源。如果某个进程所需的全部资源得不到满足，则不分配任何资源，此进程暂不运行。只有当系统能够满足当前进程的全部资源需求时，才一次性地将所申请的资源全部分配给该进程。由于运行的进程已占有了它所需的全部资源，所以不会发生占有资源又申请资源的现象，因此不会发生死锁。但是，这种策略也有如下缺点：

<font style="background-color:#FFFFFF;">（1）在许多情况下，一个进程在执行之前不可能知道它所需要的全部资源。这是由于进程在执行时是动态的，不可预测的；</font>

<font style="background-color:#FFFFFF;">（2）资源利用率低。无论所分资源何时用到，一个进程只有在占有所需的全部资源后才能执行。即使有些资源最后才被该进程用到一次，但该进程在生存期间却一直占有它们，造成长期占着不用的状况。这显然是一种极大的资源浪费；</font>

<font style="background-color:#FFFFFF;">（3）降低了进程的并发性。因为资源有限，又加上存在浪费，能分配到所需全部资源的进程个数就必然少了。 </font>

〈4〉打破循环等待条件

实行资源有序分配策略。采用这种策略，即把资源事先分类编号，按号分配，使进程在申请，占用资源时不会形成环路。所有进程对资源的请求必须严格按资源序号递增的顺序提出。进程占用了小号资源，才能申请大号资源，就不会产生环路，从而预防了死锁。这种策略与前面的策略相比，资源的利用率和系统吞吐量都有很大提高，但是也存在以下缺点：

<font style="background-color:#FFFFFF;">（1）限制了进程对资源的请求，同时给系统中所有资源合理编号也是件困难事，并增加了系统开销；</font>

<font style="background-color:#FFFFFF;">（2）为了遵循按编号申请的次序，暂不使用的资源也需要提前申请，从而增加了进程对资源的占用时间。</font>

# <font style="color:#ff4635;">4、死锁的避免 </font>
预防死锁的几种策略，会严重地损害系统性能。因此在避免死锁时，要施加较弱的限制，从而获得 较满意的系统性能。由于在避免死锁的策略中，允许进程动态地申请资源。因而，系统在进行资源分配之前预先计算资源分配的安全性。若此次分配不会导致系统进入不安全状态，则将资源分配给进程；否则，进程等待。如果一个进程的当前请求的资源会导致死锁，系统拒绝启动该进程；如果一个资源的分配会导致下一步的死锁，系统就拒绝本次的分配；显然要避免死锁，必须事先知道系统拥有的资源数量及其属性。f其中最具有代表性的避免死锁[算法](http://lib.csdn.net/base/datastructure)是银行家算法(银行家可以先挂起某个额度请求较大的客户的请求，优先满足小额度的请求，等小额度的请求还款后，再处理挂起的请求。这样，资金能够永远流通。所以银行家算法其核心是：保证银行家系统的资源数至少不小于一个客户的所需要的资源数)。

# <font style="color:#ff4635;">5、死锁的检测与恢复</font>
死锁问题是事务的并发执行必须要付出的代价。解决死锁，不管是预防还是检测与恢复，思路都是按照某个标准让某些事务吃亏，也就是回滚。

死锁检测与恢复机制的工作方式如下：检查系统状态的算法周期性地被激活，判断有无死锁。如果发生死锁，则系统要进行恢复。这种机制的基本要求如下：

⑴ 维护当前已分配给事务的数据项的有关信息以及任何尚未解决的数据项请求信息；

⑵ 提供一个使用这些信息判断系统是否进入死锁状态的算法；

⑶ 提供解除死锁的策略。

a、死锁检测

死锁可以用称为等待图的有向图来描述。该图由两部分G=(V,E)组成，其中V是顶点集，E是边集。顶点集由系统中的所有事务组成；如果事务Ti在等待Tj释放所需数据项，则存在从Ti到Tj的一条有向边Ti→Tj。死锁检测算法就是要检查等待图中是否存在有向环，图论中有相应的深度(广度)优先搜索算法。这和前面介绍过的判断冲突可串行化的优先图类似（参阅第十章"事务"的10.9.1和10.9.2小节）。

b、死锁恢复

解除死锁的常用方法是回滚一个或多个事务。在选择要回滚的事务时，要考虑以下情况：

⑴ 选择使回滚代价最小的事务作为牺牲者

① 该事务已计算了多久？

② 该事务已使用了多少数据项？

③ 完成该事务还需要多少数据项？

④ 回滚该事务将牵涉多少事务？

⑵ 决定回滚多远：是彻底回滚，即中止该事务尔后重启；还是部分回滚，即只回滚到可以解除死锁为止；

⑶ 避免饿死。避免同一事务总是作为回滚代价最小的事务而被选中。最常用的方法就是在代价因素中包含回滚次数。

另一种处理死锁的简单方法是基于锁超时的机制。在这种方法中，申请锁的事务至多等待一个给定的时间。若在此期间内锁未授予该事务，则称该事务超时，此时该事务自己回滚并重启。如果确实存在死锁，卷入死锁的一个或多个事务将超时并回滚，从而使其他事务继续。该机制介于死锁预防（不会发生死锁）与死锁检测及恢复之间。

超时机制的实现极其容易，并且在事务是短事务或长时间等待是由死锁引起时该机制运作良好。但是，一般而言很难确定一个事务超时之前应等待多长时间。如果已发生死锁，则等待时间太长而导致不必要的延迟。如果等待时间太短，即便没有死锁，也可能引起事务回滚，造成资源浪费。该机制还可能会产生饿死，故此，基于超时的机制应用不多。

