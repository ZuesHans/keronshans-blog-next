---
title: KH优化算法
date: 2025-11-13
tags:
    - C++
    - 算法
    - Trick
    - 杂项
cover: /img/cover/picg_3.png
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
