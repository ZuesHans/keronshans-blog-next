---
title: KH_优化算法
date: '2026-06-20'
tags:
  - C++
  - 算法
  - Trick
  - 杂项
  - 优化
category: 算法板子
pinned: false
---

## CDQ 分治

- 解决和点对有关的问题．
- 1D 动态规划的优化与转移．
- 通过 CDQ 分治，将一些动态问题转化为静态问题．

### 维护三维偏序问题

#### [Grand Swap Master](https://acm.hdu.edu.cn/contest/problem?cid=1237&pid=1012)

- **核心模型**:一句话概括题意/数学本质 (如: 中位数贪心 / 差分约束)
- **思维误区 (Bug)**:记录第一直觉为什么错了 (如: 以为是DP其实是贪心 / 读错题)
- **修正逻辑 (Patch)**:下次看到什么特征，要修正为正确思路
- **关键代码**:

```cpp
struct info
{
    int a, b, c;
    int res;
};
struct Fenwick
{
    int n;
    vector<long long> tr;

    // 初始化：传入最大长度 n
    Fenwick(int size) : n(size), tr(size + 1, 0) {}
    // 初始化2：节省时间开销的init
    void init(int size)
    {
        n = size;
        tr.assign(n + 1, 0);
    }

    // 核心位运算：获取二进制最低位的 1
    int lowbit(int x)
    {
        return x & -x;
    }

    // 单点修改：在位置 x 加上 val
    void add(int x, long long val)
    {
        for (; x <= n; x += lowbit(x))
        {
            tr[x] += val;
        }
    }

    // 查询前缀和：查询 [1, x] 的和
    long long ask(int x)
    {
        long long res = 0;
        for (; x > 0; x -= lowbit(x))
        {
            res += tr[x];
        }
        return res;
    }

    // 区间查询：查询 [l, r] 的和
    long long range_ask(int l, int r)
    {
        if (l > r)
            return 0;
        return ask(r) - ask(l - 1);
    }
};
bool cmpA(info x, info y)
{
    if (x.a != y.a)
        return x.a < y.a;
    if (x.b != y.b)
        return x.b < y.b;
    return x.c < y.c;
}
bool cmpB(info x, info y)
{
    if (x.b != y.b)
        return x.b < y.b;
    return x.c < y.c;
}
void solve()
{
    int n;
    n = read();
    vi nums(n + 1);
    vector<info> a(n + 1);
    vector<info> p(n + 1);
    Fenwick bit(n + 1);
    for (int i = 1; i <= n; i++)
    {
        nums[i] = read();
        a[i].b = nums[i];
        a[i].c = i;
        p[i].b = -nums[i];
        p[i].c = i;
    }
    for (int i = 2; i <= n - 1; i++)
    {
        a[i].a = (nums[i + 1] + nums[i - 1]);
        p[i].a = -(nums[i + 1] + nums[i - 1]);
    }

    if (n == 1)
    {
        cout << 0 << '\n';
        return;
    }
    sort(a.begin() + 2, a.begin() + n, cmpA);
    sort(p.begin() + 2, p.begin() + n, cmpA);

    auto CDQ = [&](int l, int r, auto &&self) -> void
    {
        if (l >= r)
            return;

        int base = (l + r) / 2;
        int mid = base;

        while (mid < r && a[mid].a == a[mid + 1].a)
            mid++;

        if (mid == r)
        {
            mid = base;

            while (mid >= l && a[mid].a == a[mid + 1].a)
                mid--;
        }

        if (mid < l)
            return;
        self(l, mid, self);
        self(mid + 1, r, self);

        sort(a.begin() + l, a.begin() + mid + 1, cmpB);
        sort(a.begin() + mid + 1, a.begin() + r + 1, cmpB);

        int i = l;

        for (int j = mid + 1; j <= r; j++)
        {
            while (i <= mid && a[i].b < a[j].b)
            {
                bit.add(a[i].c, 1);
                i++;
            }

            a[j].res += bit.ask(a[j].c - 2);
        }

        for (int p = l; p < i; p++)
            bit.add(a[p].c, -1);
    };
    auto CDQ2 = [&](int l, int r, auto &&self) -> void
    {
        if (l >= r)
            return;
        int base = (l + r) / 2;
        int mid = base;

        while (mid < r && p[mid].a == p[mid + 1].a)
            mid++;

        if (mid == r)
        {
            mid = base;

            while (mid >= l && p[mid].a == p[mid + 1].a)
                mid--;
        };
        if (mid < l)
            return;
        self(l, mid, self);
        self(mid + 1, r, self);

        sort(p.begin() + l, p.begin() + mid + 1, cmpB);
        sort(p.begin() + mid + 1, p.begin() + r + 1, cmpB);

        int i = l;

        for (int j = mid + 1; j <= r; j++)
        {
            while (i <= mid && p[i].b < p[j].b)
            {
                bit.add(p[i].c, 1);
                i++;
            }

            p[j].res += bit.ask(p[j].c - 2);
        }

        for (int f = l; f < i; f++)
            bit.add(p[f].c, -1);
    };

    CDQ(2, n - 1, CDQ);
    CDQ2(2, n - 1, CDQ2);
    long long total = 0;

    for (int i = 2; i <= n - 1; i++)
    {
        total += a[i].res;
        total += p[i].res;
    }
    for (int i = 2; i <= n - 2; i++)
    {
        int d = (nums[i + 1] - nums[i]) * (nums[i + 2] - nums[i - 1]);

        if (d > 0)
            total++;
    }

    int i1 = (nums[1] - nums[2]) * (nums[1] - nums[2]);
    for (int i = 3; i <= n - 1; i++)
    {
        int yuan = i1;
        yuan += ((nums[i] - nums[i + 1]) * (nums[i] - nums[i + 1]));
        yuan += ((nums[i] - nums[i - 1]) * (nums[i] - nums[i - 1]));

        int bian = (nums[i] - nums[2]) * (nums[i] - nums[2]);
        bian += ((nums[1] - nums[i + 1]) * (nums[1] - nums[i + 1]));
        bian += ((nums[1] - nums[i - 1]) * (nums[1] - nums[i - 1]));
        if (bian > yuan)
        {
            total++;
        }
    }
    if (n >= 3)
    {
        if ((nums[1] - nums[3]) * (nums[1] - nums[3]) > (nums[2] - nums[3]) * (nums[2] - nums[3]))
        {
            total++;
        }
    }
    int jn = (nums[n - 1] - nums[n]) * (nums[n - 1] - nums[n]);
    for (int i = 2; i <= n - 2; i++)
    {
        int yuan = jn;
        yuan += ((nums[i] - nums[i + 1]) * (nums[i] - nums[i + 1]));
        yuan += ((nums[i] - nums[i - 1]) * (nums[i] - nums[i - 1]));

        int bian = (nums[i] - nums[n - 1]) * (nums[i] - nums[n - 1]);
        bian += ((nums[n] - nums[i + 1]) * (nums[n] - nums[i + 1]));
        bian += ((nums[n] - nums[i - 1]) * (nums[n] - nums[i - 1]));
        if (bian > yuan)
        {
            total++;
        }
    }
    if (n >= 3)
    {
        if ((nums[n] - nums[n - 2]) * (nums[n] - nums[n - 2]) > (nums[n - 1] - nums[n - 2]) * (nums[n - 1] - nums[n - 2]))
        {
            total++;
        }
    }
    int bianbian = (nums[1] - nums[n - 1]) * (nums[1] - nums[n - 1]) + (nums[n] - nums[2]) * (nums[n] - nums[2]);
    total += (bool)((i1 + jn) < bianbian);

    cout << total << '\n';
}

```

---

## 莫队

### 普通莫队做法

#### [P2709 【模板】莫队 / 小B的询问](https://www.luogu.com.cn/problem/P2709)

- **核心模型**:
- **思维误区 (Bug)**:
- **修正逻辑 (Patch)**:
- **关键代码**:

```cpp
struct qury
{
    int l, r, id;
};

void solve()
{
    int n, m, k;
    cin >> n >> m >> k;
    vi nums(n + 1);
    for (int i = 1; i <= n; i++)
    {
        cin >> nums[i];
    }
    vi cnt(k + 3);
    vector<qury> qry(m);

    for (int i = 0; i < m; i++)
    {
        cin >> qry[i].l >> qry[i].r;
        qry[i].id = i;
    }
    int bk = max(1, (int)sqrt(n));
    sort(all(qry), [&](qury a, qury b)
         {
    int aa=a.l/bk;
    int bb=b.l/bk;
        if(aa!=bb)return aa<bb;
        else
        {
            return a.r<b.r;
        } });

    int now = 0;
    auto add = [&](int x) -> void
    {
        now += 2 * cnt[nums[x]] + 1;
        cnt[nums[x]]++;
    };
    auto del = [&](int x) -> void
    {
        now -= 2 * cnt[nums[x]] - 1;
        cnt[nums[x]]--;
    };

    int lef = 1;
    int ri = 0;
    vi anss(m);
    ll ans = 0;
    for (int i = 0; i < m; i++)
    {
        while (lef > qry[i].l)
        {
            lef--;
            add(lef);
        }

        while (ri < qry[i].r)
        {
            ri++;
            add(ri);
        }

        while (lef < qry[i].l)
        {
            del(lef);
            lef++;
        }

        while (ri > qry[i].r)
        {
            del(ri);
            ri--;
        }

        anss[qry[i].id] = now;
    }
    for (int i = 0; i < m; i++)
    {
        cout << anss[i] << '\n';
    }
}
```

#### [小楠的数组询问（easy）](https://ac.nowcoder.com/acm/contest/130737/E)

- **核心模型**:普通莫队＋意料不到的优化
- **思维误区 (Bug)**:计算复杂度：**莫队算法复杂度是：n根号q起步，重点在你怎么去优化每一步的操作**
- **修正逻辑 (Patch)**:这个数据范围n方根号过不了呜呜呜。。学习到可以同时把ri lef带进去计算，不影响。以及求区间交集的预处理
- **关键代码**:

```cpp

struct qury
{
    int l, r;
    int id;
};

void solve()
{
    int n;
    cin >> n;
    int q;
    cin >> q;
    // cerr<<"YUANSHEN";
    vi nums(n + 1);
    for (int i = 1; i <= n; i++)
    {
        cin >> nums[i];
    }
    vector<qury> qry(q);
    rep(i, 0, q - 1)
    {
        cin >> qry[i].l >> qry[i].r;
        qry[i].id = i;
    }

    vector<vi> qzh(n + 1, vi(n + 1, 0));
    // cerr<<"YUANSHEN";
    for (int i = 1; i <= n; i++)
    {
        for (int j = i; j <= n; j++)
        {
            qzh[i][j] = qzh[i][j-1] | nums[j];
        }
    }

    vector<vector<qury>> zuo(n + 1);
    vector<vector<qury>> you(n + 1);

    for (int i = 1; i <= n; i++)
    {
        int now = nums[i];
        int st = i;
        for (int j = i + 1; j <= n; j++)
        {
            if (qzh[i][j] != now)
            {
                you[i].push_back({st, j - 1, now});
                now = qzh[i][j];
                st = j;
            }
        }
        you[i].push_back({st, n, now});
        int ed = i;
        now = nums[i];
        for (int j = i - 1; j >= 1; j--)
        {
            if (qzh[j][i] != now)
            {
                zuo[i].push_back({j + 1, ed, now});
                now = qzh[j][i];
                ed = j;
            }
        }
        zuo[i].push_back({1, ed, now});
    }
  
    // cerr<<"YUANSHEN";
    int B = max(1ll, (int)sqrt(n + 1));
    sort(all(qry), [&](qury a, qury b)
         {
    if(a.l/B!=b.l/B)
    {
        return a.l/B<b.l/B;
    }
    else  
    {
        return a.r<b.r;
    } });
    // cerr<<"YUANSHEN";
    map<int, int> lab;
    int lef = 1;
    int ri = 0;
    auto addl = [&](int x) -> void
    {
        // cerr<<"YUANSHEN";
        for (auto it : you[x])
        {
            // cerr<<it.id<<' '<< abs(it.r - max(x, it.l))<<'\n';
            lab[it.id] += max(0ll, min(it.r, ri) - max(x, it.l) + 1);
        }
    };
    auto addr = [&](int x) -> void
    {
        for (auto it : zuo[x])
        {
            lab[it.id] += max(0ll, min(it.r, x) - max(lef, it.l) + 1);
        }
        // cerr<<"YUANSHEN";
    };
    auto delr = [&](int x) -> void
    {
        for (auto it : zuo[x])
        {
            // lab[it.id] -= abs(min(x, it.r) - it.l);
            lab[it.id] -= max(0ll, min(it.r, x) - max(lef, it.l) + 1);
        }
        // cerr<<"YUANSHEN";
    };
    auto dell = [&](int x) -> void
    {
        for (auto it : you[x])
        {
            lab[it.id] -= max(0ll, min(it.r, ri) - max(x, it.l) + 1);
        }
    };
    // cerr<<"YUANSHEN";
    vector<pii> pans(q);

    for (int i = 0; i < q; i++)
    {
        // cerr<<"YUANSHEN";
        while (lef > qry[i].l)
        {
            lef--;
            addl(lef);
        }
        while (ri < qry[i].r)
        {
            ri++;
            addr(ri);
        }
        while (lef < qry[i].l)
        {
            dell(lef);
            lef++;
        }
        while (ri > qry[i].r)
        {
            delr(ri);
            ri--;
        }

        int cnt = -1;
        int cnt2 = 0;
        for (auto itt : lab)
        {
           // cerr << itt.second << ' ' << itt.first << '\n';
            cnt = max(itt.second, cnt);
        }

        int ans = 0;

        for (auto itt : lab)
        {
            if (itt.second == cnt)
            {

                ans = itt.first;
                cnt2++;
            }
        }

        pans[qry[i].id] = {cnt2, ans};
    }

    for (int i = 0; i < q; i++)
    {
        cout << pans[i].first << ' ' << pans[i].second << '\n';
    }
}

```

---
---
