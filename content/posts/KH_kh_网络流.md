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

- **做法** 二分答案+Dinic做二分图匹配
- 注意Dinic二分图匹配容量为每个点匹配得度数（比如如果是二分图多配容量就是匹配容量）
- **关键代码**:

```cpp
struct info
{
    int to, rev, cap; // 建图
    // 分别是正图，反图，流量
    int w;
};
void solve()
{
    int n, m;
    cin >> n >> m;
    vector<vector<info>> mp1(2 * n + 2);
    for (int i = 0; i < m; i++)
    {
        int u, v, d;
        cin >> u >> v >> d;
        v += n;
        mp1[u].push_back({v, (int)mp1[v].size(), 1, d}); // 容量为1就是说一个点只能匹配一次
        mp1[v].push_back({u, (int)mp1[u].size() - 1, 0, 0});
    }
    for (int i = 1; i <= n; i++)
    {
        mp1[0].push_back({i, (int)mp1[i].size(), 1, 0});
        mp1[i].push_back({0, (int)mp1[0].size() - 1, 0, 0});
        mp1[2 * n + 1].push_back({n + i, (int)mp1[n + i].size(), 0, 0});
        mp1[n + i].push_back({2 * n + 1, (int)mp1[2 * n + 1].size() - 1, 1, 0});
    }

    auto check = [&](int mid) -> bool
    {
        vector<vector<info>> mp = mp1;
        vi dep(2 * n + 2, -1);
        auto bfs = [&]() -> bool
        {
            fill(all(dep), -1);
            queue<int> q;
            dep[0] = 0;
            q.emplace(0);
            while (!q.empty())
            {
                int it = q.front();
                q.pop();
                for (auto v : mp[it])
                {
                    if (v.w > mid)//这里是增广验证二分
                        continue;
                    if (v.cap > 0 && dep[v.to] == -1)
                    {
                        dep[v.to] = dep[it] + 1;
                        q.emplace(v.to);
                    }
                }
            }
            return dep[2 * n + 1] != -1;
        };
        int ans = 0;
        vi cur(2 * n + 2);
        while (bfs())
        {
            fill(all(cur), 0);
            while (1)
            {
                auto dfs = [&](auto &&self, int u, int flow) -> int
                {
                    if (u == 2 * n + 1)
                    {
                        return flow;
                    }
                    for (int &i = cur[u]; i < (int)mp[u].size(); i++)
                    {
                        info &now = mp[u][i];
                        //这里是增广验证二分
                        if (now.cap > 0 && now.w <= mid && dep[now.to] == dep[u] + 1)
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
                int pushed = dfs(dfs, 0, INF);
                if (!pushed)
                {
                    break;
                }
                ans += pushed;
            }
        }
        return ans == n;
    };

    int l = 0;
    int r = 1e9;
    while (l < r)
    {
        int mid = (l + r) / 2;
        if (check(mid))
        {
            r = mid;
        }
        else
        {
            l = mid + 1;
        }
    }
    if (!check(r))
    {
        cout << -1 << '\n';
    }
    else
    {
        cout << l << '\n';
    }
}

```

---

### 最小费用最大流

- 若一共增广 \(K\) 次，总复杂度：
\[
\boxed{O(K\cdot E\log V)}
\]若容量均为整数，最坏每次只能增广 1 单位，则 \(K\le F\)（最大流），所以常写为：
\[
\boxed{O(FE\log V)}
\]

#### [toys](https://acm.hdu.edu.cn/contest/problem?cid=1231&pid=1004)

- **复杂度分析**：\(V\)：顶点（点）的数量。这里就是图中的小朋友、玩具、源点、汇点加起来。
\(E\)：边的数量。比如“小朋友喜欢某玩具”的连线、源点到小朋友的边等。
\(\log V\)：对数，来自 Dijkstra 中的优先队列（堆）。不必特别算它，竞赛里常视为一个增长比较慢的额外因子。
\(K\)：增广次数，即算法找了多少次“源点到汇点的最短路”，并沿该路送流。**像这种单次匹配增广次数就是1**
\(F\)：最大流量，即最多能给多少个小朋友买到玩具。
- **题目**: 有n个小朋友m个玩具，每个小朋友要一个玩具，每个玩具库存减少之后价格会贵一点。求n个点完全匹配下怎么样才能花费最少
- **数据范围**:n,m 1000 ∑x_i≤10^4
- **建模关键**：把“同一种玩具买得越多，第 \(j\) 件越贵”拆成了多条容量为 1 的边。
- **关键代码**:

```cpp
struct info
{
    int to, rev, cap, cost;
};
void solve()
{
    int n, m;
    cin >> n >> m;
    int st = 0;
    int end = (n + m + 1);
    vector<vector<info>> mp(end + 1);
    auto add = [&](int u, int v, int cp, int cs)
    {
        info a = {v, mp[v].size(), cp, cs};
        info b = {u, mp[u].size(), 0, -1 * cs};
        mp[u].push_back(a);
        mp[v].push_back(b);
    };

    rep(i, 1, n)
    {
        add(st, i, 1, 0);
        int x;
        cin >> x;

        for (int j = 0; j < x; j++)
        {
            int toy;
            cin >> toy;
            add(i, n + toy, 1, 0);
        }
    }
    rep(i, 1, m)
    {
        int y;
        cin >> y;

        for (int j = 0; j < y; j++)
        {
            int w;
            cin >> w;
            add(n + i, end, 1, w);
        }
    }

    //[1,n]是小孩子 后面是礼物[n+1,n+m]

    int flow = 0;
    int ans = 0;
    vi dis(end + 1, INF);
    vi pot(end + 1);
    vi dian(end + 1); // 前面得点
    vi bian(end + 1); // 前边
    while (flow < n)
    {
        fill(dis.begin(), dis.end(), INF);
        dis[st] = 0;
        priority_queue<pii, vector<pii>, greater<pii>> q;
        q.emplace(0, st);

        while (!q.empty())
        {
            auto [d, u] = q.top();
            q.pop();

            if (d != dis[u])
                continue;

            for (int i = 0; i < mp[u].size(); i++)
            {
                info v = mp[u][i];

                if (v.cap == 0)
                    continue;

                int now = d + v.cost + pot[u] - pot[v.to];

                if (now < dis[v.to])
                {
                    dis[v.to] = now;
                    dian[v.to] = u;
                    bian[v.to] = i;
                    q.emplace(now, v.to);
                }
            }
        }

        if (dis[end] == INF)
            break;

        rep(i, 0, end)
        {
            if (dis[i] != INF)
                pot[i] += dis[i];
        }

        int pushed = n - flow;

        for (int v = end; v != st; v = dian[v])
        {
            pushed = min(pushed, mp[dian[v]][bian[v]].cap);
        }
        for (int v = end; v != st; v = dian[v])
        {
            ans += pushed * mp[dian[v]][bian[v]].cost;
            mp[dian[v]][bian[v]].cap -= pushed;
            mp[v][mp[dian[v]][bian[v]].rev].cap += pushed;
        }

        flow += pushed;
    }
    if (flow == n)
    {
        cout << ans << '\n';
    }
    else
    {
        cout << -1 << '\n';
    }
}

```

#### [Magical Set](https://www.luogu.com.cn/problem/P15082?contestId=305336)

- **核心模型**:因数匹配最大费用最大流
- **关键代码**:

```cpp

```

---
