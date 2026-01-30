---
title: "Arch Linux 使用 Swap File 进行休眠"
pubDate: "2019-06-08"
description: "在 Arch Linux 上配置 Swap File 并实现系统休眠功能的完整指南，包括 GRUB 和内核模块配置。"
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "ArchLinux", "Linux"]
---

> 大部分情况下，为了便于调整和配置的灵活性，我们一般使用 Swap File。

<!--more-->

参考资料：[Arch Wiki](https://wiki.archlinux.org/index.php/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))，[Arch Wiki](https://wiki.archlinux.org/index.php/Power_management/Suspend_and_hibernate_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%BD%BF%E7%94%A8swap_file%E4%BC%91%E7%9C%A0)，[Arch BBS](https://bbs.archlinux.org/viewtopic.php?id=229753)

## 建立 Swap File（参考 [Arch Wiki](https://wiki.archlinux.org/index.php/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%89%8B%E5%8A%A8%E6%96%B9%E5%BC%8F)）

### 手动方式

#### 建立交换文件

用root账号，使用 `fallocate` 命令来创建一个所需大小的交换文件（M = [Mebibytes](https://en.wikipedia.org/wiki/Mebibyte), G = [Gibibytes](https://en.wikipedia.org/wiki/Gibibyte)）。例如，创建一个16G 的交换文件（用作休眠，最好设置为你电脑内存的大小）：

```bash
# fallocate -l 16G /swapfile
```

**注意:** *fallocate* 命令用在 [F2FS](https://wiki.archlinux.org/index.php/F2FS) 或 [XFS](https://wiki.archlinux.org/index.php/XFS) 文件系统时可能会引起问题。[[1]](https://bugzilla.redhat.com/show_bug.cgi?id=1129205#c3) 代替方式是使用 *dd* 命令，但是要慢一点:

```bash
# dd if=/dev/zero of=/swapfile bs=1M count=512
```

为交换文件设置权限：（交换文件全局可读是一个巨大的本地漏洞）

```bash
# chmod 600 /swapfile
```

创建好交换文件后，将其格式化：

```bash
# mkswap /swapfile
```

![mkswap 输出](/images/blog/arch-linux-hibernation-into-swap-file/mkswap-output.png)

Tip：这里会有一个UUID，**没有任何用处**。

启用交换文件：

```bash
# swapon /swapfile
```

最后，编辑 `/etc/fstab`， 在其中添加如下的一行：

```
/etc/fstab
```

```
/swapfile none swap defaults 0 0
```

## 设置休眠（参考 [Arch Wiki](https://wiki.archlinux.org/index.php/Power_management/Suspend_and_hibernate_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%BD%BF%E7%94%A8swap_file%E4%BC%91%E7%9C%A0)）

### 设置 grub

![GRUB 配置](/images/blog/arch-linux-hibernation-into-swap-file/grub-config.png)

#### 设置 resume（用于告诉系统应该从哪个硬盘设备恢复）

获取 swap file 所在的分区的 UUID，例如我用的是 LVM

```bash
lsblk -no UUID /dev/XzRoot/root
```

![查看 UUID](/images/blog/arch-linux-hibernation-into-swap-file/filefrag-output.png)

将这串 UUID（2cee6498-2bd1-496f-9801-164ddddcc9c3） 填入 resume

```
resume=UUID=2cee6498-2bd1-496f-9801-164ddddcc9c3
```

当然，你也可以填 `resume=/dev/XzRoot/root`

###### 获取 resume_offset

运行 `sudo filefrag -v /swapfile`

![filefrag 输出](/images/blog/arch-linux-hibernation-into-swap-file/lsblk-uuid.png)

找到第一行第一个拥有两个句点的数字。如截图所示，为：78610432

#### 设置 resume_offset（用于告诉系统应该从哪个具体的位置恢复）

将刚刚用 swap file 获得的值填入如图所示的 resume_offset。

```
resume_offset=78610432
```

#### 重新生成grub.cfg

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

### 设置 Kernel Module

#### 编辑 mkinitcpio.conf 的 HOOKS 项

> 启动钩子的关键词请参考 [ArchWiki](https://wiki.archlinux.org/index.php/Mkinitcpio_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E8%BF%90%E8%A1%8C%E6%97%B6%E9%92%A9%E5%AD%90)

添加 resume 钩子

```bash
# /etc/mkinitcpio.conf
HOOKS=(base udev autodetect modconf block lvm2 resume filesystems keyboard fsck)
```

#### 重新编译镜像

```bash
sudo mkinitcpio -p 你的内核名称
```

## The End

在第一次休眠之前，需要重新启动才能激活该功能。

##### 重启之后，你应该就能看见电源菜单中有了休眠选项。
