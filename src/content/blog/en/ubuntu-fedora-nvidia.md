---
source_hash: "415e3447"
title: "Ubuntu, Fedora and Nvidia"
pubDate: "2018-06-24"
description: "Detailed tutorials for installing Nvidia graphics drivers on Ubuntu and Fedora systems, solving driver installation challenges faced by Linux beginners."
author: "xz-dev"
category: "Nvidia"
tags: ["Fedora", "Ubuntu", "Nvidia", "Nouveau"]
---

> Nvidia drivers have always been one of the obstacles for beginners using Linux.
>
> There are already many methods online about how to install drivers, but more or less they contain errors or unnecessary steps.
>
> Therefore, here we reorganize the correct installation methods.
>
> (Blogger currently uses Fedora, former Ubuntu user for one year)

## Ubuntu Installation Method

### Unable to Enter Installation Interface

1. At the grub interface (boot screen), press the 'e' key.

2. Find **quiet splash**

3. Add **nomodeset** after it (separated by spaces)

4. Press **F10** to enter the installation interface

5. Complete Ubuntu installation and reboot.

### Entering Ubuntu System

**1. At the grub interface (boot screen), press the 'e' key**

2. Find **quiet splash**

3. Add **nomodeset** after it (separated by spaces)

4. Press **F10** to boot the system

### Installing Nvidia Drivers

1. In the Update Manager, select Additional Drivers to install Nvidia drivers

2. Wait for completion and reboot

## Fedora Installation Method

### Unable to Enter Installation Interface (UID1000 Error)

1. **At the grub interface (boot screen), press the 'e' key (or TAB key)**

2. Find **quiet splash**

3. Add **nomodeset** after it (separated by spaces)

4. Press **F10** (or Enter key) to enter the installation interface

5. Complete Fedora installation and reboot.

### Entering Fedora System (Same as 1)

1. **At the grub interface (boot screen), press the 'e' key (or TAB key)**

2. Find **quiet splash**

3. Add **nomodeset** after it (separated by spaces)

4. Press **F10** (or Enter key) to boot the system

5. Enter the system

### Installing Nvidia Drivers

#### Method 1:

1. Add [Nvidia driver dnf repository](https://negativo17.org/nvidia-driver/)

```bash
sudo dnf config-manager --add-repo=https://negativo17.org/repos/fedora-nvidia.repo
```

2. Update system (*optional*)

```bash
sudo dnf upgrade
```

3. Uninstall nouveau driver

```bash
sudo dnf remove xorg-x11-drv-nouveau
```

3. Install Nvidia basic drivers

```bash
sudo dnf install nvidia-driver nvidia-settings
```

*4. Install CUDA tools (**optional, untested**)*

Reference [this blog: https://blog.csdn.net/ZhangK9509/article/details/79260341](https://blog.csdn.net/ZhangK9509/article/details/79260341)

5. Modify grub default parameters

- Open /etc/sysconfig/grub file
- Remove `nomodeset` from `GRUB_CMDLINE_LINUX` parameter and add `rd.driver.blacklist=nouveau`
- Update grub

**## BIOS ##**

```bash
grub2-mkconfig -o /boot/grub2/grub.cfg
```

**## UEFI ##**

```bash
grub2-mkconfig -o /boot/efi/EFI/fedora/grub.cfg
```

6. Install VDPAU / VAAPI support (Geforce 8 or higher)

```bash
sudo dnf install vdpauinfo libva-vdpau-driver libva-utils
```

7. Reboot

#### Method 2 (Manual driver installation, *not recommended*):

Reference: [https://www.if-not-true-then-false.com/2015/fedora-nvidia-guide/](https://www.if-not-true-then-false.com/2015/fedora-nvidia-guide/)

---

If you also want to speed up proxy performance in Linux environment, [this article](https://www.xzos.net/index.php/galaxy/haproxy-shadowsocks/) may help

Welcome to discuss via comments/email 🙂