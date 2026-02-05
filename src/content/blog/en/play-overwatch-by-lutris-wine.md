---
source_hash: "9a0e75e4"
title: "Playing Overwatch on Wine Platform"
pubDate: "2019-05-18"
description: "A complete configuration guide for playing Overwatch on Arch Linux using Lutris Wine with Nvidia graphics, including driver installation, GPU management, and performance optimization."
author: "xz-dev"
category: "Wine"
tags: ["Lutris", "Wine", "Nvidia", "OverWatch", "Arch Linux"]
---

> [Lutris](https://lutris.net/) is an Open Source gaming platform for Linux.

> This article uses MI Pro (i7-8550U, GTX1050 ti) as an example

> Regarding GPU performance: Minimal performance loss
> (Runs smoother than Windows with only Overwatch installed)

## Install Lutris

```bash
sudo pacman -S lutris
```

## Install Nvidia Drivers

> Prerequisite environment: [Bumblebee](https://wiki.archlinux.org/index.php/Bumblebee_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) already installed
> If you already have Bumblebee installed, there's no need to disable the service

```bash
sudo pacman -S nvidia nvidia-settings
```

Overwatch is a 32-bit application, so we also need 32-bit Nvidia drivers:

```bash
sudo pacman -S lib32-nvidia-utils
```

Overwatch depends on DXVK:

```bash
sudo pacman -S dxvk-bin  # Requires archlinuxcn repo, otherwise install from AUR
```

## Install Nvidia-xrun

```bash
sudo pacman -S nvidia-xrun
```

## Configure Nvidia-xrun (Mostly following ArchWiki)

### Set nvidia bus id

If `/etc/X11/nvidia-xorg.conf.d/30-nvidia.conf` already has the bus id configured after installing nvidia-xrun, you can skip this step.

If you installed nvidia-xrun from the [nvidia-xrun github repo], you'll need to manually set the bus id.

Get the ID: Typically the bus ID is 1:0:0. To confirm, run:

```bash
lspci | grep NVIDIA
```

The ID can be found at the beginning of each output line.

Create `/etc/X11/nvidia-xorg.conf.d/30-nvidia.conf` with content like:

```
Section "Device"
    Identifier "nvidia"
    Driver "nvidia"
    BusID "PCI:1:0:0"
EndSection
```

Similarly, you can adjust some NVIDIA settings if needed:

```
Section "Screen"
    Identifier "nvidia"
    Device "nvidia"
    # Option "AllowEmptyInitialConfiguration" "Yes"
    # Option "UseDisplayDevice" "none"
EndSection
```

## Manage nvidia GPU with bbswitch (Directly following ArchWiki)

Normally use bbswitch to disable the nvidia GPU. When needing to run programs with nvidia, executing `nvidia-xrun` will activate the nvidia GPU and automatically launch the configured window manager.

- Load bbswitch module at startup

```bash
# echo 'bbswitch ' > /etc/modules-load.d/bbswitch.conf
```

- Options to disable nvidia GPU

```bash
# echo 'options bbswitch load_state=0 unload_state=1' > /etc/modprobe.d/bbswitch.conf
```

Reboot the system to apply.

Check status:

```bash
cat /proc/acpi/bbswitch
```

Toggle GPU using bbswitch commands:

```bash
# tee /proc/acpi/bbswitch <<<OFF
# tee /proc/acpi/bbswitch <<<ON
```

More bbswitch info at [Bumblebee-Project/bbswitch](https://github.com/Bumblebee-Project/bbswitch)

## Running KDE with Nvidia

Edit ~/.nvidia-xinitrc and add:

```bash
export VK_ICD_FILENAMES=/usr/share/vulkan/icd.d/nvidia_icd.json  # Prevents Vulkan loading issues
startkde
```

After logging into tty, launch KDE desktop environment with NVIDIA rendering using:

```bash
nvidia-xrun
```

## Overwatch Left CTRL Key Not Working

Use xmodmap to map left CTRL to right CTRL:

```bash
xmodmap -e "keycode 37 = Control_R"  # Only valid for current tty session
```

## The End

Next, log out of current KDE session

Open a new tty and launch KDE with:

```bash
nvidia-xrun
```

Launch Lutris and install Overwatch as usual