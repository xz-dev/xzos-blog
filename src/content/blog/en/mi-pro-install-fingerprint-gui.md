---
source_hash: "80017bfc"
title: "Installing Fingerprint GUI on MI Pro (Arch Linux Environment)"
pubDate: "2019-02-27"
description: "Complete guide for installing and configuring Fingerprint GUI fingerprint recognition software on Xiaomi Pro notebook, including solutions for permission issues."
author: "xz-dev"
category: "ArchLinux"
tags: ["Arch Linux", "MI Pro", "Fingerprint GUI"]
---

> All hardware components of MI Pro have Linux driver support (including fingerprint), which is quite rare.

During installation and usage, I encountered some minor issues, which I'll point out here:

1. Refer to [Arch Wiki](https://wiki.archlinux.org/index.php/Fingerprint_GUI) to install Fingerprint GUI
2. After installation, found that Fingerprint GUI only works with root privileges
3. Solution as follows (reference [github issues](https://github.com/iafilatov/libfprint/issues/2))

**Steps:**

1. Add the following to `/etc/udev/rules.d/elan-fprint.rules`:

```
ATTR{idVendor}=="04f3", ATTR{idProduct}=="0c1a", GROUP="plugdev"
```

2. Run command:

```bash
udevadm trigger
```

PS: Personal experience proves that the fingerprint driver works almost perfectly. However, Fingerprint GUI's recognition algorithm has an unacceptably low success rate, resulting in very poor user experience. 🙁