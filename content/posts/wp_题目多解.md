---
title: wp_题目多解
date: 2025-12-13
tags:
    - 算法
    - Problems

cover: /img/cover/picg_16.png
---


## [P7913 [CSP-S 2021] 廊桥分配](https://www.luogu.com.cn/problem/P7913)

- 通用优化：前缀和优化输出答案

### 优先队列模拟

- 优先队列模拟飞机进入时贪心分配廊道
- 前缀和优化快速查询
- 离散化思想

```cpp
struct tim
{
    int l, r;
};

void solve()
{
    int n, m1, m2;
    cin >> n >> m1 >> m2;

    vector<tim> gn(m1);
    vector<tim> gw(m2);

    rep(i, 0, m1 - 1) cin >> gn[i].l >> gn[i].r;
    rep(i, 0, m2 - 1) cin >> gw[i].l >> gw[i].r;

    auto px = [&](vector<tim> &a,vi &pre) -> void
    {
        priority_queue<pii, vector<pii>, greater<pii>> man;
        priority_queue<int, vi, greater<>> xian;

        vi cnt(n + 2, 0);
        int idx = 0;
        for (auto it : a)
        {
            while(!man.empty() && it.l > man.top().first)
            {
                xian.push(man.top().second);
                man.pop();
            }

            int now=0;
            if(!xian.empty())
            {
                now=xian.top();
                xian.pop();
            }
            else 
            {
                idx++;
                now=idx;
            }
            if(now<=n)
            {
                cnt[now]++;
                man.push({it.r,now});

            }

        }

        for(int i=1;i<=n;i++)
        {
            pre[i]=cnt[i]+pre[i-1];
        }
    };

    sort(all(gn), [&](tim a, tim b)
         { return a.l < b.l; });
    sort(all(gw), [&](tim a, tim b)
         { return a.l < b.l; });

    vi pre1(n+2);
    vi pre2(n+2);

    px(gn,pre1);
    px(gw,pre2);

    ll ans=-1;
    for(int i=0;i<=n;i++)
    {
        ans=max(ans,(ll)pre1[i]+pre2[n-i]);
    }
cout<<ans<<'\n';

}

```

### set模拟（和优先队列做法没什么区别）

- 需要重载运算符，很坏
- 代码思路非常直观
- 写的时候经典漏掉剪枝和判断
- 同时也属于贪心

```cpp
struct tmw
{
    int l, r;
    bool operator<(const tmw &other) const
    {
        return l < other.l;
    }
};

void solve()
{
    int n, m1, m2;
    cin >> n >> m1 >> m2;

    vector<tmw> p1(m1);
    vector<tmw> p2(m2);

    rep(i, 0, m1 - 1)
    {
        cin >> p1[i].l >> p1[i].r;
    }
    rep(i, 0, m2 - 1)
    {
        cin >> p2[i].l >> p2[i].r;
    }

    auto act = [&](vector<tmw> &a, vi &pre) -> void
    {
        multiset<tmw> mp;
        for (auto hsh : a)
        {
            mp.emplace(hsh);
        }

        vi cnt(n + 2);
        for (int i = 1; i <= n; i++)
        {
            if (mp.empty())
                break;   // 漏了一个非常重要的set是否空剪枝
            int now = 0; // 这里漏了一个初始化
            while (1)
            {
                auto it = mp.lower_bound({now, 0});
                if (it == mp.end())
                    break;
                cnt[i]++;
                now = it->r;

                mp.erase(it);
            }
        }

        for (int i = 1; i <= n; i++)
        {
            pre[i] = pre[i - 1] + cnt[i];
        }
    };

    vi pre1(n + 1);
    vi pre2(n + 1);

    act(p1, pre1);
    act(p2, pre2);

    ll ans = -1;
    for (int i = 0; i <= n; i++)
    {
        ans = max(ans, (ll)pre1[i] + pre2[n - i]);
    }
    cout<<ans<<'\n';
}

```

### 分离事件将区间化成离散的时间点

- 将大根堆存的区间用桶和排序来替代

```cpp
struct tmw
{
    int t, id, can;
};

void solve()
{
    int n, m1, m2;
    cin >> n >> m1 >> m2;

    vector<tmw> p1;
    vector<tmw> p2;

    rep(i, 0, m1 - 1)
    {
        tmw a;
        tmw b;

        cin >> a.t >> b.t;
        a.id = b.id = i;
        a.can = 1;
        b.can = 0;
        p1.push_back(a);
        p1.push_back(b);
    }
    rep(i, 0, m2 - 1)
    {
        tmw a;
        tmw b;

        cin >> a.t >> b.t;
        a.id = b.id = i;
        a.can = 1;
        b.can = 0;
        p2.push_back(a);
        p2.push_back(b);
    }

    auto act = [&](vector<tmw> &a, vi &pre) -> void
    {
        sort(all(a), [&](tmw a, tmw b)
             { if(a.t!=b.t)return a.t < b.t;
            else return a.can>b.can; });
        int p = a.size() / 2;
        priority_queue<int, vi, greater<>> pq;

        for (int i = 1; i <= p; i++)
        {
            pq.emplace(i);
        }
        vi cnt(max(n, p) + 2);//数组开太小
        vi opy(max(n, p) + 2);
        for (auto hsh : a)
        {
            if (hsh.can)
            {
                cnt[pq.top()]++;
                opy[hsh.id] = pq.top();
                pq.pop();
            }
            else
            {
                pq.emplace(opy[hsh.id]);
            }
        }
        for (int i = 1; i <= n; i++)
        {
            pre[i] = pre[i - 1] + cnt[i];
        }
    };

    vi pre1(n + 2);
    vi pre2(n + 2);

    act(p1, pre1);
    act(p2, pre2);

    ll ans = -1;
    for (int i = 0; i <= n; i++)
    {
        ans = max(ans, (ll)pre1[i] + pre2[n - i]);
    }
    cout << ans;
}

```
