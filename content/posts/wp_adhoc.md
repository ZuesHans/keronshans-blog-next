---
title: wp_优化
date: 2026-01-12
tags:
    - 算法
cover: /img/cover/picg_12.png
---

## gcd相关

### gcd构造性质：知道

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
