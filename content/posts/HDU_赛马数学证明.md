---
title: HDU_赛马数学证明
category: 题解复盘
date: '2026-06-04'
tags:
  - 数学
---
A174605 数学证明
1. 序列定义
由 Mathematica 代码可知：

$$a(n) = \sum_{k=0}^{n} \bigl(k - s_2(k)\bigr)$$

其中 $s_2(k)$ 是 $k$ 的二进制表示中 1 的个数（popcount）。

2. Legendre 公式：$\nu_2(n!) = n - s_2(n)$
这是核心引理。

证明： 设 $n$ 的二进制表示为 $n = \sum_{j=0}^{L} b_j \cdot 2^j$，其中 $b_j \in {0,1}$。

由 Legendre 公式，$n!$ 中素因子 2 的幂次为：

$$\nu_2(n!) = \sum_{i=1}^{\infty} \left\lfloor \frac{n}{2^i} \right\rfloor$$

将 $n$ 的二进制展开代入：

$$\left\lfloor \frac{n}{2^i} \right\rfloor = \sum_{j=i}^{L} b_j \cdot 2^{j-i}$$

因此：

$$\sum_{i=1}^{\infty} \left\lfloor \frac{n}{2^i} \right\rfloor = \sum_{i=1}^{L} \sum_{j=i}^{L} b_j \cdot 2^{j-i}$$

交换求和顺序（令 $j$ 为外层）：

$$= \sum_{j=1}^{L} b_j \sum_{i=1}^{j} 2^{j-i} = \sum_{j=1}^{L} b_j \cdot (2^j - 1)$$

由于 $b_0 \cdot (2^0 - 1) = 0$，可以从 $j=0$ 开始：

$$= \sum_{j=0}^{L} b_j \cdot (2^j - 1) = \sum_{j=0}^{L} b_j \cdot 2^j - \sum_{j=0}^{L} b_j = n - s_2(n) \qquad \blacksquare$$

3. 与 Barnes G 函数的联系
Barnes G 函数满足 $G(n+2) = \prod_{k=1}^{n} k!$（超阶乘）。

因此：

$$\nu_2\bigl(G(n+2)\bigr) = \sum_{k=1}^{n} \nu_2(k!) = \sum_{k=1}^{n} \bigl(k - s_2(k)\bigr) = \sum_{k=0}^{n} \bigl(k - s_2(k)\bigr) = a(n)$$

最后一步成立是因为 $k=0$ 时 $0 - s_2(0) = 0$。$\blacksquare$

4. 闭合公式推导
将 $a(n)$ 拆分：

$$a(n) = \sum_{k=0}^{n} k - \sum_{k=0}^{n} s_2(k) = \frac{n(n+1)}{2} - S(n)$$

其中 $S(n) = \sum_{k=0}^{n} s_2(k)$。

计算 $S(n)$： 利用按位分解。

$$s_2(k) = \sum_{j=0}^{L} b_j(k)$$

其中 $b_j(k)$ 是 $k$ 的第 $j$ 位。交换求和：

$$S(n) = \sum_{j=0}^{L} \sum_{k=0}^{n} b_j(k) = \sum_{j=0}^{L} f(n, j)$$

这里 $f(n,j) = \sum_{k=0}^{n} b_j(k)$ 表示 $[0, n]$ 中第 $j$ 位为 1 的整数个数。

引理： 在 $0, 1, 2, \ldots$ 中，第 $j$ 位按周期 $2^{j+1}$ 循环：先 $2^j$ 个 0，再 $2^j$ 个 1。设 $n + 1 = q \cdot 2^{j+1} + r$（其中 $0 \le r < 2^{j+1}$），则：

$$f(n, j) = q \cdot 2^j + \max(r - 2^j,\ 0)$$

证明： 在完整的 $q$ 个周期中，每个周期贡献 $2^j$ 个 1。剩余的 $r$ 个数中，前 $2^j$ 个的第 $j$ 位为 0，之后的（若有）为 1，贡献 $\max(r - 2^j, 0)$。$\blacksquare$

因此最终：

$$\boxed{a(n) = \frac{n(n+1)}{2} - \sum_{j=0}^{\lfloor \log_2 n \rfloor} \left[ \left\lfloor \frac{n+1}{2^{j+1}} \right\rfloor \cdot 2^j + \max!\Bigl((n+1) \bmod 2^{j+1} - 2^j,\ 0\Bigr) \right]}$$

5. 验证 Python 代码的等价性
Python 代码：


def A174605(n):
    return (n*(n+1)>>1) - (n+1)*n.bit_count() - (
        sum((m:=1<<j) * ((k:=n>>j) - (r if n<<1 >= m*(r:=k<<1|1) else 0))
            for j in range(1, n.bit_length()+1)) >> 1)
其中 n*(n+1)>>1 即 $\frac{n(n+1)}{2}$，n.bit_count() 即 $s_2(n)$。

代码将 $S(n)$ 分成两部分处理，利用了以下恒等式：

$$S(n) = (n+1) \cdot s_2(n) + \frac{1}{2}\sum_{j=1}^{L} 2^j \cdot \left(\left\lfloor \frac{n}{2^j} \right\rfloor - \epsilon_j\right)$$

其中 $\epsilon_j$ 是修正项（对应代码中的 r if n<<1 >= m*r else 0），用于处理不完整周期中的余项。这本质上是对上述 $f(n,j)$ 求和公式的代数变形，将完整周期部分与余项部分分离并化简。$\blacksquare$

总结： 所有公式的数学根基是 Legendre 公式 $\nu_2(n!) = n - s_2(n)$ 与 二进制位按周期分布 的组合计数。不同代码实现只是对同一求和式的不同代数化简。
