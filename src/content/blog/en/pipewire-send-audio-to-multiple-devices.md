---
source_hash: "fdf6247e"
title: "Pipewire: Send Audio to Multiple Devices"
pubDate: "2022-08-13"
description: "Using Pipewire to output audio simultaneously to multiple devices, such as computer speakers and Bluetooth headphones."
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "Fedora", "PipeWire"]
---

> Today I wanted to listen to music with a friend. After connecting their Bluetooth headphones to my computer, I noticed the KDE interface only allows setting one audio output port. Remembering my previous experience with [Steam Link](https://xzos.net/steam-for-linux-no-sound-when-streaming/), I decided to use Pipewire to achieve this functionality.
>
> References:
> - https://xzos.net/steam-for-linux-no-sound-when-streaming/
> - https://bbs.archlinux.org/viewtopic.php?pid=1986792#p1986792

1. Find audio devices

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

Confirmed the desired audio devices are `alsa_output.pci-0000_00_1f.3.analog-stereo` and `bluez_output.84_AB_26_A6_8A_6A.a2dp-sink`

2. Create virtual device connection

```bash
$ pactl load-module module-null-sink media.class=Audio/Sink sink_name=Simultaneous channel_map=stereo
536870913 # Module ID, no need to remember
```

3. Connect devices

```bash
# Order doesn't affect the result
$ pw-link Simultaneous:monitor_FL bluez_output.84_AB_26_A6_8A_6A.a2dp-sink:playback_FL
$ pw-link Simultaneous:monitor_FR bluez_output.84_AB_26_A6_8A_6A.a2dp-sink:playback_FR
$ pw-link Simultaneous:monitor_FL alsa_output.pci-0000_00_1f.3.analog-stereo:playback_FL
$ pw-link Simultaneous:monitor_FR alsa_output.pci-0000_00_1f.3.analog-stereo:playback_FR
```

4. Select in KDE settings

![KDE audio settings interface](/images/blog/pipewire-send-audio-to-multiple-devices/kde-audio-settings.png)

5. Unload module

You can unload the module when done

```bash
$ pactl unload-module module-null-sink
```