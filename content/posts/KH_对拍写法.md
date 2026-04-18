---
title: KH_对拍写法
date: 2026-02-11
tags:
    - 杂谈
    - 算法
cover: /img/cover/picg_17.png
---

## python 的随机数生成器写法

### 基础常见语法

- `import random`随机库
- `random.randint(a, b)`: 生成一个 $[a, b]$ 范围内的整数（包含 $a$ 和 $b$）。
- `random.choice(seq)`: 从列表或字符串中随机选择一个元素。
- `random.uniform(a, b)`: 生成一个 $[a, b]$ 范围内的浮点数。

- **示例代码**

```python
import random

def solve():
    n = random.randint(1,1000000)

    print(n)
    for i in range (n):
        c=random.randint(1,10)
        w=random.randint(1,10)
        print(c,w)# end=" " 表示打印后不换行，而是加个空格
    print()# 最后换个行
if __name__ == "__main__":
    solve()

```

## windows系统下对拍控制器的 python 版本写法

### 基础语法

- `import os`执行系统操作
- `import sys`
- `import time`

- `os.system("python shuju.py > data.in")` os.让电脑在命令行（CMD）里执行括号里的命令
- `>`(重定向): 这是操作系统命令的核心。它的意思是：不要把 print 的结果输出到屏幕上，而是全部写入到 data.in 这个文件里。
- `fc /W wa.out std.out` fc == flie compare `/W`指不要管空格和换行符
- 如果两个文件完全一样会返回0，所以直接写!=0
- `print(f"test case : {cnt} ... ",end="")`这里的f是指你可以用花括号引用变量
- `with open("data.in","r") as f:`意思是以只读的形式打开data.in，把里面的变量吐给f
- `print(f.read())`打印里面的东西

- **SPJchecker**：需要写`if os.system(check_exe) != 0:`
- **标准程序**：没有返回检查

```python
import os

#用变量代替文件名事实可以不这么写
wap = "wap.exe"
stdp = "stdp.exe"

def solve():
    cnt=0 #看看拍到哪了
    while True:
        cnt+=1
        print(f"test case : {cnt} ... ",end="")
        os.system("python gen.py > data.in")
        os.system("stdp < data.in > std.out")
        os.system("wap < data.in > wa.out")
        if os.system("fc /W wa.out std.out>diff.log" )!=0:
            print(f"\nwa in test {cnt} ")
            print("\n data in:")
            with open("data.in","r") as f:
                print(f.read())
            print("\n std out:")
            with open("std.out","r") as f:
                print(f.read())
                print("\n wa out:")
            with open("wa.out","r") as f:
                print(f.read())
                break
        else: 
            print("Accepted")
if __name__ == "__main__":
    solve()

```

## Linux系统下对拍控制器的 python 版本写法

- 有几处需要修改的地方，cpp在这方面同理，本质上都是调用cmd来进行操作
- 文件名：`./wap`同文件夹下
- 对比器`diff -w wa.out std.out > /dev/null`

```python
import os

WA  = "./wap"
STD = "./stdp"


cnt = 0

while True:
    cnt += 1
    print(f"测试 {cnt} ... ", end="")

    os.system("python3 gen.py > data.in")   # Linux 常用 python3
    os.system(f"{STD} < data.in > std.out")
    os.system(f"{WA}  < data.in > wa.out")

    # 比较
    if os.system(diff -w wa.out std.out > /dev/null) != 0:
        print("\n发现差异！")
        print("输入：")
        print(open("data.in").read().rstrip())
        print("\n正确：")
        print(open("std.out").read().rstrip())
        print("\n你的：")
        print(open("wa.out").read().rstrip())
        break
    else:
        print("AC")
```

## windows系统下对拍控制器的 bat 版本写法

- `@echo off`：关闭命令显示。
- `g++ ... -O2 -std=c++14`：编译程序。
- `generator.exe > data.in`：运行数据生成器，将输出重定向到 data.in。
- `if errorlevel 1`：如果文件不同（不同的时候 fc 返回非零），则找到了错误。

```bat
@echo off
echo Compiling programs...
g++ generator.cpp -o generator.exe -O2 -std=c++14
g++ std.cpp -o std.exe -O2 -std=c++14
g++ my.cpp -o my.exe -O2 -std=c++14

if errorlevel 1 (
    echo Compilation failed!
    pause
    exit
)

echo Compilation successful!

:: 对拍循环
set /a count=0
:loop
set /a count+=1
echo Testing case %count%...

:: 生成数据
generator.exe > data.in

:: 运行两个程序
std.exe < data.in > std.out
my.exe < data.in > my.out

:: 比较输出
fc std.out my.out > nul

if errorlevel 1 (
    echo ========================================
    echo Found different output at case %count%!
    echo ========================================
    echo Input data saved in: data.in
    echo Standard output saved in: std.out
    echo Your output saved in: my.out
    pause
    exit
) else (
    echo Case %count% passed.
)

goto loop

```

## 随机数生成器的cpp写法

- `mt19937 rng(seed);` 初始化引擎
- `uniform_int_distribution<int> dist(1, 100);`

- **高级随机数**

```cpp
#include <bits/stdc++.h>

#include <chrono> // 用于高精度时间种子

using namespace std;

int main() {
    // 初始化种子：使用高精度时间，防止同一秒内运行生成相同数据
    unsigned seed = chrono::system_clock::now().time_since_epoch().count();
    //完全可以写114514
    
    // 2. 初始化引擎：mt19937 (Mersenne Twister 算法)
    mt19937 rng(seed); 
    // 如果你需要生成 long long 范围的数，请用 mt19937_64
    mt19937_64 rng64(seed);

    // 3. 定义分布：生成 [L, R] 之间的整数
    uniform_int_distribution<int> dist(1, 100);
    cout << dist(rng) << endl;      // 输出 1~100 的 int

    
    uniform_int_distribution<long long> dist_ll(1e10, 1e18);
    cout << dist_ll(rng64) << endl; // 输出 10^10 ~ 10^18 的 long long

    return 0;
}
```

- **一般随机数**

```cpp
#include <bits/stdc++.h> // 万能头
using namespace std;

int main() {
    // 初始化随机种子，不写这个的话每次运行结果都一样
    srand(time(0)); 

    // 假设我们要生成 n=10, 范围 1-100 的数组
    int n = 10;
    printf("%d\n", n);

    for (int i = 0; i < n; i++) {
        // rand() % 100 得到 0-99
        // + 1 得到 1-100
        printf("%d ", rand() % 100 + 1);
    }
    puts(""); // 换行

    return 0;
}

```

## 有SPJ的checker cpp：纯checker没有控制器

```cpp
#include <bits/stdc++.h>
using namespace std;

// 定义三个文件流，名字起得直观一点
ifstream fin;   // Input (题目输入)
ifstream fstd;  
ifstream fuser; 

int main(int argc, char* argv[]) {
    // 1. 打开三个文件
    // 这里的 data.in, std.out, wa.out 要和你脚本里生成的文件名一致
    fin.open("data.in");
    fstd.open("std.out");
    fuser.open("wa.out");

    // 2. 这里写你的检查逻辑
    // 比如：读取题目输入的 N
    int n;
    fin >> n;

    // 读取你的答案
    double user_ans;
    fuser >> user_ans;

    // 读取标准答案 (如果需要的话)
    double std_ans;
    fstd >> std_ans;

    // ------------------------------------------------------
    // 3. 开始判断 (举例：浮点数误差检查)
    // ------------------------------------------------------
    
    // 如果相差超过 1e-6，就判错
    if (fabs(user_ans - std_ans) > 1e-6) {
        cout << "WA! Expected " << std_ans << " but got " << user_ans << endl;
        return 1; // 【关键】返回非0表示 WA
    }

    // 如果逻辑都跑通了，没发现错误
    cout << "AC" << endl;
    return 0; // 【关键】返回0表示 AC
}

```

## cpp版本对拍控制器：劫持输出流（包括生成器都在一个文件里）

- 可以全部复制粘贴输出流
- 可以写SPJ

```cpp
#include <bits/stdc++.h>
using namespace std;

namespace wa {
   
}
namespace ac {

}

// 3. 数据生成器 (Generator)
void gen(stringstream& ss) {
    // 这里用正常语法写造数据逻辑
    // 就像 cout << n << endl; 一样
    
    int n = rand() % 10 + 1;
    ss << n << endl;        
    for(int i = 0; i < n; i++) {
        int x = rand() % 100; 
        ss << x << " ";       
    }
}
// SPJ
bool check(string input, stringstream& wa) {
    
    stringstream data(input);
    int n;
    data >> n; // 获取 （有些题目可能需要看输入多少来检查）
    // 2. 再从 wa流 里读出你的答案
    int sum = 0;
    vector<int> a;
    int x;
    
    // 就像用 cin 一样从 wa流里读
    for(int i = 0; i < n; i++) {
        // 如果读取失败（比如你输出的数不够 n 个）
        if (!(wa >> x)) {
            cout << "SPJ Error: Output too short!" << endl;
            return false; // WA
        }
        a.push_back(x);
        sum += x;
    }
    if (sum != 100) {
        cout << "SPJ Error: Sum is " << sum << ", expected 100." << endl;
        return false; // WA
    }

    return true; // AC
}
int main() {
    srand(time(0));
    int t = 0;
    while (1) {
        t++;

       stringstream input;
        gen(input);
        string data = ss_gen.str(); 

      
        stringstream wain(data); 
        stringstream acin(data); 

      
        stringstream waout;
        stringstream acout;

      
        streambuf* oldin = cin.rdbuf(wain.rdbuf());
        streambuf* oldout = cout.rdbuf(waout.rdbuf());
        wa::solve();



        cin.rdbuf(acin.rdbuf()); 
        cout.rdbuf(acout.rdbuf()); 
        ac::solve();

     
        cin.rdbuf(oldin);
        cout.rdbuf(oldout);
        
        //if(!check(data,waout))
        if (waout.str() != acout.str()) {
            cout<<"WA"<<'\n';
            cout << "Input:\n" << data << endl;
            cout << "Your Output:\n" << waout.str() << endl;
            cout << "Expected:\n" << acout.str() << endl;
            break;
        } else {
            cout<<"AC on"<<t<<'\n' ;
        }
    }
    return 0;
}

```

## cpp版本对拍控制器（只有语法区别）

- `system("gen.exe > data.in")`跟py里面的完全一样，只有语法区别
-

```cpp

#include <bits/stdc++.h>
using namespace std;

int main() {
    int t = 0; // 测试组数计数器
    
    while (true) {
        t++;
        cout<<"Test Case # ... "<<t;
        
        // 1. 生成数据
        // system 返回 0 表示命令执行成功
        if (system("gen.exe > data.in") != 0) {
            printf("Generator Error!\n");
            break;
        }

        // 2. 运行标程 (标准答案)
        system("std.exe < data.in > std.out");
        system("wa.exe < data.in > wa.out");

        
        // 4. 比对文件 (Windows 用 fc, Linux 用 diff)
        // > nul 表示不把比对的详细内容打印在屏幕上，保持清爽
        if (system("fc /W wa.out std.out > nul") != 0) {
            printf("WA!\n"); // 发现不一样
            printf("Time Cost: %.2lf ms\n", end_time - start_time);
            
            // 暂停程序，让你看数据
            // 这里的 pause 是 Windows 命令，按任意键继续
            system("pause"); 
            return 0; // 退出
        } 
    }
    return 0;
}

```
