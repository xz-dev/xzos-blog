---
source_hash: "d7177536"
title: "Minimal KDE Installation Guide for Arch Linux"
pubDate: "2019-05-18"
description: "Provides a minimal, convenient, and usable KDE desktop environment installation solution, including configurations for Xorg, display manager, KDE desktop, and recommended applications."
author: "xz-dev"
category: "Linux Desktop Environment"
tags: ["KDE", "Arch Linux"]
---

> This article aims to provide a minimal, convenient, and usable KDE desktop environment
> For more detailed information, see [ArchWiki KDE](https://wiki.archlinux.org/index.php/KDE_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

## Install Xorg

> Before installing Plasma (KDE5), ensure [Xorg](https://wiki.archlinux.org/index.php/Xorg_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) is installed and functioning properly on your system.

Generally, you only need the [xorg-server](https://www.archlinux.org/packages/?name=xorg-server) package.

Additionally, the [xorg-apps](https://www.archlinux.org/groups/x86_64/xorg-apps/) group provides some programs for specific configuration tasks.

The [xorg](https://www.archlinux.org/groups/x86_64/xorg/) group includes the Xorg server, packages from [xorg-apps](https://www.archlinux.org/groups/x86_64/xorg-apps/), and fonts.

## Install Display Manager

> The simplest method is to use a [display manager](https://wiki.archlinux.org/index.php/Display_manager_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)), eliminating the need for additional installation and configuration.

For KDE environments, [SDDM](https://wiki.archlinux.org/index.php/SDDM) is recommended.

Reason: KDE5 provides official theme support for SDDM and offers an out-of-the-box experience with password authentication (kwallet).

## Install KDE Desktop

Arch Linux provides the [plasma](https://www.archlinux.org/groups/x86_64/plasma/) group (recommended), the [plasma-meta](https://www.archlinux.org/packages/?name=plasma-meta) meta-package, and the [plasma-desktop](https://www.archlinux.org/packages/?name=plasma-desktop) package (minimal Plasma installation, not recommended due to missing essential software).

To ensure both convenience and minimal installation (manually selecting non-essential software), we choose the [plasma](https://www.archlinux.org/groups/x86_64/plasma/) group.

Install all packages in the plasma group, then remove [plasma-sdk](https://www.archlinux.org/packages/extra/x86_64/plasma-sdk/) (developer tools) and KDE's built-in games with `sudo pacman -Rscn $(pacman -Qqs kde games)`.

## KDE Network Management

NetworkManager is KDE's default network management tool. Run `sudo systemctl enable NetworkManager` to enable it at boot.

## Recommended KDE Applications

- [Konsole](https://security.archlinux.org/package/konsole) (KDE terminal)
- [Dolphin](https://wiki.archlinux.org/index.php/Dolphin) (KDE file manager)
- [KDE Connect](https://wiki.archlinux.org/index.php/KDE#KDE_Connect) (connect with mobile devices)
- [Ark](https://www.archlinux.org/packages/extra/x86_64/ark/) (compression/decompression tool)
- [Okular](https://www.archlinux.org/packages/extra/x86_64/okular/) (PDF reader)

## Recommended KDE Plugins List

See: [KDE Recommended Plugins List](https://xzos.net/kde-recommended-plugin-list/)

> Reboot