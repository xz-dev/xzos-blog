---
source_hash: "bd9c951c"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "Find First and Last Position of Element in Sorted Array"
pubDate: "2021-04-30"
description: "LeetCode 算法题：在排序数组中查找元素的第一个和最后一个位置，对比递归和迭代两种实现方法。"
author: "xz-dev"
category: "算法"
tags: ["leetcode", "二分查找", "算法"]
---

> 题目网址：[https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/](https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/)
>
> 本质是二叉搜索题，即搜索起始点与结束点

<!--more-->

## 解题方法

### 递归方法

#### 代码

```python
def check_nums_middle(target: int, nums: list, start_position: int, stop_position: int):
    if start_position == stop_position:
        if target == nums[start_position]:
            return start_position, stop_position
        else:
            return [-1, -1]
    elif start_position + 1 == stop_position:
        r_start_position = -1
        r_stop_position = -1
        if nums[start_position] == target:
            r_start_position = start_position
            r_stop_position = start_position
        if nums[stop_position] == target:
            if r_start_position == -1:
                r_start_position = stop_position
            r_stop_position = stop_position
        return r_start_position, r_stop_position
    else:
        middle_position = int((start_position + stop_position) / 2)
        middle_position_num = nums[middle_position]
        if target > middle_position_num:
            return check_nums_middle(target, nums, middle_position, stop_position)
        elif target < middle_position_num:
            return check_nums_middle(target, nums, start_position, middle_position)
        else:  # 中位数数值相等
            left_position_range, left_r = check_nums_middle(
                target, nums, start_position, middle_position)
            right_l, right_position_range = check_nums_middle(
                target, nums, middle_position + 1, stop_position)
            if left_r == -1:
                return right_l, right_position_range
            elif right_l == -1:
                return left_position_range, left_r
            else:
                return left_position_range, right_position_range


def main(target: int, nums: list) -> list:
    if len(nums) == 0:
        return [-1, -1]
    left_position_range, right_position_range = check_nums_middle(
        target, nums, 0, len(nums) - 1)
    return [left_position_range, right_position_range]
```

#### LeetCode 测试

![递归写法的 LeetCode 测试](/images/blog/find-first-and-last-position-of-element-in-sorted-array/leetcode-recursive.png)

### 迭代

> 当列表足够长时，递归可能导致 [尾调用](https://zh.wikipedia.org/zh-cn/%E5%B0%BE%E8%B0%83%E7%94%A8) 的问题，迭代则不会

#### 代码

```python
def for_num_check(target: int, nums: list) -> list:
    start_position = 0
    stop_position = len(nums) - 1
    # 寻找等值的中位数
    while True:
        middle_position = int((start_position + stop_position) / 2)
        #print(f"find target: {start_position}, {stop_position}")
        middle_position_num = nums[middle_position]
        if target == middle_position_num:
            break
        # 这个数不存在
        elif stop_position - start_position <= 1:
            if target == nums[stop_position]:
                middle_position = stop_position
                break
            else:
                return [-1, -1]
        elif target > middle_position_num:
            start_position = middle_position + 1
        else:
            stop_position = middle_position - 1

    # 确定左右范围
    left_start_position = start_position
    left_stop_position = middle_position - 1
    #print(f"target {middle_position}")
    #print(f"left: {left_start_position}, {left_stop_position}")
    if left_start_position <= left_stop_position:
        left_position = left_num_check(target, nums, left_start_position,
                                        left_stop_position)
        if left_position == -1:
            left_position = middle_position
    else:
        left_position = middle_position
    #print(f"left: {left_position}")

    right_start_position = middle_position + 1
    right_stop_position = stop_position
    #print(f"right: {right_start_position}, {right_stop_position}")
    if right_start_position <= right_stop_position:
        right_position = right_num_check(target, nums, right_start_position,
                                          right_stop_position)
        if right_position == -1:
            right_position = middle_position
    else:
        right_position = middle_position
    #print(f"right: {right_position}")

    return [left_position, right_position]


# 寻找最左的目标值
def left_num_check(target: int, nums: list, start_position: int,
                   stop_position: int) -> int:
    if nums[stop_position] != target:
        return -1
    while True:
        middle_position = int((start_position + stop_position) / 2)
        middle_position_num = nums[middle_position]
        if middle_position == start_position:
            if target == middle_position_num:
                return middle_position
            else:
                return stop_position
        elif target == middle_position_num and\
                target > nums[middle_position - 1]:
            return middle_position
        elif target == middle_position_num:
            stop_position = middle_position - 1
        else:
            start_position = middle_position + 1


# 寻找最右的目标值
def right_num_check(target: int, nums: list, start_position: int,
                    stop_position: int) -> int:
    if nums[start_position] != target:
        return -1
    while True:
        middle_position = int((start_position + stop_position) / 2)
        middle_position_num = nums[middle_position]
        if middle_position == stop_position:
            if target == middle_position_num:
                return middle_position
            else:
                return start_position
        elif target == middle_position_num and\
                target < nums[middle_position + 1]:
            return middle_position
        elif target == middle_position_num:
            start_position = middle_position + 1
        else:
            stop_position = middle_position - 1


def main(target: int, nums: list) -> list:
    if len(nums) == 0:
        return [-1, -1]
    return for_num_check(target, nums)
```

#### LeetCode 测试

![迭代写法的 LeetCode 测试结果](/images/blog/find-first-and-last-position-of-element-in-sorted-array/leetcode-iterative.png)

## 测试方法

```python
print(main(0, [0, 0, 0, 0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8, 8, 8, 9, 9, 10, 10, 11, 11]))
```

## 总结

迭代在一些方面（[尾调用](https://zh.wikipedia.org/zh-cn/%E5%B0%BE%E8%B0%83%E7%94%A8)）比递归好，但是写起来麻烦，容易出错，实际应用（不写一些通用库时）并不建议 🙁
