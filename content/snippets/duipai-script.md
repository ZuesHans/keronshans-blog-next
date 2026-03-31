---
id: "duipai-script"
title: "对拍脚本"
language: "Shell"
tags:
  - 对拍
  - 调试
description: "快速生成对拍脚本，用于验证算法正确性"
created_at: "2026-04-01 06:00:00"
updated_at: "2026-04-01 06:00:00"
---

快速对拍脚本，保存为 `duipai.sh` 后运行：

```shell
#!/bin/bash
while true; do
    # 生成随机数据
    ./gen > data.in
    # 运行两个程序
    ./sol < data.in > sol.out
    ./bf < data.in > bf.out
    # 比较输出
    if ! diff -Z sol.out bf.out > /dev/null; then
        echo "WA!"
        cat data.in
        echo "---sol---"
        cat sol.out
        echo "---bf---"
        cat bf.out
        break
    fi
    echo "AC #$(cat data.in | wc -c) bytes"
done
```
