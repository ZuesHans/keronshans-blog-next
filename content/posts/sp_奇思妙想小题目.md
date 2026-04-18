---
title: sp_奇思妙想小题目
date: 2026-02-16
tags:
    - 杂谈
    - 算法
cover: /img/cover/picg_20.png
---
这里记录着我对题目的奇思妙想。因为我找不到oj，但是我又觉得这种题目很典，所以就搞了一个专门记录的帖子。不保证代码和分析全对，正确性由gemini3 pro支持..

## 1

- 题目描述
  - 给出长度为n的数组ai（均为正整数），给出m，选择子序列使得子序列里面的乘积==n
- 解法解答：使用拆因子dp做法->在已经有的因子里面选择（这里一个实现难点是不能重复，而愚蠢的zues一开始没实现这个），跑背包dp
- 跑过随机数据代码：

```cpp
void solve()
{
    int n;
    cin >> n;
    int m;
    cin >> m;
    // m = 67;

    map<int, int> mp;

    for (int i = 0; i < n; i++)
    {
        int d;
        cin >> d;
        if (m % d == 0)
        {
            mp[d]++;
        }
    }

    map<int, int> dp;
    dp[1] = 1;

    for (auto [nb, cnt] : mp)
    {
        vi now;
        for (auto it : dp)
        {
            now.push_back(it.first);
        }

        for (int j = 0; j < now.size(); j++)
        {
            ll sum = now[j];
            for (int i = 0; i < cnt; i++)
            {
                sum *= nb;
                if (m % sum == 0)
                {
                    if (sum == m)
                    {
                        cout << "yes" << '\n';
                        return;
                    }
                    else
                    {
                        dp[sum]++;
                    }
                }
            }
        }
    }
    cout << "no" << '\n';
}

```

## 2 C. Where's My Water?、

- 这道题目的数据范围只有2000，但是我们要学习如何最优化我们的做法
- 这道题目有一个贪心二级结论，如果会了就很简单，这里会顺便介绍一下涉及到的所有不熟练的实现

- **维护假设排水口是（i,j）如何运用容斥计算收集到水的总量：**
    这里稍微想一下可能有两种情况：i j之间比较矮（<=0）低过地平线的部分不会懂，高过地平线的部分可能给i j 任意一个排水口吸收掉，
    对于i j 我们可以想象有一个天际线把i j 部分切分成两个独立部分。这个天际线就是i j 之间最高(包括i j)的点排水量（这属于i j排水量的交集）
    或者我们用另一个视角来看：排水量的实质是什么：我往左和往右走任何大于等于我的水块
    我们多算的地方就是其中的交集

```cpp
int ans2 = mx_ans.first;
    int idx = mx_ans.second;
    int curMax = nums[idx];
    int curtp = idx;
    // cerr<<idx;
    for (int j = idx; j >= 1; j--)
    {
        if (curMax < nums[j])
        {
            curtp = j;
            curMax = nums[j];
        }

        ans2 = max(ans2, sum[idx]+ sum[j] - sum[curtp]);
    }

    curMax = nums[idx];
     curtp = idx;
    for (int j = idx + 1; j <= n; j++)
    {
        if (curMax < nums[j])
        {
            curtp = j;
            curMax = nums[j];
        }

        ans2 = max(ans2, sum[idx] + sum[j] - sum[curtp]);
    }


```

- **O(n) 代码完整版**

```cpp
void solve()
{
    int n, h;
    cin >> n >> h;
    vi nums(n + 2);
  
    rep(i, 1, n)
    {
        int d;
        cin >> d;
        nums[i] = d;
      
    }
    
    vi sl(n + 2);
    vi wl(n + 2);
    vi sum(n + 2);
    stack<int> stl;
    for (int i = 1; i <= n; i++)
    {
        while (!stl.empty() && nums[stl.top()] <= nums[i])
        {
            stl.pop();
        }
        int now = 0;
        if (stl.empty())
        {
            now = 0;
        }
        else
        {
            now = stl.top();
        }
        sl[i] = sl[now] + (i - now) * nums[i];
        wl[i] = i * h - sl[i];
        stl.emplace(i);
    }
    vi sr(n + 2);
    vi wr(n + 2);
    stack<int> str;
    for (int i = n; i >= 1; i--)
    {
        while (!str.empty() && nums[str.top()] <= nums[i])
        {
            str.pop();
        }
        int now = 0;
        if (str.empty())
        {
            now = n + 1;
        }
        else
        {
            now = str.top();
        }
        sr[i] = sr[now] + (now - i) * nums[i];
        wr[i] = (n - i + 1) * h - sr[i];
        str.emplace(i);
    }

    pii mx_ans = {0, 0};
    for (int i = 1; i <= n; i++)
    {
        sum[i] = wl[i] + wr[i] - (h - nums[i]);
        if (mx_ans.first < sum[i])
        {
            mx_ans = {sum[i], i};
        }
    }
   
    int ans2 = mx_ans.first;
    int idx = mx_ans.second;
    int curMax = nums[idx];
    int curtp = idx;
    // cerr<<idx;
    for (int j = idx; j >= 1; j--)
    {
        if (curMax < nums[j])
        {
            curtp = j;
            curMax = nums[j];
        }

        ans2 = max(ans2, sum[idx]+ sum[j] - sum[curtp]);
    }

    curMax = nums[idx];
     curtp = idx;
    for (int j = idx + 1; j <= n; j++)
    {
        if (curMax < nums[j])
        {
            curtp = j;
            curMax = nums[j];
        }

        ans2 = max(ans2, sum[idx] + sum[j] - sum[curtp]);
    }

    cout << ans2 << '\n';
}


```

但是我们在赛时无法严格证明贪心结论怎么办？我们可以力大砖飞去暴力搜索，如何分摊复杂度？
我们发现我们的暴力代码是

```cpp
 ll ans = 0;
    for (int i = 1; i <= n; i++)
    {
        int mx = 0;
        int mxtp = i;
       
        for (int j = i; j <= n; j++)
        {
            
            if (nums[j] > mx)
            {
                mx = nums[j];
                mxtp = j;
            }
            ans = max(ans,wtr[i] + wtr[j] - wtr[mxtp]);
        }
    }
```

我们发现我们容斥公式计算需要ijk，但是当我们定i，j每次移动都需要重新算一次k（n方）（固定j同理，没有什么快速的性质或者单调性快速查询）
我们视线回到k，我们发现，假如固定了k，i和j必然是在左右两边排水量最大的
i j 具体是那个点发现可以递归下去！
ok！感觉我们已经做完了
吗
枚举k？
是的我们可以枚举k

当然这里由于出现了类笛卡尔树的结构可以很自然的想到分治：熟练的话好写切不需要在意边界。（实际上边界时悬线法做到的）
因为ans需要维护最大值，我们自顶向下第一层能决定ans的取值可以覆盖掉整个区间
我们只需要动态更新ans就行。

说到笛卡尔树....我们察觉到这种类笛卡尔树结构是不是可以**思考用树上dp进行预处理（单调栈构造笛卡尔树）**（类似于<https://codeforces.com/problemset/problem/2205/D）>

btw我们这里漏了一个小妙招就是快速o1查找一个区间里面的最大值可以用st表

- **nlogn代码完整版(枚举版本)**

```cpp
template <typename T>
struct SparseTable
{
    int n;
    vector<vector<T>> st;
    vector<int> log2_;
    function<T(T, T)> func; // ← 固定为 std::function，不再是模板参数

    SparseTable() {}

    SparseTable(const vector<T> &a, function<T(T, T)> f = [](T x, T y)
                                    { return min(x, y); })
        : n(a.size()), func(f)
    {
        int LOG = __lg(n) + 1;
        st.assign(LOG, vector<T>(n));
        log2_.resize(n + 1);
        log2_[1] = 0;
        for (int i = 2; i <= n; i++)
            log2_[i] = log2_[i >> 1] + 1;

        st[0] = a;
        for (int j = 1; j < LOG; j++)
            for (int i = 0; i + (1 << j) <= n; i++)
                st[j][i] = func(st[j - 1][i], st[j - 1][i + (1 << (j - 1))]);
    }

    T query(int l, int r)
    {
        int k = log2_[r - l + 1];
        return func(st[k][l], st[k][r - (1 << k) + 1]);
    }
};
void solve()
{

    int n, h;
    cin >> n >> h;
    vi nums(n + 2);

    rep(i, 1, n)
    {
        int d;
        cin >> d;
        nums[i] = d;
    }

    vi sl(n + 2);
    vi wl(n + 2);

    vi L(n + 2);
    vi R(n + 2);
    stack<int> stl;
    for (int i = 1; i <= n; i++)
    {
        while (!stl.empty() && nums[stl.top()] <= nums[i])
        {
            stl.pop();
        }
        int now = 0;
        if (stl.empty())
        {
            now = 0;
            L[i] = 1;
        }
        else
        {
            now = stl.top();
            L[i] = now + 1;
            ;
        }

        sl[i] = sl[now] + (i - now) * nums[i];
        wl[i] = i * h - sl[i];
        stl.emplace(i);
    }
    vi sr(n + 2);
    vi wr(n + 2);
    stack<int> str;
    for (int i = n; i >= 1; i--)
    {
        while (!str.empty() && nums[str.top()] <= nums[i])
        {
            str.pop();
        }
        int now = 0;
        if (str.empty())
        {
            now = n + 1;
            R[i] = n;
        }
        else
        {
            now = str.top();
            R[i] = str.top() - 1;
        }
        sr[i] = sr[now] + (now - i) * nums[i];
        wr[i] = (n - i + 1) * h - sr[i];
        str.emplace(i);
    }

    vi sum(n + 2);
    for (int i = 1; i <= n; i++)
    {
        sum[i] = wl[i] + wr[i] - (h - nums[i]);
    }
    auto cmp_max = [](int x, int y)
    { return max(x, y); };
    SparseTable<int> wtst(sum, cmp_max);
    int ans = 0;
    for (int k = 1; k <= n; k++)
    {
        int lft = wtst.query(L[k], k);
        int rit = wtst.query(k, R[k]);

        ans = max(ans, lft + rit - sum[k]);
    }
    cout << ans << '\n';
}

```

- **nlogn代码完整版(分治版本)**

```cpp

template <typename T>
struct SparseTable
{
    int n;
    vector<vector<T>> st;
    vector<int> log2_;
    function<T(T, T)> func; // ← 固定为 std::function，不再是模板参数

    SparseTable() {}

    SparseTable(const vector<T> &a, function<T(T, T)> f = [](T x, T y)
                                    { return min(x, y); })
        : n(a.size()), func(f)
    {
        int LOG = __lg(n) + 1;
        st.assign(LOG, vector<T>(n));
        log2_.resize(n + 1);
        log2_[1] = 0;
        for (int i = 2; i <= n; i++)
            log2_[i] = log2_[i >> 1] + 1;

        st[0] = a;
        for (int j = 1; j < LOG; j++)
            for (int i = 0; i + (1 << j) <= n; i++)
                st[j][i] = func(st[j - 1][i], st[j - 1][i + (1 << (j - 1))]);
    }

    T query(int l, int r)
    {
        int k = log2_[r - l + 1];
        return func(st[k][l], st[k][r - (1 << k) + 1]);
    }
};
void solve()
{
    int n, h;
    cin >> n >> h;
    vi nums(n + 2);
    vector<pii> nb(n + 1);
    rep(i, 1, n)
    {
        int d;
        cin >> d;
        nums[i] = d;
        nb[i].first = d;
        nb[i].second = i;
    }
    auto cmp_max = [](int x, int y)
    { return max(x, y); };
    if (n == 1)
    { 
        cout << h - nums[1] << '\n';
        return;
    }

    vi sl(n + 2);
    vi wl(n + 2);
    vi sum(n + 2);
    stack<int> stl;
    for (int i = 1; i <= n; i++)
    {
        while (!stl.empty() && nums[stl.top()] <= nums[i])
        {
            stl.pop();
        }
        int now = 0;
        if (stl.empty())
        {
            now = 0;
        }
        else
        {
            now = stl.top();
        }
        sl[i] = sl[now] + (i - now) * nums[i];
        wl[i] = i * h - sl[i];
        stl.emplace(i);
    }
    vi sr(n + 2);
    vi wr(n + 2);
    stack<int> str;
    for (int i = n; i >= 1; i--)
    {
        while (!str.empty() && nums[str.top()] <= nums[i])
        {
            str.pop();
        }
        int now = 0;
        if (str.empty())
        {
            now = n + 1;
        }
        else
        {
            now = str.top();
        }
        sr[i] = sr[now] + (now-i) * nums[i];
        wr[i] = (n-i+1) * h - sr[i];
        str.emplace(i);
    }
    for (int i = 1; i <= n; i++)
    {
        sum[i] = wl[i] + wr[i] - (h - nums[i]);
    }
    SparseTable<int> wtst(sum, cmp_max);
    SparseTable<pair<int, int>> nbst(nb, [](pair<int, int> x, pair<int, int> y)
                                     {
                                         return x.first >= y.first ? x : y; // 按值比较，返回较大的pair
                                     });
    auto dfs = [&](int l, int r, auto self) -> int
    {
        if (l > r)
            return 0;
        int mx = nbst.query(l, r).second;
        int mxl = wtst.query(l, mx);
        int mxr = wtst.query(mx, r);
        int mid = mxl + mxr - sum[mx];
        int lft = self(l, mx - 1, self);
        int rit = self(mx + 1, r, self);
        return max(mid, max(lft, rit)); /*  */
    };
    cout << dfs(1, n, dfs) << '\n';
}

```
