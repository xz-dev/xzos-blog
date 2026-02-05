---
source_hash: "bd2b8361"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "Range Sum Query 2D"
pubDate: "2021-05-12"
description: "使用动态规划解决 LeetCode 的二维矩阵区域和查询问题。"
author: "xz-dev"
category: "算法"
tags: ["leetcode", "动态规划", "算法"]
---

> 题目网址：[https://leetcode.com/problems/range-sum-query-2d-immutable/](https://leetcode.com/problems/range-sum-query-2d-immutable/solution/)

动态规划解矩阵两点间求和的问题

<!--more-->

## 解题方法

### 遍历求和

#### 代码

```python
class NumMatrix:
    def __init__(self, matrix: list[list[int]]):
        self.matrix = matrix

    def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:
        n_sum = 0
        for i in range(row1, row2 + 1):
            n_sum += sum(self.matrix[i][col1:col2 + 1])
        return n_sum
```

#### LeetCode 测试

![LeetCode 测试结果](/images/blog/range-sum-query-2d/leetcode-test-1.png)

### 动态规划

#### 代码

```python
class NumMatrix:
    def __init__(self, matrix: list[list[int]]):
        self.matrix = []
        last_row = None
        row_size = len(matrix[0])
        for row in matrix:
            row_sum = 0
            l_row = []
            if not last_row:
                for i in row:
                    row_sum += i
                    l_row.append(row_sum)
            else:
                l_row = []
                for i in range(row_size):
                    row_sum += row[i]
                    l_row.append(row_sum + last_row[i])
            self.matrix.append(l_row)
            last_row = l_row

    def sumRegion(self, row1: int, col1: int, row2: int, col2: int) -> int:
        row1_0 = row1 - 1
        col1_0 = col1 - 1
        if row1_0 >= 0 and col1_0 >= 0:
            n = self.matrix[row2][col2] - self.matrix[row2][
                col1_0] - self.matrix[row1_0][col2] + self.matrix[row1_0][
                col1_0]
        elif row1_0 < 0 and col1_0 >= 0:
            n = self.matrix[row2][col2] - self.matrix[row2][col1_0]
        elif row1_0 >= 0 and col1_0 < 0:
            n = self.matrix[row2][col2] - self.matrix[row1_0][col2]
        else:
            n = self.matrix[row2][col2]
        return n
```

#### LeetCode 测试

**92ms / 17.5 MB** (beats 99.79% / 20.87%).

![LeetCode 测试结果](/images/blog/range-sum-query-2d/leetcode-test-2.png)

## 测试方法

```python
a = NumMatrix([[3, 0, 1, 4, 2], [5, 6, 3, 2, 1], [1, 2, 0, 1, 5], [4, 1, 0, 1, 7], [1, 0, 3, 0, 5]]).sumRegion(2, 1, 4, 3)
print(a)
```

## 总结

动态规划即将一个大问题拆分为多个小问题**（几乎是废话）**。

该题的解题与优化思路在于在初始化时就预先为目标问题而提前处理数据，以便减少最终函数的时间、空间消耗。即，提前计算矩阵和，在使用时直接调用而非重新计算。
