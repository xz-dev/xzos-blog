---
title: "ArchLinux 配置指南"
pubDate: "2020-10-21"
description: "一个记录 ArchLinux 配置过程的导航页面，包括桌面环境安装、交换分区、用户权限、Pacman 配置等。"
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "ArchLinux", "Linux", "KDE"]
---

> 这是一个导航页面，它记录了**我的**配置过程，你可以按照页面的顺序配置，也可以只搜寻信息。

<!--more-->

在阅读该页面之前，你应该已经完成了 ArchLinux 的安装（即可以顺利进入 ArchLinux 且已配置好网络），安装问题请参考 [ArchLinux 桌面环境生存指南#安装ArchLinux](https://xzos.net/archlinux-desktop-environment-survival-guide/#%E5%AE%89%E8%A3%85ArchLinux) 与 [ArchWiki安装指南](https://wiki.archlinux.org/index.php/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))。

## 安装桌面环境（KDE）

参考 [Arch Linux 的 KDE 最小安装方案](https://xzos.net/kde-minimum-installation-solution-for-arch-linux/)

## 交换分区（文件配置）

### 建立

- [交换文件（参考 ArchWiki）](https://wiki.archlinux.org/index.php/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%BA%A4%E6%8D%A2%E6%96%87%E4%BB%B6)
- [交换分区（参考 ArchWiki）](https://wiki.archlinux.org/index.php/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%BA%A4%E6%8D%A2%E5%88%86%E5%8C%BA)

### 优化配置

参考 [ArchWiki Swap 性能优化](https://wiki.archlinux.org/index.php/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%80%A7%E8%83%BD%E4%BC%98%E5%8C%96)

vm.swappiness 可以设置为 0

### 休眠配置

- [使用交换文件](https://xzos.net/arch-linux-hibernation-into-swap-file/)（不适用与 Btrfs）
- 使用交换分区（注意 [配置 GRUB参数](https://wiki.archlinux.org/index.php/Power_management_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)/Suspend_and_hibernate_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%BF%85%E9%9C%80%E7%9A%84%E5%86%85%E6%A0%B8%E5%8F%82%E6%95%B0) 并重新生成 grub.cfg）

> 无论使用何种方式，都必须 设置 GRUB 与 Kernel module
>
> 具体步骤参考：[Arch Linux 使用 Swap File 进行休眠](https://xzos.net/arch-linux-hibernation-into-swap-file/#%E8%AE%BE%E7%BD%AE%E4%BC%91%E7%9C%A0%EF%BC%88%E5%8F%82%E8%80%83_Arch_Wiki%EF%BC%89)

## 用户权限

添加一个常用用户（你平常用来登录/使用 Linux 的用户）（[参考 ArchWiki](https://wiki.archlinux.org/index.php/Users_and_groups_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%B7%BB%E5%8A%A0%E7%99%BB%E5%BD%95%E7%94%A8%E6%88%B7)）

```bash
useradd -m 你的用户名
```

## Pacman 配置

- [配置 pacman.conf](https://xzos.net/my-pacman-conf/)
- 安装 powerpill（默认配置，注意 powerpill 调用的 aria2 读取 http_proxy 环境变量，且只支持 http 代理）

## 游戏环境（显卡）配置

参考 [使用 Steam 游玩尼尔机械纪元](https://xzos.net/play-nierautomata-by-nvidia-steam/)

## Others

请查看：[ArchLinux 桌面环境生存指南（只限于桌面环境优化）](https://xzos.net/archlinux-desktop-environment-survival-guide/) 与 [General recommendations (简体中文)（ArchWiki）](https://wiki.archlinux.org/index.php/General_recommendations_(简体中文))
