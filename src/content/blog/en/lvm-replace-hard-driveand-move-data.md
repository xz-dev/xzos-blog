---
source_hash: "9a719393"
title: "Smooth Physical Disk Replacement (Upgrade) with LVM While Preserving Data"
pubDate: "2019-09-03"
description: "Using LVM functionality to smoothly replace or upgrade physical hard drives while preserving data, without reinstalling the system or manually copying data."
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "LVM", "ArchLinux"]
---

> Prerequisites
>
> 1. Using LVM
> 2. Need to upgrade (replace) hard drive but don't want to reinstall the system or manually copy data

<!--more-->

References: [LVM (Simplified Chinese)](https://wiki.archlinux.org/index.php/LVM_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)), [Removing Disks from a Logical Volume](https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/logical_volume_manager_administration/disk_remove_ex)

## Preparation

Generally, we need to copy data between the old and new hard drives. Therefore, we need either an SSD enclosure that can hold the old or new SSD, or a portable storage device (USB drive, external hard disk, etc.) with capacity no less than the old SSD that can serve as an LVM volume.

Here, I chose an SSD enclosure because using an external hard drive would require moving data twice, which takes longer.

- Prepare a **live environment** (for emergency recovery) and **backups** (always backup before data operations)
- LVM identifies devices by their **UUID**, so we can first install the new SSD, then place the old SSD in the enclosure **and connect it to the computer** (if you forget to connect the enclosure before booting, GRUB bootloader may be lost - you can enter the live environment to [repair the bootloader](https://xzos.net/archlinux-desktop-environment-survival-guide))
- Boot the system

## Data Migration

LVM supports online operations. Follow the instructions in [Removing Disks from a Logical Volume](https://access.redhat.com/documentation/zh-cn/red_hat_enterprise_linux/7/html/logical_volume_manager_administration/disk_remove_ex).

**Tips**: Before loading the LVM volume, it's recommended to create a partition table (preferably GPT) on the new hard drive to avoid Windows prompting to format the drive. Reason: [Does LVM need a partition table?](https://serverfault.com/questions/439022/does-lvm-need-a-partition-table)

## Postscript

I'm using Arch Linux. In a recent version, LVM caused some hard drives (like my Western Digital Red) in the volume group to fail to mount automatically, entering rescue mode instead.

If LVM enters rescue mode due to mount failure, we can temporarily mount with these commands:

```bash
lvm vgchange -ay  # Activate all LVM groups
mount /dev/mapper/YOUR_LVM_NAME /new_root  # Replace YOUR_LVM_NAME with your LVM group name
exit  # Exit rescue mode and enter the system
```

### Manually Compiling Fixed LVM Packages

#### Getting the Patch

Reference: **[LVM inactive logical volumes after bootup](https://bbs.archlinux.org/viewtopic.php?id=248788)**

#### Compiling the Patch

After obtaining the patch, enter the folder and compile it.

Reference: [Arch User Repository (Simplified Chinese)](https://wiki.archlinux.org/index.php/Arch_User_Repository_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))

Use the command `makepkg -si` to compile and automatically install the package.

#### Reboot