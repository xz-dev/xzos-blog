---
title: "Pacman 通用配置"
pubDate: "2020-10-19"
description: "ArchLinux 的 Pacman 包管理器通用配置文件，包括彩色输出、进度显示、archlinuxcn 源等优化设置。"
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "pacman", "ArchLinux"]
---

> 配置文件解释参考：[Arch manual pages](https://jlk.fjfi.cvut.cz/arch/manpages/man/pacman.conf.5)
>
> 你可以直接复制并替换你的 pacman.conf 文件（注意备份）

> 这篇文章是 [ArchLinux 配置指南](https://xzos.net/archlinux-setup-guide/) 的一部分。
>
> 当然，你也可以单独阅读

<!--more-->

## 我的配置文件

```bash
#
# /etc/pacman.conf
#
# See the pacman.conf(5) manpage for option and repository directives

#
# GENERAL OPTIONS
#
[options]
# The following paths are commented out with their default values listed.
# If you wish to use different paths, uncomment and update the paths.
#RootDir     = /
#DBPath      = /var/lib/pacman/
#CacheDir    = /var/cache/pacman/pkg/
#LogFile     = /var/log/pacman.log
#GPGDir      = /etc/pacman.d/gnupg/
#HookDir     = /etc/pacman.d/hooks/
#HookDir     = /home/xz/.local/share/pacman.d/hooks
HoldPkg     = pacman glibc
#XferCommand = /usr/bin/curl -L -C - -f -o %o %u
#XferCommand = /usr/bin/wget --passive-ftp -c -O %o %u
#CleanMethod = KeepInstalled
CleanMethod = KeepCurrent
Architecture = auto

#IgnorePkg   =
#IgnorePkg   =
#IgnoreGroup =

#NoUpgrade   =
#NoExtract   =

# Misc options
#UseSyslog
Color
TotalDownload
CheckSpace
#VerbosePkgLists

# By default, pacman accepts packages signed by keys that its local keyring
# trusts (see pacman-key and its man page), as well as unsigned packages.
#SigLevel    = Required DatabaseOptional
SigLevel = PackageRequired
LocalFileSigLevel = Optional
#RemoteFileSigLevel = Required

# NOTE: You must run `pacman-key --init` before first using pacman; the local
# keyring can then be populated with the keys of all official Arch Linux
# packagers with `pacman-key --populate archlinux`.

#
# REPOSITORIES
#   - can be defined here or included from another file
#   - pacman will search repositories in the order defined here
#   - local/custom mirrors can be added here or in separate files
#   - repositories listed first will take precedence when packages
#     have identical names, regardless of version number
#   - URLs will have $repo replaced by the name of the current repo
#   - URLs will have $arch replaced by the name of the architecture
#
# Repository entries are of the format:
#       [repo-name]
#       Server = ServerName
#       Include = IncludePath
#
# The header [repo-name] is crucial - it must be present and
# uncommented to enable the repo.
#

# The testing repositories are disabled by default. To enable, uncomment the
# repo name header and Include lines. You can add preferred servers immediately
# after the header, and they will be used before the default mirrors.

#[testing]
#Include = /etc/pacman.d/mirrorlist

[core]
Include = /etc/pacman.d/mirrorlist

[extra]
Include = /etc/pacman.d/mirrorlist

#[community-testing]
#Include = /etc/pacman.d/mirrorlist

[community]
Include = /etc/pacman.d/mirrorlist

# If you want to run 32 bit applications on your x86_64 system,
# enable the multilib repositories as required here.

#[multilib-testing]
#Include = /etc/pacman.d/mirrorlist

[multilib]
Include = /etc/pacman.d/mirrorlist

# An example of a custom package repository.  See the pacman manpage for
# tips on creating your own repositories.
#[custom]
#SigLevel = Optional TrustAll
#Server = file:///home/custompkgs

[archlinuxcn]
Include = /etc/pacman.d/archlinuxcn-mirrorlist
```

## 与默认配置的区别

- 不保存之前版本的安装包
- 彩色输出
- 显示总安装进度
- 不请求软件源的 sig 文件（不少镜像源没有 sig 文件，若安装包有有误将无法通过 pacman 的 gpg 签名校验）
- 配置了 archlinuxcn 源

## 添加 archlinuxcn 源

### 添加 archlinuxcn 配置

在 pacman.conf 文件末添加

```bash
[archlinuxcn]
Server = https://repo.archlinuxcn.org/$arch
```

下载 archlinuxcn 源相关软件包

- archlinuxcn-keyring （archlinuxcn 的 gpg 签名，没有这个你安装不了任何 archlinuxcn 里的软件包）
- archlinuxcn-mirrorlist-git （archlinuxcn 镜像列表，让你的配置看起来更规范）**（可选）**

配置 archlinuxcn 的镜像源

- 修改 /etc/pacman.d/archlinuxcn-mirrorlist，取消你希望使用的镜像的注释
- 修改 pacman.conf 文件里的 archlinuxcn 字段为

```bash
[archlinuxcn]
Include = /etc/pacman.d/archlinuxcn-mirrorlist
```
