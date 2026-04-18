---
title: KH_实现合集
date: 2026-03-07
tags:

    - 算法
cover: /img/cover/picg_5.png
---

## 实现二进制拼凑某个数字

- 用代码表达就是从高位到低位扫描：

```cpp
ll R = 0;
for(int d = 29; d >= 0; d--){
    if(n & (1ll << d)){  // 如果第d位是1
        R = R * ten[d] + rli[d];
    }
}
```
