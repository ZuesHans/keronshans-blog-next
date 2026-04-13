---
title: wo_字符串算法
date: 2026-01-12
tags:
    - 算法
cover: /img/cover/picg_12.png
---
## 字符串

### 字典树

- 检索字符串
- 维护异或极值
- 维护异或和
- 在处理异或（XOR）问题时，如果题目的核心逻辑能转化为**“在某个集合中，为当前数字 $x$ 寻找一个匹配对象 $y$，使得 $x \oplus y$ 的值最大（或最小）”，那么01字典树（0-1 Trie）**几乎就是标准答案。

#### [双生魔咒](https://codeforces.com/gym/105941/attachments/download/31813/%E6%AD%A3%E5%BC%8F%E8%B5%9B%E9%A2%98%E9%9D%A2.pdf)

- **核心模型**:一个维护前缀字符串，要做匹配/拆贡献的算法->字典树
- **思维误区 (Bug)**:没想到可以将前缀长度*数量的贡献拆分为字典树上每一个位置节点的贡献//想写非常难以维护的搜索或者魔改但其实思维绕了远路//看不懂字典树在做什么
- **修正逻辑 (Patch)**:拆贡献思维，
- **关键代码**:

```cpp

struct Trie
{
    int tre[MAXN][70];
    int cnt[MAXN];
    int idx = 0;
    int ccnt[MAXN];
    void clear()
    {
        for (int i = 0; i <= idx; i++)
        {
            for (int j = 0; j < 65; j++)
                tre[i][j] = 0;
            cnt[i] = 0;
        }
        idx = 0;
    }

    int getnum(char ch)
    {
        if (ch >= 'A' && ch <= 'Z')
        {
            return ch - 'A';
        }
        else if (ch >= 'a' && ch <= 'z')
        {
            return ch - 'a' + 26;
        }
        else if (ch >= '0' && ch <= '9')
        {
            return ch - '0' + 52;
        }
    }

    void insert(string s)
    {
        int ptr1 = 0;
        int bra = 0;
        for (int i = 0; i < s.size(); i++)
        {
            if (!tre[ptr1][getnum(s[i])])
            {
                idx++;
                tre[ptr1][getnum(s[i])] = idx;
            }
            ptr1 = tre[ptr1][getnum(s[i])];
            cnt[ptr1]++;
        }
    }

    int qury()
    {
        ll sum = 0;
        for (int i = 0; i <= idx; i++)
        {
            sum += (cnt[i] / 2) * ((cnt[i] + 1) / 2);
           // cerr<<sum<<' ';
        }
        return sum;
    }
} myTrie;
void solve()
{
    int n;
    cin >> n;
    vector<string> ss(2 * n);
    for (int i = 0; i < 2 * n; i++)
    {
        string s;
        cin >> s;
        ss[i] = s;
        myTrie.insert(s);
    }
    int pans = 0;
    cout << myTrie.qury() << '\n';
}

```

#### [维护最长异或路径](https://hydro.ac/p/bzoj-P1954)

- **核心模型**:特征一：静态或动态数组中的最大异或对/特征二：连续子数组的最大异或和（极其高频）/特征三：带限制条件的匹配
- **思维误区 (Bug)**:一定要计算好空间，注意字典树二维数组的第二维度开错了浪费空间很多。以及一定要计算好maxn
- **关键代码**:

```cpp
struct Trie
{
    int tre[MAXN][2];
    int cnt[MAXN];
    int idx = 0;

    void clear()
    {
        for (int i = 0; i <= idx; i++)
        {
            for (int j = 0; j < 35; j++)
                tre[i][j] = 0;
            cnt[i] = 0;
        }
        idx = 0;
    }

    int getnum(int x)
    {
       
        return x;
    }

    void insert(int x)
    {
        int ptr1 = 0;
        int bra = 0;
        vi res;
        int cntt = 31;
        while (cntt--)
        {
            res.push_back(x % 2);
            x /= 2;
        }
        std::reverse(all(res));
        for (int i = 0; i < res.size(); i++)
        {
            if (!tre[ptr1][getnum(res[i])])
            {
                idx++;
                tre[ptr1][getnum(res[i])] = idx;
            }
            ptr1 = tre[ptr1][getnum(res[i])];
            cnt[ptr1]++;
        }
    }

   
    int work(int x)
    {
        ll sum = 0;
        int ptr2 = 0;
        vi res;
        int cntt = 31;
        while (cntt--)
        {
            res.push_back(x % 2);
            x /= 2;
        }
        std::reverse(all(res));
        for (int i = 0; i < res.size(); i++)
        {
            if (tre[ptr2][getnum(res[i]) ^ 1])
            {
                sum += (1 << (31 - (i +1)));
                ptr2 = tre[ptr2][getnum(res[i] ^ 1)];
            }
            else
                ptr2 = tre[ptr2][getnum(res[i])];
        }
        return sum;
    }

} myTrie;

struct tr
{
    int u, v, w;
};

void solve()
{
    myTrie.clear();
    int n;
    cin >> n;
    vector<vector<pii>> trr(n + 1);

    for (int i = 0; i < n - 1; i++)
    {
        int u, v, w;
        cin >> u >> v >> w;
        trr[u].push_back(make_pair(v, w));
        trr[v].push_back(make_pair(u, w));
    }

    int rt = 1;
    int now = 0;
    vi cand;
    cand.push_back(0);
    auto dfs = [&](int fa, int stp, auto self) -> void
    {
        for (auto it : trr[stp])
        {
            if (it.first == fa)
                continue;
            now ^= it.second;
            cand.push_back(now);
            myTrie.insert(now);
            self(stp, it.first, self);
             now ^= it.second;
        }
    };
    dfs(0, 1, dfs);
    int ans = 0;
    for (auto it : cand)
    {
        ans = max(ans, myTrie.work(it));
        //   cerr << myTrie.work(it) << ' ';
    }

    cout << ans << '\n';
}

```
