---
source_hash: "a673aa84"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "exa 仅显示点文件"
pubDate: "2022-08-16"
description: "exa 是一个 ls 程序的替代品，本文介绍如何使用 exa 仅显示点文件（dotfiles）。"
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "exa", "shell"]
---

> exa 是一个 ls 程序的替代品，旨在提供更加友好与多彩的用户界面，其期望与 bat 相似。

## 背景

在简单尝试 exa 后，我决定 alias 替换 ls 来体验一段时间，然后发现 `ls -al --ignore="[^.]*"` 命令无法被直接替换，因为 exa 没有 ignore 接口。

## 测试命令

在查找文档后，发现 exa 拥有基于 glob 语法的过滤（[文档的 Filtering 节](https://the.exa.website/features/filtering)）。

所以仅显示点文件的命令应该是

```bash
exa -la --ignore-glob="[!.]*"
```

其中，`"!"` 意指不包括。

## 添加 alias

最后，我修改后的 rc 文件为（color 只是为了方便之后切换回 ls，exa 默认开启）

```bash
alias ls='exa'
alias l.='exa -la --ignore-glob="[!.]*"'
alias ll='ls --color=auto -l'
alias la='ls --color=auto -la'
```
