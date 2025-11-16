---
title: "Steam for Linux no sound when streaming"
pubDate: "2022-05-30"
description: "Fix Steam Link streaming sound issue on Linux using pipewire virtual device."
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "PipeWire", "Steam", "Steam Link"]
---

> When I use Steam Link to play my game which is running in my ArchLinux PC, I find steam only catch microphone and ignore the sound output of PC. (Fixed on my ArchLinux PC at 2022-09-15)
>
> Github Issue: [[Remote Play] No sound when streaming #6606](https://github.com/ValveSoftware/steam-for-linux/issues/6606)

<!--more-->

But lucky, we can use pipewire to solve it.

Basically, we need [create a new pipewire virtual device that to combines an real input and output into a new input](https://superuser.com/questions/1675877/how-to-create-a-new-pipewire-virtual-device-that-to-combines-an-real-input-and-o).

There are two simply script to help you do it.

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

And then mute your microphone(if you not need) and switch microphone device to the new virtual device.

Enjoy 🙂
