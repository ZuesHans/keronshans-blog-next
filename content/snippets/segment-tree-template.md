---
id: "segment-tree-template"
title: "线段树模板"
language: "C++"
tags:
  - 数据结构
  - 线段树
  - 区间查询
description: "经典线段树区间加、区间求和模板"
created_at: "2026-04-01 06:00:00"
updated_at: "2026-04-01 06:00:00"
---

经典线段树，支持区间修改 + 区间查询：

```cpp
#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
const int MAXN = 100005;

int n, m;
ll a[MAXN];
ll tr[MAXN * 4], lz[MAXN * 4];

void build(int p, int l, int r) {
    if (l == r) { tr[p] = a[l]; return; }
    int mid = (l + r) >> 1;
    build(p * 2, l, mid);
    build(p * 2 + 1, mid + 1, r);
    tr[p] = tr[p * 2] + tr[p * 2 + 1];
}

void pushdown(int p, int l, int r) {
    if (!lz[p]) return;
    int mid = (l + r) >> 1;
    tr[p * 2] += lz[p] * (mid - l + 1);
    tr[p * 2 + 1] += lz[p] * (r - mid);
    lz[p * 2] += lz[p];
    lz[p * 2 + 1] += lz[p];
    lz[p] = 0;
}

void update(int p, int l, int r, int ql, int qr, ll v) {
    if (ql <= l && r <= qr) {
        tr[p] += v * (r - l + 1);
        lz[p] += v;
        return;
    }
    pushdown(p, l, r);
    int mid = (l + r) >> 1;
    if (ql <= mid) update(p * 2, l, mid, ql, qr, v);
    if (qr > mid) update(p * 2 + 1, mid + 1, r, ql, qr, v);
    tr[p] = tr[p * 2] + tr[p * 2 + 1];
}

ll query(int p, int l, int r, int ql, int qr) {
    if (ql <= l && r <= qr) return tr[p];
    pushdown(p, l, r);
    int mid = (l + r) >> 1;
    ll res = 0;
    if (ql <= mid) res += query(p * 2, l, mid, ql, qr);
    if (qr > mid) res += query(p * 2 + 1, mid + 1, r, ql, qr);
    return res;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    cin >> n >> m;
    for (int i = 1; i <= n; i++) cin >> a[i];
    build(1, 1, n);
    while (m--) {
        int op; cin >> op;
        if (op == 1) {
            int l, r; ll v;
            cin >> l >> r >> v;
            update(1, 1, n, l, r, v);
        } else {
            int l, r; cin >> l >> r;
            cout << query(1, 1, n, l, r) << '\n';
        }
    }
    return 0;
}
```
