---
source_hash: "bdc69c52"
title: "Converting EXT4 Root Filesystem to XFS (Arch Linux)"
pubDate: "2019-10-19"
description: "Complete guide for migrating root filesystem from EXT4 to XFS on Arch Linux using LVM for disk management."
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "XFS", "Linux", "LVM"]
---

> [XFS](https://wiki.archlinux.org/index.php/XFS_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) offers more modern features compared to [EXT4](https://wiki.archlinux.org/index.php/Ext4_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) and performs better when handling large numbers of files
>
> References: [XFS vs EXT4](http://xiaqunfeng.cc/2017/07/06/XFS-vs-EXT4/), [Why did CENTOS 7.0 choose XFS as the default filesystem? What are the advantages of XFS over ext?](https://www.zhihu.com/question/24413471), [Ext4 vs XFS – Which one to choose?](https://computingforgeeks.com/ext4-vs-xfs-complete-comparison/)

> NOTE: Since XFS cannot shrink partitions, it's recommended to use [LVM](https://wiki.archlinux.org/index.php/LVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) for flexibility

> Prerequisites: Arch Linux system with LVM+EXT4 disk management

> Technical references: [Change Root File System from Ext4 to Xfs on Archlinux](https://www.binwang.me/2013-01-10-Change-Root-File-System-from-Ext4-to-Xfs-on-Archlinux.html), [XFS (简体中文)](https://wiki.archlinux.org/index.php/XFS_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)), [LVM (简体中文)](https://wiki.archlinux.org/index.php/LVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

<!--more-->

## Preparation

Backup system data and [create Arch Linux Live environment](https://wiki.archlinux.org/index.php/Installing_Arch_Linux_on_a_USB_key_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

### Preparing Filesystem

**Reboot into Live environment**

#### Shrink EXT4 Logical Volume

##### Compress Ext4 Partition

Reference: [Resizing EXT4 partition safely](https://blog.pinkd.moe/linux/2018/01/31/resize-a-ext4-partiton-safely)

```bash
e2fsck -f /dev/<volume_group>/<physical_volume>
# Check the partition to be resized (required by EXT4 tools)
```

```bash
resize2fs /dev/<volume_group>/<physical_volume> 300G
# Resize filesystem to 300G
```

##### Shrink LVM Logical Volume

Reference: [Shrinking logical volumes and their filesystems simultaneously](https://wiki.archlinux.org/index.php/LVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%90%8C%E6%97%B6%E7%BC%A9%E5%B0%8F%E9%80%BB%E8%BE%91%E5%8D%B7%E5%92%8C%E5%85%B6%E6%96%87%E4%BB%B6%E7%B3%BB%E7%BB%9F)

```bash
lvresize -L 300G /dev/<volume_group>/<physical_volume>
# Resize logical volume to 300G
```

##### Create LVM Logical Volume for XFS

Reference: [Creating logical volumes (LV)](https://wiki.archlinux.org/index.php/LVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%88%9B%E5%BB%BA%E9%80%BB%E8%BE%91%E5%8D%B7%EF%BC%88LV%EF%BC%89)

```bash
lvcreate -L 300G <volume_group> -n <xfs_physical_volume>
# Create a 300G logical volume
```

```bash
mkfs.xfs /dev/<volume_group>/<xfs_physical_volume>
# Format the volume with XFS filesystem
```

### Data Migration

NOTE: Do not use cp for data copying as it changes setuid bits and follows hard links.

#### Using tar to Copy All Files

- Mount XFS and EXT4 partitions
- `tar -cf - <EXT4_mount_path> | ( cd <XFS_mount_path> ; tar -xpvf - )`

PS: You can use pv to monitor progress

Since tar cannot preserve SELinux labels (if any), ACLs and xattrs, use rsync for exact file copying.

Reference: [How can a filesystem be copied exactly as is?](https://unix.stackexchange.com/questions/96523/how-can-a-filesystem-be-copied-exactly-as-is)

```bash
rsync -aviHAXKhPS <EXT4_dir> <XFS_dir>
```

## System Configuration

### Update GRUB2 Configuration

#### Mount Root and EFI Partitions

```bash
mount /dev/<volume_group>/<xfs_physical_volume> /mnt  # Mount XFS partition
mount /dev/<EFI_Partition> /mnt/boot/efi  # Mount EFI partition
arch-chroot /mnt  # Enter chroot environment
```

#### Verify Swapfile

If you [use swapfile for system hibernation](https://xzos.net/arch-linux-hibernation-into-swap-file/), reconfigure GRUB2 accordingly

#### Rebuild GRUB2 Configuration

```bash
grub-mkconfig -o /boot/grub/grub.cfg  # Rebuild GRUB2 config
```

### Update Fstab File

Exit chroot environment

```bash
genfstab -U /mnt >> /mnt/etc/fstab  # Update file
```

```bash
vim /mnt/etc/fstab  # Remove/comment old EXT4 mount points
```

## System Verification

Reboot and check if system boots normally

### Check XFS Filesystem Status

Reference: [XFS_(简体中文)#Data corruption](https://wiki.archlinux.org/index.php/XFS_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%95%B0%E6%8D%AE%E6%8D%9F%E5%9D%8F)

```bash
sudo xfs_scrub /  # Online error checking
sudo xfs_db -c frag -r /  # Check disk fragmentation
```

NOTE: If any errors are found, immediately enter Live environment for offline repair

```bash
xfs_repair -v /dev/<volume_group>/<xfs_physical_volume>
```

### Check Error Logs

```bash
journalctl -p 3 -xb
```

## Troubleshooting

### LVM Mount Failure

Reference: [LVM replace hard drive and move data smoothly](https://xzos.net/lvm-replace-hard-driveand-move-data/#i-3)

```bash
lvm vgchange -ay  # Activate all LVM groups
mount /dev/mapper/YOUR_LVM_NAME /new_root  # Replace YOUR_LVM_NAME with your LVM group name
exit  # Exit rescue mode and boot into system
```

### XFS Fragmentation Issues

Enter Live system to repair filesystem

```bash
mount /dev/<volume_group>/<xfs_physical_volume> /mnt  # XFS requires mounting first
umount /mnt
xfs_repair -v /dev/<volume_group>/<xfs_physical_volume>  # Repair
```

Attempt defragmentation:

```bash
mount /dev/<volume_group>/<xfs_physical_volume> /mnt  # Defrag requires mounted partition
xfs_db -c frag -r /dev/<volume_group>/<xfs_physical_volume>  # Check fragmentation
xfs_fsr /dev/<volume_group>/<xfs_physical_volume>  # Defragment
```

### XFS Mount Failure

Reference: [mount: Structure needs cleaning. How to repair without losing data?](https://access.redhat.com/discussions/3263661)

Enter Live system to repair filesystem:

```bash
mount /dev/<volume_group>/<xfs_physical_volume> /mnt  # Will fail due to corruption
xfs_repair -v -L /dev/<volume_group>/<xfs_physical_volume>  # Force clear journal and repair (may lose data)
```

## NOTE

XFS cannot shrink partitions, **but never attempt to shrink only the LVM logical volume without shrinking the partition.**