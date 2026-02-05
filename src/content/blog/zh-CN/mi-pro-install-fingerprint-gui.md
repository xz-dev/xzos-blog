---
source_hash: "80017bfc"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "MI Pro 安装 Fingerprint GUI（Arch Linux 环境）"
pubDate: "2019-02-27"
description: "在小米 Pro 笔记本上安装和配置 Fingerprint GUI 指纹识别软件，解决权限问题的完整指南。"
author: "xz-dev"
category: "ArchLinux"
tags: ["Arch Linux", "MI Pro", "Fingerprint GUI"]
---

> MI Pro 所有硬件都拥有Linux平台的驱动支持（包括指纹），非常难得。

在安装使用期间遇到了一些小问题，在这里指出：

1. 参考 [Arch Wiki](https://wiki.archlinux.org/index.php/Fingerprint_GUI) 安装 Fingerprint GUI
2. 安装完成后，发现只有root权限可用 Fingerprint GUI
3. 解决方法如下（参考 [github issues](https://github.com/iafilatov/libfprint/issues/2)）

**步骤：**

1. 在 `/etc/udev/rules.d/elan-fprint.rules` 添加：

```
ATTR{idVendor}=="04f3", ATTR{idProduct}=="0c1a", GROUP="plugdev"
```

2. 运行命令：

```bash
udevadm trigger
```

PS：个人体验证明，指纹驱动几乎是完美的。但是，Fingerprint GUI 算法识别率过低，体验非常差。🙁
