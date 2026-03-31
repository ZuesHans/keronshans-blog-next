---
title: wp_优化
date: 2026-01-12
tags:

    - 算法
cover: /img/cover/picg_12.png
---

## 基于数据范围打表预处理

### 筛法枚举

#### [F. Easy Demon Problem](https://codeforces.com/problemset/problem/2044/F)

- **核心模型**:调和级数枚举预处理
- **思维误区 (Bug)**:首先是对于题目负因数case没写上。其次是复杂度。这道题错解是n√nlogn，注意到数据范围会变成1e8，加上map常数大会tle。第一步优化换了unorded_set （O(1)查询最坏on）题目卡哈希冲突。
- **修正逻辑 (Patch)**:看到`多次查询`&&`因子`||`倍数`||`最大公约数`，在数据范围允许的条件下可以对值域内所有数有的性质进行打表。
- **关键逻辑**：**双重循环，但是内层循环是按倍数增长，这一块的复杂度实际上是nlogn的**
- **关键代码**:

```cpp

```

#### [Codeforces 1154G - Minimum Possible LCM](https://codeforces.com/contest/1154/problem/G)

- **核心模型**:枚举gcd
- **思维误区 (Bug)**:记录第一直觉为什么错了 (如: 以为是DP其实是贪心 / 读错题)
- **修正逻辑 (Patch)**:下次看到什么特征，要修正为正确思路
- **关键代码**:

```cpp
// 只贴最核心的 3-5 行逻辑或 Check 函数，不要贴 main
```

---

## 根号分治

- 是一种通过将问题按规模分类并结合不同算法来平衡时间复杂度和空间复杂度的算法技巧
- 其核心思想是：对于同一问题，如果存在两种暴力解法 —— 一种在小数据下效率高、在大数据下效率低，另一种则相反——可以将数据按规模划分，分别使用不同策略，从而在整体上优化最坏情况复杂度。

- 通常，根号分治会以问题规模的平方根作为分界点：
    对于小于阈值的数据，使用适合小规模的暴力或预处理方法；
    对于大于阈值的数据，使用适合大规模的直接模拟或动态维护方法。

- 涉及到平衡复杂度的算法并不多，主要就是一众根号算法（根分，分块，莫队），当复杂度不平衡时可以往这边想一想。

### 基于阈值的分类

#### [G. Path Summing Problem](https://codeforces.com/group/A5KcfGn880/contest/680980/problem/G)

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

## 时空复杂度优化

### BFS

#### [E. Product Queries](https://codeforces.com/contest/2193/problem/E)

- **核心模型**:由于是乘法，容易知道计算目标次数最多是logn级别，所以可以秒开BFS(严格的nlogn)
- **思维误区 (Bug)**:**！！注意queue是危险的**所以要去重；**没有剪枝会退化到n^2**
- **修正逻辑 (Patch)**:
- **关键代码**:

```cpp
void solve()
{
    int n;
    cin >> n;
    vi a(n);
    vi ans(n + 1, INF);
    for (int i = 0; i < n; i++)
    {
        cin >> a[i];
        ans[a[i]] = 1;
    }

    sort(a.begin(), a.end());
    a.erase(unique(a.begin(), a.end()), a.end());

    if (!a.empty() && a[0] == 1)
    {
        a.erase(a.begin());
    }
    int pp = a.size();

    queue<pii> q;

    int cnt = 0;

    for (int i = 0; i < pp; i++)
        q.emplace(make_pair(a[i], 1));

    vi vis(n + 1);

    while (!q.empty())
    // for(int i=0;i<100;i++)
    {
        auto hsh = q.front();
        q.pop();
        for (int i = 0; i < pp; i++)
        {
            if (a[i] * hsh.first <= n)
            {
                if (ans[a[i] * hsh.first] >= INF)
                {
                    q.emplace(make_pair(a[i] * hsh.first, hsh.second + 1));
                     ans[a[i] * hsh.first] = hsh.second+1;
                }
            }
            else
                break; // 剪枝
        }
    }

    for (int i = 1; i <= n; i++)
    {
        if (ans[i] > 3e8)
            cout << -1 << ' ';
        else
            cout << ans[i] << ' ';
    }
    cout << '\n';
}

```

---
