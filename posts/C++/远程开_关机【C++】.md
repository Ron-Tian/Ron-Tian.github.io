---
id: cpp-remote-power
title: "远程开机与关机"
date: 2026-07-18
tags: C++,网络
excerpt: "通过局域网唤醒（Wake-on-LAN）实现远程开机，通过套接字编程实现远程关机。"
cover: linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)
readingTime: 6
type: post
---

## 一、远程开机


### 1.局域网唤醒


**硬件需求：**



a.首先要有主板支持。现在，新一代的主板大都支持网络唤醒功能，而且在主板上都有一个三脚插座，它一般在PCI插槽附近，旁边标注“WOL”。



b.其次必须要有网卡支持。这类网卡在主板上比一般的网卡多了一个三脚插座，并且通常还附带一条专用的三芯连接线，该线是用来连接主板和网卡之间的三脚插座。



c.最后还必须要使用ATX电源，而且其+5V Standby电流必须比较大，根据Intel的建议，它需要在600mA以上。该电流的大小可以从电源外部标识中的+5VSB栏里查到。



需要说明的是，某些主板上已经集成了具有网络唤醒功能的网卡，所以也就没有什么三脚插座，更不需要专用的三芯连线。



**如果电脑支持这些硬件需求，需要在BIOS里将wake on lan选项打开。**



注：linux下，通过命令`ethtool eno1(网卡名，通过ifconfig命令查看)`查看wake on lan是否开启，g为开启，d为关闭



如果关闭，关机之前必须通过命令`ethtool -s eno1 wol g`打开，否则关机之后无法远程开机



当机器重启之后，eno1的设置又会回到Wake-on: d状态，如果嫌每次都要设置比较麻烦，可以编辑



`vim /etc/sysconfig/network-scripts/ifcfg-eno1（eno1网卡的配置文件）`，添加上一行： `ETHTOOL_OPTS=”wol g”`



**唤醒原理：**



在基于TCP/IP协议的网络中，计算机处于关机状态时 我们不可能有计算机的IP地址，唯一能识别计算机身份的只有其所带网卡的物理地址（mac），每块网卡的mac地址都是唯一的。要远程唤醒某台计算机，必须事先知道其mac地址，然后通过magic picket（AMD公司开发的，白皮书https://www.amd.com/system/files/TechDocs/20213.pdf）标准生成对应的远程唤醒数据包，再利用UDP协议进行**广播**，向网络发送该数据包。



控制机通过发送一个**幻数据包**（magic packet），幻数据包是一个广播帧，包含目标计算机的mac地址。由于mac地址的唯一性，使数据包可以在网络中被唯一的识别。



幻数据包通常使用无连接协议，例如UDP，发送端口通常为7或9，没有限制。



大多数网卡都支持在超低功耗下监听特定报文。**如果设备网卡接收到一个与自己 MAC 地址相同的幻数据包，则网卡会向计算机的电源或主板发出信号以唤醒计算机**。MAC地址通过命令`ifconfig`查看。大部分的幻数据包在数据链路层（OSI模型第2层）上发送，当发送时，使用广播地址广播到给定的网络上，不使用IP地址（OSI模型第3层）。当然这是绝大部分情况，幻数据包也可以使用特定的 IP 地址进行发送。



幻数据包最简单的构成是6字节的255（FF FF FF FF FF FF FF），紧接着为目标计算机的48位MAC地址，重复16次，数据包共计102字节。有时数据包内还会紧接着4-6字节的密码信息。这个帧片段可以包含在任何协议中，最常见的是包含在 UDP 中。







例如 MAC 地址为 11 22 33 44 55 66 的目标计算机，幻数据包的格式为：



```go
FFFFFFFFFFFF 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 112233445566 [ABABABABABAB(这里为6个字节的密码)]
```



**注意：传送的时候必须封包成二进制格式才可以传送**



幻数据包起作用的限制条件：



1. 需要知道目标计算机 MAC 地址
2. 不提供送达确认
3. 无法在局域网之外工作
4. 需要硬件进行支持（网卡支持网络唤醒）



#### 使用windows唤醒


**实现代码（go语言）：**



```go
/*
功能：实现同一网段内远程控制计算机开机
版本：V1.0
作者：胡龙辉
环境说明：
	1. 被唤醒主机要支持Wake on Lan功能且关机前已开启该功能
    2. 被唤醒主机在关机时应该是有线连接
    3. 请确保该程序与被唤醒主机在同一局域网中
参数说明：
    -mac 被唤醒主机的MAC地址 (必须输入)
使用说明：
    wol -mac 11:22:33:44:55:66
注意事项：
    1. MAC地址的格式可以是以下几种形式
        11:22:33:44:55:66 或
        11-22-33-44-55-66 或
        11:22-33:44:55-66 或
        112233445566
 */
package main

import (
	"bytes"
	"encoding/hex"
	"flag"
	"fmt"
	"net"
	"strings"
)

var help = "Hello,please input params like wol -mac XX:XX:XX:XX:XX:XX"
func main()  {
	mac := flag.String("mac","",help)
	flag.Parse()

	if len(*mac) == 0{
		fmt.Printf("%s\n",help)
		return
	}

	hw := strings.Replace(strings.Replace(*mac,":","",-1),"-","",-1)

	if len(hw) != 12{
		fmt.Printf("MAC:[%s] 输入不正确，请按照正确格式输入。\n",*mac)
		return
	}

	macHex,err := hex.DecodeString(hw)
	if err != nil{fmt.Printf("MAC:[%s] 输入不正确，请按照正确格式输入。\n",*mac)
		return
	}

	var bcast = []byte{0xFF,0xFF,0xFF,0xFF,0xFF,0xFF}
	var buff bytes.Buffer

	buff.Write(bcast)

	for i := 0; i < 16; i++{
		buff.Write(macHex)
	}

	mp := buff.Bytes()

	if len(mp) != 102{
		fmt.Printf("MAC:[%s] 输入不正确，请按照正确格式输入。\n",*mac)
		return
	}

	sendMagicPacket(mp)
}

func sendMagicPacket(mp []byte){
	//sender := net.UDPAddr{}
	target := net.UDPAddr{
		IP:   net.IPv4bcast,
	}

	conn,err := net.DialUDP("udp",nil,&target)
	if err != nil{
		fmt.Printf("UDP创建失败：%v", err)
		return
	}

	defer conn.Close()

	_,err = conn.Write(mp)
	if err != nil{
		fmt.Printf("唤醒数据包发送失败[%s]", err)
	}else{
		fmt.Printf("唤醒数据包发送成功！")
	}

}
```



#### 使用linux唤醒


如果是通过linux唤醒另外一台linux主机，则只需要`apt-get install wol`或者`yum install wol`安装wol包，然后通过命令`wol xx:xx:xx:xx:xx:xx(目标计算机网卡MAC地址)`即可实现远程唤醒。



### 2.远程跨网段唤醒


远程过路由开机无法进行广播，局域网唤醒手段无法使用。需在交换机中加入IP与MAC地址的绑定命令。



公网唤醒我们无办法填写具体的内网地址，只能配置路由器的公网IP，然后通过数据转发到具体的电脑IP地址，由于不是广播地址，也由于路由器ARP映射表在电脑关机后一定时间会丢失，所以路由器没有办法知道IP地址是MAC所对应那台机器，所以魔术包被丢弃，所以要么增加ARP绑定，要么添加端口转发规则到广播地址。



[https://blog.csdn.net/weixin_34414650/article/details/86207810](https://blog.csdn.net/weixin_34414650/article/details/86207810)



### 3.开机后启动程序


**linux**



在控制机上，通过xshell等软件控制



**windows**



方案1：被控主机应打开远程功能，控制机启动被控机之后，通过远程桌面连接被控机，进行相关操作



方案2：设置想启动的程序为开机启动项



方案3：在远程开机代码中直接添加开机启动项（目前还未找到实现方式，初步构想通过修改注册表信息，将可执行文件加入HKEY -LOCAL-MACHINE\SOFTW ARE\Microsoft\Windows\CurrentVersion\Run下，使其每次开机时能自动运行）



## 二、远程关机


### 1.windows关机linux


前提：同一网段内，两台机器可ping通，被关机的机器需开启远程功能。



远程ssh登陆，发送`poweroff`即可关机:输入`ssh 用户名@服务器IP`命令之后，再输入密码，即可远程登陆linux服务器。



连接成功的前提是，linux需开启ssh服务。`yum install ssh`,`/etc/init.d/sshd start`



### 2.windows关机windows


前提：



1.  同一网段内，两台机器可ping通 
2.  需在在运行中输入`gpredit.msc`打开策略编辑器，计算机配置->windows设置->安全设置->本地策略->用户权限分配，双击打开“从远程系统强制关机”，并添加Guest用户 
3.  在用户权限分配中选择“拒绝从网络访问这台计算机”，并删除Guest用户 
4.  右键我的电脑->管理。依次选择系统工具->本地用户和组->用户，选择Guest双击打开，将“账户已禁用”前边的√去掉 
5.  完成以上操作后，若还不能远程关机。  
依次打开：  
控制面板 -> Windows Defender 防火墙 -> 选择 启用或关闭 Windows Defender 防火墙。  
将 Windows Defender 防火墙 全部关闭。 



关机命令：`shutdown -s -m\\xx.xx.xx.xx(IP)`，其它可选参数可参考shutdown命令的用法。



通过抓包发现，控制机发出的是TCP协议，如果连接失败或者没有权限，被控机会通过ICMP协议返回错误信息。



### 3.远程关机原理


shutdown的命令格式中，`-m`这个参数后边可以指定要关闭的计算机，省略的话默认对本机操作



在windows默认的安全策略中，只有管理员组的用户才有权从远端关闭计算机。一般情况下，从局域网你内其他电脑访问该计算机时，只有Guest用户权限。只要在计算机中赋予Guset用户远程关机的权限即可。

