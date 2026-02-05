---
source_hash: "c754feb1"
title: "ArchLinux Desktop Environment Survival Guide"
pubDate: "2019-02-27"
description: "A comprehensive guide for installing and configuring Arch Linux desktop environment, including system installation, user management, network setup, and KDE desktop deployment, helping users establish a developer-friendly environment."
author: "xz-dev"
category: "ArchLinux"
tags: ["Arch Linux"]
---

> This article documents the installation process step by step
>
> Serves only as supplementary instructions to [ArchWiki Installation Guide](https://wiki.archlinux.org/index.php/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))
>
> Aims to provide a user/developer-friendly desktop environment

> This guide will be continuously updated

## Installing ArchLinux

1. Install [ArchLinux on a USB key](https://wiki.archlinux.org/index.php/Installing_Arch_Linux_on_a_USB_key_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

2. Boot from USB and begin installation: [Installation guide](https://wiki.archlinux.org/index.php/Installation_guide_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) (If using ***lvm***, perform these steps when installing grub:

   ```bash
   mount /dev/XzRoot/root(LVM path) /mnt
   mkdir /mnt/hostlvm
   mount --bind /run/lvm /mnt/hostlvm
   arch-chroot /mnt
   ln -s /hostlvm /run/lvm
   ```

   Code reference from [ArchLinux BBS](https://bbs.archlinux.org/viewtopic.php?id=242594))

3. If everything goes well, installation completes. After rebooting, you'll see the root user's shell terminal.

4. **Ensure network connectivity**. Refer to [Wireless network configuration](https://wiki.archlinux.org/index.php/Wireless_network_configuration_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)). If tools are missing, re-enter USB system using arch-chroot to install.

## Creating Login User Account

1. Operating as root is dangerous, so first create a login user:

   ```bash
   useradd -m -G wheel -s /bin/bash your_username
   ```

   (Reference [wiki](https://wiki.archlinux.org/index.php/Users_and_groups_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%B7%BB%E5%8A%A0%E7%99%BB%E5%BD%95%E7%94%A8%E6%88%B7))

2. Install sudo and [grant privileges to login user](https://wiki.archlinux.org/index.php/Sudo_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E8%AE%BE%E7%BD%AE%E7%A4%BA%E4%BE%8B)

3. Logout from root and relogin using the created user account.

## Connecting to Global Internet

1. Normal method: Install various services through package manager **(All docker setup below can be ignored)**

2. [Install V2Ray using docker](https://xzos.net/docker-deploy-v2ray/) (Recommended, isolated from ArchLinux environment, highly stable)

## Installing Desktop Environment

> [Minimal KDE Installation Solution for Arch Linux](https://xzos.net/kde-minimum-installation-solution-for-arch-linux/)

Install KDE (or choose your preferred DE), reference [ArchWiki KDE](https://wiki.archlinux.org/index.php/KDE_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%AE%89%E8%A3%85)

For full KDE applications suite (usually unnecessary), install [kde-applications](https://www.archlinux.org/groups/x86_64/kde-applications/) group instead of [kde-applications-meta](https://www.archlinux.org/packages/?name=kde-applications-meta) meta-package for easier package trimming.

> [Recommended KDE Plugin List](https://xzos.net/kde-recommended-plugin-list/)
>
> Some Tips about KDE desktop environment (to be edited)

> To be continued