---
source_hash: "58fa84ef"
title: "Arch Linux and Windows Dual Boot Setup (GRUB2)"
pubDate: "2019-02-27"
description: "Methods for configuring GRUB2 bootloader in an Arch Linux and Windows dual-boot environment, including manual configuration and automatic detection using os-prober."
author: "xz-dev"
category: "ArchLinux"
tags: ["Arch Linux", "GRUB", "Windows"]
---

There are two methods:

1. Manual method: See [archwiki](https://wiki.archlinux.org/index.php/GRUB_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#UEFI-GPT_%E6%A8%A1%E5%BC%8F%E4%B8%8B%E5%AE%89%E8%A3%85%E7%9A%84Windows%E7%9A%84%E5%90%AF%E5%8A%A8%E9%A1%B9)
2. Automatic configuration via os-prober (reference [archbbs](https://bbs.archlinux.org/viewtopic.php?id=233975))

## Automatic GRUB2 Configuration via os-prober

1. Install os-prober
2. Run `grub-mkconfig -o /boot/grub/grub.cfg`
3. Reboot