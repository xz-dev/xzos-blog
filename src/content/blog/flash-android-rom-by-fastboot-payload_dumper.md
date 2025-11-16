---
title: "手动线刷任意 Android ROM"
pubDate: "2023-04-22"
description: "通过 Fastboot 与 payload_dumper 工具，在任意时刻刷入任意需要的 Android ROM，分享在 Redmi K40 上成功刷入第三方 ROM 的经验。"
author: "xz-dev"
category: "Android"
tags: ["Android", "Fastboot", "payload_dumper", "ROM", "TWRP"]
---

> 通过 Fastboot 与 [payload_dumper](https://github.com/vm03/payload_dumper)，我们可以在任意时刻刷入任意我们需要的 ROM。
>
> 在本文中，我将分享如何在 Redmi K40 上通过 Fastboot 成功刷入第三方 ROM（如 crDroid OS）的经验。参考了 XDA 论坛上的一些帖子后，我找到了一个简单的方法来避免刷机过程中出现的错误。

> 最近，在一次更新中，我遇到了 `"Error applying update: 7 (ErrorCode:: kInstallDeviceOpenError )Updater process ended with ERROR: 1 Error installing zip file"` 的错误
>
> 考虑到 A/B 分区的 OTA 包中根本没有 updater-script 文件，参考 [Google 文档"构建 OTA 软件包"](https://source.android.com/docs/core/ota/tools)，你可以修改 `pre-device`，`pre-build-incremental`，`pre-build` 等。但相信我，根本没用。

> 通过查询资料，发现文章：[Flash fastboot rom / unbrick any xiaomi phone without any flashtool.](https://forum.xda-developers.com/t/flash-fastboot-rom-unbrick-any-xiaomi-phone-without-any-flashtool.4207103/)

## 准备工作

- 确保已安装 ADB 驱动程序，可以从 [这里](https://developer.android.com/studio/releases/platform-tools) 获取。
- 解锁 Bootloader。
- 下载适用于您设备的 Rescovery。
- 下载适用于您设备的 ROM。
- 下载 [payload_dumper](https://github.com/vm03/payload_dumper) 工具。

## 解压 ROM

- 解压 ROM，得到以下文件

```
.
├── apex_info.pb
├── boot.img
├── care_map.pb
├── META-INF
│   └── com
│       └── android
│           ├── metadata
│           ├── metadata.pb
│           └── otacert
├── payload.bin
└── payload_properties.txt

4 directories, 8 files
```

- 解码 Android OTA payload

1. 参考 [payload_dumper](https://github.com/vm03/payload_dumper) 的 README，运行命令

```bash
podman run --rm -v $PWD:/data -it vm03/payload_dumper /data/payload.bin --out /data/output
```

2. 在 output 文件夹下得到以下文件（因 ROM、版本不同，文件可能不一样）

```
.
├── boot.img
├── dtbo.img
├── odm.img
├── product.img
├── system_ext.img
├── system.img
├── vbmeta.img
├── vbmeta_system.img
├── vendor_boot.img
└── vendor.img

1 directory, 10 files
```

## 刷入 ROM

1. 将手机连接到电脑，引导进入 TWRP 或 OrangeFox

2. 执行 `adb reboot fastboot` 命令进入 fastbootd 模式（而非 bootloader 模式，两者的区别可参考 [这篇文章](https://forum.xda-developers.com/t/difference-between-bootloader-download-and-recovery-mode.3661049/)）。

```bash
fastboot devices
```

3. 使用 fastboot 命令逐个刷入 .img 文件，文件名和分区名是一一对应的。主要包括：boot.img、system.img 和 system_ext.img。

```bash
fastboot flash boot boot.img
fastboot flash dtbo dtbo.img
fastboot flash odm odm.img
fastboot flash product product.img
fastboot flash system system.img
fastboot flash system_ext system_ext.img
fastboot flash vbmeta vbmeta.img
fastboot flash vendor vendor.img
```

或者简单的一行命令（fish bash 语法，别的用 AI 自行翻译一下）

```fish
for img in (ls *.img)
    set img_name (basename $img .img)
    fastboot flash $img_name $img
end
```

4. 完成刷入后，执行 fastboot reboot 重启设备

5. 如果需要，您可以重新启动进入 TWRP，然后正常卡刷整个 ROM（一般不会有问题），实在不行就手动刷入其他其他文件（如 vendor.img、vbmeta.img 等）。

## 总结

刷机/更新设备是风险操作，请使用定期自动备份 Android 软件 NeoBackup 等，自动上传云端，保持良好的数据备份习惯

祝各位好运，玩得开心！
