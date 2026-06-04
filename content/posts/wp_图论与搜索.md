---
title: wp_图论与搜索
date: 2025-12-06
tags:
    - 杂谈
    - 算法
    - Problems
    - 图论
math: true
---


## 图论与搜索

### DFS 深度优先搜索

**用途**：枚举、路径搜索、连通性。  
**常见坑**：注意回溯还原（如标记数组清零），加剪枝防超时。

#### [F. Parabola Independence 寻找最常路](https://codeforces.com/contest/2195/problem/F)

- **核心模型**:寻找最长路，数学几何性质
- **修正逻辑 (Patch)**:把图分为上下两部分，按照规则建立DAG，通过dfs（好久没写好生疏）找到上下对于这个点而言最长路径，夹一下出结果
- **难点**：数学几何性质
- **关键代码**:

```cpp
struct line
{
    int a, b, c;
};

bool canwalk(line a, line b)
{
    int chaa = a.a - b.a;
    int chab = a.b - b.b;
    int chac = a.c - b.c;
    if (a.a > b.a)
    {
        return chab * chab < 4 * chaa * chac;
    }
    else if (chaa == 0)
    {

        return chab == 0 && chac > 0;
    }
    else
    {
        return false;
    }
}

void solve()
{
    int n;
    cin >> n;
    vector<line> ls(n);
    vector<vi> mp(n);
    vector<vi> fmp(n);
    rep(i, 0, n - 1)
    {
        int aa, bb, cc;
        cin >> aa >> bb >> cc;
        ls[i].a = aa;
        ls[i].b = bb;
        ls[i].c = cc;
    }
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < n; j++)
        {
            if (canwalk(ls[i], ls[j]))
            {
                mp[i].push_back(j);
                fmp[j].push_back(i);
            }
        }
    }

    vi dpu(n, 0);
    vi dpd(n, 0);

    auto dpp = [&](auto self, int a) -> int
    {
        if (dpu[a] != 0)
            return dpu[a];
        int cnt = 0;
        for (int i = 0; i < mp[a].size(); i++)
        {
            cnt = max(cnt, self(self, mp[a][i]));
        }
        return dpu[a] = cnt + 1;
    };

    auto dpq = [&](auto self, int a) -> int
    {
        if (dpd[a] != 0)
            return dpd[a];
        int cnt = 0;
        for (int i = 0; i < fmp[a].size(); i++)
        {
            cnt = max(cnt, self(self, fmp[a][i]));
        }
        return dpd[a] = cnt + 1;
    };

    for (int i = 0; i < n; i++)
    {

        int ans = dpp(dpp, i) + dpq(dpq, i) - 1;
        cout << ans << ' ';
    }
    cout << '\n';
}

```

#### [流沙（dfs找子树）](https://acm.hdu.edu.cn/contest/problem?cid=1197&pid=1007)

- **核心模型**:，贪心，继承，dp
- **思维误区 (Bug)**:
- **修正逻辑 (Patch)**:
- **关键代码**:

```cpp
void solve()
{
    int n;
    cin >> n;
    vi nums(n + 1);
    for (int i = 1; i <= n; i++)
    {
        cin >> nums[i];
    }

    vector<vi> mp(n + 1);
    for (int i = 0; i < n - 1; i++)
    {
        int u, v;

        cin >> u >> v;
        mp[u].push_back(v);
        mp[v].push_back(u);
    }

    vi dp(n + 1, 0);
    vi sum(n + 1, 0);
    vi tr(n + 1, 1);
    vi ans(n + 1);
    auto dfs = [&](int a, int fa, auto self) -> void
    {
        sum[a] = nums[a];
        
        int pans = INF;
        bool lv = 1;
        for (auto it : mp[a])
        {
            if (it == fa)
            {
                continue;
            }
            lv = 0;
            self(it, a, self);

            sum[a] += sum[it];
            tr[a] += tr[it];
            pans = min(pans, ans[it]);
        }
        if (lv)
            ans[a] = nums[a];
        else
            ans[a] = min(pans, sum[a] / tr[a]);
    };

    dfs(1, -1, dfs);
    for (int i = 1; i <= n; i++)
    {
        cout << ans[i] << ' ';
    }
    cout << '\n';
}

```

---

#### [分治->Generate01String](https://codeforces.com/group/A5KcfGn880/contest/679438/attachments/download/31637/9thHBCPC.pdf)

- **核心模型**:括号匹配，单调性分治递归搜索树
- **思维误区 (Bug)**:第一时间没有观察到其树状递归单调性
- **修正逻辑 (Patch)**:注意递归顺序最大的出发点把-1和n看作一个虚空大括号，每加上一个小括号子树进去就要加一次
- **关键代码**:

```cpp
void solve()
{
    string s;
    cin >> s;

    if (2 * count(all(s), '0') != s.size())
    {
        cout << -1 << '\n';
        return;
    }

    vector<pii> stk;
    vector<pii> bt;
    cout << count(all(s), '0') << '\n';
    for (int i = 0; i < s.size(); i++)
    {
        if (stk.empty() || s[i] == stk.back().first)
        {
            stk.push_back({s[i], i});
        }
        else
        {
            bt.push_back({stk.back().second, i});
            stk.pop_back();
        }
    }
    sort(all(bt), [](pii a, pii b)
         {
      if(a.first!=b.first)  return a.first<b.first;
      else a.second>b.second; });
    int tp = 0;
    int pos = 1;
    vector<pii> ans;
    auto dfs = [&](auto &&self, int L, int R) -> void
    {
        if (L >= R)
            return;

        if (L != -1)
        {
            if (s[L] == '0')
                ans.push_back({pos, 1});
            else
                ans.push_back({pos, 2});
        }
        while (tp < bt.size() && bt[tp].second < R)
        {
            int a = bt[tp].first;
            int b = bt[tp].second;
            tp++;
            self(self, a, b);
            pos++;
        }
    };
    dfs(dfs, -1, s.size());

    for (auto [a, b] : ans)
    {
        cout << a << ' ' << b << "\n";
    }
}
```

---

#### 小猫爬山

```cpp
int n, w, ans = 20;
vector<int> lcs(20);
void dfs(int stepnum, int lcnum, const vector<int> &cats) {
    if (lcnum >= ans) return;
    if (stepnum == n) {
        ans = lcnum;
        return;
    }
    for (int j = 1; j <= lcnum; j++)
        if (lcs[j] + cats[stepnum] <= w) {
            lcs[j] += cats[stepnum];
            dfs(stepnum + 1, lcnum, cats);
            lcs[j] -= cats[stepnum];
        }
    lcs[lcnum + 1] = cats[stepnum];
    dfs(stepnum + 1, lcnum + 1, cats);
    lcs[lcnum + 1] = 0;
}
void solve() {
    cin >> n >> w;
    vector<int> cats(n + 1);
    for (int i = 0; i < n; i++) cin >> cats[i];
    sort(cats.rbegin(), cats.rend());
    dfs(0, 1, cats);
    cout << ans << '\n';
}
```

**复杂度**：O(2^n) 最坏，剪枝后更优。

#### [E2. Interactive Graph (Hard Version)](https://codeforces.com/contest/2197/problem/E2)

- **核心模型**: 字典序 + 计数：核心的跳跃量 c[u] 本质是在字典序排列里做区间跳跃，跟数位DP的思想非常像
- **思维误区 (Bug)**:
- **修正逻辑 (Patch)**:
- **关键代码**:

```cpp
void solve()
{
    int n;
    cin >> n;
    vector<vi> ans(n + 1);
   

    auto qry = [&](int q) -> vi
    {
       
        cout << "? " << q << endl;
        int k;
        cin >> k;
        if (k == -1)
            exit(0); 
        if (k == 0) { return {}; }
        vi res(k);     
        rep(i, 0, k - 1) cin >> res[i];
        
        return res;
    };
    int kq = 1;
    vi dp(n + 1, 0);
    vector<int> stk;

    auto dfs = [&](int pt, auto self) -> void
    {
        while (1)
        {
            vi rsp = qry(kq);
            bool out = rsp.size() <= stk.size();
            if (out)
                break;
            for (int i = 0; i < stk.size(); i++)
            {
                if (rsp[i] != stk[i]) · 11
                {
                    out = 1;
                    break;
                }
            }
            
            // int v = rsp.back();
            int v = rsp[stk.size()];

            ans[pt].push_back(v);
            if (dp[v] != 0)
            { // c[v] 已知
                dp[pt] += dp[v];
                kq += dp[v];
            }
            else
            { // c[v] 未知，进去探索
                dp[v] = 1;
                kq++;
                stk.push_back(v);
                self(v, self);
                stk.pop_back();
                dp[pt] += dp[v];
            }
        }
    };

    for (int i = 1; i <= n; i++)
    {
        if (dp[i] != 0)
        {
            kq += dp[i];
            continue;
        }
        dp[i] = 1;
        kq++;
        stk.push_back(i);
        dfs(i, dfs);
        stk.pop_back();
    }
    int m = 0;
    for (int i = 1; i <= n; i++)
        m += ans[i].size();
    cout << "! " << m << endl;
    for (int i = 1; i <= n; i++)
    {
        for (auto v : ans[i])
        {
            cout << i << ' ' << v << endl;
        }
    }
}
```

#### [静海拾光](https://acm.hdu.edu.cn/contest/problem?cid=1198&pid=1010)

- **核心模型**:跟E2几乎一样的东西，注意到字典序构成的树dfs即可

- **关键代码**:

```cpp
void solve()
{
    int n, k;
    cin >> n >> k;

    vi ans;

    auto dfs = [&](int now, auto self) -> void
    {
        if (now <= 0 || k <= 0)
            return;
        if (!ans.empty())
        {
            k--;
            if (k <= 0)
                return;
        }
        for (int i = 1; i <= now; i++)
        {
            if (now - i > 61)
            {
                ans.push_back(i);
                self(now - i, self);
                return;
            }
            else
            {
                int sz = 1ll << (now - i);
                if (k <= sz)
                {
                    ans.push_back(i);
                    self(now - i, self);
                    return;
                }
                else
                {
                    k -= sz;
                }
            }
        }
    };

    dfs(n, dfs);
    for (auto it : ans)
    {
        cout << it << ' ';
    }
    cout << '\n';
}

```

---
---

### 树上问题

#### [D2.Tree coloring树上染色](https://codeforces.com/contest/2183/problem/D2)

- **核心模型**:树上染色
- **做法**:事实上这就是一道大模拟。题目要求不是父子关系（好求），不是同一层。我们就直接把每一次的染色都分层不同的颜色。
- **错误点**:容易想贪心:我想要在同一层里，每个同学都有自己**“绝对不能碰的禁忌色（亲爹色）”**。
纯贪心的逻辑是：“轮到我了，桌子上只要有我能用的，我挑个最小的拿走，不管别人死活。”
这就必然会导致一个惨案：前面的人为了图省事，顺手拿走了一个极其普通的颜色，结果把后面的人逼上了绝路，导致原本够用的蜡笔，硬生生不够用了！
- **关键代码**:

```cpp
void solve()
{
    int n;
    cin >> n;
    vector<vi> mp(n + 1);
    for (int i = 0; i < n - 1; i++)
    {
        int u, v;
        cin >> u >> v;
        mp[u].push_back(v);
        mp[v].push_back(u);
    }

    vector<vi> ceng(n + 1);
    vi baba(n + 1);
    auto dfs = [&](int now, int fa, int step, auto self) -> void
    {
        baba[now] = fa;
        ceng[step].push_back(now);
        for (auto it : mp[now])
        {
            if (it == fa)
                continue;
            self(it, now, step + 1, self);
        }
    };
    dfs(1, 0, 0, dfs);
    vi color(n + 1);
    color[1] = 1;
    int sum = 1;
    for (int i = 0; i <= n; i++)
    {
        set<int> now;
        for (int k = 1; k <= min(sum, (int)ceng[i].size() + 1); k++)
        {
            now.emplace(k);
        }
        int bt1 = -1, bt2 = -1;
        for (auto it : ceng[i])
        {
            int fac = color[baba[it]];
            auto tp = now.begin();
            if (tp != now.end() && *tp == fac)
            {
                tp++;
            }
            if (tp != now.end())
            {
                color[it] = *tp;
                now.erase(tp);
            }
            else
            {
                bool add = 0;
                if (!now.empty())
                {
                    if (bt1 != -1 && baba[bt1] != baba[it])
                    {
                        add = 1;
                        color[it] = color[bt1];
                        color[bt1] = fac;
                    }
                    if (bt2 != -1 && baba[bt2] != baba[it] && !add)
                    {
                        add = 1;
                        color[it] = color[bt2];
                        color[bt2] = fac;
                    }
                }
                if (!add)
                {
                    sum++;
                    color[it] = sum;
                }
                else
                {
                    now.clear();
                }
            }
            if (bt1 == -1)
            {
                bt1 = it;
            }
            if (bt2 == -1 && baba[it] != baba[bt1])
            {
                bt2 = it;
            }
        }
    }
    cout << sum << '\n';
    vector<vi> op(sum + 1);
    for (int i = 1; i <= n; i++)
    {
        op[color[i]].push_back(i);
    }
    for (int i = 1; i <= sum; i++)
    {
        cout << op[i].size() << ' ';
        for (auto it : op[i])
        {
            cout << it << ' ';
        }
        cout << '\n';
    }
}

```

#### [流沙树上dp](https://acm.hdu.edu.cn/contest/problem?cid=1197&pid=1007)

- **核心模型**:树上dp（涉及图论概念：子树:包含自己还有自己的所有儿子）。树上贪心 （赛时一发过只是放在这参考一下树上的遍历
- **关键代码**:

```cpp
void solve()
{
 int n;
 cin >> n;
 vi a(n + 1);
 for (int i = 1; i <= n; i++)
 {
  cin >> a[i];
 }
 vector<vi> mp(n + 1);
 for (int i = 0; i < n - 1; i++)
 {
  int u, v;
  cin >> u >> v;
  mp[u].push_back(v);
  mp[v].push_back(u);
 }

 vi ans(n + 1);
 vi sz(n + 1, -(1e9));
 auto dfs = [&](int now, int fa, auto self) -> int
 {
  bool is_leaf = 1;
  int sum = a[now];
  int siz = 1;
  int pans = (1e18);
  for (auto it : mp[now])
  {
   if (it == fa)
   {
    continue;
   }
   is_leaf = 0;
   sum += self(it, now, self);
   siz += sz[it];
   pans = min(pans, ans[it]);
  }

  if (is_leaf)
  {
   sz[now] = 1;
   ans[now] = a[now];
   return a[now];
  }
  else
  {
   sz[now] = siz;
   ans[now] = min(pans, sum / siz);
   return sum;
  }
 };
 dfs(1, -1, dfs);
 for (int i = 1; i <= n; i++)
 {
  cout << ans[i] << ' ';
 }
 cout << '\n';
}
```

#### [国士知遇豫让心树上dp](https://www.matiji.net/exam/brushquestion/47/4777/C98C14523F069FECB0DEED64F00CEAB0)

- **核心模型**:给定一棵树，每个节点可以赋予一个（或者）。问你有多少种赋值方案，使得赋值完毕后从根节点到达每一个叶子节点的唯一简单路径所经过的点构成的括号串是一个合法括号串
- **修正逻辑**: 注意到合法括号串的trick：把左括号变成-1，右括号变成1，最后相加等于0.那么我们定义`dp[i][j]`为在点i的前缀和为j的方案数，考虑转移。**难点：**$$dp[u][j] = \prod_{v \in son(u)} dp[v][j]$$ 用乘法的原因是：你必须同时满足：$v_1$ 子树往下所有的叶子路径必须合法（假设满足状态 $S$ 的有 $X$ 种填法）并且 $v_2$ 子树往下所有的叶子路径必须合法（假设满足状态 $S$ 的有 $Y$ 种填法），
- 既然这两件事必须同时发生且互不干扰，那么在状态 $S$ 下，$u$ 节点往下生长的总合法方案数自然就是 $X \times Y$。
- **关键代码**:

```cpp

constexpr int MOD = 998244353;
void solve()
{
    int n;
    cin >> n;
    vector<vi> mp(n + 1);
    for (int i = 0; i < n - 1; i++)
    {
        int u, v;
        cin >> u >> v;
        mp[u].emplace_back(v);
        mp[v].emplace_back(u);
    }

    vector<vi> dp(n + 1, vi(n + 1));

    auto dfs = [&](int fa, int now, auto &&self) -> void
    {
        bool is_leave = 1;
        for (auto v : mp[now])
        {
            if (v == fa)
                continue;
            is_leave = 0;
            self(now, v, self);
        }

        if (is_leave)
        {
            dp[now][1] = 1;
            return;
        }

        for (int i = 0; i <= n; i++)
        {
            int now_add1 = 0;
            int now_addf1 = 0;
            if (i)
            {
                now_add1 = 1;
                for (auto v : mp[now])
                {
                    if (v == fa)
                        continue;
                    now_add1 *= dp[v][i - 1];
                    now_add1 %= MOD;
                }
            }
            if (i + 1 <= n)
            {
                now_addf1 = 1;
                for (auto v : mp[now])
                {
                    if (v == fa)
                        continue;
                    now_addf1 *= dp[v][i + 1];
                    now_addf1 %= MOD;
                }
            }

            dp[now][i] = (now_addf1 + now_add1) % MOD;
        }
        return;
    };

    dfs(0, 1, dfs);
    cout << dp[1][0] << '\n';
}

```

#### [K. 星云桥 III（图上dfs）](https://hydro.ac/d/XJUCPC/p/5?tid=6a15a69ac1224fa17414cc50)

- **核心模型**:给定一张 n 个点 m 条边的无重边无自环的连通无向图。这张图的所有简单环是否都满足其大小恰好等于5。若这张图没有简单环，也视为满足条件。
- **解法**:把这题转化成在一颗树上找环，假如环的大小不等于5就错。wtf->树的深度。树上边差分来统计每条树边被“非树边（返祖边）”覆盖的次数。这也是在不写 Tarjan 算法的情况下，离线寻找桥（割边）或判定仙人掌图（Cactus Graph）的经典解法。**一个图跑完树上边差分，发现所有的树边 cnt <= 1（每条边最多被一个非树边覆盖，即最多在一个环里），并且非树边本身也没有重边，那么你就可以在赛场上果断判定：这是一个仙人掌图**。有环套环直接判否就好
- **关键代码**:

```cpp
void solve()
{
    int n, m;
    cin >> n >> m;

    vector<vi> mp(n + 1);
    for (int i = 0; i < m; i++)
    {
        int u, v;
        cin >> u >> v;
        mp[u].emplace_back(v);
        mp[v].emplace_back(u);
    }
    vi cf(n + 1);
    vi vis2(n + 1);
    bool no = 0;
    vi wtf(n + 1);
    auto dfs2 = [&](int x, auto &&self, int fa) -> void
    {
        vis2[x] = 1;
        for (auto y : mp[x])
        {
            if (y == fa)
            {
                continue;
            }
            if (vis2[y] == 0)
            {
                wtf[y] = wtf[x] + 1;
                self(y, self, x);
                // 回溯时累加子树的差分值
                cf[x] += cf[y];
            }
            else if (vis2[y] == 1)
            {
                if ((wtf[x] - wtf[y] + 1) != 5)
                {
                    no = 1;
                }
                cf[x]++;
                cf[y]--;
            }
        }
        vis2[x] = 2;
        if (cf[x] > 1)
        {
            no = 1;
        }
    };

    wtf[1] = 1;
    dfs2(1, dfs2, 0);
    if (no)
        cout << "NO" << '\n';
    else
    {
        cout << "YES" << '\n';
    }
}
```

---

---

### BFS

#### P1434 [SHOI2002] 滑雪

- **链接**: [题目链接](https://www.luogu.com.cn/problem/P14348)
- **算法类型**: 拓扑dp
- **此为标准代码请认真研读**
- **AC 代码**:

```cpp
vi dr = {1, 0, -1, 0};
vi dc = {0, 1, 0, -1};
void solve()
{
    vvi height(101, vi(110));
    vvi indigree(101, vi(110,0));
    int c, r;
    cin >> r >> c;
    for (int i = 1; i <= r; i++) // 我还是喜欢1 based存图
    {
        for (int j = 1; j <= c; j++)
        {
            cin >> height[i][j];
        }
    }
    for (int i = 1; i <= r; i++)
    {
        for (int j = 1; j <= c; j++)
        {
            for (int k = 0; k < 4; k++)
            {
                if (i + dr[k] <= 0 || i + dr[k] > r || j + dc[k] <= 0 || j + dc[k] > c)
                    continue;
                if (height[i + dr[k]][j + dc[k]] < height[i][j])
                {
                    indigree[i][j]++;
                }
            }
        }
    }
    int ans=0;
    vvi dp(101,vi(101,1));
    queue<pair<int, int>> pos;
    for (int i = 1; i <= r; i++)
        for (int j = 1; j <= c; j++)
            if (indigree[i][j] == 0)
                pos.emplace(i, j);
    while (!pos.empty())
    {
        auto [x, y] = pos.front();
        pos.pop();
        for (int k = 0; k < 4; k++)
        {
            if (x + dr[k] <= 0 || x + dr[k] > r || y + dc[k] <= 0 || y + dc[k] > c)
                continue;
            if (height[x + dr[k]][y + dc[k]] > height[x][y])
            {
                dp[x + dr[k]][y + dc[k]]=max(dp[x][y]+1,dp[x + dr[k]][y + dc[k]]);
                ans=max(ans,dp[x + dr[k]][y + dc[k]]);
                indigree[x + dr[k]][y + dc[k]]--;
                if(indigree[x + dr[k]][y + dc[k]]==0)
                pos.emplace(x + dr[k],y + dc[k]);
            }
        }
    }
    if(!ans)cout<<"1";
    else cout<<ans;
}

```

- **思路**:
  - 1. 建图（这里用反图更方便）
  - 2.\ 计算入度
  - 3.\ 入度为0的点入队
  - 4.\BFS：
  - 5.\ 答案 = max(dp[])

``` cpp
//BFS
   while (!q.empty()) {
       u = 出队
       for each v that u → v (原图：u 可以到达 v)
           dp[v] = max(dp[v], dp[u] + 1)
           inDegree[v]--
           if (inDegree[v] == 0) 入队
   }
```

#### BFS例题：P1443 马的遍历

- **题号**: P1443
- **链接**: [题目链接]<https://www.luogu.com.cn/problem/P1443>
- **算法类型**: BFS
- **AC 代码**:

```cpp

nn[x][y]=0;
    queue<pair<int, int>> bfs; // 建立一个以点坐标为项目的队列
    bfs.emplace(x, y);
    while (!bfs.empty())
    {
        auto [h, w] = bfs.front();
        bfs.pop();
        for (int i = 0; i < 8; i++)
        {
            int hsh = h + dx[i];
            int ljl = w + dy[i];
            if (hsh < 1 || hsh > n || ljl < 1 || ljl > m || !nn[hsh][ljl])
                continue;
            nn[hsh][ljl] = 0;
            mp[hsh][ljl] = mp[h][w] + 1;
            bfs.emplace(hsh, ljl);
        }
    }

```

- **注意事项**:
  - 记得BFS不要漏了`bool visit`数组
  - 记得BFS状态转移（？）方程`mp[hsh][ljl] = mp[h][w] + 1;`
  - 最短路问题 不是“另一种算法”，它就是 DP 在无权图上的高效实现
- **改进思路**:
  - 考虑严格 cnt == k 的情况，调整 check 函数。

#### P1825 [USACO11OPEN] Corn Maze S

- **题号**: P1825
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P5678)
- **算法类型**: BFS
- **记录原因**:
  - AC了，终点看引参数进数组！不要天天被神秘UB卡住脑子
  - 这道题无非是标准BFS上面加了个规则函数：这道题放这里就是教你如何写有规则的搜索
- **AC 代码**:

```cpp
void goincsm(const vector<vector<int>> &mp, int &xx, int &yy)
{
    rep(i, 1, n)
    {
        rep(j, 1, m)
        {
            if (mp[i][j] == mp[xx][yy] && (i != xx || j != yy))
            {
                xx = i;
                yy = j;
                return;
            }
        }
    }
}
```

- **注意事项**:
  - 取地址代表可更改`int &xx`：适用于那些总是要更改的量
  - `const vector<vector<int>> &mp`既安全又高校的传图方式

#### P2895 [USACO08FEB] Meteor Shower S

- **题号**: P2895
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P2895)
- **算法类型**: BFS
- **错误原因**:
  - 边界检查边界检查边界检查
  - 时间更新逻辑
  - vis数组限制逻辑（依旧时间更新逻辑）
- **AC 代码**:

```cpp
vi dx = {-1, 0, 1, 0};
vi dy = {0, 1, 0, -1};

struct flashlight
{
    int xi, yi, ti;
};

void solve()
{
    int m;
    cin >> m;
    vector<vector<bool>> vis(305, vector<bool>(305, 1));
    vector<vector<bool>> hited(305, vector<bool>(305, 1));
    vector<vector<int>> mp(305, vector<int>(305, INF));
    vector<flashlight> bar(m);
    vector<flashlight> safe;
    rep(i, 0, m - 1)
    {
        cin >> bar[i].xi >> bar[i].yi >> bar[i].ti;
        hited[bar[i].xi][bar[i].yi] = 0;
        rep(j, 0, 3)
        {
            int xd = bar[i].xi + dx[j];
            int yd = bar[i].yi + dy[j];
            if (xd < 0 || xd > 302 || yd < 0 || yd > 302)
                continue;
            hited[xd][yd] = 0;
        }
    }
    sort(bar.begin(), bar.end(), [](flashlight a, flashlight b)
         { return a.ti < b.ti; });
    rep(i, 0, 304)
    {
        rep(j, 0, 304)
        {
            if (hited[i][j] == 1 )
                safe.push_back({i, j, 0});
        }
    }

    queue<pii> pos;
    pos.emplace(0, 0);
    vis[0][0] = 0;
    int time = 0;
    while (!pos.empty())
    {
        int sz = SZ(pos); // 当前层有多少个点
        auto it = find_if(all(bar), [time](const flashlight &a)
                          { return a.ti == time+1; });
        while (it != bar.end())
        {
            int xo = it->xi;
            int yo = it->yi;
            vis[xo][yo] = 0;
            rep(i, 0, 3)
            {
                int xoo = xo + dx[i];
                int yoo = yo + dy[i];

                if (xoo < 0 || xoo > 302 || yoo < 0 || yoo > 302 || vis[xoo][yoo] == 0)
                    continue;
                vis[xoo][yoo] = 0;
            }
            it = std::find_if(++it, bar.end(),
                              [time](const flashlight &a)
                              { return a.ti == time+1; });
        }
        rep(layer, 0, sz - 1)
        {
            auto [x, y] = pos.front();
            pos.pop();

            rep(i, 0, 3)
            {
                int xx = x + dx[i];
                int yy = y + dy[i];
                if (xx < 0 || xx > 302 || yy < 0 || yy > 302 || vis[xx][yy] == 0)
                    continue;

                vis[xx][yy] = 0;
                mp[xx][yy] = time + 1;
                pos.emplace(xx, yy);
            }
        }
        time++;
    }
    int ans = INF;
    rep(i, 0, SZ(safe) - 1)
    {
        ans = min(ans, mp[safe[i].xi][safe[i].yi]);
    }
    if (ans == INF)
    {
        cout << "-1";
        return;
    }

    cout << ans;
}

```

- **注意事项**:
  - 注意：这道题没有规定地图大小，对于流星影响（限制点）最大可到301*301.所以我们的搜索应该开到303（最保险），包括continue地搜索限制
  - 注意time更新逻辑：lily只能在ti之前到达这个点，所以对于每个影响的点需要参考的是time+1；
  - 注意bfs每层地更新逻辑：每次入队都是time（i）时间点可到地所有点
- **结构体lambda搜索技巧**:

```cpp
  根据ti寻找bar中所需要地项，返回迭代器
  auto it = find_if(all(bar), [time](const flashlight &a)
                          { return a.ti == time+1; });
  直接从迭代器里面提取出来我们要的：->
  int xo = it->xi;
  int yo = it->yi;
  如果符合条件的项目存在
  while (it != bar.end())
  寻找下一个迭代器
  it = std::find_if(++it, bar.end(),
                              [time](const flashlight &a)
                              { return a.ti == time+1; });
```

---

#### P1162 填涂颜色 提供深搜广搜两种做法

- **题号**: P1162
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P1168)
- **算法类型**: 搜索板子
- **错误原因**:
  - 注意从四周寻找‘0’切入
- **AC 代码**广搜版:

```cpp
 vector<vector<int>> mp(35, vi(35));
    vector<vector<bool>> vis(35, vector<bool>(35, 1));
    for (int i = 1; i <= n; i++)
    {
        for (int j = 1; j <= n; j++)
        {
            cin >> mp[i][j];
        }
    }
    queue<pair<int, int>> bfs;
    //bfs.emplace(1, 1);
    for (int i = 1; i <= n; i++)
    {
        if (mp[1][i]==0) bfs.emplace(1, i);
        if (mp[i][1]==0) bfs.emplace(i, 1);
        if (mp[n][i]==0) bfs.emplace(n, i);
        if (mp[i][n]==0) bfs.emplace(i, n);
    }
    while (!bfs.empty())
    {
        auto [lg, cf] = bfs.front();
        bfs.pop();
        for (int i = 0; i < 4; i++)
        {
            int xlg = lg + dx[i];
            int xcf = cf + dy[i];
            if (xlg < 1 || xlg > n || xcf < 1 || xcf > n || !vis[xlg][xcf] || mp[xlg][xcf] == 1)
            {
                continue;
            }
            vis[xlg][xcf] = 0;
            mp[xlg][xcf] = -1;
            bfs.emplace(xlg, xcf);
        }
    }
```

- **AC 代码**深搜版:

```cpp
void dfs(int a, int b, vector<vector<int>> &mp)
{
    if (mp[a][b] != 0)
        return;
    if (mp[a][b] == 0)
        mp[a][b] = -1;
    for (int i = 0; i < 4; i++)
    {
        int xlg = a + dx[i];
        int xcf = b + dy[i];
       //dbg(xlg,xcf);
        if (xlg < 1 || xlg > n || xcf < 1 || xcf > n)
            continue;
        dfs(a + dx[i], b + dy[i], mp);
    }
    return;
}
//solve里面的
for (int i = 1; i <= n; i++)
    {
           dbg(i);
        dfs(i, 1, mp);
        dfs(1, i, mp);
        dfs(n, i, mp);
        dfs(i, n, mp);
    }
```

- **注意事项**:
  - 注意从四周引入点
  - 注意入队时机
- **改进思路**:
  - 学习两种搜索方式

---

### 无向图分组

**用途**：求连通分量数。  
**常见坑**：双向边需存两次，初始化标记数组。

```cpp
vector<vector<int>> a(2e5 + 10);
vector<int> kk(2e5 + 10);
void dfs(int k) {
    for (int i = 0; i < a[k].size(); i++)
        if (kk[a[k][i]] == 0) {
            kk[a[k][i]] = 1;
            dfs(a[k][i]);
        }
}
void solve() {
    int n, m, ans = 0;
    cin >> n >> m;
    for (int i = 0; i < m; i++) {
        int p, q;
        cin >> p >> q;
        a[p].push_back(q);
        a[q].push_back(p);
    }
    for (int j = 1; j <= n; j++)
        if (kk[j] == 0) {
            kk[j] = 1;
            dfs(j);
            ans++;
        }
    cout << ans << '\n';
}
```

**复杂度**：O(n+m)，空间 O(n+m)。

### 图论：常见做法：反向建边

#### P4017 最大食物链计数（拓扑排序）

- **题目概述** 给出一张有向无环图，求出最长路径的数量（最长路径定义：入度为0的点到初读为0的点），n是节点数量，m是路径数量
- **数据范围**:n:2e3,m:1e5
- **初始思路** ；记忆化加DFS
- **正解思路**：DFS+DP
- **AC代码**

```cpp
int mod = 80112002;
int n, m;
vi mem(5005, -1);
int dfs(int u, const vector<vi> &dw,const vi&in,const vi&out)
{
    if (mem[u] != -1)
    {
        return mem[u];
    }
    if (in[u] == 0)
    {
        mem[u] = 1;
        return 1;
    }
    mem[u]=0;
    for (int v : dw[u])
    {
       // mem[u] = max(mem[u], dfs(v, dw,in,out) % mod + 1);
       mem[u]=(dfs(v,dw,in,out)+mem[u])%mod;
    }
    return mem[u];
}

void solve()
{
    vector<vi> dw(5005);
    cin >> n >> m;
    vi out(n + 1);
    vi in(n + 1);
    rep(i, 0, m - 1)
    {
        int d, f;
        cin >> d >> f;
        dw[f].push_back(d);
        out[d]++;//需要计算入度和出度是为了辨别什么时候开始什么时候结束
        in[f]++;
    }
    int ans = 0;
    for (int i = 1; i <= n; i++)
    {
        if (out[i] == 0)
            // ans=max(ans,dfs(i,dw)%mod);
            ans = (ans + dfs(i, dw,in,out)) % mod;
    }
    cout << ans << '\n';
}
```

- **AC代码**:拓扑排序

```cpp
void solve()
{
    vector<vi> dw(5005);
    cin >> n >> m;
    vi out(n + 1);
    vi in(n + 1);
    rep(i, 0, m - 1)
    {
        int d, f;
        cin >> d >> f;
        dw[f].push_back(d);
        out[f]++;
        in[d]++;
    }
    int ans = 0;
    queue<int> dl;
     vi lx(n + 1,0);
    for (int i = 1; i <= n; i++)
    {
        if (in[i] == 0)
        {
            dl.emplace(i);
            lx[i]=1;
        }
    }
   
    while (!dl.empty())
    {
        auto hsh = dl.front();
        dl.pop();

        for (auto hsh2 : dw[hsh])
        {
            lx[hsh2]=(lx[hsh2]+lx[hsh])%mod;
            in[hsh2]--;
            if(in[hsh2]==0)
            {
                dl.emplace(hsh2);
            }
        }
    }
    for(int i=1;i<=n;i++)
    {
        if(!out[i])
        {
            ans=(ans+lx[i])%mod;
        }
    }
    cout << ans << '\n';
}
```

- 拓扑排序的目标是将所有节点排序，使得排在前面的节点不能依赖于排在后面的节点。
- 作用：
  - 确定任务执行顺序
  - DAG 上的动态规划
  - 检测环路:如果拓扑排序无法将所有节点都加入到最终的序列中（
  - **“顺序”、“依赖”、“先决条件”，或者需要在一个有向图中进行基于依赖的计算（如 DP）时

### 差分约束

#### [倍杀测量者](https://www.luogu.com.cn/problem/P4926)

- **核心模型**:
- **思维误区 (Bug)**:
- **修正逻辑 (Patch)**:建立D[0]为基础点，逻辑是当维护| `x[v] == x[u] + w` | `u -> v, w` 和 `v -> u, -w`就这样加进来两条边。超级源点只是保证每个点至少入队一次
- **关键代码**:

```cpp

struct info
{
    int op, a, b, k;
};

void solve()
{
    int n, s, t;
    cin >> n >> s >> t;
    vector<info> flags;
    rep(i, 0, s - 1)
    {
        int op, a, b, k;
        cin >> op >> a >> b >> k;
        flags.push_back({op, a, b, k});
    }
    vector<pii> fen;
    rep(i, 0, t - 1)
    {
        int c, x;
        cin >> c >> x;
        fen.emplace_back(c, x);
    }

    auto check = [&](double x) -> bool
    {
        vector<vector<pii>> mp(n + 1);
        for (auto [c, x] : fen)
        {
            mp[0].push_back({c, log(x)});
            mp[c].push_back({0, -log(x)});
        }
        rep(i, 0, s - 1)
        {

            if (flags[i].op == 1)
            {
                if (flags[i].k - x <= 0)
                    continue;
                mp[flags[i].b].push_back({flags[i].a, log(flags[i].k - x)});
            }
            else
            {

                mp[flags[i].b].push_back({flags[i].a, -1 * log(flags[i].k + x)});
            }
        }

        vector<double> d(n + 1, 0);
        vi cnt(n + 1, 0);
        vi inq(n + 1);
        queue<int> q;
        rep(i, 0, n)
        {
            q.emplace(i);
            inq[i] = 1;
        }
        // d[0] = 0;
        // q.emplace(0);
        // inq[0] = 1;
        while (!q.empty())
        {
            int u = q.front();
            q.pop();
            inq[u] = 0;
            for (auto [v, w] : mp[u])
            {
                if (d[v] < d[u] + w - EPS)
                {
                    d[v] = d[u] + w;
                    cnt[v]++;
                    if (cnt[v] >= n)
                    {
                        return 0;
                    }
                    if (!inq[v])
                    {
                        q.emplace(v);
                        inq[v] = 1;
                    }
                }
            }
        }
        return 1;
    };

    double l = 0, r = 1e9;

    for (int i = 1; i <= 100; i++)
    {
        double mid = (l + r) / 2;

        if (check(mid))
            r = mid;
        else
            l = mid;
    }

    if (!dcmp(l))
    {
        cout << -1 << '\n';
    }
    else
    {
        cout << fixed << setprecision(10) << l << '\n';
    }
}

```

---

### 图论：dijkstra

#### 简单 Dijkstra 模板题

 P4779 【模板】单源最短路径（标准版）

- **题号**: P4799
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P4799)
- **算法类型**: 图论模板
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
  - Dijkstra算法只能处理非负权路径问题
  - 为什么不用队列？：贪心最快，如果是菊花图复杂度会退化到nm
  - 含负权路用什么算法？用队列
- **思路**:
  - 认真研读并学习114514次

#### 水群

- **题号**: D
- **链接**: [题目链接](https://ac.nowcoder.com/acm/contest/121614/D)
- **算法类型**: Disjkstr最短路
- **错误原因**:
  - 看成DP了！！有向无环有向无环有向无环！
  - 迪克算法还在追我
  - 最短路问题
- **AC 代码**:

```cpp
void solve()
{
    vector<vector<pair<ll, int>>> mp(n + 1);
    for (int i = n-1; i >= 1; i --)
    {
        mp[i].push_back({x, i +1});
        mp[i + 1].push_back({x, i});
    }
    rep(i, 0, m - 1)
    {
        int a, b;
        cin >> a >> b;
        mp[a].push_back({y, b});
     //   mp[b].push_back({y, a});
    }
【迪克算法】
    cout<<dist[1]<<'\n';
}
```

- **思路**:
  - 没什么好说的，迪克算法模板，我都懒得贴出代码，详情请见[简单 Dijkstra 模板题]<#p4779-模板单源最短路径标准版>

#### 代号N

- **题号**: E
- **链接**: [题目链接](https://ac.nowcoder.com/acm/contest/121614/E)
- **算法类型**: 带权无向图[相似题目学习](https://www.luogu.com.cn/problem/P2097)

> 精简题干: 定义一棵树:共n个节点:一个度数为3的节点,若干个度数为2的节点,3个度数为1的节点.给出n-1条边,给出两个端点以及边权,可以操作k次将某条边边权变成0.求根节点到叶节点的度数最大值的最小值.

- **AC 代码**:

```cpp
struct edge
{
    int to, w;
};
int cmp(const vi &sums)
{
    if(sums[0]>sums[1])
    {
        if(sums[0]>sums[2])
        {
            return 0;
        }
        else return 2;
    }
    else
    {
        if(sums[1]>sums[2])
        {
            return 1;
        }
        else return 2;
    }
}
void solve()
{
    int n, k;
    cin >> n >> k;
    vector<vector<edge>> mp(n + 1);
    vi nums(n + 1);
    for (int i = 0; i < n-1; i++)
    {
        int u, v, w;
        cin >> u >> v >> w;
        mp[u].push_back({v, w});
        mp[v].push_back({u, w});
        nums[u]++;
        nums[v]++;
    }
    auto it = find(all(nums), 3);
    int sdot = (it - nums.begin());
    vector<vector<int>> chain(3);
    vi sums(3);
    vector<priority_queue<int>> pq(3);                     // <--- 改动：为每条链维护大根堆
    for (int i = 0; i < 3; i++)
    {
        queue<pii> pos;
        pos.emplace(mp[sdot][i].to, sdot);
        chain[i].push_back(mp[sdot][i].w);
        sums[i] += mp[sdot][i].w;
        pq[i].push(mp[sdot][i].w);                         // <--- 改动：把边权加入堆
        while (!pos.empty())
        {
            auto [now, par] = pos.front();
            pos.pop();
  
            for (auto &nextdot : mp[now])
            {
                if (nextdot.to == par)
                    continue;
                else
                {
                    chain[i].push_back(nextdot.w);
                    sums[i] += nextdot.w;
                    pq[i].push(nextdot.w);             // <--- 改动：把遍历到的边权加入堆
                    pos.emplace(nextdot.to,now);
                }
            }
        }
    }
    while(k--)
    {
        int idx = cmp(sums);
        if (pq[idx].empty()) break;                    // 防止空链
        int mx = pq[idx].top(); 
        pq[idx].pop();         // O(log len)
        sums[idx] -= mx;
        // 下面的两行可以删掉，保留只为保持原结构
        // sums[cmp(sums)] -= *max_element(all(chain[cmp(sums)]));
        // chain[cmp(sums)].erase(max_element(all(chain[cmp(sums)])));
    }
    cout << sums[cmp(sums)];
}
```

- **思路剖析**:
  - 非常简单的大数据和的最大值的最小值.解法一:`sort`之后逐个`pop_back()`(注意vector的pop是最后一位,所以要从小到大排序).解法二:维护最大根堆`priority_queue<int>`,n次操作复杂度nlogn.
  - 事实上解法一是优解,但是为了学习这个有意思的容器这道题用的做法是最大根堆
  - 这道题的难点是读懂题...然后是建带权无向图...依旧模板.
  - **记得**带权无向图两个端点都pushback一次
  - 然后就是用bfs带着上一个节点和下一个节点广度优先探索(这个还能用dfs解法,下文附上,作为图论路径转移学习,请严肃学习114514次)

 > 大部分图论用BFS做,在面临剪枝需求/需要回溯/所有方案的时候用DFS做

- **细节注意**:
  - 二维拓展数组记得这样开`vector<vector<edge>> mp(n + 1);`不会爆空间
  - Cpp17不支持结构体取地址,就这么写`auto [now, par] = pos.front();`
  - 记得k次操作不一定用玩一定要提前出循环`if (pq[idx].empty()) break;`以免UB

- **新结构**
  - `priority_queue` : 自动维护堆的“插入+弹出最大/最小”工具，“贪心/最短路/Top-K/滑动窗口最大值” 都能靠它快速实现
  - 注意优先队列没办法删除除了堆顶以外的元素,所以**注意**`if (d > dist[u]) continue;`

#### [冲向黄金城](https://jiang.ly/download.php?type=attachments&id=1802&r=1)

- **解法**: 题目要求求出每个点是否可达->到达每个点的代价越小最后能够遍历到的点的数量越多->dijkstra-> 普通dij是靠距离作为key（代价）来排序，我们这里的代价一个是“到达的时间”一个是“距离”->哪种状态能给我未来留下最大的操作空间？->在这道题里，“未来的操作空间”是由剩下的车票数量决定的，所以“到达的车票序号”自然就成了至高无上的第一关键字
- **优化**： 这里为了快速找到下一次用到的车票和时间需要做一个RMQ问题来确定。我们用dij'均摊了m的复杂度就需要想办法优化k的复杂度了->静态的就用st表
- **关键代码**:

```cpp
struct STTable
{
    vector<vector<long long>> st;

    // 默认构造函数（必须有，不然外层没法开 vector）
    STTable() {}

    // 给入一个一维数组，直接建表
    void build(const vector<long long> &arr)
    {
        int n = arr.size();
        if (n == 0)
            return;

        // __lg(x) 是 C++ 自带的底层宏，直接求以 2 为底的对数，极快！
        int max_log = __lg(n) + 1;

        // 分配空间并初始化第一层
        st.assign(max_log, vector<long long>(n));
        for (int i = 0; i < n; i++)
        {
            st[0][i] = arr[i];
        }

        // 核心建表逻辑
        for (int j = 1; j < max_log; j++)
        {
            for (int i = 0; i + (1 << j) <= n; i++)
            {
                st[j][i] = max(st[j - 1][i], st[j - 1][i + (1 << (j - 1))]);
            }
        }
    }

    // 查询区间 [L, R] 的最大值
    long long query(int L, int R)
    {
        if (L > R)
            return -1; // 防御性编程
        int j = __lg(R - L + 1);
        return max(st[j][L], st[j][R - (1 << j) + 1]);
    }
};

struct info
{
    int tp;
    int c, l;
};

void solve()
{
    int n, m;
    cin >> n >> m;
    int k;
    cin >> k;
    vector<vector<info>> mp(n + 1);
    for (int i = 0; i < m; i++)
    {
        int u, v, c, l;
        cin >> u >> v >> c >> l;
        mp[u].push_back({v, c, l});
        mp[v].push_back({u, c, l});
    }
    map<int, int> fd;
    vector<info> piao(k + 1);
    vector<vi> oc(m + 1);
    vector<vi> oc2(m + 1);
    for (int i = 1; i <= k; i++)
    {
        int c, l;
        cin >> c >> l;
        piao[i] = {0,c, l};
        oc[c].push_back(i);
        fd[i] = c;
        oc2[c].push_back(l);
    }

    vector<STTable> st(m + 1);
    for (int i = 1; i <= m; i++)
    {
        if (!oc[i].empty())
        {
            st[i].build(oc2[i]);
        }
    }

    using strt = pair<pair<int, long long>, int>;
    priority_queue<strt, vector<strt>, greater<>> pq;
    vector<pii> dist(n + 1, {INF, INF});
    dist[1] = {0, 0};
    vector<bool> ans(n + 1);
    ans[1]=1;
    pii y = make_pair(0ll, 0ll);
    strt w = make_pair(y, 1);
    pq.emplace(w);
    while (!pq.empty())
    {
        auto [key, pt] = pq.top();
        pq.pop();
        int idx = key.first;
        int color = fd[key.first];
        int dis = key.second;
        if (idx > dist[pt].first || (idx == dist[pt].first && dis > dist[pt].second))
            continue;
        for (auto it : mp[pt])
        {
            if (dis + it.l <= piao[idx].l && color == it.c)
            {
                ans[it.tp] = 1;
                int nxt_idx = idx;
                ll nxt_dis = dis + it.l;
                if (make_pair(nxt_idx, nxt_dis) <= dist[it.tp])
                {
                    pii kkey = make_pair(nxt_idx, nxt_dis);
                    pq.emplace(make_pair(kkey, it.tp));
                    dist[it.tp] = kkey;
                }
            }

            auto ub = upper_bound(oc[it.c].begin(), oc[it.c].end(), idx);
            if (ub == oc[it.c].end())
                continue;

            int lo = distance(oc[it.c].begin(), ub);
            int hi = (int)oc[it.c].size() - 1;

            int search_start = lo;
            int ans_pos = -1;

            while (lo <= hi)
            {
                int mid = (lo + hi) / 2;

                if (st[it.c].query(search_start, mid) >= it.l)
                {
                    ans_pos = mid;
                    hi = mid - 1;
                }
                else
                {
                    lo = mid + 1;
                }
            }

            if (ans_pos != -1)
            {
                ans[it.tp] = 1;
                int nxt_idx = oc[it.c][ans_pos];
                ll nxt_dis = it.l;
                if (make_pair(nxt_idx, nxt_dis) < dist[it.tp])
                {
                    pii kkey = make_pair(nxt_idx, nxt_dis);
                    pq.emplace(make_pair(kkey, it.tp));
                    dist[it.tp] = kkey;
                }
            }
            // ==================================================
            // int lo = idx;
            // int hi = (int)oc[it.c].size();
            // while (lo < hi)
            // {
            //     int mid = (lo + hi) / 2;
            //     if (st[it.c].query(idx, mid) >= it.l)
            //     {
            //         hi = mid;
            //     }
            //     else
            //     {
            //         lo = mid + 1;
            //     }
            // }
            // if (lo < (int)oc[it.c].size())
            // {
            //     ans[it.tp] = 1;
            //     int nxt_idx = lo;
            //     ll nxt_dis = it.l;
            //     if (make_pair(nxt_idx, nxt_dis) <= dist[it.tp])
            //     {
            //         pii kkey = make_pair(nxt_idx, nxt_dis);
            //         pq.emplace(make_pair(kkey, it.tp));
            //         dist[it.tp] = kkey;
            //     }
            // }
        }
    }

    for (int i = 1; i <= n; i++)
    {
        if (ans[i])
        {
            cout << 1;
        }
        else
        {
            cout << 0;
        }
    }
    cout << '\n';
}

```

### floyd变体

#### [括号路径](https://acm.hdu.edu.cn/contest/problem?cid=1202&pid=1006)

- **核心模型**:看到数据范围和问法想到离线floyd，从floyd的初始化想，我门可以做一个类似区间dp的东西。考虑合法的括号子序列，松弛操作有两种，一种是往两边扩张，一种是和别的合法括号并排。dij是nmlogn的，数据范围支持我们一项一项转移。核心思路类似于floyd的第一维dp变形
- **关键代码**:

```cpp
struct kuo
{
    int d;
    int a, b;
    kuo(int d = 0, int a = 0, int b = 0) : d(d), a(a), b(b) {}
    bool operator>(const kuo &other) const
    {
        return d > other.d;
    }
};

void solve()
{
    int n, m;
    cin >> n >> m;
    vector<vector<pii>> mp(n + 1);
    vector<vector<pii>> mp2(n + 1);
    int q;
    cin >> q;
    for (int i = 0; i < m; i++)
    {
        int u, v;
        char c;
        cin >> u >> v >> c;
        if (c == '(')
        {
            mp[u].push_back({v, -1});
            mp[v].push_back({u, -1});
        }
        else
        {
            mp2[u].push_back({v, 1});
            mp2[v].push_back({u, 1});
        }
    }

    vector<vi> floyd(n + 1, vi(n + 1, INF));
    priority_queue<kuo, vector<kuo>, greater<>> pq;
    for (int i = 1; i <= n; ++i)
    {
        floyd[i][i] = 0;
        pq.push({0, i, i});
    }
    while (!pq.empty())
    {
        auto it = pq.top();
        pq.pop();
        int d = it.d;
        int a = it.a;
        int b = it.b;
        for (auto zuo : mp[a])
        {
            for (auto you : mp2[b])
            {
                if (floyd[zuo.first][you.first] > d + 2)
                {
                    floyd[zuo.first][you.first] = d + 2;
                    pq.emplace(kuo(d + 2, zuo.first, you.first));
                }
            }
        }

        for (int i = 1; i <= n; i++)
        {
            if (floyd[i][a] != INF)
            {
                if (floyd[i][b] > floyd[i][a] + d)
                {
                    floyd[i][b] = floyd[i][a] + d;
                    pq.emplace(kuo(floyd[i][b], i, b));
                }
            }
        }

        for (int i = 1; i <= n; i++)
        {
            if (floyd[b][i] != INF)
            {
                if (floyd[a][i] > floyd[b][i] + d)
                {
                    floyd[a][i] = floyd[b][i] + d;
                    pq.emplace(kuo(floyd[a][i], a, i));
                }
            }
        }
    }

    while (q--)
    {
        int l, r;
        cin >> l >> r;
        if (floyd[l][r] != INF)
        {
            cout << floyd[l][r] << '\n';
        }
        else
        {
            cout << -1 << '\n';
        }
    }
}

```

---

### 最小生成树

#### [MC0573潜入相府中](https://www.matiji.net/exam/brushquestion/60/4777/C98C14523F069FECB0DEED64F00CEAB0)

- **核心模型**:三分+kruskal
- **思维误区 (Bug)**: n,m,L ( 1≤n,m≤10^6  1≤L≤10^9 ) 如果每次都暴力sort跑克鲁斯卡尔，复杂度是 O(调用次数 * m log m)。爆了。我们家一个小小的优化跑三路归并
- **关键代码**:

```cpp
#include <bits/stdc++.h>
using namespace std;

using i64 = long long;
using i128 = __int128_t;

struct Edge {
    int u, v;
    i64 b;
};

struct DSU {
    vector<int> fa, sz;
    int n;

    DSU(int n = 0) { init(n); }

    void init(int n_) {
        n = n_;
        fa.resize(n + 1);
        sz.assign(n + 1, 1);
        iota(fa.begin(), fa.end(), 0);
    }

    int find(int x) {
        while (x != fa[x]) {
            fa[x] = fa[fa[x]];
            x = fa[x];
        }
        return x;
    }

    bool unite(int x, int y) {
        x = find(x);
        y = find(y);
        if (x == y) return false;
        if (sz[x] < sz[y]) swap(x, y);
        fa[y] = x;
        sz[x] += sz[y];
        return true;
    }
};

void print_i128(i128 x) {
    if (x < 0) {
        cout << '-';
        x = -x;
    }
    if (x >= 10) print_i128(x / 10);
    cout << char('0' + x % 10);
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    i64 L;
    cin >> n >> m >> L;

    vector<Edge> g[3]; // 0: k=-1, 1: k=0, 2: k=1
    g[0].reserve(m);
    g[1].reserve(m);
    g[2].reserve(m);

    for (int i = 0; i < m; ++i) {
        int u, v;
        i64 b, k;
        cin >> u >> v >> b >> k;
        int id = (k == -1 ? 0 : (k == 0 ? 1 : 2));
        g[id].push_back({u, v, b});
    }

    for (int t = 0; t < 3; ++t) {
        sort(g[t].begin(), g[t].end(), [](const Edge& a, const Edge& b) {
            if (a.b != b.b) return a.b > b.b;
            if (a.u != b.u) return a.u < b.u;
            return a.v < b.v;
        });
    }

    DSU dsu(n);

    auto check = [&](i64 x) -> i128 {
        dsu.init(n);
        int ptr[3] = {0, 0, 0};
        i128 ans = 0;
        int cnt = 0;

        while (cnt < n - 1) {
            int choose = -1;
            i128 best = -(i128)4e36;

            for (int t = 0; t < 3; ++t) {
                if (ptr[t] >= (int)g[t].size()) continue;
                i64 k = t - 1; // 0->-1, 1->0, 2->1
                i128 w = (i128)g[t][ptr[t]].b + (i128)k * x;
                if (choose == -1 || w > best) {
                    best = w;
                    choose = t;
                }
            }

            const Edge &e = g[choose][ptr[choose]++];
            if (dsu.unite(e.u, e.v)) {
                ans += best;
                ++cnt;
            }
        }
        return ans;
    };

    // 凸函数在整数区间上的最小值，可以三分
    i64 lo = 0, hi = L;
    while (hi - lo > 2) {
        i64 m1 = lo + (hi - lo) / 3;
        i64 m2 = hi - (hi - lo) / 3;
        if (check(m1) < check(m2)) hi = m2;
        else lo = m1;
    }

    i64 best_x = lo;
    for (i64 x = lo + 1; x <= hi; ++x) {
        if (check(x) < check(best_x)) best_x = x;
    }

    print_i128(check(best_x));
    cout << '\n';
    return 0;
}
```

---

### 分层图

#### [逃出生天](https://codeforces.com/gym/106210/problem/C)

- **核心模型**:一句话概括题意/数学本质 (如: 中位数贪心 / 差分约束)
- **思维误区 (Bug)**:记录第一直觉为什么错了 (如: 以为是DP其实是贪心 / 读错题)
- **修正逻辑 (Patch)**:下次看到什么特征，要修正为正确思路
- **关键代码**:

```cpp
vi dx = {1, 0, -1, 0, 0};
vi dy = {0, 1, 0, -1, 0};
int n, m;
int laohupos(int stpos, int fx, int t)
{
    int idx;
 
    if (fx == 1)
    {
        idx = stpos - 1;
    }
    else
    {
        idx = 2 * m - 2 - (stpos - 1);
    }
 
    return (idx + t) % (2 * m - 2);
}
struct hhh
{
    int x, y, t;
};
void solve()
{
 
    cin >> n >> m;
    vector<vector<vi>> hsh(n + 1, vector<vi>(m + 1, vi(2 * m - 2, 0)));
    vector<pii> tiger;
    for (int i = 1; i <= n; i++)
    {
        int d, dd;
        cin >> d;
        char c;
        cin >> c;
        if (c == 'R')
            dd = 1;
        else
            dd = -1;
        tiger.push_back({d, dd});
    }
    vi laohu;
    for (int i = 1; i <= m; i++)
        laohu.push_back(i);
    for (int i = m - 1; i > 1; i--)
        laohu.push_back(i);
 
    queue<hhh> pos;
    pos.push({1, m, 0});
    hsh[1][m][0] = 1;
    while (!pos.empty())
    {
        auto [nx, ny, nt] = pos.front();
        pos.pop();
 
        if (nx == n && ny == 1)
        {
            cout << "Yes" << '\n';
            return;
        }
        int tm = nt + 1;
        for (int i = 0; i < 5; i++)
        {
            int xx = nx + dx[i];
            int yy = ny + dy[i];
 
            if (xx < 1 || xx > n || yy < 1 || yy > m)
                continue;
            if (hsh[xx][yy][tm%(2*m-2)])
                continue;
 
            if(laohu[laohupos(tiger[xx-1].first,tiger[xx-1].second,nt)]==yy)continue;
            if(laohu[laohupos(tiger[xx-1].first,tiger[xx-1].second,tm)]==yy)continue;
 
            hsh[xx][yy][tm%(2*m-2)]=1;
            pos.push({xx,yy,tm%(2*m-2)});
        }
    }
    cout << "No" << endl;
}
 
```

#### [G_Exploration](https://codeforces.com/gym/105806/problem/G)

- **核心模型**:分层图dp
- **思维误区 (Bug)**:一开始看见权值/2地往下递减错误的想用bfs。bfs本质上就是一点一点枚举路径，复杂度是指数级别的
- **修正逻辑 (Patch)**:ce[v][k] 是指：从v出发走k步最大地值。题目是要求/边权，我们可以反向思考成从某点出发*边权。可以证明出单调性
- 发现重复子问题 → 想到DP
- 发现步数上界只有30 → 把步数作为DP的维度
- 发现正向状态太多 → 翻转问题方向
- **关键代码**:

```cpp
void solve()
{
    int n, m, q;
    cin >> n >> m >> q;
    vector<vector<pii>> mp(n + 1);
    for (int i = 0; i < m; i++)
    {
        int u, v, d;
        cin >> u >> v >> d;
        mp[v].push_back(make_pair(u, d));
    }
    vector<vector<int>> dp(40, vi(n + 1, 0));
    for (int i = 1; i <= n; i++)
    {
        sort(mp[i].begin(), mp[i].end(), [](pii a, pii b)
             { return a.second < b.second; });
    }
    for (int i = 0; i < n + 1; i++)
    {
        dp[0][i] = 1;
    }
    for (int k = 1; k <= 30; k++)
        for (int i = 1; i <= n; i++)
        {
            for (auto it : mp[i])
            {
                int nxt = it.first;
                int gap = it.second;
                
                dp[k][nxt] = max(dp[k][nxt], min(dp[k - 1][i] * gap, (int)2e9));
            }
        }

    while (q--)
    {
        int po, val;
        cin >> po >> val;
        int ans = 0;
        for (int i = 0; i <= 30; i++)
        {
            if (dp[i][po] > val)
            {
                ans = i;
                break;
            }
        }
        cout << ans << '\n';
    }
}

```

### trick：容斥与路径数

- 情景：已知条件：
  - 从起点到 A 的路径数
  - 从起点到 B 的路径数
  - A 在 B 的左上方（A 可以在 B 之前被经过）

- 想求：
  - 从起点到 B、且途中没有经过 A 的路径数

- 解法:到B且不经过A = 到B的所有路径 - 到B且经过A的路径 = 到A的路径 × 从A到B的路径
  - 子问题1：求0，0到点A的路径数：相当于向下走Ax步向右走Ay步-> nCr(Ax+Ay，Ax)；
  - 子问题1推广到从 (prex, prey) 走到 (x, y)：->nCr(abs(x - prex) + abs(y - prey), abs(x - prex))
  - 因为是要算很多个点递推关系所以dp方程变为：`dp[j] = (((dp[j] - (dp[k] * nCr(abs(x - prex) + abs(y - prey), abs(x - prex)) % MOD)) + MOD) % MOD) % MOD;`

#### [G. Path Summing Problem](https://codeforces.com/group/A5KcfGn880/contest/680980/problem/G)

- **核心模型**:见解法一容斥dp

- **题解**：如题意容易想到贡献法：用贡献法转化为“每种数字对结果的贡献”
- 正着想可以想到容斥，反着想可以想到枚举不经过某个点v的路径数量
- 然后我们发现容斥的解法只能靠sz方的枚举点，用全是1可以卡掉.然后想到普通dp->意思是逐步算出不经过某个数字的点的路径数量，但是会被全是1不同的数字卡掉
- 所以想到根号分治
- 然后开始枚举，因为当sz（也就是某个数字arr[i]出现的次数）<B的时候容斥最好，大于的时候普通dp最好

- **关键代码**:

```cpp
void solve()
{
    int n, m;
    cin >> n >> m;
    vector<vi> mp(n + 1, vi(m + 1, 0));
    map<int, vector<pii>> lab;
    vi arr;
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < m; j++)
        {
            cin >> mp[i][j];
            arr.push_back(mp[i][j]);
            lab[mp[i][j]].push_back(make_pair(i, j));
        }
    }
    sort(all(arr));
    arr.erase(unique(arr.begin(), arr.end()), arr.end());

    int nn = arr.size();
    // cerr << "yuanshen" << '\n';
    int B = max(1ll, (int)sqrt(n * m));
    ll ans = 0;

    for (int i = 0; i < nn; i++)
    {
        int sz = lab[arr[i]].size();
        assert(sz != 0);
        //   cerr << "yuanshen" << '\n';
        if (sz < B)
        {
            // 第一个容斥DP
            //  cerr << "yuanshen" << '\n';
            vector<pii> vec = lab[arr[i]];
            ll pans = 0;
            vi dp(sz);
            for (int j = 0; j < sz; j++)
            {
                auto [x, y] = vec[j];
                dp[j] = nCr(x + y, x);
                for (int k = 0; k < j; k++)
                {
                    auto [prex, prey] = vec[k];

                    if (prex <= x && prey <= y)
                    {
                        dp[j] = (((dp[j] - (dp[k] * nCr(abs(x - prex) + abs(y - prey), abs(x - prex)) % MOD)) + MOD) % MOD) % MOD;
                    }
                }
                pans = (pans + dp[j] * nCr(n + m - x - y - 2, n - x - 1) % MOD);
            }
            ans = (ans + pans % MOD) % MOD;
        }
        else
        {
            // 第二个普通DP
            //  cerr << "yuanshen" << '\n';
            vector<vi> dp(n + 1, vi(m + 1, 0));
            dp[0][0] = (mp[0][0] == arr[i]) ^ 1;
            for (int j = 0; j < n; j++)
            {
                for (int k = 0; k < m; k++)
                {
                    if (mp[j][k] == arr[i])
                        dp[j][k] = 0;

                    else{
                        if (j > 0)
                            dp[j][k] += dp[j - 1][k];
                        if (k > 0)
                            dp[j][k] += dp[j][k - 1];
                    }
                    dp[j][k] %= MOD;
                }
            }
            dbg(dp[n - 1][m - 1], nCr(n + m - 2, n - 1));
            ans = ((ans + nCr(n + m - 2, n - 1)) % MOD - dp[n - 1][m - 1] + MOD) % MOD;
        }
    }
    cout << ans << '\n';
}
```

### bitset优化bfs

#### [B.《金牌题》](https://hydro.ac/d/XJUCPC/p/12?tid=6a15a69ac1224fa17414cc50)

- **核心模型**:

>Alice 和 Bob 正在一张有向连通图上探索。两人具有不同的起点。
>对于两人来说，每秒同时进行以下的操作：
>如果当前所在的顶点有一条或多条出边，他们会任意地沿着一条出边移动到相邻的顶点；否则，如果他们当前所在的顶点没有出边，他们会停留在该顶点。
>现在 Wensy 想知道，在某一时刻，他们二人是否有可能相遇呢？

- **思维误区 (Bug)**: 第一直觉想知道：对于每个点每个人可能到得时间，复杂度会爆炸。然后第二想法是对于这一个时间每个人在的点有没有交集。考虑状态空间n^2，只能容忍再多根号n得运算，如果遇到超级稠密图有可能
- **修正逻辑 (Patch)**:设 $A$ 是 Alice 在第 $t$ 步可能到达的所有顶点的集合。设 $B$ 是 Bob 在第 $t$ 步可能到达的所有顶点的集合。两人在第 $t$ 步能相遇的充分必要条件是：集合 $A$ 和集合 $B$ 有交集。
- **在时间维度上这道题卡bitset**
- **卡常教学**：
  - `A.set(x)`->`A[x]=1`
  - `if (A.test(i))`->`if (vis[i] == 1)`
  - `if ((A & B).any())` -> `bool meet = false;for (int i = 1; i <= n; i++) {if (A_vis[i] == 1 && B_vis[i] == 1) {meet = true;break;}}if (meet) ...`
  - `next_A |= mp[i];`->状态转移：转移到下一个点，意思是A下一步可能会在哪
- **关键代码**:

```cpp

void solve()
{
    int n, m, x, y;
    cin >> n >> m >> x >> y;
    vector<bitset<305>> mp(n + 1);
    vi out_dg(n + 1, 0);
    for (int i = 0; i < m; i++)
    {
        int u, v;
        cin >> u >> v;
        mp[u].set(v);
        out_dg[u]++;
    }

    for (int i = 1; i <= n; i++)
    {
        if (out_dg[i]==0)
            mp[i].set(i);
    }

    bitset<305> A, B;
    A.set(x);
    B.set(y);

    for (int step = 0; step <= n * n; step++)
    {

        if ((A & B).any())
        {
            cout << "Yes" << '\n';
            return;
        }

        bitset<305> next_A, next_B;

        for (int i = 1; i <= n; i++)
        {
            if (A.test(i))
                next_A |= mp[i];
            if (B.test(i))
                next_B |= mp[i];
        }

        A = next_A;
        B = next_B;
    }

    cout << "No" << '\n';

}

```

- **均摊下的可过做法（不需要优化卡常）**

```cpp

void solve()
{
    int n;
    cin >> n;
    int m;
    cin >> m;
    int x, y;
    cin >> x >> y;
    vector<vector<int>> mp(n + 1);
    for (int i = 0; i < m; i++)
    {
        int u, v;
        cin >> u >> v;
        mp[u].push_back(v);
    }

    vector<vi> vis(n + 1, vi(n + 1, 0));
    queue<pii> q;
    vis[x][y] = 1;
    q.emplace(x, y);
    while (!q.empty())
    {
        auto [u, v] = q.front();
        q.pop();

        if (u == v)
        {
            cout << "Yes\n";
            return;
        }

        vi next_alice;
        vi next_bob;
        if (mp[u].empty())
        {
             next_alice = {u};
        }
        else
        {
            next_alice = mp[u];
        }
        if (mp[v].empty())
        {
             next_bob = {v};
        }
        else
        {
            next_bob= mp[v];
        }

        for (int it1 : next_alice)
        {
            for (int it2 : next_bob)
            {
                if (!vis[it1][it2])
                {
                    vis[it1][it2] = 1;
                    q.push({it1, it2});
                }
            }
        }
    }
    cout << "No\n";
    return;
}

```

---

### tarjan

#### 图的遍历（tarjan算法）

- **题目描述**：给出一张有向图（不保证无环），节点编号1到n，求每个节点能到达的最大编号

- **错误解法：我一开始想到的**：dfs加记忆化，从入度为0的点开始dfs到出度为0的点，每个点的答案在确认的时候和自己还有其他的路径比较一下;

  - **错解中的逻辑问题**
    - 只D入度为0的点，但是当图中出现环就会漏掉
    - 为了剪枝设计了vis数组来标记有没有被访问过，但是没有重置：这个题目不保证无环，所以必须重置，甚至说这个vis的存在就没啥必要
    - 在有环图中，当 DFS 访问到一个正在递归栈中的点时，说明遇到了环。正确的 DFS 应该使用三态
    - 在ans中要先初始化ans[i]=i，因为每个点都可以到达自己。**以免出现没有连通的点**

>vis在以下情况不需要重置：当你的图是有向无环图 (DAG).或者你对每个点的计算结果是确定的、最终的、且不会随起点变化时，你可以设置 vis 后不再变回 $1$
>当他作为强连通分量 (SCC) 标记也可以不重置
>比如说在这道题里面，当你反向建图让他从最大数字的点开始DFS的时候vis就可以选择不重置：**因为N在这条路径上是最大的点，后面的状态可以通过继承前面的状态来确定答案**

- **正解一：反向建图**：原理：贪心保证剪枝成功(一旦一个点的答案 $A(v)$ 被确定，它就是正确的最大值，且永远不需要重新计算。)
  - 问题: 为什么 $\text{Visited}(v)$ 可以永不重置？
  - 思考: 当我们从 $i$ 开始 DFS 时，如果 $v$ 还没有 $\text{Visited}$，我们就设 $A(v)=i$。在此之前，所有的 $k > i$ 都没有在 $G'$ 中到达 $v$（否则 $v$ 早就被标记了）。因此，没有比 $i$ 更大的点是 $v$ 可达的。

- **正解二：tarjan算法**：求“缩点”操作的高效算法
  - 缩点然后顺序dfs+dp。求完强连通分量可以保证图片是DAG

- **检查自己方案合理性的思考路径**：
  - 1.\ 图的特性：有向？无环？连通性？（有没有孤立的点）边权？（负权边？）
  - 2.\ 做法检验：有没有环？依赖顺序是什么？状态是否能持久？（影响剪枝）（在 DAG 上，从拓扑序逆序（即从终点开始）计算是可靠的。原图 DFS 依赖于子问题的答案，必须确保子问题先被计算。）

- **AC正解1**(反向图思路)

```cpp
void dfs(int a, int f, const vector<vi> &mp, vi &ans)
{
    ans[a] = f;
    if (mp[a].empty())
        return;
    for (int hsh : mp[a])
    {
        if(ans[hsh]!=-1)
        {
           continue;
        }
        dfs(hsh, f, mp, ans);
    }
  return;
}

void solve()
{
    int n, m;
    cin >> n >> m;
    vector<vi> mp(n + 1);
    rep(i, 1, m)
    {
        int u, v;
        cin >> u >> v;
        mp[v].push_back(u);
    }
    vi ans(n + 1, -1);
    for(int i=n;i>=1;i--)
    {
        if(ans[i]!=-1)
        {
           continue;
        }
      
        dfs(i,i,mp,ans);
    }
    rep(i,1,n)
    {
        cout<<ans[i]<<' ';
    }
}
```

- **AC正解2**(Tarjan思路)

```cpp

```
