---
title: wp_̰贪心
date: 2025-12-06
tags:
    - 贪心算法
    - 算法
    - Problems
    - 贪心
cover: /img/cover/picg_8.png
math: true
---


## 贪心

- 如上P2887 [USACO07NOV] Sunscreen就是典型的贪心，重点是如何去通过我们固定左端点的大胆尝试去实现

### 反悔贪心

#### P2949 [USACO09OPEN] Work Scheduling G (全局贪心)

- **我一开始的错误思路**
  - 人人都能想得到去走时间，然后将最紧急的任务先做了然后再紧急的任务里面贪心
  - 最大的问题是:你的贪心是占用时间的，是有后效性的，万一后面有价值更高的任务他就不是期望值了
  - DP？时间跨度巨大：$D_i \le 10^9$。任务数量（N）较大：$N \le 10^5$。离散化时间之后依然n方

- **正确思路以及为什么**:
以后你在做题时，如果满足以下特征，请立刻想到反悔贪心：

选择带有顺序性（或者可以排序）。

当前的选择会影响后续的资源（比如占用了时间、金钱）。

我们在乎的是“数量”或者“总价值”。

如果发生冲突，我们可以通过“撤销”之前的某个劣质选择，来接纳当前的优质选择，且这种交换一定是不亏的（甚至更赚）

- **AC代码**

```cpp
struct hsh
{
    int d, p;
};

void solve()
{
    int n;
    cin >> n;
    vector<hsh> nums(n);
    rep(i, 0, n - 1)
    {
        cin >> nums[i].d >> nums[i].p;
    }
    ll ans = 0;
    sort(all(nums), [](hsh a, hsh b)
         { return a.d < b.d; });
    // int dpin = 0;
    // int xpin = 0;
    int time1 = 0;
    priority_queue<int,vi,greater<int>> dui;
    for(auto ljl:nums)  //记住这个反悔的思想和实现方式
    {
        if(time1+1<=ljl.d)
        {
            dui.emplace(ljl.p);
            time1+=1;
        }
        else 
        {
            if(!dui.empty())
            {
                auto ljl2=dui.top();
                dui.pop();
                if(ljl.p>ljl2)
                {
                    dui.emplace(ljl.p);
                }
                else dui.emplace(ljl2);
            }

        }
    }
    while(!dui.empty())
    {
        auto jj=dui.top();
        dui.pop();
        ans+=jj;
    }
       cout << ans << '\n';
}

```
