---
title: KH_树
category: 算法板子
date: '2026-06-04'
tags:
  - 图论
  - C++
  - 树
---
#

## 树的基础概念

### 树的直径

#### [P1099 [NOIP 2007 提高组] 树网的核](https://www.luogu.com.cn/problem/P1099)

- **关键代码**:

```cpp

struct info
{
    int to, w;
    info(long long t, long long w) : to(t), w(w) {}
};

void solve()
{
    int n, s;
    cin >> n >> s;
    vector<vector<info>> mp(n + 1);
    for (int i = 0; i < n - 1; i++)
    {
        int u, v, w;
        cin >> u >> v >> w;
        mp[u].emplace_back(v, w);
        mp[v].emplace_back(u, w);
    }
    int root = 1;
    map<int, int> dep;
    vi pre(n + 1);
    auto dfs = [&](int x, int fa, auto &&self) -> void
    {
        pre[x] = fa;
        for (auto y : mp[x])
        {
            if (y.to == fa)
                continue;
            dep[y.to] = dep[x] + y.w;
            self(y.to, x, self);
        }
        if (dep[x] > dep[root])
        {
            root = x;
        }
    };
    dfs(root, 0, dfs);
    int st = root; 
    dep.clear();
    dfs(root, 0, dfs);
    int ed = root;

    vi path;
    int now = ed;
    vi is_zhijing(n + 1);
    while (now != 0)
    {
        is_zhijing[now] = 1;
        path.emplace_back(now);
        now = pre[now];
    }
    reverse(all(path));
    int pn = path.size();
    vector<int> sum(pn, 0);
    for (int i = 0; i < pn; i++)
    {
        sum[i] = dep[path[i]];
    }

    int mx = 0;
    for (int i = 0; i < pn; i++)
    {
        int nowd = 0;
        auto dfs_find = [&](int now, int fa, int now_dep, auto &&self) -> void//不经过直径的最深子树深度
        {
            nowd = max(nowd, now_dep);
            for (auto v : mp[now])
            {
                if (v.to == fa || is_zhijing[v.to])
                {
                    continue;
                }
                self(v.to, now, v.w + now_dep, self);
            }
        };
        dfs_find(path[i], 0, 0, dfs_find);
        mx = max(mx, nowd);
    }

    ll ans = INF;
    int j = 0;
    for (int i = 0; i < pn; i++)
    {
        while (j + 1 < pn && sum[j + 1] - sum[i] <= s)
        {
            j++;
        }

        ans = min(ans, max({sum[i], sum[pn - 1] - sum[j], mx}));
    }
    cout << ans << '\n';
}

```

---

## 树形结构

### 笛卡尔树

#### 基础模板

```cpp


#include <bits/stdc++.h>
using namespace std;

const int MAXN = 100005;
int a[MAXN];      // 原数组（权值）
int lc[MAXN];     // lc[i] 表示节点 i 的左儿子
int rc[MAXN];     // rc[i] 表示节点 i 的右儿子
int st[MAXN];     // 单调栈，里面存的是原数组的【下标】

void build_cartesian_tree(int n) {
    int top = 0; // 栈顶指针
    
    // 清空左右儿子（如果是多组测试数据记得清空）
    for(int i = 1; i <= n; i++) lc[i] = rc[i] = 0;top

    for (int i = 1; i <= n; i++) {
        int last_pop = 0; // 记录最后一个被踢出栈的元素下标
        
        // 核心：维护栈底到栈顶的单调递增（小根堆性质）
        // 如果栈顶的值 > 当前值，栈顶出栈
        while (top > 0 && a[st[top]] > a[i]) {
            last_pop = st[top];
            top--;
        }
        
        // 动作1：最后一个被踢出栈的，成为当前节点 i 的左儿子
        if (last_pop != 0) {
            lc[i] = last_pop;
        }
        
        // 动作2：当前节点 i，成为现存栈顶的右儿子
        if (top > 0) {
            rc[st[top]] = i;
        }
        
        // 动作3：当前节点入栈，成为右链的新底端
        st[++top] = i;
    }
    
    // 树建完了，整棵树的根节点是谁？
    // 单调栈最底下的那个元素，就是整棵树的根！
    int root = st[1]; 
}
```

#### [Problem C数据存储](https://codeforces.com/gym/615540/attachments/download/31992/2025ICPC%E8%B4%B5%E5%B7%9E%E7%9C%81%E8%B5%9B%EF%BC%88%E6%AD%A3%E5%BC%8F%E8%B5%9B%EF%BC%89.pdf)

- **核心模型**:
- **思维误区 (Bug)**:
- **修正逻辑 (Patch)**:
- **关键代码**:

```cpp

```

---
