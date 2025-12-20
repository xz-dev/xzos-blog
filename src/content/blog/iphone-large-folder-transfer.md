---
title: "如何将10G11万个文件的文件夹（微信存档）从一个 iPhone 传输到另一个 iPhone 上"
pubDate: "2025-12-20"
description: "使用 a-Shell 和 SSH/tar 组合，通过 Linux 电脑中转，高效传输 iPhone 上的大型文件夹"
author: "xz-dev"
category: "Tips"
tags: ["iPhone", "a-Shell", "SSH", "tar", "文件传输", "微信"]
---

当你需要在两台 iPhone 之间传输一个包含 10GB、11 万个文件的微信存档时，传统方案往往力不从心：

- **AirDrop**：会无限等待"准备文件"，永远无法开始传输
- **iCloud**：直接报错，无法处理如此大量的文件

本文介绍一种通过 a-Shell + SSH + tar 的高效方案。

<!--more-->

## 为什么不使用 iSH

你可能会想到使用 iSH 这个 iOS 上的 Linux 模拟器。然而，iSH 在使用 `mount -t ios` 挂载 iOS 文件系统时存在严重的 IO 性能瓶颈。

### 性能问题来源

iSH 的性能问题主要来自其底层架构：它在用户态完全模拟 x86 指令集，这导致整体性能大幅下降。当使用 `mount -t ios` 命令挂载 iOS 文件提供者（File Provider）时，还需要经过 iOS 的文件系统 API 层，这进一步增加了 IO 操作的开销。

### 速度表现

根据用户反馈，iSH 的运行速度比原生执行慢几个数量级（orders of magnitude slower）。开发者也表示，即使改进代码，像 `youtube-dl --help` 这样的命令仍需要约一分钟才能完成，很难优化到 10 秒以内。这种性能限制在处理挂载的 iOS 文件系统时同样明显。

### JIT 优化尝试

开发团队曾尝试引入 JIT（即时编译）功能来提升性能 2-5 倍，但苹果拒绝了这一请求。目前在 iOS 上，用户需要在灵活性（iSH 的完整 shell 环境）和性能（如 a-Shell 等原生方案）之间做出选择。

## 选择 a-Shell

a-Shell 是一个原生的 iOS 终端应用，相比 iSH 有更好的性能表现。但它也有限制：

- 不支持 rsync
- 不支持 SSH server

因此，我们需要借助一台电脑作为中转。

## 为什么使用 Linux 电脑中转

有些文件名格式 iPhone 支持但 Windows 不支持（如包含特殊字符的文件名）。为了避免文件名兼容性问题，推荐使用 Linux 电脑作为中转。

如果你只有 Windows 电脑，可以选择**不解压 tar 存档**的方案（见下文）。

## 完整操作步骤

### 方案一：通过 Linux 电脑中转（解压存储）

#### 步骤 1：在源 iPhone 上打开 a-Shell 并选择目录

```bash
pickFolder  # 选择要传输的微信存档目录
```

#### 步骤 2：上传到 Linux 电脑

```bash
tar czf - ./wx | ssh user@ip "cd ~/upload && tar xzf -"
```

这条命令会：
1. 将 `./wx` 目录打包压缩为 tar.gz 流
2. 通过 SSH 传输到电脑
3. 在电脑上实时解压

#### 步骤 3：在电脑上校验

```bash
# 检查文件数量
find . -type f | wc -l

# 检查总大小
du -sh .
```

#### 步骤 4：在目标 iPhone 上下载

在新 iPhone 的 a-Shell 中：

```bash
pickFolder  # 选择目标目录
```

然后执行下载命令：

```bash
ssh -c aes128-ctr user@ip "cd ~/upload && tar czf - ." | tar xzf -
```

> 使用 `-c aes128-ctr` 加密算法可以提升传输速度。

### 方案二：不解压 tar 存档（适用于 Windows）

如果你使用 Windows 电脑，或者想避免文件名兼容性问题，可以选择不在电脑上解压 tar。

#### 上传（在源 iPhone 上）

```bash
pickFolder  # 选择要传输的目录
tar czf - . | ssh user@ip "cat > ~/wx_backup.tar.gz"
```

#### 下载（在目标 iPhone 上）

```bash
pickFolder  # 选择目标目录
ssh -c aes128-ctr user@ip "cat ~/wx_backup.tar.gz" | tar xzf -
```

这样 tar 存档在电脑上保持压缩状态，只在 iPhone 上解压，完全避免了 Windows 文件名兼容性问题。

## 监控传输进度

在电脑上监控传输进度（适用于方案一）：

```bash
watch 'echo "Size: $(du -sh . 2>/dev/null | cut -f1)"; echo "Files: $(find . -type f 2>/dev/null | wc -l)"'
```

这会每 2 秒刷新一次，显示当前目录的大小和文件数量。

对于方案二，可以监控 tar 文件大小：

```bash
watch 'ls -lh ~/wx_backup.tar.gz'
```

### 校验 tar 存档内的文件数量

如果你使用方案二（不解压 tar），可以在不解压的情况下统计存档内的文件数量：

```bash
# 统计 tar.gz 内的文件数量
tar tzf ~/wx_backup.tar.gz | wc -l

# 如果想只统计文件（排除目录）
tar tzf ~/wx_backup.tar.gz | grep -v '/$' | wc -l
```

> `tar tzf` 会列出存档内容但不解压，`-t` 表示列出，`-z` 表示 gzip 压缩，`-f` 指定文件。

> **Windows 用户提示**：上述监控和校验命令是 Linux/macOS 命令。如果你使用 Windows，可以借助 AI（如 ChatGPT、Claude）将这些命令转换为 PowerShell 或 Windows 命令行等效命令。

## 总结

| 方案 | 优点 | 缺点 |
|------|------|------|
| 方案一（Linux 解压） | 可以在电脑上查看/管理文件 | 需要 Linux 环境 |
| 方案二（不解压 tar） | 兼容 Windows，无文件名问题 | 电脑上无法直接查看文件 |

对于 10GB、11 万个文件的传输任务，这种 SSH + tar 流式传输方案比逐个文件复制高效得多，也比 AirDrop 更稳定可靠。
