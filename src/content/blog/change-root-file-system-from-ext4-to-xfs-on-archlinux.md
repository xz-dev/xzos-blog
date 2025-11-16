---
title: "修改 EXT4 根目录文件系统为 XFS（Arch Linux）"
pubDate: "2019-10-19"
description: "在 Arch Linux 系统上将根目录文件系统从 EXT4 迁移到 XFS，使用 LVM 进行磁盘管理的完整指南。"
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "XFS", "Linux", "LVM"]
---

> [XFS](https://wiki.archlinux.org/index.php/XFS_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) 相对于 [EXT4](https://wiki.archlinux.org/index.php/Ext4_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) 拥有更多新颖的特性且在处理大量文件时效率更高
>
> 参考资料：[XFS vs EXT4](http://xiaqunfeng.cc/2017/07/06/XFS-vs-EXT4/)，[为什么CENTOS 7.0开始选择XFS作为默认的文件系统？XFS相比ext有什么优点？](https://www.zhihu.com/question/24413471)，[Ext4 vs XFS – Which one to choose?](https://computingforgeeks.com/ext4-vs-xfs-complete-comparison/)

> NOTE：鉴于 XFS 无法缩小分区大小，为保证灵活性，建议使用 [LVM](https://wiki.archlinux.org/index.php/LVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

> 前设环境：Arch Linux 系统，LVM+EXT4 磁盘管理方案

> 技术参考：[Change Root File System from Ext4 to Xfs on Archlinux](https://www.binwang.me/2013-01-10-Change-Root-File-System-from-Ext4-to-Xfs-on-Archlinux.html)，[XFS (简体中文)](https://wiki.archlinux.org/index.php/XFS_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))，[LVM (简体中文)](https://wiki.archlinux.org/index.php/LVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

<!--more-->

## 准备

备份系统资料，[烧录 Arch Linux Live 环境](https://wiki.archlinux.org/index.php/Installing_Arch_Linux_on_a_USB_key_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

### 准备文件系统

**重启到 Live 环境**

#### 缩小 EXT4 逻辑卷

##### 压缩 Ext4 分区

参考：[无损调整EXT4分区大小](https://blog.pinkd.moe/linux/2018/01/31/resize-a-ext4-partiton-safely)

```bash
e2fsck -f /dev/<volume_group>/<physical_volume>
# 检查需要调整的分区，EXT4 工具规定必须先行执行
```

```bash
resize2fs /dev/<volume_group>/<physical_volume> 300G
# 调整分区文件系统到 300G
```

##### 缩小 LVM 逻辑卷

参考：[同时缩小逻辑卷和其文件系统](https://wiki.archlinux.org/index.php/LVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%90%8C%E6%97%B6%E7%BC%A9%E5%B0%8F%E9%80%BB%E8%BE%91%E5%8D%B7%E5%92%8C%E5%85%B6%E6%96%87%E4%BB%B6%E7%B3%BB%E7%BB%9F)

```bash
lvresize -L 300G /dev/<volume_group>/<physical_volume>
# 修改逻辑分区为 300G
```

##### 为 XFS 分区创建 LVM 逻辑卷

参考：[创建逻辑卷（LV）](https://wiki.archlinux.org/index.php/LVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%88%9B%E5%BB%BA%E9%80%BB%E8%BE%91%E5%8D%B7%EF%BC%88LV%EF%BC%89)

```bash
lvcreate -L 300G <volume_group> -n <xfs_physical_volume>
# 创建一个 300G 的逻辑卷
```

```bash
mkfs.xfs /dev/<volume_group>/<xfs_physical_volume>
# 格式化逻辑卷为 XFS 文件系统
```

### 移动数据

NOTE：请勿使用 cp 进行数据拷贝，因为 `cp` 会更改setuid位并遵循硬链接。

#### 使用 tar 拷贝所有文件

- 挂载 XFS 分区与 EXT4 分区
- `tar -cf - <EXT4_mount_path> | ( cd <XFS_mount_path> ; tar -xpvf - )`

PS: 可以使用 pv 以查看具体状态

因为 tar 复制无法包含 SELinux label (如有)、ACL和 xattr，请使用 rsync 工具进行文件复制。

参考：[How can a filesystem be copied exactly as is?](https://unix.stackexchange.com/questions/96523/how-can-a-filesystem-be-copied-exactly-as-is)

```bash
rsync -aviHAXKhPS <EXT4_dir> <XFS_dir>
```

## 配置系统

### 更新 GRUB2 配置

#### 挂载根目录分区、EFI分区

```bash
mount /dev/<volume_group>/<xfs_physical_volume> /mnt  # 挂载 XFS 分区
mount /dev/<EFI_Partition> /mnt/boot/efi  # 挂载EFI分区
arch-chroot /mnt  # 进入 chroot 环境
```

#### 重新确认 swapfile

如果你 [使用 swapfile 进行系统休眠](https://xzos.net/arch-linux-hibernation-into-swap-file/)，请重新配置 GRUB2 相关项

#### 重建 GRUB2 配置

```bash
grub-mkconfig -o /boot/grub/grub.cfg  # 重建 GRUB2 配置
```

### 更新 Fstab 文件

退出 chroot 环境

```bash
genfstab -U /mnt >> /mnt/etc/fstab  # 更新文件
```

```bash
vim /mnt/etc/fstab  # 删除/注释 旧的 EXT4 分区挂载点
```

## 检查系统

重启，检查是否正常进入系统

### 检查 XFS 文件系统状态

参考：[XFS_(简体中文)#数据损坏](https://wiki.archlinux.org/index.php/XFS_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%95%B0%E6%8D%AE%E6%8D%9F%E5%9D%8F)

```bash
sudo xfs_scrub /  # 在线检查错误
sudo xfs_db -c frag -r /  # 检查磁盘碎片
```

NOTE：如果发现任何错误，请立即进入 Live 环境离线修复

```bash
xfs_repair -v /dev/<volume_group>/<xfs_physical_volume>
```

### 检查错误日志

```bash
journalctl -p 3 -xb
```

## 错误处理

### LVM 无法挂载

参考：[LVM 保留数据平滑替换（升级）物理磁盘](https://xzos.net/lvm-replace-hard-driveand-move-data/#i-3)

```bash
lvm vgchange -ay  # 激活所有 LVM 组
mount /dev/mapper/YOUR_LVM_NAME /new_root  # YOUR_LVM_NAME 填写你的 LVM 组名
exit  # 退出救援模式，进入系统
```

### XFS 无法进行碎片整理

进入 Live 系统尝试修复文件系统

```bash
mount /dev/<volume_group>/<xfs_physical_volume> /mnt  # XFS 文件系统规定必须挂载一次文件系统
umount /mnt
xfs_repair -v /dev/<volume_group>/<xfs_physical_volume>  # 修复
```

尝试碎片整理

```bash
mount /dev/<volume_group>/<xfs_physical_volume> /mnt  # 碎片整理必须挂载分区
xfs_db -c frag -r /dev/<volume_group>/<xfs_physical_volume>  # 检查磁盘碎片
xfs_fsr /dev/<volume_group>/<xfs_physical_volume>  # 整理磁盘碎片
```

### XFS 挂载失败

参考：[mount: Structure needs cleaning. How to repair without losing data?](https://access.redhat.com/discussions/3263661)

进入 Live 系统尝试修复文件系统

```bash
mount /dev/<volume_group>/<xfs_physical_volume> /mnt  # XFS 文件系统规定必须挂载一次文件系统，因文件系统损坏，挂载必定失败
xfs_repair -v -L /dev/<volume_group>/<xfs_physical_volume>  # 强行清除日志并修复（极有可能丢失文件）
```

## NOTE

XFS 无法缩小分区，**但请不要尝试只缩小LVM逻辑卷而不缩小分区。**
