---
title: KH_数据结构
tags:
  - 算法
  - 数据结构
  - C++
category: 算法板子
date: '2026-06-04'
---
- 由于数据结构板子重复太多，所以建议在基础算法里面找，这里是学习的笔记，记录各种情况，算法不完全。更多题目与变体见wp_数据结构

## 带权并查集

## 单调栈

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

## 单调队列

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
