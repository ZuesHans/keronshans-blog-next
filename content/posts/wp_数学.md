---
title: wp_数学
date: 2025-12-06
tags:
    - 数学
    - 算法
    - Problems

cover: /img/cover/picg_19.png
math: true
---

## 数学

### gcd构造性质

#### [矩阵](https://codeforces.com/group/A5KcfGn880/contest/682064/problem/G)

- **核心模型**:左右互质性质：相邻自然数必然互质。余数非零性质：跨越边界的质数选择
- **思维误区 (Bug)**:上下互质性质：质数步长 + 辗转相除法。元素唯一性质：带余除法的唯一性。数学表达： 在 n 较小（如 2500 以内）时，大于 n 的第一个质数 $P$ 与 n 的距离非常近，最大差值不超过 34。
- **修正逻辑 (Patch)**:
- **关键代码**:

```cpp

const int N = 1e7 + 10; // 10^7 级别
int primes[N], cnt;     // primes存质数，cnt存质数个数
bool st[N];             // st[i]为true表示i是合数(被筛掉了)，false表示是质数

void get_primes(int n)
{
    for (int i = 2; i <= n; i++)
    {
        // 如果没有被标记过，说明 i 是质数，加入 primes 列表
        if (!st[i])
            primes[cnt++] = i;

        // 核心循环：用当前的质数 primes[j] 去筛合数
        for (int j = 0; primes[j] <= n / i; j++)
        { // primes[j] * i <= n
            // 1. 标记 primes[j] * i 为合数
            st[primes[j] * i] = true;

            // 2. 【最关键的一行】
            // 如果 i 能被 primes[j] 整除，说明 primes[j] 已经是 i 的最小质因子了
            // 那么 primes[j] 也一定是 primes[j] * i 的最小质因子
            // 我们必须立刻停止，避免重复筛
            if (i % primes[j] == 0)
                break;
        }
    }
}

void solve()
{
    int n;
    cin >> n;
    //  n=2500;
    get_primes(n * n + 40 * n);
    vi zhi;
    for (int i = 0; i < n * n + 40 * n; i++)
    {
        if (primes[i])
            zhi.push_back(primes[i]);
    }

    vector<vi> ans(n + 1, vi(n + 1));

    int fk=*upper_bound(all(zhi),n);

    for (int i = 1; i <= n; i++)
    {
        for (int j = 1; j <= n; j++)
        {
            if(i==1)
            {
                ans[i][j]=j;
            }
            else
            {
                ans[i][j]=j+fk*(i-1);
            }
        }
       
    }
    for (int i = 1; i <= n; i++)
    {
        for (int j = 1; j <= n; j++)
        {
            cout << ans[i][j] << ' ';
        }
        cout << '\n';
    }
}

```

---

### 数论

#### C. Fadi and LCM
>
>今天，Osama给了Fadi一个整数 X，Fadi想知道 max(a,b)的最小值，使得 LCM(a,b)等于 X。 a和 b都应该是正整数。
>
>LCM(a,b)是能被 a和 b整除的最小正整数。例如， LCM(6,8)=24, LCM(4,12)=12, LCM(2,3)=6。

-**解题思路**
    - 根据题意有X=a*b 除以 gcd（a，b）
    - 为了让ab更小我们贪心的从根号X开始找
    - 贪心数学推论->正整数 $X$，至少有一对互质因子。(他和1)->任何一个数字都可以通过质数相乘得到->LCM的取法是：对于每一个质数，取两人中指数“最高”的那个。
    - 切分lcm定理:对于任何一个质因子（比如一堆2，或者一堆3），它们必须作为‘一坨’整体，要么全给 a，要么全给 b，绝对不能切开。

- **AC代码**

```cpp
void solve()
{
    int n;
    cin >> n;
    vi prob;
    auto findyz = [&]() -> void  //这里只是单纯练习一下lambda表达式
    {
        for (int i = 1; i * i <= n; i++)  // 根号n的复杂度
        {
            if (n % i == 0)
            {
                prob.push_back(i);
            }
        }
    }();
    sort(prob.rbegin(), prob.rend());
    for (auto hsh : prob)
    {
        if (gcd(hsh, n / hsh) == 1)
        {
            cout << hsh << ' ' << n / hsh;
            return;
        }
    }
}


```

#### LCM结论

- $$a \times b = GCD(a, b) \times LCM(a, b)$$
  - 推论： 如果 $GCD(a, b) = 1$（互质），那么 $LCM(a, b) = a \times b$。
  - 算 LCM 的时候，为了防止先乘法爆 long long，必须写成：lcm = (a / std::gcd(a, b)) * b; （先除后乘）
- 相邻必互质（ 找$LCM$ 最大
- $GCD$ 会越算越小，哪怕是 $10^{18}$ 的数，取几次 GCD 就变成很小的数了。复杂度是 $O(\log N)$
- 前 43 个整数的 LCM 就已经超过 long long 范围了。警觉点： 如果题目让你算一堆数的 LCM，结果还要模 $10^9+7$，那通常不是让你真的算出来，而是让你对“质因子的指数”取 max
- $$GCD(k \cdot a, k \cdot b) = k \cdot GCD(a, b)$$
- $$LCM(k \cdot a, k \cdot b) = k \cdot LCM(a, b)$$

### 数学取模

#### [逆=辶+屰](https://ac.nowcoder.com/acm/contest/97487/B)

放在这里是为了告诉你：正确分析复杂度是多么的重要。。。以及数学好真的很重要
以及有时候大脑真的不要把题目想的太难，可以根据过题人数考虑是否需要考虑唐氏做法
这道题纯纯预处理一下就行了
//可能我通宵了，大脑垃圾太多了，竟然放过了一道这么唐氏且简单还珍贵的题目
>来自数院的小楠喜欢研究数学，他给定了一个数字 \( n \)，然后提出了 \( q \) 个问题，每个问题给出两个整数 \( k \) 和 \( r \)，现在他想知道，在他的每个问题中，他给出的数字 \( n \) 是否满足**不少于 \( k \) 个不同的正整数** \( c_1, c_2, c_3, \dots, c_k \) 能够使得：
\[
n \mod c_i = r, \quad i = 1, 2, 3, \dots, k.
\]
其中 `mod` 代表求余，例如：  
 \( 5 \mod 2 = 1 \)  
\( 8 \mod 2 = 0 \)
>第一行输入两个整数 n(1≤n≤1×10^6), q(1≤q≤1×10^4)，
分别代表小楠给出的这个数字 n 和提出的问题数量 q。
接下来 q 行，每行输入两个整数 k(1≤k≤1×10^6), r(0≤r<n)，
代表 n 是否满足有不少于 k 个不同的正整数 c1,c2,...,ck 使得 n mod ci = r。
>输出共 q 行，
如果 n 能够满足第 i 个问题，则输出 "YES"，
否则输出 "NO"。
（输出不含双引号，且必须严格大写）
>

```cpp
void solve()
{
    int n, q;
    cin >> n >> q;
    vi nums(n + 1);
    for (int i = 1; i <= n; i++)
    {
        nums[n % i]++;
    }
    for (int i = 1; i <= q; i++)
    {
        int k, r;
        cin >> k >> r;
        if (k <= nums[r])
            cout << "YES" << '\n';
        else
            cout << "NO" << '\n';
    }
}
```

#### [E - Simple Division](https://atcoder.jp/contests/abc448/tasks/abc448_e)

- **核心模型**: 除法/取整 + 取模  **当你需要对结果取模，但中间某步运算会破坏模运算时，找到一个更大的模数，使得这步运算在数学上能干净地消去。**
  - 遇到"除法/取整 + 取模"时：
    - 先想逆元——如果能保证 gcd(除数, 模数) = 1（比如模数是质数），直接用逆元
    - 逆元不可用时——考虑把模数扩大为 除数 × 原模数，用这道题的trick
- [数学推导及详细](/go/SimpleDivision/)
- **关键代码**:

```cpp
void solve()
{
    int k, m;
    cin >> k >> m;
    int mod = m* 10007;
    vector<pll> cl(k);
    rep(i, 0, k - 1)
    {
        cin >> cl[i].first >> cl[i].second;
    }

    vi ten(40);
    ten[1] = 10;
    for (int i = 2; i < 32; i++)
    {
        ten[i] = (ten[i - 1] * ten[i - 1])%mod;
    }

    vi rli(40);
    rli[1] = 1;
    for (int i = 2; i < 31; i++)
    {
        rli[i] = rli[i - 1]%mod + rli[i - 1] * ten[i - 1]%mod;
        rli[i] %=mod;
    }
    ll ans = 0;
    int dgt = 0;
    for (int i = k - 1; i >= 0; i--)
    {

        ll R = 0;
        for (int d = 29; d >= 0; d--)
        {
            if (cl[i].second & (1ll << d))
            { // 如果第d位是1
                R = R * ten[d+1] %mod+ rli[d+1]%mod;
            }
        }
        ans = (ans + (cl[i].first * (R * qpow(10, dgt, mod) % mod)) % mod) % mod;
        dgt += cl[i].second;
    }
    cout << ans / m << '\n';
}

```

---

### 二进制与位运算

#### [D. Unfair Game](https://codeforces.com/contest/2184/problem/D)

- **核心模型**:组合数学算出在1-n之内有多少个符合要求的数字
- **思维误区 (Bug)**:拆位运算分类讨论少了情况
- **修正逻辑 (Patch)**:注意到于n同位次不能直接全部allin，需要比n小。注意到allin逻辑最终不包含n本身，所以需要加一个对n的特判
- **关键点**：这里要学习具体怎么实现的：对于从高到低，碰到0只有一个0，碰到1可以有两种可能，以及
- **关键代码**:注意__lg()求的是0baseed长度，而我们有多少位求的是len也就是`wc+1`

```cpp
void solve()
{
    int n, k;
    cin >> n >> k;
    ll ans = 0;
    int wc = __lg(n);
    for (int i = 1; i <= wc; i++)
    {
        if (i <= k)
        {
            for (int j = 0; j <= min(i - 1,k-i); j++)
                ans += nCr(i - 1, j);
        }
    }
    int cnt = 1;
    for (int i = wc-1; i >= 0; i--)//这里我们每一位都往后挪了意味，意思是这一位填0，剩下的位次的排列组合
    {
        if ((n >> i) & 1)
        {
            for (int j = 0; j < i; j++)
                if (cnt + j < k - wc)//这里的式子应该是cnt+j<=k-(wc+1);
                    ans += nCr(i, j);
 
            cnt++;
        }
    }
 
    if (k >=wc+1)
    {
        ans++;
    }
 
    cout << n - ans << '\n';
}
```

---

#### [D. Blackslex and Penguin Civilization](https://codeforces.com/contest/2179/problem/D  )

- **核心模型**贪心求排列&前缀和的和最大，有相同的输出字典序最小的排列
- **思维误区 (Bug)**:以为只有 0011111 0001111 0000111 0000011这样的数字能够维持。hack：0011111 0001111 0000111 **0010111**
- **修正逻辑 (Patch)**:因为要保持前缀&运算最大：就是把1保留的越久越好。尽可能的让第一个0出现（这里的0可以是最高位往下数或者最低位往上数）的晚，而在同样能保留前缀（或者后缀）1的一个集合中sort就可以了。最高位最多1是一定会保留且作为第一位。容易发现因为要字典序最小，我们得找递减，也就是高位删到低位顺序。因为低位删到高位数字前面书字太大了。因为要留住最低位的1所以所有偶数挑出来sort.复杂度nlogn
- **做法修正：**打表找规律吧
- **关键代码**:

```cpp
void solve()
{
    
    int n;
    cin>>n;
    map<int,vi> hsh;

    auto cnt=[&](int a)->int{
        int cnt1=0;
        for(int i=0;i<=30;i++)
        {
            if (a&(1 << i))
            {
                cnt1++;
            }
            else break;

        }
        return cnt1;
    };

    for(int i=0;i<=(1<<n)-1;i++)
    {
        if(i%2)
        //cerr<<i<<' '<<cnt(i)<<'\n';
        hsh[-1*cnt(i)].push_back(i);
    }
    vi ans;
    for(auto it:hsh)
    {
        vi q=it.second;
        sort(all(q));
        for(auto d:q)
        {
            ans.push_back(d);
        }
    }
     for(int i=0;i<=(1<<n)-1;i++)
    {
        if(i%2==0)
        ans.push_back(i);
    }
    for(auto uu:ans)
    {
        cout<<uu<<' ';
    }
    cout<<'\n';
}

```

---

#### [C. XOR-factorization](https://codeforces.com/contest/2180/problem/C)

- **核心模型**: 位运算，异或
- **思维误区 (Bug)**:贪心贪错了，不会实现，答案反直觉
- **修正逻辑 (Patch)**:异或和实现
- **关键代码**:

```cpp
    int n, k;
    cin >> n >> k;
    vi ans(k, n);
    if (k % 2==0)
    {
        int tp = 0;
        for (int qq = 30; qq >= 0; qq--)
        {
            if (n & (1 << qq))
            {
                if (tp < k)
                {
                    ans[tp] ^= (1 << qq);
                    tp++;
                }
                else
                {
                    ans[0] ^= (1 << qq);
                }
            }
            else
            {
                for (int i = 0; i < tp-1 ; i+=2)
                {
                    ans[i] ^= (1 << qq);
                    ans[i+1]^=(1<<qq);
                }
            }
        }
    }
    for (auto hsh : ans)
    {
        cout << hsh << ' ';
    }
    cout << '\n';
```

---

#### 子段异或和

- **题号**: D
- **链接**: [题目链接](https://ac.nowcoder.com/acm/contest/120453/D)
- **算法类型**: 异或，前缀和
- **AC 代码**:

```cpp
void solve()
{
    int n;
    cin>>n;
    vi nums(n + 1);
    nums[0] = 0;
    vi cf(n + 1);
    map<int, int> bg;
    int ans = 0;
    bg[0]++;
    for (int i = 1; i <= n; i++)
    {
        cin >> nums[i];
        cf[i] = cf[i - 1] ^ nums[i];
        int key = cf[i] ^ 0; // a^b=0 ->a^0=b
        if (bg.find(key) != bg.end())
        {
            ans += bg[key];
        }
        bg[cf[i]]++;
    }

    cout << ans;
}

```

- **异或前缀和思路**:
  - 异或的“逆运算”就是它自己。
  - 所以通过求异或前缀和来实现对 [l, r] 区间的异或和的O(1)查找——>就等于 cf[r] ^ cf[l-1]。
  - 异或的一些小妙招：
    - 寻找出现次数偶数/奇数次数数列里面出现奇数/偶数次数的数
    - N堆石子，每次可以取任意多个至少一个。异或和==0先手必败

- **改进技巧：哈希表**:
  - O(N) 优化 (使用哈希表)： 我们用一个哈希表 countMap 存储历史上的前缀和 cf[j] 出现过的次数（复杂度O(logN)
  - 能O(1)查询的字段和都可以采用

>“前缀和+哈希表”是处理“子数组/子段”的小妙招

### 抽象图->式子

#### P2241 统计方形（数据加强版

- **题号**: 2241
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P2241)
- **算法类型**: 数学
- **记录原因**:我他妈自己写出来了自己推导的公式！我真是他妈的天才
- **AC 代码**:

```cpp
int cjqj(int c)
{return c*(c+1)/2;}
void solve()
{
    int n,m;
    cin>>n>>m;
    int d=min(n,m);
    int ans1=0;
    for(int i=1;i<=d;i++)
        ans1+=(n-i+1)*(m-i+1);
    int ans2=cjqj(n)*cjqj(m)-ans1;
    cout<<ans1<<' '<<ans2;
}
```

- **思路记录**:
  - 首先你要剥去情景迷雾，将它抽象成每个元素的组合
  - 你在想：怎么放置正方形 ->因为可以重叠就一个个排开
  - 然后我们就能得到正方形特殊到一般的计数方法
  - 然后我们要看看这里面一共有多少个子矩形？
  - 矩形是什么？两个横线两个竖线的累加 -> 通过线段的组合计算总数
  - 然后ans2-ans1=AC！！
  
### 数学构造

#### K最不上升也降序列

- **题号**: K
- **链接**: [题目链接](https://ac.nowcoder.com/acm/contest/119605/J)
- **算法类型**: 数学证明
- **错误原因**:
  - 不会
  - 都错题了（byd）题目中的LIS指的是**最长**单增子序列
- **题解思路**:

>LIS × LDS ≥ $n$ 是因为排列可以用 LIS 个下降子序列覆盖，每个长度 ≤ LDS，所以 $n \leq$ LIS × LDS。
>在最优构造中，我们让 LIS ≈ LDS ≈ $\sqrt{n}$，使乘积 ≈ $n$（或略大于），从而最小化 LIS + LDS ≈ $2\sqrt{n}$。
>不是“为什么等于 n”，而是“为什么至少 n”，最优构造接近这个下界。
>对于完全平方 n（如 n=9, k=3），乘积正好 =9；否则略大，但不影响。

### 排列组合

#### P1088火星人

- **题号**: P1088
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P1088)
- **算法类型**: 数学（没有stl的情况下手搓next_permutation）
- **错误原因**:
  - 不会，好难
- **AC 代码**:

```cpp
while (m)
{
    for (int j = nums.size() - 2; j >= 0; j--)
    {
        if (pron[j] < pron[j + 1])
        {
            for (int i = nums.size() - 1; i > j; i--)
            {
                if (pron[j] < pron[i])
                {
                    {
                        swap(pron[i], pron[j]);
                        m--;
                        reverse(pron.begin() + j + 1, pron.end());
                        break;
                    }
                }
            }
            break;
        }
    }
}
for (int i = 0; i < n; i++)
{
    cout << pron[i] << ' ';
}
```

- **思路**:

1. 从右向左找第一个 `pron[j] < pron[j + 1]` 的位置 i
2. 若不存在 → 已是最大排列，返回 false
3. 从右向左找第一个 `pron[j] < pron[i]` 的 j
4. 交换 a[i] 和 a[j]
5. 反转区间 [i+1, n)
6. 返回 true。

## 几何

### 简单几何

#### P3799 小 Y 拼木棒

- **题号**: P3799
- **链接**: [题目链接](https://www.luogu.com.cn/problem/P53799)
- **算法类型**: 几何
- **错误原因**:
  - if条件判断：最好两个分开的条件分开写
  - 处理小巧思：为了不要算重复两个补集，可以写成for（j，i-j）
- **AC 代码**:

```cpp
void solve()
{
    vi nums(5050, 0);
    int n;
    int mod = 1e9 + 7;
    cin >> n;
    int ans = 0;
    for (int i = 0; i < n; i++)
    {
        int d;
        cin >> d;
        nums[d]++;//桶排处理：智慧的算法
    }
    for (int i = 1; i < 5001; i++)
    {
        if (nums[i] < 2)
            continue;
        int hsh1 = ((nums[i] * (nums[i] - 1)) / 2) % mod;
        for (int j = 1; j <= i-j; j++) // 智慧的处理方法：今日审美积累中
        {
            int k = i - j;
            if (k > 5001 || !nums[k] || !nums[j] || k <= 0||k==i||j==i)//专门挑出例外continue难道不比写特殊情景方便吗
                continue;
            if (k == j && nums[j] >= 2)
            {
                int hsh2 =(nums[j] * (nums[j] - 1)/2)%mod;
                ans =(ans+ hsh1 * hsh2) % mod;
            }
            else if(k!=j)
            {
                int hsh3 = (nums[j] * nums[k])%mod;
                ans =(ans+ hsh1 * hsh3) % mod;
            }
        }
    }
    cout << ans<<'\n';
}
```

- **注意事项**:
  - 最好把C（n，2）写成单独的一个变量，模块化方便操作（比如我这里的hsh1，hsh2）
  - 关于取模：“在每一步中间运算完成后，立即安全地取模”，尤其是加法、乘法、幂运算
  - for (int j = 1; j <= i-j; j++) // 智慧的处理方法：防止计算重复
  - else if(k!=j)//请把你的**条件完整写出来**，**非必要不要用else**除非完全在处理补集
  - 专门挑出例外continue比特判方便（特判容易漏条件）

### 三角形计算几何

#### 数三角

- **链接**: [题目链接](https://ac.nowcoder.com/acm/contest/118653/D)
- **算法类型**: 模拟，数学,计算数学，模板
- **错误原因**:
  - 时间不够，这题不是我熟悉的形式，跳过这题
  - 忘记余弦定理了
  - 注意特判三点共线
  - 注意判断一下三条边三个角！！！
- **AC 代码**:

```cpp

bool cek(int i, int j, int k, const vi &x, const vi &y)
{
    int g1 = (x[i] - x[j]) * (x[i] - x[j]) + (y[i] - y[j]) * (y[i] - y[j]);
    int g2 = (x[i] - x[k]) * (x[i] - x[k]) + (y[i] - y[k]) * (y[i] - y[k]);
    int g3 = (x[k] - x[j]) * (x[k] - x[j]) + (y[k] - y[j]) * (y[k] - y[j]);
    int ck = (y[k] - y[i]) * (x[j] - x[i]) - (y[j] - y[i]) * (x[k] - x[i]);
    if (ck == 0)
        return 0;
    if (g1 + g2 - g3 < 0)return 1;
    if (g1 + g3 - g2 < 0) return true;
    if (g2 + g3 - g1 < 0) return true;   
    return 0;
    // ok根据余弦定理我们可以知道只要（a*a+b*b-c*c)*a*b>0就行
}

```

- **注意事项**:
  - 要不然你在开头先声明bool然后结尾在定义运算，要不然你就把数据导入进去，全局变量是坏的
- **改进思路**:
  >这是一种可以套模板的题目，详见以下
  数学公式：
  1，使用叉积公式：点 $(x_0, y_0)$ 到直线（由点 $(x_1, y_1)$ 和 $(x_2, y_2)$ 定义）的距离为：
$$\text{distance} = \frac{|(y_2 - y_1)(x_0 - x_1) - (y_0 - y_1)(x_2 - x_1)|}{\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}}$$

```cpp
## 判断三角形类型 ##
bool isObtuse(int x1, int y1, int x2, int y2, int x3, int y3) {
    ll g1 = (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
    ll g2 = (x1 - x3) * (x1 - x3) + (y1 - y3) * (y1 - y3);
    ll g3 = (x2 - x3) * (x2 - x3) + (y2 - y3) * (y2 - y3);
    //这里是叉积判断是否共线
    ll ck = (y3 - y1) * (x2 - x1) - (y2 - y1) * (x3 - x1);
    if (ck == 0) return false;
    return (g1 + g2 - g3 < 0 || g1 + g3 - g2 < 0 || g2 + g3 - g1 < 0);
    //这里是余弦定理返回钝角，直角就==0，锐角就>0
}

## 计算点到直线的距离 ##
double pointToLineDistance(int x0, int y0, int x1, int y1, int x2, int y2) {
    double cross = abs((y2 - y1) * (x0 - x1) - (y0 - y1) * (x2 - x1));
    double dist = sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    return cross / dist;
}//注意要用double


```

### 圆计算几何

#### 牛牛战队的秀场

- **题目简述**：给定圆半径r，求里面内接正n边形边长
- **代码块**

```cpp
#define M_PI  3.14159265358979323846
void solve()
{
    int n;
    double R;
    cin >> n >> R;
    double side = 2 * R * sin(M_PI / n);
    int q,w;
    cin>>q>>w;
    int jl=min(abs(w-q),n-abs(w-q));
    cout << fixed << setprecision(10) << side*jl<< '\n';
}
```

- **公式**：`double side = 2 *R* sin(M_PI / n);`

---
