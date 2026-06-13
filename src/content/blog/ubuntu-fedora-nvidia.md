---
title: "Ubuntu、Fedora 与 Nvidia"
pubDate: "2018-06-24T00:00:00+08:00"
description: "详细的 Ubuntu 和 Fedora 系统下 Nvidia 显卡驱动安装教程，解决 Linux 新手面临的驱动安装难题。"
author: "xz-dev"
category: "Nvidia"
tags: ["Fedora", "Ubuntu", "Nvidia", "Nouveau"]
---

> Nvidia 驱动一直是新手使用 Linux 的阻碍之一。
>
> 网上已经有很多关于如何安装驱动的方法了，但或多或少都有些错误与不必要的操作之处。
>
> 因此，在这里重新梳理一下正确的安装方法。
>
> (博主现使用 Fedora，Ubuntu 一年玩家)

## Ubuntu 安装方法

### 无法进入安装界面

1、在 grub 界面(启动页面)，按下按键e。

2、找到 **quiet spash**

3、在后面加入 **nomodeset** (以空格分隔)

4、按下 **F10** 进入安装界面

5、完成Ubuntu安装，重启。

### 进入 Ubuntu 系统

**1、在 grub 界面(启动页面)按下按键e**

2、找到 **quiet spash**

3、在后面加入 **nomodeset** (以空格分隔)

4、按下 **F10** 启动系统

### 安装 Nvidia 驱动

1、在更新管理器中，选择附加驱动安装 Nvidia 驱动

2、等待完成，重启

## Fodora 安装方法

### 无法进入安装界面 (UID1000错误)

1、**在 grub 界面(启动页面)按下按键e (或者TAB键)**

2、找到 **quiet spash**

3、在后面加入 **nomodeset** (以空格分隔)

4、按下 **F10** (或者回车键)进入安装界面

5、完成 Fedara 安装，重启。

### 进入 Fedora 系统(同1)

1、**在 grub 界面(启动页面)按下按键e (或者TAB键)**

2、找到 **quiet spash**

3、在后面加入 **nomodeset** (以空格分隔)

4、按下 **F10** (或者回车键)启动系统

5、进入系统

### 安装 Nvidia 驱动

#### 方法1：

1、添加 [Nvidia 驱动的dnf源](https://negativo17.org/nvidia-driver/)

```bash
sudo dnf config-manager --add-repo=https://negativo17.org/repos/fedora-nvidia.repo
```

2、更新系统(*可选*)

```bash
sudo dnf upgrade
```

3、卸载 nouveau 驱动

```bash
sudo dnf remove xorg-x11-drv-nouveau
```

3、安装 Nvidia 基础驱动

```bash
sudo dnf install nvidia-driver nvidia-settings
```

*4、安装 CUDA tools (**可选，未尝试**)*

参考 [这篇博客：https://blog.csdn.net/ZhangK9509/article/details/79260341](https://blog.csdn.net/ZhangK9509/article/details/79260341)

5、修改 grub 默认参数

- 打开 /etc/sysconfig/grub 文件
- 从 `GRUB_CMDLINE_LINUX` 参数中删除 `nomodeset` 并加入 `rd.driver.blacklist=nouveau`
- 更新 grub

**## BIOS ##**

```bash
grub2-mkconfig -o /boot/grub2/grub.cfg
```

**## UEFI ##**

```bash
grub2-mkconfig -o /boot/efi/EFI/fedora/grub.cfg
```

6、安装 VDPAU / VAAPI 支持(Geforce 8或更高版本)

```bash
sudo dnf install vdpauinfo libva-vdpau-driver libva-utils
```

7、重启

#### 方法2(手动安装驱动，*不推荐*)：

参考：[https://www.if-not-true-then-false.com/2015/fedora-nvidia-guide/](https://www.if-not-true-then-false.com/2015/fedora-nvidia-guide/)

---

如果你还希望加快Linux环境下的代理速度，[这篇文章](https://www.xzos.net/index.php/galaxy/haproxy-shadowsocks/)对你有用

欢迎留言/邮件探讨 🙂
