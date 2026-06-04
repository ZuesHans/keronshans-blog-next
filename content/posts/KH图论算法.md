---
title: KH图论
date: ''
tags:
  - 算法
  - C++
  - 图论
category: 学习笔记
---

## 拓扑排序

### Kahn bfs求拓排

```cpp

 int n, m;
    cin >> n >> m;
    vector<vi> mp(n + 1);
    vi idg2(n + 1);
    for (int i = 0; i < m; i++)
    {
        int u, v;
        cin >> u >> v;
        mp[u].push_back(v);
        idg2[v]++;
    }
    queue<int> q;
    for (int i = 1; i <= n; i++)
        if (idg2[i] == 0) q.push(i);
    while (!q.empty())
    {
        if (q.size() > 1)
        {
            wuhuan = 0;
            //这里判环
        }
        auto it = q.front();
        q.pop();
        ans.push_back(it);//这里输出拓扑序
        for (auto v : mp[it])
        {
            idg[v]--;
            if (!idg[v])
            {
                q.emplace(v);
            }
        }
    }
        
```

### dfs求拓排

- 染色法找返祖边（环）
- 拓排是反的，从任何一个点出发都能找完dag

```cpp
 vi clor(n + 1);
    vi ans;
    auto dfs = [&](int now, auto self) -> bool
    {
        clor[now] = 1;
        for (auto it : mp[now])
        {
            if (clor[it] == 1)
            {
                return 0;
            }
            else if (clor[it] == 0)
            {
                if (!self(it, self))
                    return 0;
            }
        }
        clor[now] = 2;
        ans.push_back(now);
        return 1;
    };
for (int i = 1; i <= n; i++) {
    if (clor[i] == 0) dfs(i);
}
```

## 最短路算法

### 单源最短路BellmanFord

### Dijkstra

#### P4779 【模板】单源最短路径（标准版）

- **题号**: P4799
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P4799)
- **算法类型**:在一个图中，给定一个固定的起点（源点），求这个起点到图中所有其他节点的最短路径和距离。
- **AC 代码**:

```cpp
void solve()
{
    ll n,m,s;
    cin>>n>>m>>s;
    //前面是点,后面是距离
    vector<vector<pair<int,ll>>> mp(n+1);
    rep(i,0,m-1)
    {
        int u,v,w;
        cin>>u>>v>>w;
        mp[u].push_back({v,w});
   //     mp[v].push_back({u,w});这道题是有向边所以不要入两次！！
    }

    priority_queue<pair<ll,int>, vector<pair<ll,int>>, greater<pair<ll,int>>>pos ;
    vector<ll> dist(n+1,LINF);
    dist[s]=0;
    pos.emplace(0,s);

    while(!pos.empty())
    {
        auto [nowd,nowp] = pos.top();
        pos.pop();
        if(nowd>dist[nowp])continue;
        for(auto [nextp,nextd]:mp[nowp])
        {
            if(dist[nextp]>dist[nowp]+nextd)
            {
                dist[nextp]=dist[nowp]+nextd;
                pos.emplace(dist[nextp],nextp);
            }
        }
    }
    rep(i,1,n)
    {
        cout<<dist[i]<<' ';
    }
}

```

- **注意事项**:
  - 注意Dijkstra算法用最小堆优化可以时间复杂度最低
  - Dijkstra算法只能处理**非负权路径问题**
  - 为什么不用队列？：贪心最快，如果是菊花图复杂度会退化到nm
  - 含负权路用什么算法？用队列

### 多源最短路->弗洛伊德算法

- 多源最短路（All-Pairs Shortest Path）： 求图中任意两点之间的最短路（即任意点都可以是起点，任意点都可以是终点）。最经典的算法是 Floyd 算法，代码就是三层 for 循环暴力枚举，时间复杂度高达 $O(V^3)$
- 适用于任何图，不管有向无向，边权正负，但是最短路必须存在．（不能有个负环）
- $V \le 500$
- 判负环$$dist[i][i] < 0$$
- 1. 负权图的全源最短路（Johnson 算法其实也是先跑 Bellman-Ford 再跑 n 次 Dijkstra，很麻烦，Floyd 代码极短）
- 1. n 很小的稠密图（n≤300 时 Floyd O(n3)O(n^3)

#### [B3647 【模板】Floyd](https://www.luogu.com.cn/problem/B3647)

- **核心模型**：外层循环的含义是以k为中间节点的时候ij可不可以更新最短路。注意到只要图上不存在负权环，k所在的行和列都不会被更新，所以每次松弛都是单项的；注意要初始化对角线为0；
- **关键代码**:

```cpp
vector<vi> mp(n + 1, vi(n + 1, LINF));
    for (int i = 1; i <= n; i++)
        mp[i][i] = 0;
       for (int k = 1; k <= n; k++)
    {
        for (int i = 1; i <= n; i++)
        {
            for (int j = 1; j <= n; j++)
            {
                mp[i][j] = min(mp[i][j], mp[i][k] + mp[k][j]);
            }
        }
    }
```

#### **传递闭包**:并查集只能处理无向连通性，传递闭包是有向可达性

```cpp

const int N = 2005;
bitset<N> f[N];
int n, m;

int main() {
    cin >> n >> m;
    for (int i = 0; i < n; i++) f[i][i] = 1;
    for (int i = 0; i < m; i++) {
        int u, v; cin >> u >> v;
        f[u][v] = 1;   // 有向边
    }
    // Floyd 传递闭包
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            if (f[i][k]) f[i] |= f[k];
    // f[i][j]==1 表示 i 能到达 j
}
```

### 最短路算法下的子问题->正权最小环

正权图两种做法，按图的形态选：

- **稠密图 / 邻接矩阵 / $n \le 500$** → Floyd 变体，$O(n^3)$
- **稀疏图 / 邻接表 / $n$ 大** → Dijkstra × n，$O(nm \log n)$

稠密图下 Dijkstra × n 退化为 $O(n^3 \log n)$，反而更慢，所以不是"正权图就用 Floyd"，而是看图的稠密程度。

#### [观光之旅](https://www.acwing.com/problem/content/description/346/)

- **核心模型**:注意到数据范围n100 m10000.这是一个稠密图，用floyd算法
- **实现问题**:
  - 实现需要注意的：**clear()本身不是放内存，clear()int是o1的，但是string是on的**
  - 弗洛伊德板子可以直接再mp上进行dp，但是找环不能

- **关键代码**:

```cpp
void solve()
{
    int n, m;
    cin >> n >> m;

    vector<vi> mp(n + 1, vi(n + 1, LINF));  // 记录原图边权
    vector<vi> lab(n + 1, vi(n + 1, LINF)); // 记录最短路

    for (int i = 0; i <= n; i++)
    {
        mp[i][i] = 0;
        lab[i][i] = 0;
    }

    for (int i = 0; i < m; i++)
    {
        int u, v, c;
        cin >> u >> v >> c;
        mp[u][v] = min(mp[u][v], c);
        mp[v][u] = min(mp[v][u], c);
        lab[u][v] = min(lab[u][v], c);
        lab[v][u] = min(lab[v][u], c);
    }

    int ans = LINF;
    vector<vi> pos(n + 1, vi(n + 1, 0));
    vi path;

    auto fd_huan = [&](int l, int r, auto self) -> void
    {
        if (!pos[l][r])
            return;
        int k = pos[l][r];
        self(l, k, self);
        path.push_back(k);
        self(k, r, self);
    };

    for (int k = 1; k <= n; k++)
    {
        // 1. i 和 j 的边界严格小于 k
        for (int i = 1; i < k; i++)
        {
            for (int j = i + 1; j < k; j++)
            {
                // 2. 环长度 = 最短路(lab) + 两条原边(mp)
                if (lab[i][j] < LINF && mp[i][k] < LINF && mp[k][j] < LINF)
                {
                    if (ans > lab[i][j] + mp[i][k] + mp[k][j])
                    {
                        path.clear();
                        path.push_back(i);
                        fd_huan(i, j, fd_huan);
                        path.push_back(j);
                        path.push_back(k); // 3. 补上最大的环节点 k
                    }
                    ans = min(ans, lab[i][j] + mp[i][k] + mp[k][j]);
                }
            }
        }

        // 4. Floyd 状态转移全部在 lab 上操作
        for (int i = 1; i <= n; i++)
        {
            for (int j = 1; j <= n; j++)
            {
                if (lab[i][k] < LINF && lab[k][j] < LINF)
                {
                    if (lab[i][j] > lab[i][k] + lab[k][j])
                    {
                        pos[i][j] = k;
                        lab[i][j] = lab[i][k] + lab[k][j];
                    }
                }
            }
        }
    }

    if (ans == LINF)
    {
        cout << "No solution.\n";
    }
    else
    {
        for (auto it : path)
        {
            cout << it << ' ';
        }
        cout << '\n';
    }
}

```

#### [(暴力最小环)shortest cycle](https://codeforces.com/problemset/problem/1205/B)

- **核心模型**:其实我感觉这应该放在二进制里面的））这个思路主要优化在了二进制上。鉴于某个笨猪不会写bfs暴力...
- **暴力思路**:就是逐个找，以每个点k假设必须要在链上，向四周扩展，假如走到之前走过的点，说明图里面含环（这就是bfs最短再dag上能成功地原因）。。**注意计算贡献是`ans = min(ans, dist[it] + dist[now] + 1);`**(因为事项四周扩散)
- **这道题目关键剪枝思路:（抽屉原理）**我们把每个二进制位看作抽屉，如果要卡我，就是把数字放在每一个位置上散开放，但是最多60个位置，每个位置放2个点最后再多一个点一定能构成一个环。本质就是把and这样的位运算转化成连通块一样地寻找。

- **关键代码**:

```cpp
void solve()
{
    int n;
    cin >> n;
    vi nums;
    int cnt = 0;
    int d;
    rep(i, 0, n - 1)
    {
        cin >> d;
        if (d)
        {
            cnt++;
            nums.push_back(d);
        }
    }
    if (cnt > 128)
    {
        cout << 3 << '\n';
        return;
    }
    vector<vi> mp(cnt);

    for (int i = 0; i < cnt; i++)
    {
        for (int j = i + 1; j < cnt; j++)
        {
            if (nums[i] & nums[j])
            {
                mp[i].push_back(j);
                mp[j].push_back(i);
            }
        }
    }

    int ans = INF;
    for (int i = 0; i < cnt; i++)
    {
        vi dist(n, -1);
        vi fa(n);
        queue<int> q;
        q.emplace(i);
        dist[i] = 0;
        while (!q.empty())
        {
            auto now = q.front();
            q.pop();
            for (auto it : mp[now])
            {
                if (it == fa[now])
                    continue;
                if (dist[it] == -1)
                {
                    dist[it] = dist[now] + 1;
                    fa[it] = now;
                    q.emplace(it);
                }
                else
                {
                    ans = min(ans, dist[it] + dist[now] + 1);
                }
            }
        }
    }
    if (ans < INF)
        cout << ans << '\n';
    else
    {
        cout << -1 << '\n';
    }
}
```

#### dij中的最小环

- 染色法：适用于无向图

```cpp

struct Edge
{
    int to, w;
};

int n, m;
vector<vector<Edge>> adj;

void solve()
{
    cin >> n >> m;
    adj.assign(n + 1, vector<Edge>());

    for (int i = 0; i < m; i++)
    {
        int u, v, c;
        cin >> u >> v >> c;
        adj[u].push_back({v, c});
        adj[v].push_back({u, c});
    }

    int min_cycle = LINF;

    // 枚举每一个点作为源点 S
    for (int S = 1; S <= n; ++S)
    {
        vector<int> dist(n + 1, LINF);
        vector<int> color(n + 1, 0);

        // 优先队列存 {距离, 节点编号}，实现小根堆
        priority_queue<pii, vector<pii>, greater<pii>> pq;

        // 1. 特殊初始化：把 S 的直接邻居入队，并进行“大门染色”
        for (auto &edge : adj[S])
        {
            int v = edge.to;
            int w = edge.w;

            // 处理重边：如果有多条 S 到 v 的边，只保留最短的作为该分支起点
            if (w < dist[v])
            {
                dist[v] = w;
                color[v] = v; // 核心：第一步的节点编号就是这个分支的颜色
                pq.push({w, v});
            }
        }

        // 2. 跑 Dijkstra
        while (!pq.empty())
        {
            auto [d, u] = pq.top();
            pq.pop();

            // 典型的 Dijkstra 优化，废弃的状态直接丢弃
            if (d > dist[u])
                continue;

            for (auto &edge : adj[u])
            {
                int v = edge.to;
                int w = edge.w;

                // 绝对不能往回走到源点 S，否则就不是环了
                if (v == S)
                    continue;

                // 正常的最短路松弛
                if (dist[u] + w < dist[v])
                {
                    dist[v] = dist[u] + w;
                    color[v] = color[u]; // 继承所在分支的颜色
                    pq.push({dist[v], v});
                }
                // 3. 发现碰撞！两个点都被访问过，且属于 S 的不同分支
                else if (color[u] != color[v] && color[v] != 0)
                {
                    min_cycle = min(min_cycle, dist[u] + dist[v] + w);
                }
            }
        }
    }

    if (min_cycle == LINF)
    {
        cout << "No solution.\n";
    }
    else
    {
        cout << min_cycle << "\n";
    }
}
```

- 普通dij：有向图，边带权

```cpp
int dijkstra(int s, int n, vector<vector<pair<int,int>>>& adj) {
    vector<int> dist(n + 1, 1e15);
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;

    // 注意：不设置 dist[s]=0，直接从邻居起步
    for(auto& edge : adj[s]) {
        int v = edge.first, w = edge.second;
        if(w < dist[v]) {
            dist[v] = w;
            pq.push({dist[v], v});
        }
    }

    while(!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if(d > dist[u]) continue;
        if(u == s) return d; // 成功绕回起点！

        for(auto& edge : adj[u]) {
            int v = edge.first, w = edge.second;
            if(dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return 1e15;
}
```

#### [#7991. 最小环(我还不会，ai写的)](https://qoj.ac/problem/7991)

- **核心模型**:一句话概括题意/数学本质 (如: 中位数贪心 / 差分约束)
- **思维误区 (Bug)**:记录第一直觉为什么错了 (如: 以为是DP其实是贪心 / 读错题)
- **修正逻辑 (Patch)**:下次看到什么特征，要修正为正确思路
- **关键代码**:

```cpp
// Problem: 有向图弱连通最小环 (N=3e5, M-N<=1500)
// Tag: 拓扑排序, 缩链, Dijkstra

#include <bits/stdc++.h>
using namespace std;

const long long LINF = 1e15;

struct Edge
{
    int to;
    long long w;
};

void solve()
{
    int n, m;
    if (!(cin >> n >> m))
        return;

    vector<vector<Edge>> adj(n + 1);
    vector<vector<Edge>> rev_adj(n + 1); // 存反向边用于拓扑剥离
    vector<int> in(n + 1, 0), out(n + 1, 0);

    for (int i = 0; i < m; i++)
    {
        int u, v;
        long long c;
        cin >> u >> v >> c;
        adj[u].push_back({v, c});
        rev_adj[v].push_back({u, c});
        out[u]++;
        in[v]++;
    }

    // ==========================================
    // 第一步：拓扑剪枝，剥离所有死胡同 (不在任何环里的点)
    // ==========================================
    queue<int> q;
    vector<bool> dead(n + 1, false);
    for (int i = 1; i <= n; i++)
    {
        if (in[i] == 0 || out[i] == 0)
        {
            q.push(i);
            dead[i] = true;
        }
    }

    while (!q.empty())
    {
        int u = q.front();
        q.pop();
        for (auto &e : adj[u])
        {
            if (!dead[e.to])
            {
                if (--in[e.to] == 0)
                {
                    dead[e.to] = true;
                    q.push(e.to);
                }
            }
        }
        for (auto &e : rev_adj[u])
        {
            if (!dead[e.to])
            {
                if (--out[e.to] == 0)
                {
                    dead[e.to] = true;
                    q.push(e.to);
                }
            }
        }
    }

    // ==========================================
    // 第二步：寻找“关键路口”，准备构建压缩图
    // ==========================================
    vector<int> key_nodes;
    vector<bool> is_key(n + 1, false);
    vector<int> new_id(n + 1, 0); // 记录原图节点在新图中的 ID

    int new_n = 0;
    for (int i = 1; i <= n; i++)
    {
        if (!dead[i] && (in[i] > 1 || out[i] > 1))
        {
            is_key[i] = true;
            key_nodes.push_back(i);
            new_id[i] = ++new_n;
        }
    }

    long long ans = LINF;

    // 特判：如果整个图缩完之后没有关键节点，说明整个图就是一个纯粹的简单环 (m=n)
    if (key_nodes.empty())
    {
        for (int i = 1; i <= n; i++)
        {
            if (!dead[i])
            {
                long long cycle_sum = 0;
                int curr = i;
                do
                {
                    for (auto &e : adj[curr])
                    {
                        if (!dead[e.to])
                        {
                            cycle_sum += e.w;
                            curr = e.to;
                            break;
                        }
                    }
                } while (curr != i);
                cout << cycle_sum << "\n";
                return;
            }
        }
        cout << "-1\n";
        return;
    }

    // ==========================================
    // 第三步：顺藤摸瓜进行缩链，构建超小规模新图
    // ==========================================
    // new_n 最大只有 3000 (因为 m-n <= 1500)
    vector<vector<Edge>> new_adj(new_n + 1);

    for (int u : key_nodes)
    {
        for (auto &edge : adj[u])
        {
            int v = edge.to;
            long long w = edge.w;
            if (dead[v])
                continue;

            int curr = v;
            long long path_w = w;

            // 如果碰到的不是关键路口，就把它当做马路直接走过去
            while (!is_key[curr])
            {
                for (auto &e : adj[curr])
                {
                    if (!dead[e.to])
                    {
                        path_w += e.w;
                        curr = e.to;
                        break; // 因为 out[curr] == 1，所以唯一的出路就是它
                    }
                }
            }
            // 终于走到了下一个关键路口 curr，直接连一条长直边！
            new_adj[new_id[u]].push_back({new_id[curr], path_w});
        }
    }

    // ==========================================
    // 第四步：在新图上跑 N 轮 Dijkstra 求最小环
    // ==========================================
    for (int S = 1; S <= new_n; S++)
    {
        vector<long long> dist(new_n + 1, LINF);
        priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<pair<long long, int>>> pq;

        // 起步：有向图找环的特殊技巧
        // 不要把 dist[S] 设为 0，而是直接把 S 的出边扔进队列
        // 这样只要再次跑到 S，dist[S] 就是环的长度！
        for (auto &edge : new_adj[S])
        {
            int v = edge.to;
            long long w = edge.w;
            if (w < dist[v])
            {
                dist[v] = w;
                pq.push({w, v});
            }
        }

        while (!pq.empty())
        {
            auto [d, u] = pq.top();
            pq.pop();

            if (d > dist[u])
                continue;

            // 如果跑回了起点，就说明找到了一个环！
            if (u == S)
            {
                ans = min(ans, d);
                break; // Dijkstra 第一次回到 S 一定是最短的环，直接退出当前源点的搜索
            }

            for (auto &edge : new_adj[u])
            {
                int v = edge.to;
                long long w = edge.w;
                if (dist[u] + w < dist[v])
                {
                    dist[v] = dist[u] + w;
                    pq.push({dist[v], v});
                }
            }
        }
    }

    if (ans == LINF)
        cout << "-1\n";
    else
        cout << ans << "\n";
}

signed main()
{
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    solve();
    return 0;
}
```

### 差分约束+spfa板子

#### [Layout G](https://www.luogu.com.cn/problem/P4878)

- **核心模型**: 差分约束就是`a-b<=c` a b 是变量c 是常数，然后跑spfa判负环，如果是诸如`a<=b+c`的形式就是`spfa[b].push_back({a, c});`（负数就是-c）我们把每个点的权值尽可能往小更新，当`if (cnt[it.v] > n)`即出现负环
- btw我们也可以往大更新，判断超长路，但我不想写））
- 这道题的关键是你要约束奶牛之间的相对位置，我们只是给奶牛约束相对位置所以不需要带权值，放一个0就行，但是必须带上这个约束先后位置
- **关键代码**:

```cpp


void solve()
{
    int n, ml, md;
    cin >> n >> ml >> md;
    int a, b, d;
    vector<vector<pii>> mp(n + 1);
    for (int i = 1; i < n; i++)
    {
        mp[i + 1].push_back({i, 0});
    }
    for (int i = 0; i < ml; i++)
    {
        cin >> a >> b >> d;
        mp[a].push_back({b, d});
    }
    for (int i = 0; i < md; i++)
    {
        cin >> a >> b >> d;
        // swap(a,b);
        mp[b].push_back({a, -1 * d});
    }

    for (int i = 1; i <= n; i++)
    {
        mp[0].push_back({i, 0});
    }
    vi val(n + 1, INF);
    val[0] = 0;
    queue<int> q;
    q.emplace(0);
    vi inq(n + 1);
    inq[0] = 1;
    vi cnt(n + 1);

    while (!q.empty())
    {
        auto now = q.front();
        q.pop();
        inq[now] = 0;
        for (auto it : mp[now])
        {
            if (val[it.first] > val[now] + it.second)
            {
                val[it.first] = val[now] + it.second;
                cnt[it.first] = cnt[now] + 1;
                if (cnt[it.first] > n)
                {
                    cout << -1 << '\n';
                    return;
                }
                if (!inq[it.first])
                {

                    q.emplace(it.first);
                    inq[it.first] = 1;
                }
            }
        }
    }

    vi val2(n + 1, INF);
    val2[1] = 0;
    queue<int> q2;
    q2.emplace(1);
    vi inq2(n + 1);
    inq2[1] = 1;
    while (!q2.empty())
    {
        auto now = q2.front();
        q2.pop();
        inq2[now] = 0;
        for (auto it : mp[now])
        {
            if (val2[it.first] > val2[now] + it.second)
            {
                val2[it.first] = val2[now] + it.second;
                if (!inq2[it.first])
                {
                    q2.emplace(it.first);
                    inq2[it.first] = 1;
                }
            }
        }
    }
    if (val2[n] == INF)
        cout << -2 << '\n';
    else
    {
        cout << val2[n] << '\n';
    }
}
```

---

## Tarjan

### Tarjan是什么？

- $O(V+E)$，其中 $V$ 是节点数，$E$ 是边数
- 实现：stack dfs
- 讨论有向图的连通性
- Tarjan 算法是找出割点、桥和双连通分量的标准算法。

### Tarjan怎么用？

- 对于每个节点u我们需要
  - dfn[u] 访问顺序
  - low[u] 判断u是否属于某个SCC
- 当$$\text{dfn}[u] = \text{low}[u]$$ 的时候u是这个SCC的根节点
- 只有当一个节点确定属于某个 SCC 时，它才会被弹出栈。
- in_stack[u] (或 vis[u]): 一个布尔数组，标记节点 $u$ 是否在 stack 中。//换名字以免和遍历算法重名
- 我们在根节点上面对他所领导的强连通分量做统计
- $\text{dfn}$ 值是用来衡量 连通性 的标准。

### tarjan性质

- 关于 low 数组的性质：能回到的“最古老/最早”的时间戳
- Tarjan 算法求出的强连通分量（SCC）的编号，天然就是一个严格的“逆拓扑排序”！
也就是说，编号越小，离图的“终点（出口）”越近；编号越大，离图的“起点”越近。->因为 SCC 编号已经是“逆拓扑序”了。你只要把循环倒过来，从编号最大的 SCC 开始，一直遍历到编号为 1 的 SCC，这本身就是一个完美的**拓扑序递推**！
- **几种中档题常见做法**

  - 图里肯定没环，或者只问你先后顺序：
    - 标准拓扑排序（入度表 + BFS 队列）。如果有字典序要求，就上优先队列。简单、清晰、不易错。

  - 图里可能有环，且只问你谁和谁是一伙的：
    - 只跑 Tarjan。找出来完事。

  - 图里有环，且要把环缩点后，求整张图的最优解/最大值/路径数：
    - Tarjan 缩点 + scc_cnt 倒着循环跑 DP。这就是前面说的“图论三剑客”终极偷懒版，一套连招带走！

- **tarjan模板（详细解释）**

```cpp

const int MAXN = 100005;

// =======================
// 核心数据结构和变量
// =======================

// 图的邻接表表示
vector<int> adj[MAXN];

// 计时器，用于给节点分配 dfn
int timer = 0;

// dfn[u]: 节点 u 的 DFS 访问次序（发现时间）
int dfn[MAXN];

// low[u]: 节点 u 及其子树中的节点能追溯到的最早的 dfn
int low[MAXN];

// stack: 存储当前正在搜索路径上且未确定 SCC 的节点
stack<int> s;

// in_stack[u]: 标记节点 u 是否在栈中
bool in_stack[MAXN];

// scc_count: 强连通分量的数量
int scc_count = 0;

// scc_id[u]: 节点 u 所属的强连通分量的编号
// 如果需要进行“缩点”，这个数组是关键
int scc_id[MAXN];

// =======================
// Tarjan 算法主体：纯纯的板子不需要改动
// =======================

/**
 * @brief Tarjan算法寻找强连通分量
 * @param u 当前正在访问的节点
 */
void Tarjan(int u) {
    // 1. 初始化：设置 dfn 和 low
    dfn[u] = low[u] = ++timer;

    // 2. 入栈：将节点 u 压入栈并标记
    s.push(u);
    in_stack[u] = true;

    // 3. 遍历 u 的所有邻接点 v
    for (int v : adj[u]) {
        if (dfn[v] == 0) {
            // 情况 A: v 未被访问（树枝边）
            Tarjan(v);
            
            // 回溯时：用子节点的 low 更新父节点的 low
            // low[u] = min(low[u], low[v])
            low[u] = min(low[u], low[v]);
        } else if (in_stack[v]) {
            // 情况 B: v 已被访问且仍在栈中（回边/横叉边，但 v 在栈中）
            // 用 v 的 dfn 更新 u 的 low
            // low[u] = min(low[u], dfn[v])
            // 注意：这里是 dfn[v] 而非 low[v]，因为 low[v] 可能跨越了 u 所在的 SCC
            low[u] = min(low[u], dfn[v]);
        }
    }

    // 4. 判断是否找到 SCC 根
    // 如果 dfn[u] == low[u]，则 u 是一个 SCC 的根

    //这一段要写对于每一个scc需要维护的东西（根据题意改变）
    if (dfn[u] == low[u]) {
        scc_count++;
        // 5. 出栈：将 SCC 中的所有节点弹出
        while (true) {
            int current_node = s.top();
            s.pop();
            
            // 标记节点已不在栈中
            in_stack[current_node] = false;
            
            // 分配 SCC 编号
            scc_id[current_node] = scc_count;
            
            // 直到弹出根节点 u
            if (current_node == u) {
                break;
            }
        }
    }
}

调用：// 遍历所有节点，确保所有连通块都被搜索到
    for (int i = 1; i <= N; ++i) {
        if (dfn[i] == 0) {
            Tarjan(i);
        }
    }

```

#### P3916 图的遍历(运用tarjan算法)

- **题号**: P3916
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P3916)
- **算法类型**:Tarjan
- **AC 代码**:

```cpp
const int MAXN = 100005;

vi dfn(MAXN);
vi low(MAXN);

stack<int> stk;

vector<bool> in_stk(MAXN, 0);
int scc = 0; // scc编号
int scc_id[MAXN];

vi nwempmx(MAXN);
vi dp(MAXN);
int timer = 0;
void Tarjan(int u,  const vector<vi> &mp)
{

    dfn[u] = low[u] = ++timer;
   

    stk.push(u);
    in_stk[u] = 1;

    for (auto hsh : mp[u])
    {
        if (!dfn[hsh])
        {
            Tarjan(hsh, mp);
            low[u] = min(low[u], low[hsh]);
        }
        else if (in_stk[hsh])
        {
            low[u] = min(low[u], dfn[hsh]);
        }
    }

    if (dfn[u] == low[u])
    {
        scc++;
        int mxscc = 0;
        while (1)
        {
            auto node = stk.top();
            stk.pop();
            in_stk[node] = 0;
            scc_id[node] = scc;
            mxscc = max(mxscc, node);
            if (node == u)
                break;
        }
        nwempmx[scc] = mxscc;
        dp[scc] = mxscc;
    }
}
// 拓排dp
int dfs(int a, const vector<vi> &newmp)
{
    if (dp[a] != nwempmx[a])
    {
        return dp[a];
    }
    int k = nwempmx[a];
    for (int hsh4 : newmp[a])
    {
        k = max(k, dfs(hsh4, newmp));
    }
    dp[a] = k;
    return dp[a];
}

```

#### [M. My University Is Better Than Yours](https://codeforces.com/group/A5KcfGn880/contest/687149/problem/M)

- **核心模型**:
- **思维误区 (Bug)**:
- **修正逻辑 (Patch)**:
- **关键代码**:

```cpp
#include <bits/stdc++.h>
using namespace std;

using vi = vector<int>;

const int MAXN = 5e5 + 50;
vi dfn(MAXN);
vi low(MAXN);

stack<int> stk;

vector<bool> in_stk(MAXN, 0);
int scc = 0;
int scc_id[MAXN];

int timer = 0;

void Tarjan(int u, const vector<vi> &mp)
{
    dfn[u] = low[u] = ++timer;
    stk.emplace(u);
    in_stk[u] = 1;

    for (auto it : mp[u])
    {
        if (!dfn[it])
        {
            Tarjan(it, mp);
            low[u] = min(low[u], low[it]);
        }
        else if (in_stk[it])
        {
            low[u] = min(low[u], dfn[it]);
        }
    }

    if (dfn[u] == low[u])
    {
        scc++;
        while (1)
        {
            int now = stk.top();
            stk.pop();

            in_stk[now] = 0;
            scc_id[now] = scc;
            if (now == u)
            {
                break;
            }
        }
    }
}

void solve()
{

    int n, m;
    cin >> n >> m;
    vector<vi> mp(n + 1);
    vi line(n);
    for (int i = 0; i < m; i++)
    {
        int lst = 0, d;
        for (int j = 0; j < n; j++)
        {
            cin >> d;
            if (lst)
            {
                mp[lst].push_back((d));
            }
            if (!i)
            {
                line[j] = d;
            }
            lst = d;
        }
    }

    for (int i = 1; i <= n; i++)
    {
        if (!dfn[i])
        {
            Tarjan(i, mp);
        }
    }

    vector<vi> dag(n + 1);
    for (int i = 1; i <= n; i++)
    {
        for (auto v : mp[i])
        {
            if (scc_id[i] != scc_id[v])
            {
                dag[scc_id[i]].push_back(scc_id[v]);
            }
        }
    }
    vi xiao_scc(n + 1, n + 1);
    for (int i = 0; i < n; i++)
    {
        xiao_scc[scc_id[line[i]]] = min(i, xiao_scc[scc_id[line[i]]]);
        // cerr<<xiao[scc_id[line[i]]]<<' '<<i<<' '<<line[i]<<'\n';
    }
    for (int i = 1; i <= scc; i++)
    {
        for (auto it : dag[i])
        {
            // xiao[i] = min(xiao[i], xiao[it]);
            xiao_scc[i] = min(xiao_scc[i], xiao_scc[it]);
        }
    }

    vi ans(n + 1);
    for (int i = 0; i < n; i++)
    {
        // ans[line[i]] = n - xiao[scc_id[line[i]]]-1;
        ans[line[i]] = n - xiao_scc[scc_id[line[i]]] - 1;
    }
    for (int i = 1; i <= n; i++)
    {
        cout << ans[i] << ' ';
    }
    cout << '\n';
}


```

---
