---
title: "ArchLinux 桌面环境生存指南"
pubDate: "2019-02-27"
description: "提供 Arch Linux 桌面环境安装和配置的完整指南，包括系统安装、用户管理、网络配置和 KDE 桌面环境部署，帮助用户建立友好的开发环境。"
author: "xz-dev"
category: "ArchLinux"
tags: ["Arch Linux"]
---

> 本文章以安装步骤的方式记录
>
> 本文仅作为 [ArchWiki安装指南](https://wiki.archlinux.org/index.php/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) 的补充说明
>
> 本文旨在提供一个用户/开发友好的桌面环境

> 该指南将持续更新

## 安装ArchLinux

1. 在U盘上安装一个 [ArchLinuxInstalling Arch Linux on a USB key (简体中文)](https://wiki.archlinux.org/index.php/Installing_Arch_Linux_on_a_USB_key_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

2. 启动到U盘系统，开始安装: [Installation guide (简体中文)](https://wiki.archlinux.org/index.php/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))（如果选择***使用lvm***，请在安装grub时做以下操作:

   ```bash
   mount /dev/XzRoot/root(LVM 路径) /mnt
   mkdir /mnt/hostlvm
   mount --bind /run/lvm /mnt/hostlvm
   arch-chroot /mnt
   ln -s /hostlvm /run/lvm
   ```

   代码参考自 [ArchLinux BBS](https://bbs.archlinux.org/viewtopic.php?id=242594)）

3. 如果一切顺利，安装完成。重启进入系统后，你可以看见root用户的shell终端。

4. **确保网络通畅**，帮助详见 [Wireless network configuration (简体中文)](https://wiki.archlinux.org/index.php/Wireless_network_configuration_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))，如果你发现缺少工具，可以再次进入U盘系统使用arch-chroot安装

## 创建登录用户帐号

1. 使用root用户操作系统非常危险，因此先创建登陆用户:

   ```bash
   useradd -m -G wheel -s /bin/bash 你的用户名
   ```

   （参考 [wiki](https://wiki.archlinux.org/index.php/Users_and_groups_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%B7%BB%E5%8A%A0%E7%99%BB%E5%BD%95%E7%94%A8%E6%88%B7)）

2. 安装sudo，并 [给予登录用户权限](https://wiki.archlinux.org/index.php/Sudo_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E8%AE%BE%E7%BD%AE%E7%A4%BA%E4%BE%8B)

3. 注销root登录，使用创建的登录用户重新登录系统。

## 连接到国际互联网

1. 使用正常方法：包管理安装各种相应服务**（以下docker环境设置可全部忽略）**

2. [使用docker安装V2Ray](https://xzos.net/docker-deploy-v2ray/)（推荐，与ArchLinux环境隔离，高稳定）

## 安装桌面环境

> [Arch Linux 的 KDE 最小安装方案](https://xzos.net/kde-minimum-installation-solution-for-arch-linux/)

安装KDE（也可以选择自己喜爱的），参考 [ArchWiki KDE (简体中文)](https://wiki.archlinux.org/index.php/KDE_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%AE%89%E8%A3%85)

如果需要KDE全套应用（全家桶，一般你不会需要的），建议安装 [kde-applications](https://www.archlinux.org/groups/x86_64/kde-applications/) 组而不是 [kde-applications-meta](https://www.archlinux.org/packages/?name=kde-applications-meta) 元软件包，便于精简软件包。

> [KDE 推荐插件列表](https://xzos.net/kde-recommended-plugin-list/)
>
> 关于KDE桌面环境的一些 Tips （待编辑）

> 待续
