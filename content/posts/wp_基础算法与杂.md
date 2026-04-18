---
title: wp_基础算法与杂
date: 2025-12-05 16:50:10
tags:
  - 算法
  - C++
  - Problems
  - STL
  - tricks
cover: /img/cover/picg_11.png

math: true
---
## 基础算法

### 二分搜索

**用途**：答案单调时逼近最优解。  
**常见坑**：

- 最小值模板：if(check) r=mid else l=mid+1。
- 最大值模板：if(check) l=mid else r=mid-1。
- 注意边界（left 初始化为最大单元素）。

#### 货运难题

```cpp
int n, k;
bool check(int pans, const vector<int> &nums) {
    int hsh = 0, cnt = 0;
    for (int i = 0; i < n; i++) {
        if (hsh + nums[i] > pans) {
            cnt++;
            hsh = nums[i];
        } else
            hsh += nums[i];
    }
    return cnt <= k-1;
}
void solve() {
    cin >> n >> k;
    vector<int> nums(n);
    int sum = 0, zd = 0;
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
        sum += nums[i];
        zd = max(zd, nums[i]);
    }
    int left = zd, right = sum;
    while (left < right) {
        int mid = (left + right) / 2;
        if (check(mid, nums)) right = mid;
        else left = mid + 1;
    }
    cout << left << '\n';
}
```

**复杂度**：O(n*log(sum))，空间 O(n)。

### 二分与边界处理

#### E. khba Loves to Sleep

- **题号**: E
- **链接**: [题目链接](https://codeforces.com/contest/2167/problem/E)
- **算法类型**: 二分，边界处理
- **错误原因**:
  - 边界处理
- **AC 代码**//只能放自己ac的代码！:

```cpp
bool cek(int a, const vi &pos)
{
    int cnt = 0;
    if (pos[1] - a >= 0)
    {
        cnt += pos[1] - a + 1;
    }
    for (int i = 1; i < n; i++)
    {
        if ((pos[i + 1] - pos[i]) / 2 >= a)
        {
            cnt += (pos[i + 1] - a) - (pos[i] + a)+1;
        }
    }
    if (pos[n] + a <= x)
    {
        cnt += x - (pos[n] + a) + 1;
    }
    return cnt >= k;
}

void findans(int d, const vi &pos, vi &ans)
{
    if(d==0)
    {
         for (int i = 0; i <= n; i++)
        {
            ans.push_back(i);
        }
        return;
    }
    if (pos[1] - d >= 0)
    {
        int ljl = 0;
        int hsh = pos[1] - d;
        for (int i = ljl; i <= hsh; i++)
        {
            ans.push_back(i);
        }
    }

    for (int i = 1; i <= n-1; i++)
    {
        if ((pos[i + 1] - pos[i]) / 2 >= d)
        {
            int ljl = pos[i] + d;
            int hsh = pos[i + 1] - d;
            for (int j = ljl; j <= hsh; j++)
            {
                ans.push_back(j);
                
            }
        }
     
    }
    if (pos[n] + d <= x)
    {
        int ljl = pos[n] + d;
        int hsh = x;
        for (int i = ljl; i <= hsh; i++)
        {
            ans.push_back(i);
        }
    }
}
```

- **注意事项**:
  - 边界处理
  - 如果要*修改答案数组*记得要**取地址**！
  - 以及输出记得要**输出到ans.size()**，要不然会ub（可能编译器一开始不管k在哪）

```cpp

    for (int i = 0; i < ans.size(); i++)
    {
        if(i==k)break;
        cout << ans[i]<<' ';
    }
```

- **改进思路**:
  - 看到答案单调直接答案二分，这道题算法不难，只是一个锻炼码力的分类讨论比赛题

---

### 三分答案

#### 牛牛战队的比赛地(三分教学)

- [link]<https://ac.nowcoder.com/acm/contest/120454/F>
- **题意简述**：给出若干个点的坐标，在x轴上找到某点使得该点与给出的点距离的最大值最小，求这个最大值最小的值(数据范围:点的数量1e5，坐标范围-1e9到1e9)
- **tag** ：计算几何，二分答案/三分
- **思路做法**：
  - 首先读题：`距离的最大值最小值`，再看数据范围：遍历法：1e23？？
  - 问题转化：这里我们有两种转化思路：1.找到`最大值最小的值`，对可能的答案进行二分。求：是否有一个答案满足：对于所有点来说，必然存在一个共同的点（或者区间）在x轴上，与他距离为r ->求圆覆盖交集问题 -> cek函数：求交集
    思路2.按照题目的顺思路：对x轴进行三分，找到符合要求的点，不需要写cek，直观简单
    缺点：我不会三分
- **新算法：三分**
  - 和二分的区别：二分对象具有单调性;判断“是否可行” → 二分答案（如最小化最大值）
                 三分直接求凸函数极值（无 check 可写）
  - 三分用处：适合答案有**类似于凸函数的性质**
    - 求函数最值
    - 求唯一最小值
    - 求最远点对，圆覆盖问题转化
    - 概率期望优化
  - 注意事项：
    - 在1e9到1e12循环100次
    - 函数需要单峰
    - 整数域使用最好用二分
  - 三分模板

    ```cpp
        double ternary_search(double l, double r) {
             for (int i = 0; i < 100; i++) {
             double m1 = l + (r - l) / 3;
             double m2 = r - (r - l) / 3;
            if (f(m1) < f(m2)) r = m2;
            else l = m1;
        }
         return (l + r) / 2;
    }
    ```

- **AC代码**：二分答案（适合答案有**单调性**）

```cpp
struct node
{
    double x, y;
};
bool check(double r, const vector<node> &jd)
{
    double le = -1e9;
    double ri = 1e9;
    for (node hsh : jd)
    {
        if (fabs(hsh.y) > r + EPS)
            return false;//剪枝
        double dy = hsh.y;
        double dx = sqrt(max(0.0, r * r - dy * dy));
        le = max(le, hsh.x - dx);
        ri = min(ri, hsh.x + dx);
    }
    return le <= ri + EPS;
}
void solve()
{
    int n;
    cin >> n;
    vector<node> jd(n);

    rep(i, 0, n - 1)
    {
        double a, s;
        cin >> a >> s;
        jd[i].x = a;
        jd[i].y = s;
    }
    double l = 0, r = 3e4;
    for(int i=0;i<=100;i++)
    {
        double mid = (l + r) / 2;
        if (check(mid,jd))
            r = mid;
        else
            l = mid;
    }
    cout << fixed << setprecision(10) << l<< '\n';
}
```

- **AC代码**：三分（适合答案有**凸函数的性质**）

```cpp
struct Point
{
    double x, y;
    Point(double x = 0, double y = 0) : x(x), y(y) {}
    Point operator-(const Point &b) const { return Point(x - b.x, y - b.y); }
    double len() const { return hypot(x, y); }
};
double Dist(Point a, Point b) { return (a - b).len(); } // 需要重载.len()
double mxdist(const vector<Point> &rec, Point c)
{
    double s = 0;
    for (Point hsh : rec)
    {
        s = max(Dist(hsh, c), s);
    }
    return s;
}
void solve()
{
    int n;
    cin >> n;
    vector<Point> rec(n);
    rep(i, 0, n - 1)
    {
        cin >> rec[i].x >> rec[i].y;
    }
    double l = -1e9;
    double r = 1e9;
    for (int i = 0; i < 100; i++)
    {
        double m1 = l + (r - l) / 3;
        double m2 = l + (r - l) * 2 / 3;
        Point c1 = {m1, 0};
        Point c2 = {m2, 0};
        if (mxdist(rec, c1) < mxdist(rec, c2))
            r = m2;
        else
            l = m1;
    }
    cout << fixed << setprecision(10) << mxdist(rec, {l, 0});
}
```

- **注意事项**：double有精度丢失：用 for(int i=0;i<=100;i++)实现各种操作

---

## 双指针

**用途**：滑动窗口、区间统计。  
**常见坑**：防止越界，注意快慢指针逻辑。

### 快慢指针

#### 子段乘积->滑动窗口

- **题号**: C
- **链接**: [题目链接](https://ac.nowcoder.com/acm/contest/120453/C)
- **算法类型**: 滑动窗口（双指针）
- **AC 代码**:

```cpp
void solve()
{
    int n, k;
    cin >> n >> k;
    vi nums(n + 1);
    rep(i, 1, n)
    {
        cin >> nums[i];
    }

    int left = 1;
    int right = 1;
    int ans = 0;
    int sz = 1;
    int mod = 998244353;
    while (right <= n)
    {
        while (right <= n && left + k > right)
        {
            if (nums[right] == 0)
            {
                left = right + 1;
                right = left;
                sz = 1;
                continue;
            }
            sz = (sz * nums[right]) % mod;
            right++;
        }
        if (right > n || left > n - k)
            break;

       // if (right - left == k)这是保险起见之举，事实上没有必要
            ans = max(ans, sz);

        sz = (sz * inverse_fermat(nums[left], mod)) % mod;
        left++;
    }
    cout << ans;
}

```

- **注意事项**:
  - 1-Based存数方式lr初始在1
  - 记得滑动窗口的while，不要惯性思维认为*答案更新*/*大小比较*都在while的末尾。while只是一个路径，前面是快指针移动，后面是慢指针移动。中间夹着你的数字更新
  - 适用于固定区间长度的数据处理
  - 维护r的界限和nums[r]的更新逻辑是难点

#### 子段乘积（简单）

- **题号**: C
- **链接**: [题目链接](https://ac.nowcoder.com/acm/contest/120453/C)
- **算法类型**: 滑动窗口（双指针）
- **AC 代码**:

```cpp
void solve()
{
    int n, k;
    cin >> n >> k;
    vi nums(n + 1);
    rep(i, 1, n)
    {
        cin >> nums[i];
    }

    int left = 1;
    int right = 1;
    int ans = 0;
    int sz = 1;
    int mod = 998244353;
    while (right <= n)
    {
        while (right <= n && left + k > right)
        {
            if (nums[right] == 0)
            {
                left = right + 1;
                right = left;
                sz = 1;
                continue;
            }
            sz = (sz * nums[right]) % mod;
            right++;
        }
        if (right > n || left > n - k)
            break;

       // if (right - left == k)这是保险起见之举，事实上没有必要
            ans = max(ans, sz);

        sz = (sz * inverse_fermat(nums[left], mod)) % mod;
        left++;
    }
    cout << ans;
}

```

- **注意事项**:
  - 1-Based存数方式lr初始在1
  - 记得滑动窗口的while，不要惯性思维认为*答案更新*/*大小比较*都在while的末尾。while只是一个路径，前面是快指针移动，后面是慢指针移动。中间夹着你的数字更新
  - 适用于固定区间长度的数据处理
  - 维护r的界限和nums[r]的更新逻辑是难点
[相似的滑动窗口]<https://codeforces.com/problemset/problem/2117/C>

#### [金麦园](https://codeforces.com/group/A5KcfGn880/contest/679438/attachments/download/31637/9thHBCPC.pdf)

- **核心模型**:双指针固定点R快速求区间差值和
- **思维误区 (Bug)**:
- **修正逻辑 (Patch)**:注意到排序后的差值有单调性，有单调性的就能二分
- **关键代码**:

```cpp
void solve()
{
    int n, k;
    cin >> n >> k;
    vi nums(n + 1);
    vi qzh(n + 1);
    rep(i, 1, n)
    {
        cin >> nums[i];
    }
 
    sort(nums.begin() + 1, nums.end());
    rep(i, 1, n)
    {
        qzh[i] = qzh[i - 1] + nums[i];
    }
    auto check = [&](int x) -> bool
    {
        ll cnt = 0;
        for (int lef = 1, ri = 1; ri <= n; ri++)
        {
            while (nums[ri] - nums[lef] > x)
                lef++;
            cnt += (ri - lef);
        }
        return cnt <= k;
    };
    int dui = 0;
    auto sum = [&](int x) -> ll
    {
        ll res = 0;
 
        for (int lef = 1, ri = 1; ri <= n; ri++)
        {
            while (nums[ri] - nums[lef] > x)
                lef++;
            dui += (ri - lef);
            res += (ri - lef) * nums[ri] - (qzh[ri - 1] - qzh[lef - 1]);
        }
        return res;
    };
 
    int L = 0;
    int R = (ll)1e8 + 5;
    while (L < R)
    {
        int mid = (L + R) / 2;
        if (check(mid))
        {
            L = mid + 1;
        }
        else
        {
            R = mid;
        }
    }
 
    ll gap = 0;
    ll ans = sum(L - 1);
    ans += (k - dui) * L;
    cout << ans << '\n';
}
 
```

---

#### P1638 逛画展

- 写双指针的时候一定要知道你在写什么
- 这个时for循环的版本
- ==**小技巧** 存替答案的时候可以`array<int, 3> ans = {INF, -1, -1};` 这样子，优先比较第一个值，意思是按照整个array的字典序来比较满足的化就替换与存答案。array可以优化开销==

```cpp
void solve()
{
    int n, m;
    cin >> n >> m;
    vi a(n);
    rep(i, 0, n - 1)
    {
        cin >> a[i];
    }

    int kind = 0;
    array<int, 3> ans = {INF, -1, -1};
    vector<int> cnt(m + 1);
    for (int l = 0, r = 0; l < n; l++)
    {
        while (r < n && kind < m)
        {
            kind += cnt[a[r]]++ == 0;
            r++;
        }
        if (kind == m) ans = min(ans, {r - l, l + 1, r});//按照字典序比较；
        kind -= --cnt[a[l]] == 0;
    }
    cout << ans[1] << ' ' << ans[2] << '\n';
}
```

---

## 模拟

### 数组模拟

#### P1067 [NOIP 2009 普及组] 多项式输出

- **题号**: P5678
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P1067)
- **算法类型**: 模拟
- **错误原因**:
  - 分类讨论大师，不读题导致的
  - 这道题需要特判0，1，最高次项
  - 一开始把下标和数字分开处理使非常愚蠢的做法！
- **AC 代码**:

```cpp
for (int i = n, j = 0; i >= 0; i--, j++) // 以后两个变量都写在这里
bool fh = (nums[j] > 0);
bool notOne = (nums[j] != 1);
bool isfuOne = (nums[j] == -1);
```

- **注意事项**:
  - 读题读题读对题
  - 想好再写
  - 模拟题一定要有耐心，认真讨论所有可能的条件
  - bool变量是对的！分讨大师请多多使用bool变量做分叉
  - 记得特判要continue，想好在什么时候刷新判断

#### P4924  魔法少女小Scarlet

- **题号**: P4924
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P4924)
- **算法类型**: 模拟
- **错误原因**:
  - 乍一看很复杂，要不是定级只有橙我肯定跳了
  - **可恶的边界以及循环顺序**
  - **可恶的边界以及循环顺序**
  - **可恶的边界以及循环顺序**
  - '外层循环写左边，内层循环写右边'
- **AC 代码**:

```cpp
void solve()
{
    int n, m;
    cin >> n >> m;
    vvi nums(505, vi(505));
    int chg[505][505];
    int cnt = 1;

    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)
        {
            nums[i][j] = cnt;
            cnt++;
        }

    while (m--)
    {
        memset(chg, 0, sizeof(chg));
        int x, y, r, z;
        cin >> x >> y >> r >> z;
        if (z == 0)
        {
            for (int i = x - r; i <= x + r; i++)
                for (int j = y - r; j <= y + r; j++)
                    if (i >= 1 && i <= n && j >= 1 && j <= n)
                        chg[j - y + x][x - i + y] = nums[i][j];
        }

        else
        {
            for (int i = x - r; i <= x + r; i++)
                for (int j = y - r; j <= y + r; j++)
                    if (i >= 1 && i <= n && j >= 1 && j <= n)
                        chg[x + y - j][i - x + y] = nums[i][j];
        }

        for (int i = x - r; i <= x + r; i++)

            for (int j = y - r; j <= y + r; j++)

                if (i >= 1 && i <= n && j >= 1 && j <= n && chg[i][j] != 0)
                    nums[i][j] = chg[i][j];
    }
    for (int i = 1; i <= n; i++)
        for (int j = 1; j <= n; j++)

            cout << nums[i][j] << ' ';
    cout << '\n';
}

```

- **注意事项**:
  - 思考路径：

> 1\.**相对化坐标** 通过平移使得*平面内任意一点*的普遍情况转换成*以(0,0)为基准点的*特殊情况，方便观察规律
> 2\.**做几何变换**
> 3\.**绝对化坐标** 一般来说就是用计算完的结果加回去
> 4\.**带入原始坐标**
  
## 博弈

### 普通博弈

#### Enjoy the game

- [link]<https://ac.nowcoder.com/acm/problem/201960>
- **题目描述**：有n张牌，轮流取牌：第一个人最多拿n-1
  张，最少拿1张。接下来每回合最多拿上一个人拿的数量，最少一张。拿走最后一张牌就胜利。求先手必胜策略？
- **思路分析**：容易知道：对于每个人来说，到自己回合得时候能使牌堆里面的牌变成单数，或者把这堆牌变成偶数丢给对方就必胜。对于先手来说，他要尽可能把牌变成偶数且经可能通过减一做到。容易知道所有奇数都会胜利。对于偶数情况，先手第一次行动只能拿偶数牌，要不然对面直接拿1就废了。当先手将牌堆维护在偶数时，对面只能也拿偶数，因为拿了奇数丢过来的还是奇数先手就赢了就不是最优策略了。所以：如果先手能够取偶数且取偶数次（在取得次数上也限制后手）先手有必胜策略。其他情况下后手可以通过调整取偶数的次数来限制（因为双方只能拿2x张牌，但是对于x没办法保证最优解）
接下来可以尝试小样例看看有没有需要特判的，发现没有
- **代码实现**：所以事实上我们要做的是求出log2n是否是奇数，用while循环固然只管但是可能吃一发20分钟的罚时
- **求一个数是否是2的正整数次幂**：`(n & (n - 1))`

#### 因数分解

- **题号**: G
- **链接**: [题目链接]<https://ac.nowcoder.com/acm/contest/121614/G>
- **算法类型**: 二分查找
- **错误原因**:
  - 看不懂题目在讲啥
  
>有 **n** 堆石子排成一行，从左到右依次编号为 **1** 到 **n**，第 **i** 堆有 \( a_i \) 个石子。trilliverse 和宇暧微霄两人轮流进行游戏，trilliverse 先手。
>每回合，当前玩家必须选择**最左边的石子数大于 0 的石子堆**（即下标最小的非空石子堆），石子数量为 \( a_i \)，并从中取走 \( k \) 个石子，其中 \( k \) 必须满足以下条件之一：
> $$\ k = a_i $$
>\[\forall i,\ a_i \equiv 0 \pmod{a_i - k}\]
>>!!对于每一个 $ i $，$ ai $ 都能被 $ ai - k $ 整除，即 $ ai - k $ 是 $ ai $ 的除数。

- **AC 代码**:

```cpp
  void solve()
  {
    int n;
    cin >> n;
    bool by = (n % 2 == 1);
    vi nums(n + 1);
    rep(i, 1, n)
    {
        int d;
        cin >> nums[i];
    }
    if (n == 1)
    {
        cout << "CandidateMaster" << '\n';
        return;
    }
    rep(i, 1, n)
    {
        if ( i % 2 == 0)
        {
            if (nums[i] != 1)
            {
                cout << "LegendaryGrandmaster" << '\n';
                return;
            }
        }
        else if (  i % 2 == 1)
        {
            if (nums[i] != 1)
            {
                cout << "CandidateMaster" << '\n';
                return;
            }
        }
    }
    if (by)
        cout << "CandidateMaster" << '\n';
    else
        cout << "LegendaryGrandmaster" << '\n';
  }
```

- **解析**:
  - **关键点**想到对于每个人来说取石子的最优解是==当石子大于1的时候取ai-1==
  - 可以想到，先手拿到的是奇数位上的控制权，后手拿到偶数上的控制权。一旦某人拿到大于1的数字，就可以通过取k个（ai-k==1）来拿到后续的控制权。从而把后面所有的情况压缩为1
  - 博弈疑问？为什么可以压缩?万一后面的人可以通过在后来拿到主动权来改变先后手优势吗？答：注意到如果要改变先后手优势，你就得走到别人的位置上（先手走偶数，后手走奇数）如果后面还有主动权，我大可以跳过前面的所有选项来获得我必有的控制权。
- **改进思路**:
  - 思维题，一般这种简单博弈都不要想的太难。一般某个人能拿到绝对主动权，看绝对主动权给谁最重要

---

## 细节

### 区间

#### [铺设线段]((https://www.luogu.com.cn/problem/P2082))

- **修正逻辑 (Patch)**:注意左闭右开还是左闭右闭，以及你家多了多少次
- **关键代码**:

```cpp
void solve()
{
    int n;
    ll s, t;
    cin >> n;
    vi zuo(n);
    vi you(n);

    rep(i, 0, n - 1)
    {
        cin >> zuo[i] >> you[i];
    }
    ll ans = 0;
    sort(all(zuo));
    sort(all(you));
    for (int i = 0; i < n; i++)
    {
        if (!i)
        {
            ans += you[i] - zuo[i] + 1;
        }
        else
        {
            if (zuo[i] <= you[i - 1])
            {
                ans = ans + (you[i] - zuo[i] + 1) - (you[i - 1] - zuo[i]+1);
            }
            else
                ans += you[i] - zuo[i] + 1;
        }
    }
    cout << ans << '\n';
}
```

---

### 逻辑维护

#### [F. Longest Strike](https://codeforces.com/problemset/problem/1676/F)

- **核心模型**:离散化后寻找两个数字要求这两个数字之间的所有数字在数组里面出现的次数大于等于k
- **思维误区 (Bug)**:不会维护
- **修正逻辑 (Patch)**:临时变量分类讨论
- **关键代码**:

```cpp
  ans ans2 = {-1, 0, 0};//len l r
    bool can = 0;//是否有解
    bool cage = 0; // 标记当前是否在一个合法的连续段中
    int len = 0; //目前长度
    int p = 0;     // 记录当前连续段的起点数值 (l)
    //可以直接跟着i来更新r

    for (int i = 0; i < arr.size(); i++)
    {
    
        if (!hhh[i]) 
        {
            cage = 0;
            len = 0;
        }//当她是不合法的段可以全部都是0
        else 
        {
            
            if (cage && (i > 0 && arr[i] != arr[i-1] + 1)) //直接判断是否和前面相连接，因为以前更新过了
            {
                cage = 0;
                len = 0;
            }

            if (!cage)
            {
                
                cage = 1;
                p = arr[i];
                len = 1;
            }
            else
            {
       
                len++;
            }
            
            can = 1; 

       
            if (len > ans2.len)
            {
                ans2.len = len;
                ans2.l = p;
                ans2.r = arr[i];
            }
        }
    }
```

---

---

### stl-map

#### 在ACM里面打ACM（map的使用：模拟：数据处理）

-**AC代码**

```cpp
struct hsh
{
    bool accepted = false;
    int wrangans = 0;
    int time = 0;
};
void solve()
{
    int n;
    cin >> n;
    map<string, map<char, hsh>> ljl;
    map<string, int> sumtime;
    map<string, int> sumac;
    string ans;
    for (int i = 0; i < n; i++)
    {
        string n;
        char th;
        bool ac;
        int tme;
        cin >> n >> th >> ac >> tme;
        ans = n;
        if (ljl[n][th].accepted)
            continue;
        if (ac)
        {
            ljl[n][th].time += tme;
            ljl[n][th].time += ljl[n][th].wrangans * 20;
            ljl[n][th].accepted=true;
            sumac[n]++;
            sumtime[n] += ljl[n][th].time;
        }
        else
        {
            ljl[n][th].wrangans++;
        }
    }

    for (auto it : ljl)
    {
        if (sumac[it.first] > sumac[ans])
        {
            ans = it.first;
        }
        if (sumac[it.first] == sumac[ans])
        {
            if (sumtime[it.first] < sumtime[ans])
            {
                ans = it.first;
            }
        }
    }
    cout<<ans<<' '<<sumac[ans]<<' '<<sumtime[ans];
}

```

#### [P3029 [USACO11NOV] Cow Lineup S]([题目URL](https://www.luogu.com.cn/problem/P3029))

- **核心模型**:用map来做到记录双指针区间里面有多少种类个数目
- **思维误区 (Bug)**:记得erase需要nums.end()
- **修正逻辑 (Patch)**:下次看到需要滑动窗口一个区间的种类数目可以用map做到logn
- **关键代码**:

```cpp

struct hsh1
{
    int nums, idx;
};
void solve()
{
    int n;
    cin >> n;
    vector<hsh1> hsh(n);
    vector<int> hsh2;
    rep(i, 0, n - 1)
    {
        cin >> hsh[i].nums >> hsh[i].idx;
        hsh2.push_back(hsh[i].idx);
    }
    sort(all(hsh2));
    hsh2.erase(unique(all(hsh2)), hsh2.end());
    int p = hsh2.size();
    sort(all(hsh), [](hsh1 a, hsh1 b)
         { return a.nums < b.nums; });
    int l = 0;
    int r = l;
    map<int, int> ljl;
    ljl[hsh[0].idx]++;
    ll ans = INF;
    auto remve = [&](int x) -> void//这个lambda就是用来维护的
    {
        ljl[x]--;
        if (ljl[x] == 0)
        {
            ljl.erase(x);
        }
    };

    while (r < n)
    {

        while (r < n - 1 && ljl.size() < p)
        {
            r++;
            ljl[hsh[r].idx]++;
        }
        if (ljl.size() < p)
            break;
        ans = min(ans, (ll)(hsh[r].nums - hsh[l].nums));

        remve(hsh[l].idx);
        l++;
    }
    cout << ans << '\n';
}

```

---

### 浮点数

#### P1618 三连击（升级版）

- **题号**: P1618
- **链接**: [题目链接]([P1618 三连击（升级版） - 洛谷](https://www.luogu.com.cn/problem/P1618))
- **算法类型**: 暴力枚举
- **题目概述**:
  - 分别组成三个三位数，且使这三个三位数的比例是 A:B:C
- **AC 代码**:

```cpp
bool cek()
{
    // 必须用浮点数比较比例！不能整数除
    if (abs(1.0 * pans[0] / pans[1] - 1.0 * a / b) > eps)
        return false;
    if (abs(1.0 * pans[1] / pans[2] - 1.0 * b / c) > eps)
        return false;
    if (abs(1.0 * pans[0] / pans[2] - 1.0 * a / c) > eps)
        return false;
    return true;
}
```

- **注意事项**:
  - 注意比较比例需要用浮点数
  - 写法 ：abs(1.0 *pans[0] / pans[1] - 1.0* a / b) > eps）
  - eps是浮点数误差，板子里面有

### 快速幂

#### 判正误

- **链接**: [题目链接](https://ac.nowcoder.com/acm/contest/118653/C)
- **算法类型**: 快速幂模板速用
- **题目数据范围**

 >![alt text](image.png)

- **错误原因**:
  - 不会快速幂
- **AC 代码**:

```cpp
i64 qpow(i64 a, i64 b, i64 m)
{
    i64 res = 1; // 初始化结果为 1
    a %= m;      // 预先取模
    while (b > 0)
    { // 当 n > 0 时循环
        if (b & 1)
            res = res * a % m; // 如果 n 的最低位为 1，res = res * a % m
        a = a * a % m;         // a = a * a % m
        b>>= 1;               // n 右移一位
    }
    return res; // 返回 (a^n) % m
}

void solve()
{
i64 m1=1e9+7;
i64 m2=1e9+9;
i64 m3=1e9+21;

i64 a,b,c,d,e,f,g;
cin>>a>>b>>c>>d>>e>>f>>g;

i64 p1=qpow(a,d,m1)%m1+qpow(b,e,m1)%m1+qpow(c,f,m1)%m1;
i64 p2=qpow(a,d,m2)%m2+qpow(b,e,m2)%m2+qpow(c,f,m2)%m2;
i64 p3=qpow(a,d,m3)%m3+qpow(b,e,m3)%m3+qpow(c,f,m3)%m3;

if(p1==g&&p2==g&&p3==g)
{
    cout<<"Yes"<<'\n';
}
else cout<<"No"<<'\n';
}
```

- **注意事项**:
  -注意数据范围，记得开long long
- **改进思路**:
  >**常用模数**
  >i64 m1=1e9+7;
    i64 m2=1e9+9;
    i64 m3=1e9+21;
  >**简单快速幂**

```cpp
   i64 qpow(i64 a, i64 b, i64 m)
    {
    i64 res = 1; // 初始化结果为 1
    a %= m;      // 预先取模
    while (b > 0)
    { // 当 n > 0 时循环
        if (b & 1)
            res = res * a % m; // 如果 n 的最低位为 1，res = res * a % m
        a = a * a % m;         // a = a * a % m
        b>>= 1;               // n 右移一位
    }
    return res; // 返回 (a^n) % m
    }
```

  >**数据范围更大的快速幂**

```cpp

  using f80 = long double;  
  using u128 = unsigned __int128;  
  using i128 = __int128;  
  using u64 = unsigned long long;  
  using i64 = long long;  
  using u32 = unsigned;  
  i64 qmul(i64 x, i64 y, i64 m) {
    i64 z = (f80) x / m * y + 0.5L;
    u64 c = (u64) x * y - (u64) z * m;
    return c < m ? (i64) c : (i64) (c + m);
  }

  i64 qpow(i64 a, i64 n, i64 m) {
    i64 res = 1;
    while (n) {
        if (n & 1) res = res * a % m;
        a = a * a % m;
        n >>= 1;
    }
    return res;
  }
```

  >快速乘可避免模数大于 int 取值范围时溢出，可将快速幂中乘法替换为快速乘版本以避免乘法溢出。

## 暴力

### 剪枝trick

#### D. Yet Another Array Problem

- **题号**: D
- **链接**: [题目链接]<https://codeforces.com/contest/2167/problem/D>
- **算法类型**: 唐人暴力
- **错误原因**:
  - 脑子里没有明确的思路，多积累，多想
- **AC 代码**:

```cpp
for (int i = 2; i <= 1e9; i++)//我说白了i范围再[ 1 , 100 ]都能过
    {
        for (int j = 0; j < n; j++)
        {
            if (gcd(i, nums[j]) == 1)
            {
                ans = min(i, ans);
                hsh = 1;
                break;
            }
        }
        if (hsh == 1)
        {
            cout << ans << '\n';
            return;
        }
    }
```

### 字典序

#### C. Isamatdin and His Magic Wand

- **题号**: C
- **链接**: [题目链接](https://codeforces.com/contest/2167/problem/C)
- **算法类型**: 字典序
- **错误原因**:
  - 一个序列 $p$ 字典序小于一个序列 $q$，如果存在一个索引 $i$，使得对于所有 $j < i$ 都有 $p_j = q_j$，并且 $p_i < q_i$。
  - lexicographically smallest：字典序最小时
  - 整数的字典序 = 数值大小顺序！
  字符串的字典序 = 字符ASCII顺序！
  - ==sort 默认行为字典序==
- **AC 代码**:

```cpp
sort
```

- **Trick**:

>如果x是满足gcd(a[i],x)=1的最小值，则对每个2≤i<x都有gcd(a[i],x)≠1
考虑每个素数p，要满足对每个2≤p<x都有gcd(a[i],p)=p≠1
也就是每个满足2≤p<x的素数p都是a[i]的因数
那最坏情况就是2*3*5*7*11*13*17*...*p_max=a[i]
p_max也就前几十个素数  
对每个数a[i]，从小到大枚举x直到gcd(a[i],x)=1
也就是x其实贼啦小
很经典的
若干个数（大于1）乘起来大于n
数字个数是O(logn)

- **改进思路**:
  - 记得简单的循环走外面，我们要知道什么时候出循环，循环内外谁先走谁后走显得尤为重要

#### B：Del

- **题号**: B
- **链接**: [题目链接](https://ac.nowcoder.com/acm/contest/119666/B)
- **算法类型**: 字符串处理，字典序，细节处理
- **错误原因**:
  - 我的赛时代码所有逻辑都是错的
  - **关于字典序** ：不是简单的删掉最大的字母就行的：
  >>反例：1 abcbd
    abbd
    abcb
  -
- **AC 代码**:

```cpp
void solve()
{
    int n;
    cin >> n;
    vector<string> arr;
    rep(i, 0, n)
    {
        string s;
        cin >> s;
        rep(j, 0, SZ(s) - 1)
        {
            if(s[j]>s[j+1]||j==s.size()-1)
            {
                s.erase(j,1);
                break;
            }
        }
        if (s.empty())
            continue;
        arr.push_back(s);
    }
    stable_sort(all(arr), [](const auto &a1, const auto &a2)
                { return a1 + a2 < a2 + a1; });
    string ans;
    rep(i, 0, SZ(arr) - 1)
    {
        ans+=arr[i];
    }
    cout<<ans<<endl;
}
```

- **需要了解的写法**:
  - `s.erase(j,1);`删除vector里面的其中一个元素
  - `size_t pos = s.find(max_char);`存放maxchar的迭代器
- **改进思路**:
  - 每个串删掉“第一个让它变大的字符”（或末尾），再按“谁放前面拼接更小”排序，得到的就是字典序最小的最终字符串。

#### [P1012 [NOIP 1998 提高组] 拼数（贪心）](https://www.luogu.com.cn/problem/P1012)

- **核心模型**:字典序的比较规则如下：从左到右逐个比较两个字符串的字符。
    如果在某个位置上字符不同，则按照该位置上的字符的字母顺序进行排序，即较小的字符排在前面，较大的字符排在后面。
    如果一直比较到其中一个字符串结束，则较短的字符串排在前面。
    如果两个字符串完全相同，则它们的字典序相同。
- **思维误区 (Bug)**：单纯的比较s1s2大小排序是错的，hack数据：321 32 由于字典序比较权重不是组合而是长度，而所需字符串在得到答案的时候（对于所有可能答案长度都是一样的就会出现比较不到下面一位的情况
- **修正逻辑 (Patch)**：能够通过最优子结构来敌退到最优解
- **关键代码**:

```cpp
void solve()
{
    int n;
    cin >> n;
    vector<string> ss(n);
    for (int i = 0; i < n; i++)
    {
        cin >> ss[i];
    }

    sort(all(ss), [](string s1, string s2)
         { return s1 + s2 > s2 + s1; });

    for(auto hsh:ss)
    {
        cout<<hsh;
    }
}
```

---

### 圆环处理

#### C 丢手绢

- **题号**: C
- **链接**: [题目链接](https://ac.nowcoder.com/acm/contest/119666/C)
- **算法类型**: 圆环处理
- **题目**:

>给定一个长度为 $n$ 的数组 $\{a_1, a_2, \dots, a_n\}$，这些元素**围成一个圆**。第 $i$ 个元素与第 $i+1$ 个元素相邻，且第 $n$ 个元素与第 $1$ 个元素相邻。
我们从圆上任意选择**四个两两不同的位置** $i, j, k, l$，分别连线 $(i, j)$ 和 $(k, l)$。
**如果**这两条线恰好在圆内部相交（交点不在圆上）：
>
> - **权值定义：** 每条线的权值定义为其两个端点元素之和。
> - **价值定义：** 这两条相交线权值的乘积记为该对相交线的价值。
>求所有可能的两条相交的线中，**价值的最大值**。
>
- **AC 代码**:

```cpp
void solve()
{
    int n;
    cin>>n;
    vi nums(n);
    rep(i,0,n-1)
    {
        cin>>nums[i];
    }
    rotate(nums.begin(),max_element(all(nums)),nums.end());
    vi dx(n+1,0);
    //dx[n-1]=nums[n-1];
    for(int i=n-1;i>=0;i--)
    {
        dx[i]=max(nums[i],dx[i+1]);
    }  
    vi zx(n,0);
    zx[1]=nums[1];
    for(int i=2;i<=n-1;i++)
    {
        zx[i]=max(nums[i],zx[i-1]);
    } 
    ll sum=0;
    for(int i=2;i<n-1;i++)
    {
        sum=max(sum,(nums[0]+nums[i])*(zx[i-1]+dx[i+1]));
    }
    cout<<sum<<'\n';
}

```

- **注意事项**:
  - 对于由圆上点连成的线段(i,j)(k,l)来说，需要使他们相交的充要条件
   >$$\text{相交几何：} \quad 0 < k < i < l \quad (\text{在线性展开上})$$
  - `std::rotate( ForwardIt first, ForwardIt middle, ForwardIt last );`
  三个都是迭代器：第一个和最后一个是范围，中间是目标。简单来说，它将 middle 所指向的元素 变为新序列的 第一个元素。但是不改变序列里面每个元素之间的相对顺序
  >**常见用法一**：解决圆上排列问题： 当一个数组被视为一个圆（即首尾相连）时，通常需要检查所有可能的起始点（或某种特殊元素作为起点）的情况。
用法： 通过 std::rotate，可以将圆上的任意元素高效地移到数组的第一个位置（s[0]），从而将圆排列问题转化为标准的 线性数组问题 进行处理。
  >**常见用法二**： 模拟 $K$ 步旋转（数组旋转问题）这是 LeetCode 上的经典问题。如果要求将数组向左或向右旋转 $K$ 步，std::rotate 是最简洁高效的实现方式
  >**常见用法三**： 简化双指针或滑动窗口问题
在某些涉及双指针或滑动窗口的问题中，如果需要 周期性地 调整窗口的起始点，或者需要将数组的一个子序列移动到另一端来满足特定的结构要求，std::rotate 可以作为一种方便的工具。

  - **严重注意**：边界处理！！因为要保证元素顺序所以最后找i的循环起点是2终点是n-2!!

- **算法思路**:
  - **相交条件：** 四个点 $i, j, k, l$ 在圆上的顺序必须是交替的（如 $i \rightarrow k \rightarrow j \rightarrow l$）。
  - **优化：** 通过 `std::rotate` 将数组中的 **最大元素** 放置到 $s[0]$，简化为只需要考虑一条线段是 $(s[0], s[i])$ 的情况。
  - **$O(N)$ 计算：** 结合 **前缀最大值 (`px`)** 和 **后缀最大值 (`a[i+1]`)**，高效地找到分割线 $(s[0], s[i])$ 两侧的最佳配对元素 $s[k]$ 和 $s[l]$，从而最大化价值：
    $$\text{Max Value} = \max_{i} \left( (s[0] + s[i]) \times (\max_{k \in [1, i-1]} \{s[k]\} + \max_{l \in [i+1, n-1]} \{s[l]\}) \right)$$
- **详细做法和实现思路**
  - 实现寻找到最大元素S[i]：`rotate(s.begin(),max_element(s.begin(),s.end()),s.end());`
  - 实现维护区间[i+1,n-1]之间的最大数字（一个类似于前缀和标记的压缩数组）：注意他的实现方式：从后往前遍历

```cpp
  vector<ll>a(n+1,0);
    for(int i=n-1;i>=0;i--)
      a[i]=max(a[i+1],s[i]);
```

- 维护前面最大值同理，甚至更加简单，可以直接用一个变量来维护。这个简单的代码做到了在寻找i的同时维护px。精妙至极。但是没有维护的实力就还是多开一个数组做把））

```cpp

  ll px=0;
  ll sum=0;
  for(ll i=2;i<n-1;i++)
  {
    px=max(px,s[i-1]);
    sum=max(sum,(s[0]+s[i])*(px+a[i+1]));
  }
```

---

## 基础实现

### 字符串处理

#### [C. Needle in a Haystack]( https://codeforces.com/contest/2175/problem/C )

- **核心模型**:贪心，双指针
- **思维误区 (Bug)**:主要是害怕字符串题目，这里主要记录如此字串的贪心实现
  - 本来我想的是按照不下降为索引一个一个放进去，但是没有维护的实力
  - 容易发现要做到答案的字典序最小，对于每一位都贪心的找最小就好了，而且由于是子序列更简单了。。直接从两堆东西里面一个一个拿就行
  - 这里教教你怎么用`string`
- **修正逻辑 (Patch)**:
  - 常见字符串匹配:桶计数
  - 一些简单的写法->双指针
- **关键代码**:

```cpp
void solve()
{
    string s;
    cin >> s;
    string t;
    cin >> t;

    vi cnt(26);
    for (auto hsh : t)
    {
        cnt[hsh - 'a']++;
    }
    for (int i = 0; i < s.size(); i++)
    {
        cnt[s[i] - 'a']--;
        if (cnt[s[i] - 'a'] < 0)
        {
            std::cout << "Impossible" << '\n';
            return;
        }
    }
    string ans;
    int tp = 0;
    for (int i = 0; i < 26;)
    {
        if (tp >= s.size() || i + 'a' < s[tp])
        {
            ans += string(cnt[i], i + 'a');//加上一个字符串
            i++;//记得滑动指针
        }
        else
        {
            ans += s[tp];
            tp++;
        }
    }
    std::cout << ans << '\n';
}
```

---

#### [A MAD Interactive Problem](题目URL)

- **核心模型**:交互题，在3n次查询里面找到每个数字的位置
- **思维误区 (Bug)**:不会
- **修正逻辑 (Patch)**:用vector实现维护一串不重复的数字，然后一个一个查询某个数字在哪里
- **关键代码**:

```cpp
void solve()
{
    int n;
    cin >> n;
    int n2 = 2 * n;
    vi q1, q2;
    auto qury = [](vi a) -> int
    {
        sort(all(a));
        cout << "? "<<a.size()<< ' ';
        for (auto hsh : a)
        {
            cout << hsh << ' ';
        }
        cout<<endl;
        int s;
        cin >> s;
        return s;
    };
    vi ans(n2+1);
    for(int i=1;i<=n2;i++)
    {
        q1.push_back(i);
        int g=qury(q1);
        if(g)
        {
            q1.pop_back();
            ans[i]=g;
            q2.push_back(i);
        }
    }

    for(int i=1;i<=n2;i++)
    {
        if(!ans[i])
        {
            q2.push_back(i);
            ans[i]=qury(q2);
            q2.pop_back();
        }
    }
    cout<<"! ";
    for(int i=1;i<=n2;i++)
    {
        cout<<ans[i]<<' ';
    }
    cout<<endl;
}

```

#### [家谱->实现字符串映射到数字数字再多次反查询到字符串](https://www.luogu.com.cn/problem/P2814)

- **核心模型**:并查集。使用`vector<string>` 与`map<string,int>` 实现字符串映射到数字数字再多次反查询到字符串

- **关键代码**:

```cpp
//这里应该有个struct dsu
void solve()
{
    string s;
    map<string, int> sti;
    vector<string> its;
    auto getid = [&](string nme) -> int
    {
        if (sti.count(nme))
        {
            return sti[nme];
        }
        else
        {
            sti[nme] = its.size();
            its.push_back(nme);//注意这里的顺序，先获取size（）再放进去要不然会ub
            return sti[nme];
        }
    };
    // vi ask;
    int father;
    int son;
    vector<pii> per;
    bool ask = 0;
    vi que;
    while (cin >> s)
    {
        string nme;
        if (s[0] == '$')
            break;
        for (int i = 1; i < 7; i++)
        {
            nme += s[i];
        }
        if (s[0] == '?')
            ask = 1;
        int ren = getid(nme);
        //  cerr<<ren<<'\n';
        if (!ask)
        {
            if (s[0] == '#')
            {
                father = ren;
                continue;
            }
            if (s[0] == '+')
            {
                son = ren;
            }
            per.push_back({father, son});
        }
        else
        {
            que.push_back(ren);
        }
        //    cerr << "cek" << '\n';
    }
    //   cerr << "cek" << '\n';
    DSU dsu(its.size() + 1);
    for (auto hsh : per)
    {
        //  cerr << "cek" << '\n';
        dsu.merge(hsh.first, hsh.second);
    }
    for (auto hsh : que)
    {
        cout << its[hsh] << ' ';
        cout << its[dsu.find(hsh)] << '\n';
    }
}

```

### 悬线法

#### [P4147 玉蟾宫->处理最大矩形面积悬线法的dp方法](https://www.luogu.com.cn/problem/P4147 )

- **核心模型**:最大矩形面积，悬线法
- **思维误区 (Bug)**:非常容易漏掉和越界：1.\需要初始化，自己能到达的最远的格子搜显示自己，然后从右到左从左到右一个一个继承2.\ 记得第一行也要更新面积 3.\记得左闭右闭区间要加一
- **修正逻辑 (Patch)**:需要两拨预处理，一个初始化。==初始化h为1，lr为自己==，先从左到右右到左扫一遍，然后继承上面的格子
- **关键代码**:

```cpp
void solve()
{
    int n, m;
    cin >> n >> m;
    vector<vi> mp(n, vi(m, 0));
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < m; j++)
        {
            char d;
            cin >> d;
            if (d == 'F')
            {
                mp[i][j] = 1;
            }
        }
    }
    //==========================================//
    vector<vi> le(n, vi(m));
    vector<vi> ri(n, vi(m));
    vector<vi> hei(n, vi(m, 1));
    ll ans = 0;
    for (int i = 0; i < n; i++)
    {
        for (int j = 0; j < m; j++)
        {
            le[i][j] = j;
            ri[i][j] = j;
        }

        for (int j = 1; j < m; j++)
        {
            if (mp[i][j] && mp[i][j - 1])
            {
                le[i][j] = le[i][j - 1];
            }
        }
        for (int j = m - 2; j >= 0; j--)
        {
            if (mp[i][j] && mp[i][j + 1])
            {
                ri[i][j] = ri[i][j + 1];
            }
        }

        for (int j = 0; j < m; j++)
        {
            if (i)
            {
                if (mp[i - 1][j] && mp[i][j])
                {
                    hei[i][j] = hei[i - 1][j] + 1;
                    if (le[i - 1][j] > le[i][j])
                    {
                        le[i][j] = le[i - 1][j];
                    }
                    if (ri[i - 1][j] < ri[i][j])
                    {
                        ri[i][j] = ri[i - 1][j];
                    }
                }
            }
            if (mp[i][j])
            {
                ans = max(ans, (ll)(ri[i][j] - le[i][j] + 1) * hei[i][j]);
            }
        }
    }
    cout << ans*3 << '\n';
}
```

---

---

## 总结

### 神秘UB记录点

### stl记录

- `string s = to_string(某个string数组)`
- `int hsh=*max_element(dp.begin()+1,dp.end());`找到最大的元素，返回迭代器，需要*取指针
- `auto it = find(v.begin(), v.end(), target);`返回迭代器，需要取指针。
- 提取下标：`(it - v.begin())`
- `gcd()`计算最大公约数
- `binary_search`在有序数列中寻找指定元素
- `next_permutation(a.begin(),a.end())`返回下一个全排列（字典序）
- `substr(pos, len)` 接受两个参数：起始位置 和 长度。等价于左闭右开,复杂度On
  - 如果你想取 [l, r) 这段，写法就是：`substr(l, r - l)`
    所以 s.substr(0, i + st.size()) 的意思是：
    从位置 0 开始,取 i + st.size() 个字符
