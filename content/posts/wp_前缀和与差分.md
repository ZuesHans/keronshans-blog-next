---
title: wp_差分与前缀和
date: 2025-12-06
tags:
    - 前缀和与差分
    - 算法
    - Problems
cover: /img/cover/picg_3.png
---
[toc]

## 差分与前缀和

### 差分 + 前缀和原理

**用途**：区间修改后求点值或最小值。  
**常见坑**：差分数组需初始化，注意边界。

```cpp
struct niubi {
    int l, r, gap;
};
void solve() {
    int n, p;
    cin >> n >> p;
    vector<int> c(n + 1);
    for (int i = 1; i <= n; i++) cin >> c[i];
    vector<int> hsh(5e6 + 1);
    for (int i = 1; i <= n; i++) hsh[i] = c[i] - c[i-1];
    vector<niubi> nums(p + 1);
    for (int i = 1; i <= p; i++)
        cin >> nums[i].l >> nums[i].r >> nums[i].gap;
    for (int i = 1; i <= p; i++) {
        hsh[nums[i].l] += nums[i].gap;
        hsh[nums[i].r + 1] -= nums[i].gap;
    }
    vector<int> hsh2(5e6 + 1);
    hsh2[1] = hsh[1];
    for (int i = 2; i <= n; i++)
        hsh2[i] = hsh2[i-1] + hsh[i];
    int ans = 201;
    for (int i = 1; i <= n; i++)
        ans = min(ans, hsh2[i]);
    cout << ans << '\n';
}
```

**复杂度**：O(n+p)，空间 O(n)。

### 二维差分

#### P2280 [HNOI2003] 激光炸弹

- **题号**: P2280
- **链接**: [题目链接]<https://www.luogu.com.cn/problem/P2280>
- **算法类型**: 二维差分
- **算法**:
  - 二维差分的适用性

> **离散化地图**：目标点的坐标 $(x_i, y_i)$ 分布在 $0 \leq x_i, y_i \leq 5000$ 的整数格点上，可以用一个二维数组 $sum[x][y]$ 记录每个格点 $(x, y)$ 的总价值（可能有多个目标点在同一位置）。
>**区域和计算**：对于一个正方形区域 $[x, x+m-1] \times [y, y+m-1]$，我们需要快速计算这个矩形区域内所有点的价值和。直接遍历点的时间复杂度为 $O(n)$，而通过二维前缀和或二维差分，可以将区域和的计算优化到 $O(1)$ 或接近 $O(1)$。

- 二维前缀和方程（自推）

```cpp

   pre[i][j]=pre[i][j-1]+pre[i-1][j]-pre[i-1][j-1]
```

- **代码错误**

 >无偏移的问题：
 >>**“边界不摧毁”对你的代码没有影响**，问题出在别处。
错误细节：坐标范围：0 ~ 5000。
>
> - 对于 m=1，右下角最小应为0（单点覆盖），但你从1开始，漏掉坐标0的单点。
样例中有点(0,0)和(1,1)，你只算到(1,1)，碰巧输出1（过了样例），但如果测试点只有(0,0)或依赖低坐标，必然错。
> - 对于更大m，如果目标集中在x=0 ~ m-2，需要左上=0的正方形来覆盖，你也漏了。

  简单来说，你的原代码从 *int j = m* 开始，导致至少从 *（1，1）*开始查找，会导致漏掉边界数据

- **AC 代码**:

```cpp

for (int i = 1; i <= 5001; i++)
    {
        for (int j = 1; j <= 5001; j++) // i是列j是行记得记得别搞乱了
        {
            if (i == 1 && j == 1)
                continue;
            dbg(i, j);
            if (i == 1)
            {
                arr[1][j] = arr[1][j - 1] + arr[1][j];
                continue;
            }
            if (j == 1)
            {
                arr[i][1] = arr[i - 1][1] + arr[i][1];
                continue;
           }
            arr[i][j] = arr[i][j - 1] + arr[i - 1][j] - arr[i - 1][j - 1] + arr[i][j];
        }
    }
    int ans = 0;
    for (int i = m; i <= 5001; i++)
    {
        for (int j = m; j <= 5001; j++) // i是列j是行记得记得别搞乱了
        {
            int hsh = arr[i][j] - arr[i - m][j] - arr[i][j - m] + arr[i - m][j - m];
            ans = max(ans, hsh);
        }
    }
    cout << ans;

```

- **改进思路**:
  - 二维差分适合这道题，因为它能高效处理二维平面上的矩形区域和问题，通过预处理将区域和查询优化到 $O(1)$，总复杂度可控

### 二阶差分

#### P5026 Lycanthropy

- **题号**: P5026
- **链接**: [题目链接]<https://www.luogu.com.cn/problem/P5026>
- **算法类型**: 差分，O(1)查询，指针/index模拟坐标正负数
- **错误原因**:
  - 数组范围
  - 指针运用
- **AC 代码**:
  - **第一：指针法**

```cpp
int hsh[2100000]；
int ljl[2100000];
void solve()
{
    // 1-based
    int n, m;
    cin >> n >> m;
    int *a = hsh + 1000000;
    int *b=ljl+1000000;
    for (int i = 1; i <= n; i++)
    {
        int v, x;
        cin >> v >> x;
        a[x - 3 * v + 1] += 1;
        a[x - 2 * v+1] -= 2;
        a[x + 1] += 2;
        a[x + 2 * v+1] -= 2;
        a[x + 3 * v + 1] += 1;
    }
    for (int i =-40000 ; i <= 40000+m; i++)
    {
        a[i] += a[i - 1];
        b[i]+=b[i-1]+ a[i];
    }
  for (int i = 1; i <= m; i++)
    {
        cout <<b[i]<<' ';
    }
}
```

- **index补充**

  ```cpp
  const int offset = 1000000;
  const int SIZE = 2100000; // 确保 SIZE > 2 * OFFSET
    // 创建 vector 并初始化所有元素为 0
    // 使用 long long 防止累加时溢出
    vector<ll> a(SIZE, 0); 
    vector<ll> b(SIZE, 0);
    // --- 改动结束 ---
        // 所有访问都加上 OFFSET
        a[x - 3 * v + 1 + OFFSET] += 1;
        a[x - 2 * v + 1 + OFFSET] -= 2;
  ```

- **注意事项**:
  - 如果非要用指针，记得在全局变量的地方定义它，要不然全都在访问垃圾值！！
  - 如果用vector容器（推荐），记得想好index和偏移量的关系
- **双重差分算法讲解**:
  - 首先你要记得：双重差分的递推**在同一个循环里同时操作**
  - 二阶差分：解决“区间加等差数列”
  - 难点：边界条件处理

>*以下是思考路径记录，比赛跳过*
>
> - 思考：“为了让数组在 X 点之后呈现出我想要的效果，我应该在差分数组的 X 点做什么操作？”
>
>>根据一阶差分我们可知我们可以通过给a[l]++，a[**r+1**]--表达区间内的统一操作（++）
>>那么同理易得二阶差分里面我们要实现增长可以a[l]++,a[r+1]--
>
> - 首先我知道差分数组本身的差分处理意义就是去通过去打标记实现最终o1的复杂度。
> - 对于其中一阶差分数组的处理实质上只是打标记
> - 而实现让二阶数组呈现增长是因为**前缀和**
> - 如果我们再进行一个三阶前缀和就会让她呈现x方的增长
> - 而修改它+1还是-2单纯是因为增长点和下降点重合了
> - 如何处理我们“W”形的上下坡操作边界？我们发现对a[r+1]的修改叠在了一起，一段的终点就是下一段的起点

  ```cpp
    a[i] += a[i - 1];
    b[i]+=b[i-1]+ a[i];
  ```

### 三阶差分

#### 说重话:简单推式子，沉住气同时处理就好

>小 A 的好好师兄牛哥在去上班前给小 A 拟定了一份 $m$ 项的奋斗清单。清单每行包含两个数字，分别代表奋斗事项类型和从第几天开始。已知对于第 $x$ 天开始的奋斗事项有：
>
> - 奋斗事项 1：从 $x$ 天开始多奋斗 $1$ 小时，第 $x+1$ 天多奋斗 $2$ 小时，第 $x+2$ 天多奋斗 $3$ 小时... ，从 $x$ 天往后的第 $k$ 天多奋斗 $k+1$ 个小时，持续到第 $n$ 天。
>
> - 奋斗事项 2：从 $x$ 天开始多奋斗 $1$ 小时，第 $x+1$ 天多奋斗 $4$ 小时，第 $x+2$ 天多奋斗 $9$ 小时... ，从 $x$ 天往后的第 $k$ 天多奋斗 $(k+1)^2$ 个小时，持续到第 $n$ 天。
>
>帮他算出每天需要奋斗多少个小时。请输出答案对 $10^9+7$ 取模后的结果。
>
> 数据范围
>
>保证所有测试用例的 $n$ 之和与 $m$ 之和均不大于 $10^5$

```cpp

for (int i = 1; i <= n; i++)
    {
        b1[i] = (b1[i - 1] + a1[i])%MOD;
        b2[i] = (b2[i - 1] + a2[i])%MOD;
        c1[i]=(c1[i-1]+b1[i])%MOD;
        c2[i]=(c2[i-1]+b2[i])%MOD;
        d[i]=(d[i-1]+c2[i])%MOD;
        ans[i]=((d[i]+d[i-1])%MOD+c1[i])%MOD;
    }
for (int i = 1; i <= n; i++)
    {
        cout<<ans[i]<<' ';
    }

```

---

### 重叠线段覆盖处理

**用途**：计算多段重叠后的总覆盖长度。  
**常见坑**：排序后处理重叠，注意边界。

```cpp
void solve() {
    int n;
    cin >> n;
    vector<int> l(n), r(n);
    for (int i = 0; i < n; i++)
        cin >> l[i] >> r[i];
    sort(l.begin(), l.end());
    sort(r.begin(), r.end());
    int ans = 0;
    for (int i = 0; i < n; i++) {
        ans += r[i] - l[i];
        if (i + 1 < n && r[i] >= l[i + 1])
            ans -= (r[i] - l[i + 1]);
    }
    cout << ans << '\n';
}
```

**复杂度**：O(n*log n)，空间 O(n)。

---

## 离散化

### 离散化裸题

#### [赤壁之战]([题目URL](https://www.luogu.com.cn/problem/P1496))

- **核心模型**:离散化
- **思维误区 (Bug)**:记住离散化的前缀和是只用给pre[r]--，因为是把距离压缩到前面那个点
- **修正逻辑 (Patch)**:使用erase和uniqe，记得erase需要nums.end(*)
- **关键代码**:

```cpp
void solve()
{
    int n;
    cin >> n;
    vector<int> arr = {(int)-1e18,(int)1e18};
    vector<int> bg(n);
    vector<int> ed(n);
    for (int i = 0; i < n; i++)
    {
        cin >> bg[i] >> ed[i];
        arr.push_back(bg[i]);
        arr.push_back(ed[i]);
    }
    sort(arr.begin(), arr.end());
    arr.erase(unique(arr.begin(), arr.end()));
    int m = arr.size();
    vector<int> pre(m + 2);
    for (int i = 0; i < n; i++)
    {
        int l = lower_bound(arr.begin(), arr.end(), bg[i]) - arr.begin();
        int r = lower_bound(arr.begin(), arr.end(), ed[i]) - arr.begin();
        pre[l]++;
        pre[r]--;
    }

    int ans = 0;
    for (int i = 1; i < m + 1; i++)
    {
        pre[i] = pre[i] + pre[i - 1];
    }
    bool ok = true;
    for(int i=0;i<m-1;++i)
    {
        if(pre[i])
        {
            ans+=arr[i+1]-arr[i];
        }
    }
    cout << ans;
}
```

---
