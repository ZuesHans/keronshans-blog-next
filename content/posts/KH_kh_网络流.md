---
title: KH_网络流
date: '2026-07-01'
category: 算法学习
pinned: false
tags:
  - 算法
  - C++
  - 图论
  - 网络流
description: ''
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

- **理论最坏复杂度为 \(O(V^2E)\)**
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

<details>
<summary>Dinic最大流算法逐行解释（防止看不懂）</summary>

```cpp
struct info
{
    int to, rev, cap;//建图
    // 分别是正图，反图，流量
};

void solve()
{
    int n, m, s, t;
    //s->源点 t->汇点
    cin >> n >> m >> s >> t;
    vector<vector<info>> mp(n + 1);
    for (int i = 0; i < m; i++)
    {
        int u, v, w;
        cin >> u >> v >> w;
        info a = {v, mp[v].size(), w};
        info b = {u, mp[u].size(), 0};
        mp[u].push_back(a);
        mp[v].push_back(b);
    }

    vi dep(n + 1);//层数，意思是从源点到这里要多久（需要能走）
    //层数是用来防止dfs走回头路的
    auto bfs = [&]() -> bool
    {
        fill(dep.begin(), dep.end(), -1);

        queue<int> q;
        dep[s] = 0;
        q.emplace(s);
        while (!q.empty())
        {
            int it = q.front();
            q.pop();
            for (auto v : mp[it])
            {

                if (v.cap > 0 && dep[v.to] == -1)
                {
                    dep[v.to] = dep[it] + 1;
                    q.emplace(v.to);
                }
            }
        }
        return dep[t] != -1;
    };

    int ans = 0;

    vi cur(n + 1);
    // cur[u] 是当前弧优化数组
    // 表示节点 u 下一次应该从 mp[u] 的哪一条边开始检查
    while (bfs())
    {
        fill(cur.begin(), cur.end(), 0);
        while (1)
        {
            auto dfs = [&](auto &&self, int u, int flow) -> int
            {
                if (u == t)
                    return flow;
                //以下是当前弧优化
                for (int &i = cur[u]; i < mp[u].size(); i++)
                {
                    info &now = mp[u][i];
                    if (now.cap > 0 && dep[now.to] == dep[u] + 1)
                    {
                        int ps = self(self, now.to, min(now.cap, flow));
                        if (ps > 0)
                        {
                            now.cap -= ps;
                            mp[now.to][now.rev].cap += ps;
                            return ps;
                        }
                    }
                }
                return 0;
            };
            int pushed = dfs(dfs, s, INF);
            if (!pushed)
                break;
            ;
            ans += pushed;
        }
    }
    cout << ans << '\n';
}


```

</details>

### 二分图匹配 ：在二分图这种特殊图里面dinic可以做到\(O(E\sqrt V)\)

- 适用于二分图很大、边很多的二分图匹配（专门卡你）

#### [B. Valuable Paper](https://codeforces.com/problemset/problem/1423/B)

- **核心模型**:一句话概括题意/数学本质 (如: 中位数贪心 / 差分约束)
- **思维误区 (Bug)**:记录第一直觉为什么错了 (如: 以为是DP其实是贪心 / 读错题)
- **修正逻辑 (Patch)**:下次看到什么特征，要修正为正确思路
- **关键代码**:

```cpp
// 只贴最核心的 3-5 行逻辑或 Check 函数，不要贴 main
```

---
