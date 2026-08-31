---
title: KH_树
category: 算法学习
date: '2026-06-04'
tags:
  - 图论
  - C++
  - 树
pinned: false
description: ''
---


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

## 树上算法

### 树链剖分

#### 树剖求LCA：from widas （加入了个人理解的魔改）

```cpp

struct HLD {
    int n, idx;
    vector<vector<int>> ver;
    vector<int> siz, dep; //子树大小，节点深度
    vector<int> top, son, parent; //重链的连头  重儿子  父亲
    vector<int> dfn;
    HLD(int n) {
        this->n = n;
        ver.resize(n + 1);
        siz.resize(n + 1);
        dep.resize(n + 1);

        top.resize(n + 1);
        son.resize(n + 1);
        parent.resize(n + 1);

        dfn.resize(n+1);
    }
    void add(int x, int y) { // 建立双向边
        ver[x].push_back(y);
        ver[y].push_back(x);
    }
    void dfs1(int x) { //维护pa dep son siz
        siz[x] = 1;
        dep[x] = dep[parent[x]] + 1;
        for (auto y : ver[x]) {
            if (y == parent[x]) continue;
            parent[y] = x;
            dfs1(y);
            siz[x] += siz[y];
            if (siz[y] > siz[son[x]]) {
                son[x] = y;
            }
        }
    }
    void dfs2(int x, int up) { //维护 top
        top[x] = up;
        dfn[x] = ++idx;
        if (son[x]) dfs2(son[x], up); //重儿子
        for (auto y : ver[x]) {  // 轻儿子
            if (y == parent[x] || y == son[x]) continue;
            dfs2(y, y);
        }
    }
    void work(int root = 1) { // 在此初始化
        dfs1(root);
        dfs2(root, root);
    }

    int lca(int x, int y) { //查询树上lca
        while (top[x] != top[y]) {
            if (dep[top[x]] > dep[top[y]]) {
                x = parent[top[x]];
            } else {
                y = parent[top[y]];
            }
        }
        return dep[x] < dep[y] ? x : y;
    }
    int clac(int x, int y) { // 查询两点间距离
        return dep[x] + dep[y] - 2 * dep[lca(x, y)];
    }
   
    bool is_an(int x,int y)  // x是否是y的祖先
    {
        return dfn[x]<=dfn[y]&&dfn[y]<dfn[x]+siz[x];
    }


};

```

### 树上点分治

#### [模板：树上点分治](https://www.luogu.com.cn/problem/P3806)

- **问题**:给定一棵有 n 个点的树，询问树上距离为 k 的点对是否存在。
- **算法流程**：分为两个部分，一个是递归找到树的重心，一个是继续往下进行分治，每一层对于儿子传上来的信息进行计算
- **关键代码**:

```cpp
struct edge
{
    int to, val;
};

void solve()
{
    int n, m;
    cin >> n >> m;
    int root = 0;
    int Max_tree = 1e18;
    vi vis(n + 1), siz(n + 1);
    vector<vector<edge>> mp(n + 1);
    for (int i = 0; i < n-1; i++)
    {
        int u, v, w;
        cin >> u >> v >> w;
        mp[u].emplace_back(v, w);
        mp[v].emplace_back(u, w);
    }

    auto get = [&](auto &&self, int x, int fa, int n) -> void
    {
        siz[x] = 1;
        int val = 0;
        for (auto [y, w] : mp[x])
        {
            if (y == fa || vis[y])
                continue;
            self(self, y, x, n);
            siz[x] += siz[y];
            val = max(val, siz[y]);
        }
        val = max(val, n - siz[x]);
        if (val < Max_tree)
        {
            {
                Max_tree = val;
                root = x;
            }
        }
    };

    get(get, 1, 0, n);
    vi q(m + 1);
    vi ans(m + 1);
    auto clac = [&](int x) -> void
    {
        set<int> pre = {0};
        vi dis(n + 1);
        for (auto [y, w] : mp[x])
        {
            if (vis[y])
                continue;
            vi child;

            auto dfs = [&](auto &&self, int x, int fa) -> void
            {
                child.emplace_back(dis[x]);
                for (auto [y, w] : mp[x])
                {
                    if (y == fa || vis[y])
                        continue;
                    dis[y] = dis[x] + w;
                    self(self, y, x);
                }
            };

            dis[y] = w;
            dfs(dfs, y, x);
        // 进行对子树上的信息进行计算
            for (auto it : child)
            {
                for (int i = 1; i <= m; i++)
                {
                    if (q[i] < it || !pre.count(q[i] - it))
                        continue;
                    ans[i] = 1;
                }
            }
            pre.insert(child.begin(), child.end());
        }
    };
    auto dfz = [&](auto &&self, int x, int fa) -> void
    {
        vis[x] = 1;
        clac(x);
        for (auto [y, w] : mp[x])
        {
            if (y == fa || vis[y])
                continue;
            Max_tree = 1e18;
            get(get, y, x, siz[y]);
            self(self, root, x);
        }
    };

    for (int i = 1; i <= m; i++)
    {
        cin >> q[i];
    }
    dfz(dfz, root, 0);
    for (int i = 1; i <= m; i++)
    {
       if(ans[i])
       {
        cout<<"AYE"<<'\n';
       }
       else
       {
        cout<<"NAY"<<'\n';
       }
    }
}

```

---

### 虚树

#### 板子

- **复杂度**
设关键点数量为 k：
虚树节点数：最多 2k - 1
排序：O(k log k)
LCA：调用 k - 1 次
建边：O(k)

- 前提：你目前已经有：dfn dep lca 两点是否是公共祖先

```cpp
int dfn[MAXN];
int dep[MAXN];

int lca(int u, int v);

// 必须是包含自身的祖先判断：is_an(u, u) == true
   bool is_an(int x, int y) {
        return dfn[x] <= dfn[y] &&
               dfn[y] < dfn[x] + siz[x];
    }
```

- 虚树部分直接写成：

```cpp
vector<vector<pair<int, int>>> vir;
vector<int> vir_node;
初始化一次：
vir.resize(n + 1);
```

- 核心函数：
  - 假设要导入结构体可以：`int build_virtual_tree(HLD &tr,vector<int> point,bool force_root = false,int root)`

```cpp
int build_virtual_tree(vector<int> point,bool force_root = false,int root) {
    // 清理上一次虚树的边
    for (int u : vir_node) {
        vir[u].clear();
    }

    vir_node.clear();

    if (force_root) {
        point.push_back(root);
    }

    if (point.empty()) {
        return 0;
    }

    auto cmp = [&](int u, int v) {
        return dfn[u] < dfn[v];
    };

    // 关键点按 DFS 序排序并去重
    sort(point.begin(), point.end(), cmp);
    point.erase(
        unique(point.begin(), point.end()),
        point.end()
    );

    int k = point.size();

    // 加入相邻关键点的 LCA
    point.reserve(2 * k);

    for (int i = 0; i + 1 < k; ++i) {
        point.push_back(lca(point[i], point[i + 1]));
    }

    // LCA 加入后，必须重新排序去重
    sort(point.begin(), point.end(), cmp);
    point.erase(
        unique(point.begin(), point.end()),
        point.end()
    );

    vir_node = point;

    // 单调栈建边
    vector<int> stk;
    stk.reserve(point.size());

    stk.push_back(point[0]);

    for (int i = 1; i < static_cast<int>(point.size()); ++i) {
        int u = point[i];

        // 弹出所有不是 u 祖先的节点
        while (!is_an(stk.back(), u)) {
            stk.pop_back();
        }

        int fa = stk.back();

        // 虚树边：fa -> u
        // dep 差表示原树路径长度
        vir[fa].push_back({
            u,
            dep[u] - dep[fa]
        });

        stk.push_back(u);
    }

    // point[0] 就是虚树根
    return point[0];
}
```

- 调用

```cpp
vector<int> key = {4, 5, 6};

int root = build_virtual_tree(key, true, 1);

for (auto [v, len] : vir[root]) {
    // v 是 root 的虚树儿子
    // len 是原树中 root 到 v 的距离
}
```

- **各种LCA 实现方式**
  - `倍增` `Euler Tour + RMQ` `HLD` `Tarjan 离线 LCA`

#### [Escape Root](https://ac.nowcoder.com/acm/contest/133884/D)

- **题意**:m 个人分别在时刻si 出现在树上结点xi，随后以单位速度沿最短路走向根1。任意时刻若至少两人在同一位置，则这些人同时消失；位置也可以在边内部。未发生碰撞并到达根的人成功逃脱，输出每个人的结果。n, m ≤2×105
- **虚树**:在保持关键节点祖先关系、路径关系和距离信息的前提下，删除所有无用节点，并把无用链压缩成边。
- **关键代码**:

```cpp
struct VirtualTree
{
    HLD &tree;

    // 虚树父亲 -> 儿子
    vector<vector<pii>> ver;

    // 当前虚树中出现的所有节点
    vi node;

    VirtualTree(HLD &tree) : tree(tree)
    {
        ver.resize(tree.n + 1);
    }

    // point：关键点
    // force_root：是否强制加入原树根
    // 返回虚树根
    int build(vi point, bool force_root = false, int root = 1)
    {
        for (auto x : node)
            ver[x].clear();

        node.clear();

        if (force_root)
            point.push_back(root);

        if (point.empty())
            return 0;

        auto cmp = [&](int x, int y)
        {
            return tree.dfn[x] < tree.dfn[y];
        };

        sort(all(point), cmp);
        point.erase(unique(all(point)), point.end());

        int len = point.size();

        point.reserve(len * 2);

        for (int i = 0; i + 1 < len; i++)
            point.push_back(tree.lca(point[i], point[i + 1]));

        sort(all(point), cmp);
        point.erase(unique(all(point)), point.end());

        node = point;

        vi stk;
        stk.reserve(point.size());
        stk.push_back(point[0]);

        for (int i = 1; i < point.size(); i++)
        {
            int x = point[i];

            while (!tree.is_an(stk.back(), x))
                stk.pop_back();

            int fa = stk.back();

            // first：儿子
            // second：原树上的边距离
            ver[fa].push_back({x, tree.dep[x] - tree.dep[fa]});

            stk.push_back(x);
        }

        return point[0];
    }

};
struct info
{
    int s, x;
    int val;
    int idx;
};

void solve()
{
    int n, m;
    cin >> n >> m;
    HLD lca(n);
    for (int i = 0; i < n - 1; i++)
    {
        int u, v;
        cin >> u >> v;

        lca.add(u, v);
    }
    lca.work(1); // 预处理
    vector<info> bb(m);
    for (int i = 0; i < m; i++)
    {

        cin >> bb[i].x >> bb[i].s;

        bb[i].val = bb[i].s + lca.clac(bb[i].x, 1); // 权值
        bb[i].idx = i + 1;
    }
    sort(all(bb), [](info a, info b)
         { return a.val < b.val; }); // 按照权值牌序

    vi ans(m + 1);       // 答案
    VirtualTree vt(lca); // 建立虚树
    vector<int> pt;      // 关键点集
    vi dp(n + 1, 0);
    vector<pii> lab;
    for (int i = 0; i < m; i++)
    {
        if (i && bb[i].val != bb[i - 1].val)
        {
            int root = vt.build(pt, true, 1); // 建树
            for (auto nd : vt.node)
            {
                dp[nd] = 0;
            }
            for (int i = 0; i < lab.size(); i++)
            {
                if (dp[lab[i].first])
                    dp[lab[i].first] = -1;
                else
                    dp[lab[i].first] = lab[i].second; // 编号
            }

            auto dfs = [&](auto &&self, int x, int fa) -> void
            {
                for (auto [y, dis] : vt.ver[x])
                {
                    if (y == fa)
                        continue;
                    self(self, y, x);
                    if (dp[x] == 0)
                    {
                        if (dp[y] == -1)
                            dp[y] = 0;
                        dp[x] = dp[y];
                    }
                    else
                    {
                        if (dp[y] == 0 || dp[y] == -1)
                        {
                        }
                        else
                        {
                            dp[x] = -1;
                        }
                    }
                }
            };
            dfs(dfs, root, 0);

            if (dp[root] != -1 && dp[root] != 0)
                ans[dp[root]] = 1;

            pt.clear();
            lab.clear();
        }
        pt.push_back({bb[i].x});
        lab.push_back({bb[i].x, bb[i].idx});
    }
    int root = vt.build(pt, true, 1); // 建树
    for (auto nd : vt.node)
    {
        dp[nd] = 0;
    }
    for (int i = 0; i < lab.size(); i++)
    {
        if (dp[lab[i].first])
            dp[lab[i].first] = -1;
        else
            dp[lab[i].first] = lab[i].second; // 编号
    }

    auto dfs = [&](auto &&self, int x, int fa) -> void
    {
        for (auto [y, dis] : vt.ver[x])
        {
            if (y == fa)
                continue;
            self(self, y, x);
            if (dp[x] == 0)
            {
                if (dp[y] == -1)
                    dp[y] = 0;
                dp[x] = dp[y];
            }
            else
            {
                if (dp[y] == 0 || dp[y] == -1)
                {
                }
                else
                {
                    dp[x] = -1;
                }
            }
        }
    };
    dfs(dfs, root, 0);
    if (dp[root] != -1 && dp[root] != 0)
        ans[dp[root]] = 1;
    for (int i = 1; i <= m; i++)
    {
        if (ans[i])
            cout << 1;
        else
            cout << 0;
    }
}
```

#### [世界树](https://www.luogu.com.cn/problem/P3233)

- 虚树的部分很简单先不说：我们考虑一下将问题转化->给定一棵带权树上面有一些点，每个点都有一定的影响范围，求能够覆盖整棵树所有点的影响范围的最大值最小。数据范围4e5
- **关键代码**:

```cpp

struct HLD
{
    int n, idx;
    vector<vi> ver;
    vi siz, dep;
    vi top, son, pa;
    vi dfn;
    HLD(int n)
    {

        this->n = n;
        idx = 0;
        ver.resize(n + 1);
        siz.resize(n + 1);
        dep.resize(n + 1);
        top.resize(n + 1);
        son.resize(n + 1);
        pa.resize(n + 1);
        dfn.resize(n + 1);
    }
    void add(int x, int y)
    {
        ver[x].push_back(y);
        ver[y].push_back(x);
    }
    void dfs1(int x)
    {
        siz[x] = 1;
        dep[x] = dep[pa[x]] + 1;
        for (auto y : ver[x])
        {
            if (y == pa[x])
                continue;
            pa[y] = x;
            dfs1(y);
            siz[x] += siz[y];
            if (siz[y] > siz[son[x]])
            {
                son[x] = y;
            }
        }
    }
    void dfs2(int x, int up)
    {
        top[x] = up;
        dfn[x] = ++idx;

        if (son[x])
            dfs2(son[x], up);
        for (auto y : ver[x])
        {
            if (y == pa[x] || y == son[x])
                continue;
            dfs2(y, y);
        }
    }

    void init(int root)
    {
        dfs1(root), dfs2(root, root);
    }

    int lca(int x, int y)
    {
        while (top[x] != top[y])
        {
            if (dep[top[x]] > dep[top[y]])
            {
                x = pa[top[x]];
            }
            else
            {
                y = pa[top[y]];
            }
        }
        return dep[x] < dep[y] ? x : y;
    }
    int clac(int x, int y)
    {
        return dep[x] + dep[y] - 2 * dep[lca(x, y)];
    }
    bool is_an(int x, int y)
    {
        return dfn[x] <= dfn[y] && dfn[y] < dfn[x] + siz[x];
    }
};

void solve()
{
    int n;
    cin >> n;
    HLD tr(n);
    for (int i = 0; i < n - 1; i++)
    {
        int u, v;
        cin >> u >> v;
        tr.add(u, v);
    }
    tr.init(1);
    int q;
    cin >> q;
    vi pt;
    vector<vector<pii>> vir(n + 1);
    vi vir_pt;
    vi dis(n + 1), bel(n + 1), ans(n + 1);
    vector<bool> key(n + 1);
    int m;

    for (int i = 0; i < q; i++)
    {
        cin >> m;
        pt.clear();
        pt.push_back(1);
        rep(j, 0, m - 1)
        {
            int y;
            cin >> y;
            pt.push_back(y);
        }

        for (auto u : vir_pt)
        {
            vir[u].clear();
        }

        auto cmp = [&tr](int u, int v) -> bool
        {
            return tr.dfn[u] < tr.dfn[v];
        };

        sort(all(pt), cmp);
        // pt.erase(unique(all(pt)), pt.end());
        // int k=pt.size();
        pt.reserve(2 * m);
        for (int j = 0; j + 1 < m; j++)
        {
            pt.push_back(tr.lca(pt[j], pt[j + 1]));
        }
        sort(all(pt), cmp);
        pt.erase(unique(all(pt)), pt.end());
        vir_pt = pt;

        vector<int> stk;
        stk.reserve(pt.size());
        stk.push_back(pt[0]);

        for (int j = 1; j < static_cast<int>(pt.size()); j++)
        {
            int u = pt[j];
            while (!tr.is_an(stk.back(), u))
            {
                stk.pop_back();
            }
            int fa = stk.back();
            vir[fa].push_back({u, tr.dep[u] - tr.dep[fa]});
            stk.push_back(u);
        }

        int root = pt[0];
    }
}
```

---

### Euler + RMQ 卡log复杂度求lca（预处理nlogn，只是在巨多次询问的时候会被卡）

```cpp

struct EulerLCA {
    int n;
    int timer;

    vector<vector<int>> ver;

    // 原树深度
    vector<int> dep;

    // Euler 序
    vector<int> euler;

    // first[u]：u 第一次出现在 Euler 序中的位置
    vector<int> first;

    // lg[i] = floor(log2(i))
    vector<int> lg;

    // st[k][i]：从 euler[i] 开始，长度 2^k 的区间最浅节点
    vector<vector<int>> st;

    EulerLCA(int n) {
        this->n = n;

        ver.resize(n + 1);
        dep.resize(n + 1);
        first.resize(n + 1);
    }

    void add(int x, int y) {
        ver[x].push_back(y);
        ver[y].push_back(x);
    }

    void dfs(int x, int fa) {
        first[x] = euler.size();
        euler.push_back(x);

        for (int y : ver[x]) {
            if (y == fa) {
                continue;
            }

            dep[y] = dep[x] + 1;

            dfs(y, x);

            // 从 y 的子树返回 x
            euler.push_back(x);
        }
    }

    void work(int root = 1) {
        euler.clear();

        dep[root] = 0;
        dfs(root, 0);

        int m = euler.size();

        // 预处理 log
        lg.resize(m + 1);

        for (int i = 2; i <= m; ++i) {
            lg[i] = lg[i / 2] + 1;
        }

        int K = lg[m] + 1;

        st.assign(K, vector<int>(m));

        // k = 0，区间长度为 1
        for (int i = 0; i < m; ++i) {
            st[0][i] = euler[i];
        }

        // Sparse Table
        for (int k = 1; k < K; ++k) {
            int len = 1 << k;
            int half = len >> 1;

            for (int i = 0; i + len <= m; ++i) {
                int x = st[k - 1][i];
                int y = st[k - 1][i + half];

                st[k][i] =
                    dep[x] < dep[y] ? x : y;
            }
        }
    }

    int lca(int x, int y) {
        int l = first[x];
        int r = first[y];

        if (l > r) {
            swap(l, r);
        }

        int k = lg[r - l + 1];

        int x1 = st[k][l];
        int x2 = st[k][r - (1 << k) + 1];

        return dep[x1] < dep[x2] ? x1 : x2;
    }

    int dist(int x, int y) {
        int z = lca(x, y);

        return dep[x] + dep[y] - 2 * dep[z];
    }
};

//使用
EulerLCA tree(n);

for (int i = 1; i < n; ++i) {
    int x, y;
    cin >> x >> y;

    tree.add(x, y);
}

tree.work(1);

int z = tree.lca(x, y);
int d = tree.dist(x, y);
```
