---
title: KH_博弈论
tags:
    - 算法
---

## 博弈操作

### 入门:简单的公平博弈下dfs搜索

- **核心原理**：如果无论怎么转移，到达的所有状态都是必胜态，或者当前根本无法转移（到达终点），当前状态就是必败态。

#### [左右脑互博](https://acm.hdu.edu.cn/contest/problem?cid=1200&pid=1004)

- **题目**:两脑轮流操作，左脑先手，右脑后手。游戏一开始给出了包含 n 个正整数的多重集合(即可以包含重复元素)。每次操作时，脑子必须从集合中删除一个数，并且必须满足删除的这个数大于删除这个数后集合中剩余元素的异或和。若当前集合中只有一个元素，则可以直接删去。无法操作的脑子失败。

- **思路**:题目给了20的数据范围直接搜索就好，在目前这一步我要尽可能地胜利。这只是单纯的01胜利判断

- **关键代码**:

```cpp
void solve()
{
    int n;
    cin >> n;
    vi nums(n);
    int fk = 0;
    rep(i, 0, n - 1)
    {
        cin >> nums[i];
        fk ^= nums[i];
    }
    if (!fk)
    {
        cout << "Right" << '\n';
        return;
    }
    vi vis(n);
    int win = 0;
    auto dfs = [&](int cnt, auto self) -> bool
    {
        for (int i = 0; i < n; i++)
        {
            if (!vis[i])
            {
                cnt ^= nums[i];
                if (cnt < nums[i])
                {
                    vis[i] = 1;
                    if (!self(cnt, self))
                    {
                        vis[i] = 0;
                        cnt ^= nums[i];
                        return 1;
                    }
                    vis[i] = 0;
                    cnt ^= nums[i];
                }
                else cnt ^= nums[i];
            }
        }
        return 0;
    };
    

    if (dfs(fk, dfs))
    {
        cout << "Left" << '\n';
    }
    else
    {
        cout << "Right" << '\n';
    }
}

```

- **DFS伪代码思路**:此时返回的是目前这个人是否必胜

```cpp
// 记忆化数组，初始化为 -1，0 表示必败，1 表示必胜
int memo[MAX_STATE]; 

bool dfs(State u) {
    // 1. 终点判定：如果当前已经没有任何合法操作（无路可走），根据正常游戏规则，当前玩家必败
    if (is_terminal(u)) return false; 
    
    // 2. 查表：如果计算过，直接返回（记忆化搜索防 TLE）
    if (memo[u] != -1) return memo[u];

    // 3. 遍历所有可能的下一步操作
    for (State v : get_transitions(u)) {
        // 如果下一步 v 对于对手来说是“必败态” (dfs(v) == false)
        // 那么我只要走这一步，我就必胜了
        if (!dfs(v)) {
            return memo[u] = true;
        }
    }

    // 4. 如果循环结束还没 return，说明我能走的所有 v，dfs(v) 都是 true（对手必胜）
    // 那我只能必败了
    return memo[u] = false;
}

```

---
