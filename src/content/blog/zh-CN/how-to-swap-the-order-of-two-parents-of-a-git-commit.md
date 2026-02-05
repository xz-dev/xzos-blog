---
source_hash: "ccec3796"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "修改一个历史提交的父提交"
pubDate: "2021-02-06"
description: "使用 Git 的 grafts 和 filter-repo 工具来修改历史提交的父提交顺序，解决合并方向错误的问题。"
author: "xz-dev"
category: "Git"
tags: ["Git", "UpgradeAll"]
---

在半年前，合并热修复分支时，合并方向弄反了，导致热修复分支成为了新的主分支。但一直没有什么办法，今天重拾起来，尝试去修复。

<!--more-->

> 参考资料
>
> 1. [How do I swap the order of two parents of a Git commit?](https://stackoverflow.com/questions/25265528/how-do-i-swap-the-order-of-two-parents-of-a-git-commit)（引子）
> 2. [How do git grafts and replace differ? (Are grafts now deprecated?)](https://stackoverflow.com/questions/6800692/how-do-git-grafts-and-replace-differ-are-grafts-now-deprecated)
> 3. [Setting git parent pointer to a different parent](https://stackoverflow.com/questions/3810348/setting-git-parent-pointer-to-a-different-parent)（解决方法出处）

## 效果预览

- 修复前

![修复前的 Git 提交树](/images/blog/how-to-swap-the-order-of-two-parents-of-a-git-commit/before.png)

- 修复后

![修复后的 Git 提交树](/images/blog/how-to-swap-the-order-of-two-parents-of-a-git-commit/after.png)

## 操作步骤

> 备份项目文件（打包一个压缩包）

### 创建一个嫁接提交

切换（修改）目标分支的信息（包括父分支等）（[参考出处](https://stackoverflow.com/a/40540389)）

```bash
git replace --graft <目标 commit> <主分支的父节点> <热修复分支的父节点>
```

### 检查修改

检查嫁接 commit 的信息是否正确，符合预期（现在还没修改到原 commit 上，只是保存文件至 .git/refs/replace/）

查看原 commit 信息

```bash
git cat-file commit <目标 commit>
```

查看嫁接 commit 信息

```bash
git --no-replace-objects cat-file commit <目标 commit>
```

### 覆盖原 commit

安装 git-filter-repo（需要 git 在 2.22 版本以上）

覆盖提交（[参考出处](https://stackoverflow.com/a/62479351)）

```bash
git filter-repo --force
```

### 重新绑定远端仓库

```bash
git remote add origin <你的远端仓库地址>
```

### 提交

> 提交修改（每个分支都要）

```bash
git push -f <分支名>
```

## 告知项目相关者

告知一同开发的开发者保存现有代码并重新 pull 项目 🙂
