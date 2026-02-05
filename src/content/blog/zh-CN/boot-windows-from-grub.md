---
source_hash: "58fa84ef"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "Arch Linux、Windows 双系统启动（grub2）"
pubDate: "2019-02-27"
description: "在 Arch Linux 和 Windows 双系统环境下配置 GRUB2 启动引导的方法，包括手动配置和使用 os-prober 自动检测。"
author: "xz-dev"
category: "ArchLinux"
tags: ["Arch Linux", "GRUB", "Windows"]
---

有两种方法：

1. 手动方法：见 [archwiki](https://wiki.archlinux.org/index.php/GRUB_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#UEFI-GPT_%E6%A8%A1%E5%BC%8F%E4%B8%8B%E5%AE%89%E8%A3%85%E7%9A%84Windows%E7%9A%84%E5%90%AF%E5%8A%A8%E9%A1%B9)
2. 通过 os-prober 自动配置（参考 [archbbs](https://bbs.archlinux.org/viewtopic.php?id=233975)）

## 通过 os-prober 自动配置grub2

1. 安装 os-prober
2. 运行 `grub-mkconfig -o /boot/grub/grub.cfg`
3. 重启
