---
source_hash: "092cfb9a"
source_lang: "zh"
target_lang: "en"
title: "Arch Linux Hibernation Using Swap File"
pubDate: "2019-06-08"
description: "Complete guide to configuring Swap File on Arch Linux and enabling system hibernation, including GRUB and kernel module configurations."
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "ArchLinux", "Linux"]
---

> In most cases, we generally use Swap File for easier adjustment and configuration flexibility.

<!--more-->

References: [Arch Wiki](https://wiki.archlinux.org/index.php/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)), [Arch Wiki](https://wiki.archlinux.org/index.php/Power_management/Suspend_and_hibernate_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%BD%BF%E7%94%A8swap_file%E4%BC%91%E7%9C%A0), [Arch BBS](https://bbs.archlinux.org/viewtopic.php?id=229753)

## Creating Swap File (Reference: [Arch Wiki](https://wiki.archlinux.org/index.php/Swap_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E6%89%8B%E5%8A%A8%E6%96%B9%E5%BC%8F))

### Manual Method

#### Creating the Swap File

Use the root account and the `fallocate` command to create a swap file of the desired size (M = [Mebibytes](https://en.wikipedia.org/wiki/Mebibyte), G = [Gibibytes](https://en.wikipedia.org/wiki/Gibibyte)). For example, create a 16G swap file (for hibernation, it's best to set it to your computer's RAM size):

```bash
# fallocate -l 16G /swapfile
```

**Note:** The *fallocate* command may cause issues on [F2FS](https://wiki.archlinux.org/index.php/F2FS) or [XFS](https://wiki.archlinux.org/index.php/XFS) filesystems. [[1]](https://bugzilla.redhat.com/show_bug.cgi?id=1129205#c3) As an alternative, use the *dd* command, though it's slower:

```bash
# dd if=/dev/zero of=/swapfile bs=1M count=512
```

Set permissions for the swap file (globally readable swap files are a major local vulnerability):

```bash
# chmod 600 /swapfile
```

After creating the swap file, format it:

```bash
# mkswap /swapfile
```

![mkswap output](/images/blog/arch-linux-hibernation-into-swap-file/mkswap-output.png)

Tip: A UUID will be displayed here, but **it's useless**.

Enable the swap file:

```bash
# swapon /swapfile
```

Finally, edit `/etc/fstab` and add the following line:

```
/etc/fstab
```

```
/swapfile none swap defaults 0 0
```

## Configuring Hibernation (Reference: [Arch Wiki](https://wiki.archlinux.org/index.php/Power_management/Suspend_and_hibernate_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E4%BD%BF%E7%94%A8swap_file%E4%BC%91%E7%9C%A0))

### Configuring GRUB

![GRUB configuration](/images/blog/arch-linux-hibernation-into-swap-file/grub-config.png)

#### Setting resume (to tell the system which disk device to resume from)

Get the UUID of the partition containing the swap file. For example, I'm using LVM:

```bash
lsblk -no UUID /dev/XzRoot/root
```

![View UUID](/images/blog/arch-linux-hibernation-into-swap-file/filefrag-output.png)

Fill in this UUID (2cee6498-2bd1-496f-9801-164ddddcc9c3) for `resume`:

```
resume=UUID=2cee6498-2bd1-496f-9801-164ddddcc9c3
```

Alternatively, you can use `resume=/dev/XzRoot/root`.

###### Getting resume_offset

Run `sudo filefrag -v /swapfile`

![filefrag output](/images/blog/arch-linux-hibernation-into-swap-file/lsblk-uuid.png)

Find the first number with two dots in the first row. As shown in the screenshot, it's: 78610432.

#### Setting resume_offset (to tell the system the exact location to resume from)

Fill in the value obtained from the swap file (`resume_offset`) as shown:

```
resume_offset=78610432
```

#### Regenerate grub.cfg

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

### Configuring Kernel Module

#### Edit the HOOKS entry in mkinitcpio.conf

> For runtime hook keywords, refer to [ArchWiki](https://wiki.archlinux.org/index.php/Mkinitcpio_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E8%BF%90%E8%A1%8C%E6%97%B6%E9%92%A9%E5%AD%90).

Add the `resume` hook:

```bash
# /etc/mkinitcpio.conf
HOOKS=(base udev autodetect modconf block lvm2 resume filesystems keyboard fsck)
```

#### Recompile the image

```bash
sudo mkinitcpio -p your_kernel_name
```

## The End

Before hibernating for the first time, a reboot is required to activate the feature.

##### After rebooting, you should see the hibernation option in the power menu.