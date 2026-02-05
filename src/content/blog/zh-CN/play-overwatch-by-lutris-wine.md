---
source_hash: "9a0e75e4"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "使用 Wine 平台游玩守望先锋"
pubDate: "2019-05-18"
description: "在 Arch Linux 上使用 Lutris Wine 和 Nvidia 显卡玩守望先锋的完整配置指南，包括驱动安装、显卡管理和性能优化。"
author: "xz-dev"
category: "Wine"
tags: ["Lutris", "Wine", "Nvidia", "OverWatch", "Arch Linux"]
---

> [Lutris](https://lutris.net/) is an Open Source gaming platform for Linux.

> 本文以 MI Pro (i7-8550U, GTX1050 ti) 为例

> 关于显卡性能：性能损耗小
> （比 Windows(只安装了守望先锋) 流畅）

## 安装Lutris

```bash
sudo pacman -S lutris
```

## 安装 Nvidia 驱动

> 安装背景环境：已安装 [Bumblebee](https://wiki.archlinux.org/index.php/Bumblebee_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))
> 如果你已经安装了 Bumblebee，不需要关闭该服务

```bash
sudo pacman -S nvidia nvidia-settings
```

守望先锋是32位程序，因此我们还需要Nvidia 32位的驱动

```bash
sudo pacman -S lib32-nvidia-utils
```

守望先锋依赖 DXVK

```bash
sudo pacman -S dxvk-bin  # 添加了archlinuxcn源，否则请去AUR源安装
```

## 安装 Nvidia-xrun

```bash
sudo pacman -S nvidia-xrun
```

## 配置 Nvidia-xrun (基本参考 ArchWiki)

### 设置nvidia的bus id

如果安装nvidia-xrun完毕后，`/etc/X11/nvidia-xorg.conf.d/30-nvidia.conf` 文件中已经设置好bus id，可直接跳过本步。

如果你从[nvidia-xrun github repo]下载安装的nvidia-xrun，你应该需要进行手动设置bus id。

获取ID：一般的设备的总线ID是1:0:0，为了确保正确，使用一下命令获取ID:

```bash
lspci | grep NVIDIA
```

在输出内容中第行首即可看到ID。

新增文件 `/etc/X11/nvidia-xorg.conf.d/30-nvidia.conf`，添加类似如下内容：

```
Section "Device"
    Identifier "nvidia"
    Driver "nvidia"
    BusID "PCI:1:0:0"
EndSection
```

同样的，如果遇到问题你可以调整一些NVIDIA设置：

```
Section "Screen"
    Identifier "nvidia"
    Device "nvidia"
    # Option "AllowEmptyInitialConfiguration" "Yes"
    # Option "UseDisplayDevice" "none"
EndSection
```

## 使用bbswitch在管理nvidia显卡 (完全参考 ArchWiki)

平时使用bbswitch关闭nvidia显卡，在需要使用nvidia运行程序时，运行 `nvidia-xrun` 就会唤醒nvidia显卡，并自动打开设定好的窗口管理器。

- 在启动时载入bbswitch模块

```bash
# echo 'bbswitch ' > /etc/modules-load.d/bbswitch.conf
```

- 关闭nvidia显卡的选项

```bash
# echo 'options bbswitch load_state=0 unload_state=1' > /etc/modprobe.d/bbswitch.conf
```

重启系统即可。

查看状态：

```bash
cat /proc/acpi/bbswitch
```

开关显卡可以使用bbswitch相关命令

```bash
# tee /proc/acpi/bbswitch <<<OFF
# tee /proc/acpi/bbswitch <<<ON
```

更多bbswitch信息查看 [Bumblebee-Project/bbswitch](https://github.com/Bumblebee-Project/bbswitch)

## Nvidia 运行 KDE

编辑~/.nvidia-xinitrc，在其中添加：

```bash
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json  # 避免不正常加载 Vulkan
startkde
```

在tty登录后，通过以下命令启动 KDE 桌面环境，在 KDE 中运行程序即可使用NVIDIA渲染：

```bash
nvidia-xrun
```

## 守望先锋无法使用左CTRL键

使用 xmodmap 映射左 CTRL 键到右 CTRL 键

```bash
xmodmap -e "keycode 37 = Control_R"  # 只对当前tty会话有效
```

## The End

接下来，注销当前KDE登录

打开新的tty，输入 `nvidia-xrun` 启动 KDE

启动 Lutris 自行安装守望先锋
