---
title: KH_网络流
date: '2026-07-01'
category: 算法板子
pinned: false
tags:
  - 算法
  - C++
  - 图论
  - 网络流
---
## 讲解

### 最大流

- **Dinic算法流程**
  - bfs分层->最短路分层，只允许从低层走到高层
  - DFS 找增广流 ->一条路径能推的量是路径上最小剩余容量

- 注意点
  - 加边时同时加正向边和反向边。
  - DFS 遇到汇点返回当前可增广流。
  - 每轮 BFS 后重置 cur。
  - 这条边限制的是谁流向谁？
  - 如果反过来，会不会允许非法选择？
  - **INF 要大于所有可能答案总和，而不是随手 1e9。**

#### [【模板】网络最大流](https://www.luogu.com.cn/problem/P3376)

- **理论最坏复杂度为 O(N2M)**
- **板子代码(来源widaswiki)**(<https://github.com/hh2048/XCPC/blob/main/02%20-%20%E6%89%93%E5%8D%B0%E7%A8%BF%E6%A8%A1%E6%9D%BF%E6%B1%87%E6%80%BB/04%20-%20%E7%BD%91%E7%BB%9C%E6%B5%81.md>):

```cpp
template <typename T>
struct Flow_
{
    const int n;
    const T inf = numeric_limits<T>::max();

    struct Edge
    {
        int to;
        T w;
        Edge(int to, T w) : to(to), w(w) {}
    };

    vector<Edge> ver;      // 所有边
    vector<vector<int>> h; // 邻接表，存边的编号
    vector<int> cur, d;    // 当前弧、层次

    Flow_(int n) : n(n + 1), h(n + 1) {}

    void add(int u, int v, T c)
    {
        h[u].push_back(ver.size());
        ver.emplace_back(v, c);
        h[v].push_back(ver.size());
        ver.emplace_back(u, 0);
    }

    bool bfs(int s, int t)
    {
        d.assign(n, -1);
        d[s] = 0;
        queue<int> q;
        q.push(s);
        while (!q.empty())
        {
            auto x = q.front();
            q.pop();
            for (auto it : h[x])
            {
                auto [y, w] = ver[it];
                if (w && d[y] == -1)
                {
                    d[y] = d[x] + 1;
                    if (y == t)
                        return true;
                    q.push(y);
                }
            }
        }
        return false;
    }
    T dfs(int u, int t, T f)
    {
        if (u == t)
            return f;
        auto r = f;
        for (int &i = cur[u]; i < h[u].size(); i++)
        {
            auto j = h[u][i];
            auto &[v, c] = ver[j];
            auto &[u, rc] = ver[j ^ 1];//反向边
            if (c && d[v] == d[u] + 1)
            {
                auto a = dfs(v, t, std::min(r, c));
                c -= a;
                rc += a;
                r -= a;
                if (!r)
                    return f;
            }
        }
        return f - r;
    }
    T work(int s, int t)
    {
        T ans = 0;
        while (bfs(s, t))
        {
            cur.assign(n, 0);
            ans += dfs(s, t, inf);
        }
        return ans;
    }
};
using Flow = Flow_<int>;
```

### 二分图匹配
