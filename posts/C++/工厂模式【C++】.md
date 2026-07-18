---
id: cpp-factory
title: "工厂模式"
date: 2026-07-18
tags: C++,设计模式
excerpt: "简单工厂、工厂方法、抽象工厂三种工厂模式的结构、应用场景与优缺点对比。"
cover: linear-gradient(135deg, #f6d365 0%, #fda085 100%)
readingTime: 7
type: post
---

## <font style="color:#333333;">1、简单工厂模式</font>
**<font style="color:#333333;">a</font>****<font style="color:#333333;">、概述</font>**

<font style="color:#333333;">简单工厂模式（</font><font style="color:#333333;">Simple Factory Pattern</font><font style="color:#333333;">）又叫做静态工厂方法模式（</font><font style="color:#333333;">Static Factory Method Pattern</font><font style="color:#333333;">），属于创建型模式。简单工厂模式的实质是由一个工厂类</font><font style="color:#333333;background-color:#FF0000;">根据传入的参数，动态决定应该创建哪一个产品类的实例</font><font style="color:#333333;">。</font>

**<font style="color:#333333;">b</font>****<font style="color:#333333;">、模式结构</font>**

<font style="color:#333333;">工厂（</font><font style="color:#333333;">Factory</font><font style="color:#333333;">）：整个模式的核心，负责实现创建所有实例的内部逻辑。 </font>

<font style="color:#333333;">抽象产品（</font><font style="color:#333333;">Product</font><font style="color:#333333;">）：所有具体产品的父类，负责描述所有实例所共有的公共接口。 </font>

<font style="color:#333333;">具体产品（</font><font style="color:#333333;">ConcreteProduct</font><font style="color:#333333;">）：最终创建的具体产品 </font>

**<font style="color:#333333;">c</font>****<font style="color:#333333;">、优缺点</font>**

<font style="color:#333333;">优点：</font>

<font style="color:#333333;">工厂类包含了必要的逻辑判断，根据指定的信息来创建对应的产品。客户端仅负责</font><font style="color:#333333;">“</font><font style="color:#333333;">消费</font><font style="color:#333333;">”</font><font style="color:#333333;">产品即可，实现了对象创建和使用的分离，客户端无需关心具体产品如何创建与组织，仅需知道具体产品所对应的参数即可，可以在一定程度减少使用者的记忆量 </font>

<font style="color:#333333;">缺点：</font>

<font style="color:#333333;">于工厂类集中了所有产品的创建逻辑（违反了高内聚责任分配原则），职责过重，一旦无法正常工作，整个系统都将受到影响；一旦添加新产品就不得不修改工厂逻辑，在产品类型较多时，有可能造成工厂逻辑过于复杂，不利于系统的扩展和维护。</font>

**<font style="color:#333333;">d</font>****<font style="color:#333333;">、适用场景</font>**

<font style="color:#333333;">工厂类负责创建的对象比较少（不会造成工厂方法中的业务逻辑太过复杂）；客户端仅需知道传入工厂类的参数，对于如何创建对象（逻辑）不关心。 </font>

**<font style="color:#333333;">e</font>****<font style="color:#333333;">、</font>****<font style="color:#333333;">EG</font>****<font style="color:#333333;">分析</font>**

<font style="color:#333333;">以生产汽车为例子：创建抽象产品</font>

```cpp
//汽车产品
class Car
{
public:
	virtual string Name() = 0;  //汽车名字
}

//创建具体产品
//奔驰汽车
class BenzCar : public Car
{
public:
	string Name()
	{
		return "BenzCar";
	}
}
//宝马汽车
class BmwCar : public Car
{
public:
	string Name()
	{
		retutn "BmwCar";
	}
}
//奥迪
class AudCar : public Car
{
public:
	string Name()
	{
		return "AudCar";
	}
}
//创建工厂（要生产汽车，需要有相应的工厂）
class Factory
{
public:
	enum Car_Type
	{
		BENZ_CAR,   //奔驰汽车
		BMW_CAR,    //宝马汽车
		AUD_CAR     //奥迪汽车
	};
	Car* CreateCar(Car_Type type)
	{
		Car* pCar = NULL;
		switch (type)
		{
		case CAR_TYPE::BENZ_CAR:
			pCar = new BenzCar();
			break;
		case  CAR_TYPE::BMW_CAR:
			pCar = new BmwCar();
			break;
		case CAR_TYPE::AUD_CAR:
			pCar = new AudCar();
			break;
		default:
			break;
		}
		return pCar;
	}
}
//客户端：
int main()
{
	// 工厂
	Factory* pFactory = new Factory();
	// 奔驰汽车
	ICar* pCar = pFactory->CreateCar(Factory::BENZ_CAR);
	cout << pCar->Name() << endl;
	...
		return 0;
}

```

## <font style="color:#333333;">2、工厂方法模式</font>
**<font style="color:#333333;">a</font>****<font style="color:#333333;">、简述</font>**

<font style="color:#333333;">工厂方法模式（</font><font style="color:#333333;">Factory Method Pattern</font><font style="color:#333333;">）是一种常用的对象创建型设计模式，此模式的核心思想是封装类中不变的部分，提取其中个性化善变的部分为独立类，通过依赖注入以达到解耦、复用以及方便后期维护拓展的目的。 </font>

**<font style="color:#333333;">b</font>****<font style="color:#333333;">、模式结构</font>**

<font style="color:#333333;">Factory</font><font style="color:#333333;">（抽象工厂）：是工厂方法模式的核心，与应用程序无关。任何在模式中创建的对象的工厂类必须实现这个接口。</font><font style="color:#333333;">ConcreteFactory</font><font style="color:#333333;">（具体工厂）：实现抽象工厂接口的具体工厂类，包含与应用程序密切相关的逻辑，并且被应用程序调用以创建产品对象。</font><font style="color:#333333;">Product</font><font style="color:#333333;">（抽象产品）：所创建对象的基类，也就是具体产品的共同父类或共同拥有的接口。</font>

<font style="color:#333333;">ConcreteProduct</font><font style="color:#333333;">（具体产品）：实现了抽象产品角色所定义的接口。某具体产品有专门的具体工厂创建，它们之间往往一一对应。</font>

**<font style="color:#333333;">c</font>****<font style="color:#333333;">、优缺点</font>**

<font style="color:#333333;">优点：克服了简单工厂模式违背开放</font><font style="color:#333333;">-</font><font style="color:#333333;">封闭原则的缺点，又保留了封装对象创建过程的优点，降低客户端和工厂的耦合性。所以说，</font><font style="color:#333333;">“</font><font style="color:#333333;">工厂方法模式</font><font style="color:#333333;">”</font><font style="color:#333333;">是</font><font style="color:#333333;">“</font><font style="color:#333333;">简单工厂模式</font><font style="color:#333333;">”</font><font style="color:#333333;">的进一步抽象和推广。</font>

<font style="color:#333333;">缺点：每增加一个产品，相应的也要增加一个子工厂，加大了额外的开发量。</font>

**<font style="color:#333333;">d</font>****<font style="color:#333333;">、适用场景</font>**

<font style="color:#333333;">对于某个产品，调用者清楚地知道应该使用哪个具体工厂服务，实例化该具体工厂，生产出具体的产品来，只是需要一种产品，而不想知道也不需要知道究竟是哪个工厂生产的，即最终选用哪个具体工厂的决定权在生产者一方，它们根据当前系统的情况来实例化一个具体的工厂返回给使用者，而这个决策过程对于使用者来说是透明的。</font>

**<font style="color:#333333;">e、EG分析</font>**

```cpp
//创建抽象产品
class Car
{
public:
	virtual string Name() = 0;  //汽车名字
};
//创建具体产品

//奔驰汽车
class BenzCar : public Car
{
public:
	string Name()
	{
		return "BenzCar";
	}
};
//宝马汽车
class BmwCar : public Car
{
public:
	string Name()
	{
		return "BmwCar";
	}
};
//奥迪汽车
class AudCar : public Car
{
public:
	string Name()
	{
		return "AudCar";
	}
};
//创建工厂(产品有了，当然要有相应的工厂来生产，但在这之前，需要一个抽象工厂, 每个工厂只负责生产自己的产品。)

class Afactory
{
	public：
		virtual Car* CreateCar() = 0;  //生产汽车
}
//创建具体工厂
//奔驰工厂
class BenzFactory : public AFactory
{
public:
	Car* CreateCar()
	{
		return new BenzCar();
	}
}
//宝马工厂
class BmwFactory : public AFactory
{
public:
	Car* CreateCar()
	{
		return new BmwCar();
	}
}
//奥迪工厂
class AudFactory : public AFactory
{
public:
	Car* CtrateCar()
	{
		return new AudCar();
	}
}
//创建客户端
int main()
{
	//奔驰
	AFactory* pFactory = new BenzFactory();
	Car* pCar = pFactory->CreateCar();
	//宝马
	AFactory* pFactory = new BmwFactory();
	Car* pCar = pFactory->CreateCar()；
		...
		return 0;
}
```

## <font style="color:#333333;">3、抽象工厂模式</font>
**<font style="color:#333333;">a</font>****<font style="color:#333333;">、简述</font>**

<font style="color:#333333;">抽象工厂模式（</font><font style="color:#333333;">Abstract Factory Pattern</font><font style="color:#333333;">）是所有形态的工厂模式中最为抽象和最具一般性的一种形态。抽象工厂模式是指当有多个抽象角色时，使用的一种工厂模式。抽象工厂模式可以向客户端提供一个接口，使客户端在不必指定产品的具体的情况下，创建多个产品族中的产品对象。 </font>

**<font style="color:#333333;">b</font>****<font style="color:#333333;">、模式结构</font>**

<font style="color:#333333;">Factory</font><font style="color:#333333;">（抽象工厂）：声明一个用于创建抽象产品的接口</font>

<font style="color:#333333;">ConcreteFactory</font><font style="color:#333333;">（具体工厂）：用于创建具体的产品</font>

<font style="color:#333333;">Product</font><font style="color:#333333;">（抽象产品）：声明一个产品对象类型的接口</font>

<font style="color:#333333;">ConcreteProduct</font><font style="color:#333333;">（具体产品）：由具体工厂创建的具体产品</font>

**<font style="color:#333333;">c</font>****<font style="color:#333333;">、优缺点</font>**

<font style="color:#333333;">优点：封装了产品的创建，使得不需要知道具体是哪种产品，只需要知道是哪个工厂即可。可以支持不同类型的产品，使得模式灵活性更强。可以非常方便的使用一族中的不同类型的产品。</font>

<font style="color:#333333;">缺点：</font><font style="color:#333333;">结构过于臃肿，如果产品类型较多或产品族较多，会非常难于管理。每次如果添加一组产品，那么所有的工厂类都必须添加一个方法，这样违背了开放</font><font style="color:#333333;">-</font><font style="color:#333333;">封闭原则。所以一般适用于产品组合产品族变化不大的情况。</font>

**<font style="color:#333333;">d</font>****<font style="color:#333333;">、适用场景</font>**

<font style="color:#333333;">在不必指定产品的具体的情况下，创建多个产品族中的产品对象。</font>

**<font style="color:#333333;">e</font>****<font style="color:#333333;">、</font>****<font style="color:#333333;">EG</font>****<font style="color:#333333;">分析</font>**

```cpp
//创建抽象产品
clsaa Car
{
  public:
	  virtual string Name() = 0;     //汽车名称
}
class Bike
{
public:
	virtual string Name() = 0;     //自行车名称
}
//创建具体产品

/********** 汽车 **********/
//奔驰
class BenzCar : public Car
{
public:
	string Name()
	{
		return "BenzCar";
	}
}
//宝马
class BmwCar : public Car
{
public:
	string Name()
	{
		return "BmwCar";
	}
}
//奥迪
class AudCar : public Car
{
public:
	string Name()
	{
		return "BmwCar";
	}
}
/********** 自行车 **********/
// 奔驰
class BenzBike : public IBike
{
public:
	string Name() {
		return "Benz Bike";
	}
};
// 宝马
class BmwBike : public Bike
{
public:
	string Name() {
		return "Bmw Bike";
	}
};
// 奥迪
class AudBike : public Bike
{
public:
	string Name() {
		return "Aud Bike";
	}
};
//创建抽象工厂
class Afactory
{
public:
	enum FACTORY_TYPE
	{
		BENZ_FACTORY,   //
		BMW_FACTORY,
		AUD_FACTORY
	};
	virtual Car* CreateCar() = 0;        //生产汽车
	virtual bikeCar* CreateBike() = 0;   //生产自行车
	static AFactory* CreateFactory(FACTORY_TYPE factoryType);   //创建工厂
}

// 创建工厂
AFactory* AFactory::CreateFactory(FACTORY_TYPE factoryType)
{
	AFactory* pFactory = NULL;
	switch (factoryType) {
	case FACTORY_TYPE::BENZ_FACTORY:  // 奔驰工厂
		pFactory = new BenzFactory();
		break;
	case FACTORY_TYPE::BMW_FACTORY:  // 宝马工厂
		pFactory = new BmwFactory();
		break;
	case FACTORY_TYPE::AUD_FACTORY:  // 奥迪工厂
		pFactory = new AudFactory();
		break;
	default:
		break;
	}
	return pFactory;
}
//创建具体工厂

// 奔驰工厂
class BenzFactory : public AFactory
{
public:
	ICar* CreateCar()
	{
		return new BenzCar();
	}
	IBike* CreateBike()
	{
		return new BenzBike();
	}
};
// 宝马工厂
class BmwFactory : public AFactory
{
public:
	Car* CreateCar()
	{
		return new BmwCar();
	}
	Bike* CreateBike()
	{
		return new BmwBike();
	}
};
// 奥迪工厂
class AudFactory : public AFactory
{
public:
	ICar* CreateCar()
	{
		return new AudCar();
	}
	IBike* CreateBike()
	{
		return new AudBike();
	}
};
//创建客户端
int main()
{
	// 奔驰
	AFactory* pFactory = AFactory::CreateFactory(AFactory::FACTORY_TYPE::BENZ_FACTORY);
	ICar* pCar = pFactory->CreateCar();
	IBike* pBike = pFactory->CreateBike();
	// 宝马
	pFactory = AFactory::CreateFactory(AFactory::FACTORY_TYPE::BMW_FACTORY);
	pCar = pFactory->CreateCar();
	pBike = pFactory->CreateBike();
	// 奥迪
	pFactory = AFactory::CreateFactory(AFactory::FACTORY_TYPE::AUDI_FACTORY);
	pCar = pFactory->CreateCar();
	pBike = pFactory->CreateBike();
	return 0;
}
```

---

```cpp
（1）简单工厂模式
	有多个产品类，工厂类根据传入参数的不同，动态决定实例化那个工厂类（在工厂类做判断，从而创建相应的产品，当增加产品时需要修改工厂类。）
		#include<iostream>
		using namespace std;
		
		class Product
		{
		public:
		    virtual void show() = 0;  
		};
		class Product_A : public Product
		{
		public:
		    void show()
		    {
		        cout << "Product_A" << endl;
		    }
		};
		class Product_B : public Product
		{
		public:
		    void show()
		    {
		        cout << "Product_B" << endl;
		    }
		};
		class Factory
		{
		public:
		    Product* Create(int i)
		    {
		        switch (i)
		        {
		        case 1:
		            return new Product_A;
		            break;
		        case 2:
		            return new Product_B;
		            break;
		        default:
		            break;
		        }
		    }
		};
		
		int main()
		{
		    Factory *factory = new Factory();
		    factory->Create(1)->show();
		    factory->Create(2)->show();
		    system("pause");
		    return 0;
		}
（2）工厂方法模式
	抽象工厂类，只提供一个接口，通过子类去扩展和实现
		#include <iostream>
		#include <stdlib.h>
		#include <string>
		using namespace std;
		 
		//工厂方法模式
		 
		//抽象类(多态:提高基类)
		class car{
		public:
		    virtual void createcar(void)=0;
		};
		//具体类(产品1)
		class bencicar:public car{
		public:
		    bencicar(){
		        cout<<" begin create bencicar "<<endl;
		    }
		    void createcar(void){
		        cout<<" creating bencicar "<<endl;
		    }
		    ~bencicar(){}
		};
		//具体类(产品2)
		class baomacar:public car{
		public:
		    baomacar(){
		        cout<<" begin create baomacar "<<endl;
		    }
		    void createcar(void){
		        cout<<" creating baomacar "<<endl;
		    }
		    ~baomacar(){}
		};
		//抽象工厂类，提供创建产品类的接口
		class carfactory{
		public:
		    virtual car* createSpecificCar()=0;
		};
		 
		//工厂类子类
		class bencifactory:public carfactory{
		    car* createSpecificCar(){
		        return (new bencicar());
		    }
		};
		//工厂类子类
		class baomafactory:public carfactory{
		    car* createSpecificCar(){
		        return (new baomacar());
		    }
		};
		 
		int main(){
		    carfactory *producecar1 = new bencifactory();
		    car *newcar1 = producecar1->createSpecificCar();
		    newcar1->createcar();
		    carfactory *producecar2 = new baomafactory();
		    car *newcar2 = producecar2->createSpecificCar();
		    newcar2->createcar();
		    return 0;
		}
（3）抽象工厂模式
	当存在多个产品系列，而客户端只使用一个系列的产品时（选择普通产品还是高配产品），可以考虑使用抽象工厂模式。（缺点：当增加一个新系列的产品时，不仅需要现实具体的产品类，还需要增加一个新的创建接口，扩展相对困难）
		#include <iostream>
		#include <stdlib.h>
		#include <string>
		using namespace std;
		//抽象类(多态:提高基类)
		class car{
		public:
		    virtual void createcar(void)=0;
		};
		class highcar{
		public:
		    virtual void createcar(void)=0;
		};
		//具体类(产品1)
		class bencicar:public car{
		public:
		    bencicar(){
		        cout<<" begin create bencicar "<<endl;
		    }
		    void createcar(void){
		        cout<<" creating bencicar "<<endl;
		    }
		    ~bencicar(){}
		};
		//具体类(产品1,高性能)
		class highbencicar:public highcar{
		public:
		    highbencicar(){
		        cout<<" begin create highbencicar "<<endl;
		    }
		    void createcar(void){
		        cout<<" creating highbencicar "<<endl;
		    }
		    ~highbencicar(){}
		};
		//具体类(产品2)
		class baomacar:public car{
		public:
		    baomacar(){
		        cout<<" begin create baomacar "<<endl;
		    }
		    void createcar(void){
		        cout<<" creating baomacar "<<endl;
		    }
		    ~baomacar(){}
		};
		//具体类(产品2,高性能)
		class highbaomacar:public highcar{
		public:
		    highbaomacar(){
		        cout<<" begin create highbaomacar "<<endl;
		    }
		    void createcar(void){
		        cout<<" creating highbaomacar "<<endl;
		    }
		    ~highbaomacar(){}
		};
		//抽象工厂类，提供创建产品类的接口
		class carfactory{
		public:
		    virtual car* createSpecificCar()=0;
		    virtual highcar* createSpecificHightCar()=0;
		};
		 
		//工厂类子类
		class bencifactory:public carfactory{
		    car* createSpecificCar(){
		        return (new bencicar());
		    }
		    highcar* createSpecificHightCar(){
		        return (new highbencicar());
		    }
		};
		//工厂类子类
		class baomafactory:public carfactory{
		    car* createSpecificCar(){
		        return (new bencicar());
		    }
		    highcar* createSpecificHightCar(){
		        return (new highbaomacar());
		    }
		};
		int main(){
		    carfactory *producecar1 = new bencifactory();
		    car *newcar1 = producecar1->createSpecificCar();
		    newcar1->createcar();
		    carfactory *producecar2 = new baomafactory();
		    highcar *newcar2 = producecar2->createSpecificHightCar();
		    newcar2->createcar();
		    return 0;
		}

```

## 
