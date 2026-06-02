---
title: KH_线性基
tags:
    - 数学
    - 算法
cover: /img/cover/picg_4.png
---
## 线性基

### 线性基模板

```cpp
struct LinearBasis {
    ll d[64];
    ll p[64]; // 用于重建后的基，方便求第 k 小
    int cnt;  // 线性基中元素的个数
    bool has_zero; // 是否可以异或出 0

    LinearBasis() {
        fill(d, d + 64, 0);
        fill(p, p + 64, 0);
        cnt = 0;
        has_zero = false;
    }

    // 核心插入操作
    bool insert(ll x) {
        for (int i = 62; i >= 0; i--) {
            if (!(x >> i)) continue;
            if (!d[i]) {
                d[i] = x;
                cnt++;
                return true;
            }
            x ^= d[i];
        }
        has_zero = true; // 如果最后变成了 0，说明存在线性相关，可以表示出 0
        return false;
    }

    // 求最大异或和
    ll query_max() {
        ll res = 0;
        for (int i = 62; i >= 0; i--) {
            if ((res ^ d[i]) > res) res ^= d[i];
        }
        return res;
    }

    // 求最小异或和（非空子集）
    ll query_min() {
        if (has_zero) return 0;
        for (int i = 0; i <= 62; i++) {
            if (d[i]) return d[i];
        }
        return 0;
    }

    // 重建线性基：使每一位独立，用于求第 k 小
    void rebuild() {
        cnt = 0;
        for (int i = 62; i >= 0; i--) {
            for (int j = i - 1; j >= 0; j--) {
                if ((d[i] >> j) & 1) d[i] ^= d[j];
            }
        }
        for (int i = 0; i <= 62; i++) {
            if (d[i]) p[cnt++] = d[i];
        }
    }

    // 求异或空间中第 k 小的值 第k大的等于->(Total - k + 1)
    ll query_kth(ll k) {
        if (has_zero) k--; // 如果能表示0，第1小就是0，所以k要减1
        if (k >= (1LL << cnt)) return -1; // k 超出了表示范围
        if (k == 0) return 0;
        ll res = 0;
        for (int i = 0; i < cnt; i++) {
            if ((k >> i) & 1) res ^= p[i];
        }
        return res;
    }
};

```

### 前缀线性基& 线性基O(C)卡log环境下不需要rebuild优化做法

#### [区间异或第k大](https://ac.nowcoder.com/acm/contest/132045/A)

- **修正逻辑 (Patch)**:求异或第k大->线性基 这里有不rebuild的做法
- **关键代码**:

```cpp
struct LinearBasis
{
    ll d[64];
    ll p[64];      // 用于重建后的基，方便求第 k 小
    int cnt;       // 线性基中元素的个数
    bool has_zero; // 是否可以异或出 0
    ll ps[64];
    LinearBasis()
    {
        fill(d, d + 64, 0);
        fill(p, p + 64, 0);
        fill(ps, ps + 64, 0);
        cnt = 0;
        has_zero = false;
    }

    // 核心插入操作
    bool insert(ll x, int pos)
    {
        for (int i = 62; i >= 0; i--)
        {
            if (!x)
                break;
            if (!(x >> i))
                continue;
            if (!d[i])
            {
                d[i] = x;
                cnt++;
                ps[i] = pos;
                return true;
            }
            if (pos > ps[i])
            {
                swap(x, d[i]);
                swap(pos, ps[i]);
            }
            x ^= d[i];
        }
        has_zero = true; // 如果最后变成了 0，说明存在线性相关，可以表示出 0
        return false;
    }
};

struct qury
{
    int l, r;
    int k;
    int id;
};
void solve()
{
    int n, q;
    cin >> n >> q;
    vi nums(n);
    for (int i = 0; i < n; i++)
    {
        cin >> nums[i];
    }
    vector<qury> qry;
    for (int i = 0; i < q; i++)
    {
        int l, r;
        cin >> l >> r;
        l--, r--;
        int k;
        cin >> k;
        qry.push_back({l, r, k, i});
    }
    LinearBasis lb;
    sort(all(qry), [](qury a, qury b)
         {
    if(a.r!=b.r)return a.r<b.r;
    else
        return a.l>b.l; });
    int tp = 0;
    vi ans(q);
    for (int i = 0; i < q; i++)
    {
        auto [l, r, k, id] = qry[i];
        // cerr<<r<<' '<<tp<<'\n';
        while (tp <= r)
        {
            lb.insert(nums[tp], tp);
            tp++;
        }
        vi now(64);
        int c = 0;
        vi heit(64);
        // cerr<<l<<' ';
        for (int j = 60; j >= 0; j--)
        {
            // cerr<<lb.ps[j]<<' ';
            if (lb.ps[j] >= l && lb.d[j])
            {
                now[c] = lb.d[j];
                heit[c] = j;
                c++;
            }
            //  cerr<<c<<' ';
        }

        if (k > (1ll << c))
        {
            ans[id] = -1;
        }
        else
        {
            // cerr<<"wtf"<<'\n';
            int res = 0;
            int rnk = (1ll << c) - k;
            for (int j = 0; j < c; j++)
            {
                int sod = (rnk >> (c - (j + 1))) & 1;
                int real = (res >> heit[j]) & 1;

                if (sod ^ real)
                {
                    res ^= now[j];
                }
            }
            ans[id] = res;
        }
    }
    for (int i = 0; i < q; i++)
    {
        cout << ans[i] << '\n';
    }
}
```

---
