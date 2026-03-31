---
title: KH单调栈单调队列
date: 2025-11-11 10:00:23
tags:
    - 算法
    - C++
cover: /img/cover/picg_4.png
  
---
## 单调栈模板

- **运用场景**
  - 下一个/上一个更大/更小值的位置
  - 去除重复子串
- **精妙之处**
    在栈里面存下标，只在更新的时候“取下标”。
- **AC代码**

```cpp
 int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++)
    {
        cin >> a[i];
    }

    stack<int> stk;
    vector<int> ans(n);
    for (int i = 0; i < n; i++)
    {
        while (!stk.empty() && a[stk.top()] < a[i])
        {
            ans[stk.top()] = i + 1;
            stk.pop();
        }
        stk.push(i);
    }

    for (int i = 0; i < n; i++)
    {
        cout << ans[i] << " \n"[i == n - 1];
    }
```

## 单调队列模板

- **运用场景**
  - 滑动窗口维护区间最大值/最小值
  - 固定窗口的极值

- **AC代码**

```cpp

    int n, k;
    cin >> n >> k;
    vector<int> a(n + 1);
    for (int i = 0; i < n; i++)
    {
        cin >> a[i];
    }
    deque<int> dq;
    vi ans1(n + 1);
    for (int i = k - 1; i < n; i++)
    {
        while (!dq.empty() && dq.front() + k <= i)
        {
            dq.pop_front();
        }
        while (!dq.empty() && a[dq.back()] > a[i])
        {

            dq.pop_back();
        }
        dq.push_back(i);
        ans1[i] = a[dq.front()];
    }
    for (int i = k - 1; i < n; i++)
    {
        cout << ans1[i] << " \n"[i == n - 1];
    }
```

## 典题：怕你看不出来是什么

### AT_abc372_d [ABC372D] Buildings

- [链接](https://www.luogucom.cn/problem/AT_abc372_d)
- **分析**

>题目描述
>
>这里有 $N$ 栋房子，从 $1$ 到 $N$ 依次编号。它们按照顺序排成一排。第 $i(1\le i\le N)$ 的房子的高度为 $H_i$。
对于每一个 $i=1,2,\dots,N$，找到满足以下条件的整数 $j(i<j\le N)$ 的数量：
>
>- 没有一栋在 $i$ 和 $j$ 之间的房子比 $j$ 要高。
>
> 说明/提示
>
>- $1\le N\le 2\times 10^5$
>- $1\le H_i\le N$
>- $H_i\not=H_j(i\not= j)$
>- 所有输入都为整数
