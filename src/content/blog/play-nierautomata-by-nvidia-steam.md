---
title: "使用 Linux 游玩尼尔机械纪元"
pubDate: "2020-10-21"
description: "在 Linux 下使用 Nvidia 显卡、Bumblebee 和 primus_vk 运行 Steam 游戏尼尔机械纪元的配置指南。"
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "Bumblebee", "Nvidia", "Steam", "Linux 桌面环境"]
---

> 这里以 steam平台上运行的 尼尔机械纪元 为例，硬件平台为 Intel + Nvidia
>
> 一般来说，大部分 Windows 游戏都可以通过 wine 运行。

> 这篇文章是 [ArchLinux 配置指南](https://xzos.net/archlinux-setup-guide/) 的一部分。
>
> 当然，你也可以单独阅读

<!--more-->

## 安装 Nvidia 显卡驱动

参考：[NVIDIA (简体中文)（ArchWiki）](https://wiki.archlinux.org/index.php/NVIDIA_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%AE%89%E8%A3%85)

因为我选择的 Bumblebee 方案。因此，只需要安装**基础的** Nvidia 驱动

```bash
sudo pacman -S nvidia-dkms nvidia-utils lib32-nvidia-utils
```

## 安装 primus_vk

> primus_vk 是 Bumblebee 的 Vulkan 实现

### 安装软件

```bash
sudo pacman -S primus_vk
```

### 启用服务自启

```bash
sudo systemctl enable bumblebeed.service
```

### 设置 Bumblebee

以下是我的 Bumblebee Nvidia 配置

```bash
# /etc/bumblebee/xorg.conf.nvidia
Section "ServerLayout"
    Identifier  "Layout0"
    #Option "AutoAddDevices" "false"
    Option "AutoAddGPU" "false"
EndSection

Section "InputClass"
    Identifier "IgnoreDevices"
    MatchDevicePath "/dev/input/event*|/dev/input/mouse*|/dev/input/js*|/dev/input/mice"
    Option "Ignore" "true"
EndSection

Section "Device"
    Identifier  "DiscreteNvidia"
    Driver      "nvidia"
    VendorName  "NVIDIA Corporation"

#   If the X server does not automatically detect your VGA device,
#   you can manually set it here.
#   To get the BusID prop, run `lspci | egrep 'VGA|3D'` and input the data
#   as you see in the commented example.
#   This Setting may be needed in some platforms with more than one
#   nvidia card, which may confuse the proprietary driver (e.g.,
#   trying to take ownership of the wrong device). Also needed on Ubuntu 13.04.
#   BusID "PCI:01:00:0"
    BusID "PCI:01:00:0"

#   Setting ProbeAllGpus to false prevents the new proprietary driver
#   instance spawned to try to control the integrated graphics card,
#   which is already being managed outside bumblebee.
#   This option doesn't hurt and it is required on platforms running
#   more than one nvidia graphics card with the proprietary driver.
#   (E.g. Macbook Pro pre-2010 with nVidia 9400M + 9600M GT).
#   If this option is not set, the new Xorg may blacken the screen and
#   render it unusable (unless you have some way to run killall Xorg).
    Option "ProbeAllGpus" "false"

    Option "NoLogo" "true"
    Option "UseEDID" "false"
    Option "UseDisplayDevice" "none"
    # 避免DPMS 超时
    Option "HardDPMS" "false"
EndSection
```

相较于默认配置，有以下区别：

- 手动设置了BusID，避免找不到显卡的问题（不设置几乎是一定找不到的）
- 停用了 Nvidia 的 DPMS 省电机制，避免 Nvidia 显卡检测到 Xorg 无输入设备动作后自动降频（因为 Bumblebee 使用映射一个 Xorg 环境的方式实现）

## 设置 Steam 启动游戏的启动选项

命令参数参考 [primus_vk issues](https://github.com/felixdoerre/primus_vk/issues/34)

如图所示

![Steam 启动选项设置](/images/blog/play-nierautomata-by-nvidia-steam/steam-launch-options.png)

设置启动选项为以下

```bash
VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/intel_icd.x86_64.json:/usr/share/vulkan/icd.d/nv_vulkan_wrapper.json pvkrun %command%
```

## The End

重启，Emjoy
