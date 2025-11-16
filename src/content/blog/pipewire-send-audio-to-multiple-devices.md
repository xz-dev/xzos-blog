---
title: "Pipewire 发送音频到多个设备"
pubDate: "2022-08-13"
description: "使用 Pipewire 实现音频同时输出到多个设备，如电脑扬声器和蓝牙耳机。"
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "Fedora", "PipeWire"]
---

> 今天想和朋友一起听歌，把ta的蓝牙耳机连到电脑上后发现 KDE 界面只能设置一个音频输出端口。想起来上次 [Steam Link 的经验](https://xzos.net/steam-for-linux-no-sound-when-streaming/)，决定使用 Pipewire 实现这个功能。
>
> 参考资料：
> - https://xzos.net/steam-for-linux-no-sound-when-streaming/
> - https://bbs.archlinux.org/viewtopic.php?pid=1986792#p1986792

1. 查找音频设备

```bash
$ pw-link -o
Midi-Bridge:Midi Through:(capture_0) Midi Through Port-0
v4l2_input.pci-0000_00_14.0-usb-0_6_1.0:out_0
alsa_output.pci-0000_00_1f.3.analog-stereo:monitor_FL
alsa_output.pci-0000_00_1f.3.analog-stereo:monitor_FR
alsa_input.pci-0000_00_1f.3.analog-stereo:capture_FL
alsa_input.pci-0000_00_1f.3.analog-stereo:capture_FR
easyeffects_sink:monitor_FL
easyeffects_sink:monitor_FR
easyeffects_source:capture_FL
easyeffects_source:capture_FR
ee_soe_output_level:output_FL
ee_soe_output_level:output_FR
ee_soe_spectrum:output_FL
ee_soe_spectrum:output_FR
ee_soe_equalizer:output_FL
ee_soe_equalizer:output_FR
ee_soe_convolver:output_FL
ee_soe_convolver:output_FR
ee_sie_output_level:output_FL
ee_sie_output_level:output_FR
ee_sie_spectrum:output_FL
ee_sie_spectrum:output_FR
Audacious:output_FL
Audacious:output_FR
steam:output_FL
steam:output_FR
bluez_output.84_AB_26_A6_8A_6A.a2dp-sink:monitor_FL
bluez_output.84_AB_26_A6_8A_6A.a2dp-sink:monitor_FR
```

确认希望使用的音频设备为 `alsa_output.pci-0000_00_1f.3.analog-stereo` 与 `bluez_output.84_AB_26_A6_8A_6A.a2dp-sink`

2. 连接创建虚拟设备

```bash
$ pactl load-module module-null-sink media.class=Audio/Sink sink_name=Simultaneous channel_map=stereo
536870913 # 模块 ID，不用记
```

3. 连接设备

```bash
# 顺序不影响结果
$ pw-link Simultaneous:monitor_FL bluez_output.84_AB_26_A6_8A_6A.a2dp-sink:playback_FL
$ pw-link Simultaneous:monitor_FR bluez_output.84_AB_26_A6_8A_6A.a2dp-sink:playback_FR
$ pw-link Simultaneous:monitor_FL alsa_output.pci-0000_00_1f.3.analog-stereo:playback_FL
$ pw-link Simultaneous:monitor_FR alsa_output.pci-0000_00_1f.3.analog-stereo:playback_FR
```

4. 去 KDE 设置里选择

![KDE 音频设置界面](/images/blog/pipewire-send-audio-to-multiple-devices/kde-audio-settings.png)

5. 卸载模块

用完后可以卸载模块

```bash
$ pactl unload-module module-null-sink
```
