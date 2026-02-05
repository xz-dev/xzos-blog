---
source_hash: "2ab7876c"
source_lang: "zh"
target_lang: "en"
title: "ArchLinux Configuration Guide"
pubDate: "2020-10-21"
description: "A navigation page documenting the ArchLinux configuration process, including desktop environment installation, swap partition setup, user permissions, Pacman configuration, etc."
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "ArchLinux", "Linux", "KDE"]
---

> This is a navigation page that records **my** configuration process. You can follow the page order for setup or just search for specific information.

<!--more-->

Before reading this page, you should have already completed the ArchLinux installation (i.e., able to boot into ArchLinux smoothly with network configured). For installation issues, please refer to [ArchLinux Desktop Environment Survival Guide#Installing ArchLinux](https://xzos.net/archlinux-desktop-environment-survival-guide/#%E5%AE%89%E8%A3%85ArchLinux) and [ArchWiki Installation Guide](https://wiki.archlinux.org/index.php/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)).

## Install Desktop Environment (KDE)

Reference: [Minimal KDE Installation Solution for Arch Linux](https://xzos.net/kde-minimum-installation-solution-for-arch-linux/)

## Swap Partition (File Configuration)

### Setup

- [Swap File (Reference ArchWiki)](https://wiki.archlinux.org/index.php/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%BA%A4%E6%8D%A2%E6%96%87%E4%BB%B6)
- [Swap Partition (Reference ArchWiki)](https://wiki.archlinux.org/index.php/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%BA%A4%E6%8D%A2%E5%88%86%E5%8C%BA)

### Performance Optimization

Reference: [ArchWiki Swap Performance Optimization](https://wiki.archlinux.org/index.php/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96)

vm.swappiness can be set to 0

### Hibernation Configuration

- [Using Swap File](https://xzos.net/arch-linux-hibernation-into-swap-file/) (Not applicable for Btrfs)
- Using Swap Partition (Note [GRUB Parameter Configuration](https://wiki.archlinux.org/index.php/Power_management_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)/Suspend_and_hibernate_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%BF%85%E9%9C%80%E7%9A%84%E5%86%85%E6%A0%B8%E5%8F%82%E6%95%B0) and regenerate grub.cfg)

> Regardless of the method used, GRUB and Kernel module must be configured.
>
> Detailed steps: [Arch Linux Hibernation Using Swap File](https://xzos.net/arch-linux-hibernation-into-swap-file/#%E8%AE%BE%E7%BD%AE%E4%BC%91%E7%9C%A0%EF%BC%88%E5%8F%82%E8%80%83_Arch_Wiki%EF%BC%89)

## User Permissions

Add a regular user (for daily login/use of Linux) ([Reference ArchWiki](https://wiki.archlinux.org/index.php/Users_and_groups_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%B7%BB%E5%8A%A0%E7%99%BB%E5%BD%95%E7%94%A8%E6%88%B7))

```bash
useradd -m your_username
```

## Pacman Configuration

- [Configure pacman.conf](https://xzos.net/my-pacman-conf/)
- Install powerpill (default configuration, note that powerpill's aria2 reads http_proxy environment variable and only supports http proxy)

## Gaming Environment (Graphics) Configuration

Reference: [Playing NieR:Automata Using Steam](https://xzos.net/play-nierautomata-by-nvidia-steam/)

## Others

Please check: [ArchLinux Desktop Environment Survival Guide (Limited to Desktop Environment Optimization)](https://xzos.net/archlinux-desktop-environment-survival-guide/) and [General recommendations (简体中文)（ArchWiki）](https://wiki.archlinux.org/index.php/General_recommendations_(简体中文))