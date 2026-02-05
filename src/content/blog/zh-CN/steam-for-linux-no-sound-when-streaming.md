---
source_hash: "a3c1c6de"
source_lang: "en"
target_lang: "zh-CN"
title: "Linux版Steam串流时无声音问题"
description: "使用PipeWire虚拟设备解决Steam Link串流时的声音问题。"
pubDate: "2022-05-30"
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "PipeWire", "Steam", "Steam Link"]
---

> 当我使用Steam Link游玩运行在ArchLinux电脑上的游戏时，发现Steam只捕获了麦克风而忽略了电脑的声音输出。（已于2022-09-15在ArchLinux电脑上修复）
>
> Github问题：[【远程游玩】串流时无声音 #6606](https://github.com/ValveSoftware/steam-for-linux/issues/6606)

<!--more-->

幸运的是，我们可以使用PipeWire来解决这个问题。

本质上，我们需要[创建一个新的PipeWire虚拟设备，将真实的输入和输出合并为一个新的输入](https://superuser.com/questions/1675877/how-to-create-a-new-pipewire-virtual-device-that-to-combines-an-real-input-and-o)。

这里有两个简单的脚本来帮助你完成：

- enable_virtual_mic.sh

```bash
#!/usr/bin/bash
pactl load-module module-null-sink media.class=Audio/Sink sink_name=my-combined-sink channel_map=stereo
pactl load-module module-null-sink media.class=Audio/Source/Virtual sink_name=my-virtualmic channel_map=front-left,front-right
pw-link easyeffects_sink:monitor_FL my-combined-sink:playback_FL
pw-link easyeffects_sink:monitor_FR my-combined-sink:playback_FR
pw-link easyeffects_source:capture_FL my-combined-sink:playback_FL
pw-link easyeffects_source:capture_FR my-combined-sink:playback_FR
pw-link my-combined-sink:monitor_FL my-virtualmic:input_FL
pw-link my-combined-sink:monitor_FR my-virtualmic:input_FR
```

- disable_virtual_mic.sh

```bash
#!/usr/bin/bash
pactl unload-module module-null-sink
```

然后静音你的麦克风（如果不需要），并将麦克风设备切换到这个新的虚拟设备。

享受吧 🙂