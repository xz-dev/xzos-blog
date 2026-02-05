---
source_hash: "d7177536"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "Arch Linux 的 KDE 最小安装方案"
pubDate: "2019-05-18"
description: "提供一个最小、方便、可用的 KDE 桌面环境安装方案，包括 Xorg、显示管理器、KDE 桌面和推荐应用的配置。"
author: "xz-dev"
category: "Linux 桌面环境"
tags: ["KDE", "Arch Linux"]
---

> 本文旨在提供一个最小，方便，可用的 KDE 桌面环境
> 更详细的信息见 [ArchWiki KDE](https://wiki.archlinux.org/index.php/KDE_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

## 安装Xorg

> 在安装 Plasma(KDE5) 之前，请确保 [Xorg](https://wiki.archlinux.org/index.php/Xorg_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) 已经被安装到您的系统中并可以正常工作。

一般情况下，你只需要 [xorg-server](https://www.archlinux.org/packages/?name=xorg-server) 软件包。

此外，[xorg-apps](https://www.archlinux.org/groups/x86_64/xorg-apps/) 组提供了一些程序以完成某些特定的配置工作。

软件包组 [xorg](https://www.archlinux.org/groups/x86_64/xorg/) 包含了 Xorg server，[xorg-apps](https://www.archlinux.org/groups/x86_64/xorg-apps/) 中的软件包以及字体

## 安装显示管理器

> 最简单的方法是使用 [显示管理器](https://wiki.archlinux.org/index.php/Display_manager_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))，这样就不需要额外的安装和配置。

KDE 环境下，推荐使用 [SDDM](https://wiki.archlinux.org/index.php/SDDM)。

理由：KDE5 为 SDDM 提供了官方的主题设置支持，且在密码验证（kwallet）上提供了开箱即用的体验。

## 安装 KDE桌面

Arch Linux 提供了 [plasma](https://www.archlinux.org/groups/x86_64/plasma/) 组（推荐）、[plasma-meta](https://www.archlinux.org/packages/?name=plasma-meta) 元软件包、[plasma-desktop](https://www.archlinux.org/packages/?name=plasma-desktop) 包（最小化安装 Plasma，不建议，缺少必要软件）

为确保 KDE 桌面环境的方便性与最小安装（手动选择非必要软件），我们选择 [plasma](https://www.archlinux.org/groups/x86_64/plasma/) 组

全选安装 plasma 组，然后卸载 [plasma-sdk](https://www.archlinux.org/packages/extra/x86_64/plasma-sdk/)（开发者工具）与 KDE 自带的游戏 `sudo pacman -Rscn $(pacman -Qqs kde games)`。

## KDE 网络管理

NetworkManager 是 KDE 默认网络管理，运行 `sudo systemctl enable NetworkManager` 设置开机自启

## 推荐的 KDE 应用

- [Konsole](https://security.archlinux.org/package/konsole)（KDE 终端）
- [Dolphin](https://wiki.archlinux.org/index.php/Dolphin)（KDE 文件管理）
- [KDE Connect](https://wiki.archlinux.org/index.php/KDE#KDE_Connect)（连接手机）
- [Ark](https://www.archlinux.org/packages/extra/x86_64/ark/)（压缩/解压软件）
- [Okular](https://www.archlinux.org/packages/extra/x86_64/okular/)（PDF阅读器）

## KDE 推荐插件列表

参见：[KDE 推荐插件列表](https://xzos.net/kde-recommended-plugin-list/)

> 重启
