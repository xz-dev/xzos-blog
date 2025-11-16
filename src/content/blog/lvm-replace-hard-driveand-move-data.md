---
title: "LVM 保留数据平滑替换（升级）物理磁盘"
pubDate: "2019-09-03"
description: "使用 LVM 功能在保留数据的情况下平滑替换或升级物理硬盘，无需重装系统或手动拷贝数据。"
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "LVM", "ArchLinux"]
---

> 前设背景
>
> 1. 使用 LVM
> 2. 需要升级（替换）硬盘，但不希望重装系统或是手动拷贝数据

<!--more-->

参考资料：[LVM (简体中文)](https://wiki.archlinux.org/index.php/LVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))，[从逻辑卷中删除磁盘](https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/logical_volume_manager_administration/disk_remove_ex)

## 准备

一般来说，我们需要在需要替换的硬盘和新硬盘之间拷贝数据。因此，我们需要一个可以装载旧的或者新的SSD的硬盘盒或者一个容量不小于旧SSD的可以作为LVM卷的移动存储设备（U 盘、移动磁盘等）。

这里，我选择了SSD硬盘盒，因为使用移动硬盘需要两次移动数据，耗时长。

- 准备一个**live 环境**（意外救砖用）、**备份**（数据操作前先备份）
- LVM 是以硬盘的 **UUID** 确认设备的，所以我们可以先把新的 SSD 换上，然后把旧的 SSD 放入硬盘盒**并连接电脑**（如果你开机前忘记插上硬盘盒，GRUB 引导会丢失，可以进入 live 环境 [修复引导](https://xzos.net/archlinux-desktop-environment-survival-guide)）
- 开机启动系统

## 数据移动

LVM 支持线上操作，根据 [从逻辑卷中删除磁盘](https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/logical_volume_manager_administration/disk_remove_ex) 进行操作。

**Tips**：在加载 LVM 卷之前建议先在新的硬盘上建立分区表（建议 GTP），避免 Windows 弹出窗口要求格式化。原因：[Does LVM need a partition table?](https://serverfault.com/questions/439022/does-lvm-need-a-partition-table)

## 后记

我使用的是 Arch Linux，LVM在最近一次版本中造成某些硬盘（比如我的西部数据红盘）组成的数据卷无法自动挂载而进入救援模式

如果 LVM 因为挂载失败而进入救援模式，我们可以运行以下命令暂时挂载

```bash
lvm vgchange -ay  # 激活所有 LVM 组
mount /dev/mapper/YOUR_LVM_NAME /new_root  # YOUR_LVM_NAME 填写你的 LVM 组名
exit  # 退出救援模式，进入系统
```

### 手动编译修复的 LVM 软件包

#### 获取补丁包

参考：**[LVM inactive logical volumes after bootup](https://bbs.archlinux.org/viewtopic.php?id=248788)**

#### 编译补丁包

获取补丁包后进入文件夹，编译

参考：[Arch User Repository (简体中文)](https://wiki.archlinux.org/index.php/Arch_User_Repository_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

使用 `makepkg -si` 命令编译并自动安装软件包

#### 重启
