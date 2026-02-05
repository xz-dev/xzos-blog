---
source_hash: "d1fb81d1"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "批量修复 DJI Mimo 导出照片/视频的拍摄时间"
pubDate: "2026-01-04"
description: "使用 osxphotos timewarp 命令从文件名提取正确的拍摄时间，批量修复 Apple Photos 中 DJI Mimo 导出文件的日期"
author: "xz-dev"
category: "Tips"
tags: ["DJI Mimo", "Apple Photos", "osxphotos", "macOS", "照片管理"]
---

DJI Mimo APP 导出的照片和视频导入 Apple Photos 后，日期可能会显示错误。更麻烦的是，Apple Photos 原生不支持批量恢复原始拍摄时间——选择多张照片时"恢复"按钮会消失。

本文介绍如何使用 osxphotos timewarp 命令，从文件名中提取正确的拍摄时间并批量修复。

<!--more-->

## 前提条件

此方法需要 macOS 环境，你可以选择：

- 使用 Mac 电脑
- 通过 [quickemu](https://github.com/quickemu-project/quickemu)（推荐）创建 macOS 虚拟机
- 通过 [ultimate-macOS-KVM](https://github.com/Coopydood/ultimate-macOS-KVM) 创建 macOS 虚拟机

## DJI Mimo 文件命名规则

首先需要理解 DJI Mimo 的文件命名结构：

```
dji_mimo_20260101_151718_20260101151719_1767262128881_photo.jpg
│        │        │      │              │             │
│        │        │      │              │             └─ 类型标识 (photo/video)
│        │        │      │              └─ Unix 时间戳（毫秒）
│        │        │      └─ 第二个时间戳：YYYYMMDDHHMMSS（实际拍摄时刻）
│        │        └─ 第一个时间戳的时间部分：HHMMSS
│        └─ 第一个时间戳的日期部分：YYYYMMDD
└─ 固定前缀
```

### 两个时间戳的区别

| 时间戳 | 示例 | 含义 |
|--------|------|------|
| 第一个 | `20260101_151718` | 文件创建/保存时间 |
| 第二个 | `20260101151719` | **实际拍摄时刻**（我们需要的） |

> 对于视频，两者差距可能是视频时长（录制结束 vs 录制开始）；对于照片，通常只差 1 秒左右。

## osxphotos parse-date 解析规则

`--parse-date` 参数使用类似 strptime 的格式，加上扩展通配符：

| 符号 | 含义 | 示例 |
|------|------|------|
| `%Y` | 4位年份 | `2026` |
| `%m` | 2位月份 | `01` |
| `%d` | 2位日期 | `01` |
| `%H` | 2位小时(24h) | `15` |
| `%M` | 2位分钟 | `17` |
| `%S` | 2位秒 | `19` |
| `*` | 匹配任意字符（通配符） | 跳过不需要的部分 |
| `?` | 匹配单个字符 | 更精确的跳过 |

### 解析模式解读

```
dji_mimo_*_*_%Y%m%d%H%M%S
│        │ │ └─ 提取：20260101151719
│        │ └─ 跳过：151718
│        └─ 跳过：20260101
└─ 固定匹配：dji_mimo_
```

用 `*` 而不是 `????????` 的原因：
- `*` 匹配任意长度，更灵活
- `????????` 精确匹配 8 个字符，更严格
- 对于 DJI Mimo 文件，`*` 足够且更简洁

## 安装 osxphotos

```bash
brew install osxphotos
```

详细安装说明参考：[osxphotos 官方安装文档](https://github.com/RhetTbull/osxphotos?tab=readme-ov-file#installation-using-brew)

## 操作步骤

### 1. 整理照片到相册

在 Apple Photos 中，将所有 DJI Mimo 导出的文件整理到一个相册（如 `DJI Album`）。

### 2. 运行修复命令

```bash
osxphotos timewarp \
  --album "DJI Album" \
  --parse-date "dji_mimo_*_*_%Y%m%d%H%M%S" \
  --timezone "Asia/Shanghai" \
  --verbose
```

### 参数说明

| 参数 | 说明 |
|------|------|
| `--album` | 指定要处理的相册名称 |
| `--parse-date` | 文件名解析模式 |
| `--timezone` | 时区设置（根据你的位置调整） |
| `--verbose` | 显示详细输出 |

### 3. 验证结果

两种方式：

**直接在 Apple Photos 中确认**（推荐）：打开 Photos 应用，查看照片/视频的日期是否已更新。

**使用命令行查询**（可选）：

```bash
osxphotos query --album "DJI Album" --json | jq | head -100
```

注：`--json` 输出是单行 JSON，需要 `jq` 格式化后才能阅读。

## 注意事项

> **必须登录自己的 iCloud 帐号**：iCloud 同步是整体的，无法单独切换 Photos 的帐号。如果使用虚拟机，需要在虚拟机中登录你自己的 Apple ID。

- 建议操作前备份照片图库
- 此方法同时适用于照片和视频
