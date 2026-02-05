---
source_hash: "e8b7e957"
title: "Manually Flashing Any Android ROM"
pubDate: "2023-04-22"
description: "Using Fastboot and payload_dumper tools to flash any required Android ROM at any time, sharing successful experience flashing third-party ROMs on Redmi K40."
author: "xz-dev"
category: "Android"
tags: ["Android", "Fastboot", "payload_dumper", "ROM", "TWRP"]
---

> With Fastboot and [payload_dumper](https://github.com/vm03/payload_dumper), we can flash any ROM we need at any time.
>
> In this article, I'll share my experience successfully flashing third-party ROMs (like crDroid OS) on Redmi K40 via Fastboot. After referencing some threads on XDA forums, I found a simple method to avoid errors during flashing.

> Recently, during an update, I encountered the error: `"Error applying update: 7 (ErrorCode:: kInstallDeviceOpenError )Updater process ended with ERROR: 1 Error installing zip file"`
>
> Considering OTA packages for A/B partitions don't contain updater-script files at all, referring to [Google's "Building OTA Packages" documentation](https://source.android.com/docs/core/ota/tools), you could modify `pre-device`, `pre-build-incremental`, `pre-build`, etc. But trust me, it's completely useless.

> Through research, I found this article: [Flash fastboot rom / unbrick any xiaomi phone without any flashtool.](https://forum.xda-developers.com/t/flash-fastboot-rom-unbrick-any-xiaomi-phone-without-any-flashtool.4207103/)

## Preparation

- Ensure ADB drivers are installed, available [here](https://developer.android.com/studio/releases/platform-tools).
- Unlock Bootloader.
- Download Recovery suitable for your device.
- Download ROM suitable for your device.
- Download [payload_dumper](https://github.com/vm03/payload_dumper) tool.

## Extracting ROM

- Extract the ROM to get these files:

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

- Decoding Android OTA payload

1. Refer to [payload_dumper](https://github.com/vm03/payload_dumper) README, run command:

```bash
podman run --rm -v $PWD:/data -it vm03/payload_dumper /data/payload.bin --out /data/output
```

2. Get these files in output folder (may vary by ROM/version):

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

## Flashing ROM

1. Connect phone to computer, boot into TWRP or OrangeFox

2. Execute `adb reboot fastboot` to enter fastbootd mode (not bootloader mode, differences explained [here](https://forum.xda-developers.com/t/difference-between-bootloader-download-and-recovery-mode.3661049/)).

```bash
fastboot devices
```

3. Use fastboot commands to flash .img files one by one (filenames correspond to partition names). Mainly includes: boot.img, system.img and system_ext.img.

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

Or a simplified one-liner (fish bash syntax, translate for others):

```fish
for img in (ls *.img)
    set img_name (basename $img .img)
    fastboot flash $img_name $img
end
```

4. After flashing completes, execute fastboot reboot to restart device

5. If needed, you can reboot into TWRP and normally flash the complete ROM (usually works fine), or manually flash other files (like vendor.img, vbmeta.img, etc.) if necessary.

## Conclusion

Flashing/updating devices is risky. Use regular Android backups like NeoBackup with automatic cloud uploads to maintain good backup habits.

Good luck and have fun!