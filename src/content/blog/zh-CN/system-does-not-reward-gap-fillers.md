---
source_hash: "ed6d68ae"
source_lang: "zh"
target_lang: "zh-CN"
lang: "zh-CN"
is_copy: true
title: "系统不奖励补缝的人"
pubDate: "2026-11-06T18:17:39+08:00"
description: "前端思维、责任倒置与收入回报不对等：在组件边缘行走，计算机行业为什么惩罚不造轮子的人，开源为什么会被 AI 贡献冲击。"
author: "xz-dev"
category: "随想"
tags: ["开源", "思考", "AI", "系统工程", "责任倒置", "职业", "不重复造轮子", "结构性失败"]
---

> 前端思维、责任倒置与收入回报不对等
>
> 又名，在组件边缘行走，计算机行业为什么惩罚不造轮子的人
>
> 又名，开源为什么会被 AI 贡献冲击

## 在边缘行走

<details>
<summary>我给别人的项目提过的 201 个 PR（点击展开）</summary>

[Mojo-Webqq #255](https://github.com/hexsum/Mojo-Webqq/pull/255)、[Mojo-Webqq #261](https://github.com/hexsum/Mojo-Webqq/pull/261)、[Mojo-Webqq #276](https://github.com/hexsum/Mojo-Webqq/pull/276)、[docker #6](https://github.com/fuck-xuexiqiangguo/docker/pull/6)、[Install-Lion #2](https://github.com/dadaewq/Install-Lion/pull/2)、[QvPlugin-Command #5](https://github.com/Qv2ray/QvPlugin-Command/pull/5)、[Magisk #4613](https://github.com/topjohnwu/Magisk/pull/4613)、[ATLauncher #507](https://github.com/ATLauncher/ATLauncher/pull/507)、[ATLauncher #511](https://github.com/ATLauncher/ATLauncher/pull/511)、[Android-Architecture-knowledge-2- #4](https://github.com/Timdk857/Android-Architecture-knowledge-2-/pull/4)、[bilimiao2 #8](https://github.com/10miaomiao/bilimiao2/pull/8)、[magisk-unifiednlp-aosp-enabler #2](https://github.com/misaka4e21/magisk-unifiednlp-aosp-enabler/pull/2)、[download-navi #263](https://github.com/TachibanaGeneralLaboratories/download-navi/pull/263)、[bilimiao2 #17](https://github.com/10miaomiao/bilimiao2/pull/17)、[bilimiao2 #18](https://github.com/10miaomiao/bilimiao2/pull/18)、[NewPipeExtractor #936](https://github.com/TeamNewPipe/NewPipeExtractor/pull/936)、[LibreTube #3624](https://github.com/libre-tube/LibreTube/pull/3624)、[LibreTube #3632](https://github.com/libre-tube/LibreTube/pull/3632)、[linux-enable-ir-emitter #104](https://github.com/EmixamPP/linux-enable-ir-emitter/pull/104)、[oiledmachine-overlay #81](https://github.com/orsonteodoro/oiledmachine-overlay/pull/81)、[distrobox #886](https://github.com/89luca89/distrobox/pull/886)、[AM #58](https://github.com/ivan-hc/AM/pull/58)、[AM #59](https://github.com/ivan-hc/AM/pull/59)、[ansible-runner #1306](https://github.com/ansible/ansible-runner/pull/1306)、[restic-android #199](https://github.com/lhns/restic-android/pull/199)、[bilimiao2 #67](https://github.com/10miaomiao/bilimiao2/pull/67)、[QLDependency #50](https://github.com/FlechazoPh/QLDependency/pull/50)、[Get_JDCookie #5](https://github.com/huaisha1224/Get_JDCookie/pull/5)、[config #210](https://github.com/armbian/config/pull/210)、[CachyOS-kernels #13](https://github.com/Szowisz/CachyOS-kernels/pull/13)、[CachyOS-kernels #14](https://github.com/Szowisz/CachyOS-kernels/pull/14)、[grpc-rust #1692](https://github.com/grpc/grpc-rust/pull/1692)、[displaycal-py3 #380](https://github.com/eoyilmaz/displaycal-py3/pull/380)、[distrobox #1455](https://github.com/89luca89/distrobox/pull/1455)、[eselect-llvm #3](https://github.com/Infrasonics/eselect-llvm/pull/3)、[stickerpicker #78](https://github.com/maunium/stickerpicker/pull/78)、[bilimiao2 #160](https://github.com/10miaomiao/bilimiao2/pull/160)、[xarblu-overlay #507](https://github.com/xarblu/xarblu-overlay/pull/507)、[InfiniTime #2143](https://github.com/InfiniTimeOrg/InfiniTime/pull/2143)、[distrobox #1622](https://github.com/89luca89/distrobox/pull/1622)、[hev-socks5-tunnel #208](https://github.com/heiher/hev-socks5-tunnel/pull/208)、[hev-socks5-tunnel #219](https://github.com/heiher/hev-socks5-tunnel/pull/219)、[LibreChat #7584](https://github.com/LibreChat-AI/LibreChat/pull/7584)、[AM #1589](https://github.com/ivan-hc/AM/pull/1589)、[NCM-Downloader #14](https://github.com/xxynet/NCM-Downloader/pull/14)、[installkernel-gentoo #36](https://github.com/projg2/installkernel-gentoo/pull/36)、[GradleAndroidRustPlugin #10](https://github.com/MatrixDev/GradleAndroidRustPlugin/pull/10)、[GradleAndroidRustPlugin #11](https://github.com/MatrixDev/GradleAndroidRustPlugin/pull/11)、[kernel-patches #132](https://github.com/CachyOS/kernel-patches/pull/132)、[kvm-guest-drivers-windows #1473](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1473)、[kvm-guest-drivers-windows #1474](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1474)、[kvm-guest-drivers-windows #1475](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1475)、[kvm-guest-drivers-windows #1479](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1479)、[virtio-win-guest-tools-installer #85](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/85)、[kernel-patches #135](https://github.com/CachyOS/kernel-patches/pull/135)、[distrobox #1982](https://github.com/89luca89/distrobox/pull/1982)、[distrobox #1987](https://github.com/89luca89/distrobox/pull/1987)、[virtio-win-guest-tools-installer #87](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/87)、[virtio-win-guest-tools-installer #88](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/88)、[GradleAndroidRustPlugin #14](https://github.com/MatrixDev/GradleAndroidRustPlugin/pull/14)、[zram-init #57](https://github.com/vaeth/zram-init/pull/57)、[zram-init #59](https://github.com/vaeth/zram-init/pull/59)、[rclone #1](https://github.com/mikegillan/rclone/pull/1)、[kvm-guest-drivers-windows #1536](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1536)、[kvm-guest-drivers-windows #1537](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1537)、[SillyTavern #5309](https://github.com/SillyTavern/SillyTavern/pull/5309)、[SillyTavern #5316](https://github.com/SillyTavern/SillyTavern/pull/5316)、[SillyTavern #5333](https://github.com/SillyTavern/SillyTavern/pull/5333)、[SillyTavern #5334](https://github.com/SillyTavern/SillyTavern/pull/5334)、[AM #2176](https://github.com/ivan-hc/AM/pull/2176)、[AM #2177](https://github.com/ivan-hc/AM/pull/2177)、[SillyTavern #5351](https://github.com/SillyTavern/SillyTavern/pull/5351)、[python-evdev #251](https://github.com/gvalkov/python-evdev/pull/251)、[freebsd-src #2116](https://github.com/freebsd/freebsd-src/pull/2116)、[guru #1](https://github.com/d3finit/guru/pull/1)、[rclone #2](https://github.com/timerring/rclone/pull/2)、[reframe #25](https://github.com/AlynxZhou/reframe/pull/25)、[reframe #26](https://github.com/AlynxZhou/reframe/pull/26)、[hermes-webui #2189](https://github.com/nesquena/hermes-webui/pull/2189)、[hermes-webui #2190](https://github.com/nesquena/hermes-webui/pull/2190)、[honcho #689](https://github.com/plastic-labs/honcho/pull/689)、[opencode-models-discovery #3](https://github.com/yuhp/opencode-models-discovery/pull/3)、[plannotator #805](https://github.com/backnotprop/plannotator/pull/805)、[OmniRoute #2975](https://github.com/cheaper-inference/OmniRoute/pull/2975)、[OmniRoute #3064](https://github.com/cheaper-inference/OmniRoute/pull/3064)、[plannotator #843](https://github.com/backnotprop/plannotator/pull/843)、[OmniRoute #3094](https://github.com/cheaper-inference/OmniRoute/pull/3094)、[OmniRoute #3146](https://github.com/cheaper-inference/OmniRoute/pull/3146)、[OmniRoute #3188](https://github.com/cheaper-inference/OmniRoute/pull/3188)、[OmniRoute #3422](https://github.com/cheaper-inference/OmniRoute/pull/3422)、[OmniRoute #4293](https://github.com/cheaper-inference/OmniRoute/pull/4293)、[OmniRoute #4359](https://github.com/cheaper-inference/OmniRoute/pull/4359)、[neomacs #134](https://github.com/eval-exec/neomacs/pull/134)、[neomacs #135](https://github.com/eval-exec/neomacs/pull/135)、[neomacs #136](https://github.com/eval-exec/neomacs/pull/136)、[neomacs #137](https://github.com/eval-exec/neomacs/pull/137)、[neomacs #138](https://github.com/eval-exec/neomacs/pull/138)、[pi-hindsight #444](https://github.com/luxus/pi-hindsight/pull/444)、[pi-honcho-memory #16](https://github.com/agneym/pi-honcho-memory/pull/16)、[pi-mcp-adapter #159](https://github.com/nicobailon/pi-mcp-adapter/pull/159)、[OmniRoute #6322](https://github.com/cheaper-inference/OmniRoute/pull/6322)、[OmniRoute #6323](https://github.com/cheaper-inference/OmniRoute/pull/6323)、[OmniRoute #6330](https://github.com/cheaper-inference/OmniRoute/pull/6330)、[OmniRoute #6336](https://github.com/cheaper-inference/OmniRoute/pull/6336)、[OmniRoute #6702](https://github.com/cheaper-inference/OmniRoute/pull/6702)、[OmniRoute #6714](https://github.com/cheaper-inference/OmniRoute/pull/6714)、[OmniRoute #6727](https://github.com/cheaper-inference/OmniRoute/pull/6727)、[pi-subagents #136](https://github.com/tintinweb/pi-subagents/pull/136)、[pi-subagents #139](https://github.com/tintinweb/pi-subagents/pull/139)、[OmniRoute #7004](https://github.com/cheaper-inference/OmniRoute/pull/7004)、[OmniRoute #7012](https://github.com/cheaper-inference/OmniRoute/pull/7012)、[OmniRoute #7027](https://github.com/cheaper-inference/OmniRoute/pull/7027)、[pi-mcp-adapter #181](https://github.com/nicobailon/pi-mcp-adapter/pull/181)、[pi #6697](https://github.com/earendil-works/pi/pull/6697)、[pi #6764](https://github.com/earendil-works/pi/pull/6764)、[pi-subagents #153](https://github.com/tintinweb/pi-subagents/pull/153)、[pi-subagents #154](https://github.com/tintinweb/pi-subagents/pull/154)、[OmniRoute #7673](https://github.com/cheaper-inference/OmniRoute/pull/7673)、[OmniRoute #7700](https://github.com/cheaper-inference/OmniRoute/pull/7700)、[OmniRoute #7747](https://github.com/cheaper-inference/OmniRoute/pull/7747)、[OmniRoute #7776](https://github.com/cheaper-inference/OmniRoute/pull/7776)、[OmniRoute #7843](https://github.com/cheaper-inference/OmniRoute/pull/7843)、[pi-subagents #169](https://github.com/tintinweb/pi-subagents/pull/169)、[OmniRoute #8367](https://github.com/cheaper-inference/OmniRoute/pull/8367)、[pi-subagents #173](https://github.com/tintinweb/pi-subagents/pull/173)、[pi-tasks #42](https://github.com/tintinweb/pi-tasks/pull/42)、[pi-subagents #180](https://github.com/tintinweb/pi-subagents/pull/180)、[OmniRoute #8908](https://github.com/cheaper-inference/OmniRoute/pull/8908)、[pi-hermes-memory #140](https://github.com/chandra447/pi-hermes-memory/pull/140)、[pi-subagents #191](https://github.com/tintinweb/pi-subagents/pull/191)、[pi-hermes-memory #141](https://github.com/chandra447/pi-hermes-memory/pull/141)、[pi-hermes-memory #142](https://github.com/chandra447/pi-hermes-memory/pull/142)、[OmniRoute #9199](https://github.com/cheaper-inference/OmniRoute/pull/9199)、[OmniRoute #9205](https://github.com/cheaper-inference/OmniRoute/pull/9205)、[pi-subagents #198](https://github.com/tintinweb/pi-subagents/pull/198)、[OmniRoute #9262](https://github.com/cheaper-inference/OmniRoute/pull/9262)、[OmniRoute #9290](https://github.com/cheaper-inference/OmniRoute/pull/9290)、[OmniRoute #9313](https://github.com/cheaper-inference/OmniRoute/pull/9313)、[OmniRoute #9329](https://github.com/cheaper-inference/OmniRoute/pull/9329)、[pi-intercom #87](https://github.com/nicobailon/pi-intercom/pull/87)、[OmniRoute #9555](https://github.com/cheaper-inference/OmniRoute/pull/9555)、[OmniRoute #9569](https://github.com/cheaper-inference/OmniRoute/pull/9569)、[pi-subagents #839](https://github.com/nicobailon/pi-subagents/pull/839)、[pi-hermes-memory #165](https://github.com/chandra447/pi-hermes-memory/pull/165)、[OmniRoute #9788](https://github.com/cheaper-inference/OmniRoute/pull/9788)、[pi-subagents #922](https://github.com/nicobailon/pi-subagents/pull/922)、[OmniRoute #9983](https://github.com/cheaper-inference/OmniRoute/pull/9983)、[OmniRoute #10066](https://github.com/cheaper-inference/OmniRoute/pull/10066)、[codebase-memory-mcp #1530](https://github.com/DeusData/codebase-memory-mcp/pull/1530)、[OmniRoute #10072](https://github.com/cheaper-inference/OmniRoute/pull/10072)、[pi-honcho-memory #21](https://github.com/agneym/pi-honcho-memory/pull/21)、[OmniRoute #10079](https://github.com/cheaper-inference/OmniRoute/pull/10079)、[pi-subagents #973](https://github.com/nicobailon/pi-subagents/pull/973)、[OmniRoute #10123](https://github.com/cheaper-inference/OmniRoute/pull/10123)、[OmniRoute #10125](https://github.com/cheaper-inference/OmniRoute/pull/10125)、[OmniRoute #10127](https://github.com/cheaper-inference/OmniRoute/pull/10127)、[OmniRoute #10162](https://github.com/cheaper-inference/OmniRoute/pull/10162)、[pi-caveman #15](https://github.com/jonjonrankin/pi-caveman/pull/15)、[OmniRoute #10243](https://github.com/cheaper-inference/OmniRoute/pull/10243)、[OmniRoute #10247](https://github.com/cheaper-inference/OmniRoute/pull/10247)、[pi-subagents #1141](https://github.com/nicobailon/pi-subagents/pull/1141)、[pi-hermes-memory #189](https://github.com/chandra447/pi-hermes-memory/pull/189)、[pi-subagents #1214](https://github.com/nicobailon/pi-subagents/pull/1214)、[rpiv-mono #174](https://github.com/juicesharp/rpiv-mono/pull/174)、[OmniRoute #10712](https://github.com/cheaper-inference/OmniRoute/pull/10712)、[OmniRoute #10716](https://github.com/cheaper-inference/OmniRoute/pull/10716)、[OmniRoute #10723](https://github.com/cheaper-inference/OmniRoute/pull/10723)、[OmniRoute #10806](https://github.com/cheaper-inference/OmniRoute/pull/10806)、[deno #36644](https://github.com/denoland/deno/pull/36644)、[pi-subagents #1297](https://github.com/nicobailon/pi-subagents/pull/1297)、[pi-hermes-memory #191](https://github.com/chandra447/pi-hermes-memory/pull/191)、[pi-hermes-memory #192](https://github.com/chandra447/pi-hermes-memory/pull/192)、[OmniRoute #10953](https://github.com/cheaper-inference/OmniRoute/pull/10953)、[OmniRoute #10963](https://github.com/cheaper-inference/OmniRoute/pull/10963)、[sub2api #6139](https://github.com/Wei-Shaw/sub2api/pull/6139)、[CLIProxyAPI #5246](https://github.com/router-for-me/CLIProxyAPI/pull/5246)、[CLIProxyAPI #5247](https://github.com/router-for-me/CLIProxyAPI/pull/5247)、[CLIProxyAPI #5264](https://github.com/router-for-me/CLIProxyAPI/pull/5264)、[EternalTerminal #1](https://github.com/bmaurer/EternalTerminal/pull/1)、[pi-subagents #1747](https://github.com/nicobailon/pi-subagents/pull/1747)、[EternalTerminal #803](https://github.com/MisterTea/EternalTerminal/pull/803)、[wenai #1](https://github.com/Straniero44/wenai/pull/1)、[tproxy-config #36](https://github.com/tun2proxy/tproxy-config/pull/36)、[sub2api #7215](https://github.com/Wei-Shaw/sub2api/pull/7215)、[sub2api #7217](https://github.com/Wei-Shaw/sub2api/pull/7217)、[rpiv-mono #241](https://github.com/juicesharp/rpiv-mono/pull/241)、[honk #5](https://github.com/Zakkaus/honk/pull/5)、[neomacs #412](https://github.com/eval-exec/neomacs/pull/412)、[rpiv-mono #262](https://github.com/juicesharp/rpiv-mono/pull/262)、[CLIProxyAPI #6189](https://github.com/router-for-me/CLIProxyAPI/pull/6189)、[gpt-with-taste #6](https://github.com/NB-Corp/gpt-with-taste/pull/6)、[sub2api #8191](https://github.com/Wei-Shaw/sub2api/pull/8191)、[cpa-quota-estimator #4](https://github.com/Autsunset/cpa-quota-estimator/pull/4)、[CLIProxyAPI #6760](https://github.com/router-for-me/CLIProxyAPI/pull/6760)、[sub2api #8302](https://github.com/Wei-Shaw/sub2api/pull/8302)、[aisix #1370](https://github.com/api7/aisix/pull/1370)、[aisix #1387](https://github.com/api7/aisix/pull/1387)、[youki #3862](https://github.com/youki-dev/youki/pull/3862)、[youki #3866](https://github.com/youki-dev/youki/pull/3866)、[youki #3867](https://github.com/youki-dev/youki/pull/3867)、[honk #450](https://github.com/daeuniverse/honk/pull/450)。

</details>

我喜欢这种修复我每天用的东西并造福所有人的感觉，而且我总以为我做的够多，就能回报的更多，比如赚的越多，或者在开源社区里越出名来获得更好的岗位。但是很不幸，我逐渐意识到，我的劳动，成了他人的垫脚石，而我的名字，消失的悄无声息。

这对我这个热爱开源的人来说，这仿佛就是开源社区在伤害彼此。一个人为兼容性，边缘情况，自己需要的功能做的越多，就越失败，而项目主就越成功。我不怀疑别人成功，但是不禁让我开始反思，那我做这个，只是为了不包括我在内的人类吗。

<!--more-->

对于我这个从写代码第一天开始就接触开源的人来说，探索开源越早就会越失败，这简直颠覆三观。但是，当我深入思考，并不是开源的问题，是计算机界的结构倒置。而这种结构倒置，从根本上损毁任何建立在计算机软件上的社区，也导致造轮子成了所有人最常听见的词语。

## 在组件边缘行走

### “不重复造轮子”

不造轮子，就是复用组件。复用得越多，组件和组件之间的接缝就越多。系统被按岗位分工切开了，但问题不会沿着岗位的边界发生。

越喜欢复用，就越“全干”；越全干，就越不精。但我认为能全干自然是优势，因为这意味着你可以在大多数维度上学习、深入，并解决问题。广度不只是避免重复劳动，还能避免因为广度不足导致的问题。比如一个 Java 程序员能背诵 JVM 优化，但对于操作系统如何调度 JVM 本身毫无研究，结果在无效的路径上反复优化。

而不重置造轮子的极致，便是虚拟化，我梦想可以实现跨硬件的联机单一操作系统的虚拟化。而这意味着，我什么都需要做点，所以什么都需要学点。

### 修得越多便能修得更多

在几年前，我还在充分参与 Android 应用和 Home Assistant 的开源软件建设，那时候，我只是默默背诵“开源有 bug 才好，说明每个人都能实现自己的功能，所以才有 bug 而且还能自己修复”，那时候的我还满怀希望，只是困惑为什么开源软件总有修不完而且显而易见的 bug 和功能缺失，一群人提 issue 但是没有人去动手。

比如 NewPipe 的评论回复，[2019 年就有人提了](https://github.com/TeamNewPipe/NewPipe/issues/2277)，我在 2022 年写了 [NewPipe #9020](https://github.com/TeamNewPipe/NewPipe/pull/9020)（后来挪到 [#9410](https://github.com/TeamNewPipe/NewPipe/pull/9410)），以及配套显示回复数的 [NewPipeExtractor #936](https://github.com/TeamNewPipe/NewPipeExtractor/pull/936)；Syncthing-Fork 里让网络请求走指定网络的 [syncthing-android #914](https://github.com/researchxxl/syncthing-android/commit/1391d0aa1a3b5c2b4d0c58879af94596185c14a7)；LibreTube 里看评论时也能操作播放器的 [LibreTube #3624](https://github.com/libre-tube/LibreTube/pull/3624)；还有 Home Assistant 的蓝牙设备追踪在新版 Python 上用不了，我提了 [core #108513](https://github.com/home-assistant/core/pull/108513)，[对应的 issue](https://github.com/home-assistant/core/issues/89119) 下面有 123 条评论。

然后我很快就要开始在下一年开始发现，作为 Linux 开发者看见 Linux 的混乱以及为什么大厂都会拥有自己的 fork。

和红帽的 PR 是从 Ansible 开始的，原因也很偶然，因为 RHCE 需要考 Ansible，于是我在学习中顺利的发现了 Ansible 运行管道命令无法退出的问题，在排查后得到了 [ansible-runner #1306](https://github.com/ansible/ansible-runner/pull/1306)。

然后后来不可变发行版火了，我觉得容器化用在实际开发中确实不错，于是我尝试了 distrobox，然后成功的开始修复 distrobox（Alpine 下写错的包名 [distrobox #886](https://github.com/89luca89/distrobox/pull/886)，Gentoo Stage3 镜像初始化装包失败 [#1455](https://github.com/89luca89/distrobox/pull/1455)，distrobox-init 里 runtime sync 的回退会吞掉错误 [#1622](https://github.com/89luca89/distrobox/pull/1622)，还有 rootless 加 `--pid host` 时 `podman stop`、`rm` 会超时的绕行方案 [#1982](https://github.com/89luca89/distrobox/pull/1982)，2026 年 1 月提交，到现在还开着），最终修到了 podman 和 runc/crun/youki（issue：[podman #30078](https://github.com/podman-container-tools/podman/issues/30078)；PR：[podman #30079](https://github.com/podman-container-tools/podman/pull/30079)、[container-libs #1307](https://github.com/podman-container-tools/container-libs/pull/1307)、[crun #2427](https://github.com/containers/crun/pull/2427)、[runc #5594](https://github.com/opencontainers/runc/pull/5594)、[youki #3862](https://github.com/youki-dev/youki/pull/3862)）。

然后后来，结束了在 Klavis AI 工作的年头，我决定再次沉下心学习虚拟化，于是我看到了半虚拟化技术，不知怎么的，我就想安装一个半虚拟化的 Windows，然后我就开始了为期一年的 virtio-win 修复。这一年提的 PR：[kvm-guest-drivers-windows #1473](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1473)、[kvm-guest-drivers-windows #1474](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1474)、[kvm-guest-drivers-windows #1475](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1475)、[kvm-guest-drivers-windows #1479](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1479)、[virtio-win-guest-tools-installer #85](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/85)、[virtio-win-guest-tools-installer #87](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/87)、[virtio-win-guest-tools-installer #88](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/88)、[kvm-guest-drivers-windows #1536](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1536)、[kvm-guest-drivers-windows #1537](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1537)、[virtio-win-guest-tools-installer #108](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/108)、[virtio-win-guest-tools-installer #109](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/109)。

它们大多不是追求极致性能时才会碰到的边角问题，而是失败清理、状态真实性、终端语义这些基本契约：

- [kvm-guest-drivers-windows #1473](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1473)：初始化失败的错误路径里，日志反而访问了还没赋值的成员指针。本来应该报告失败，结果报告失败本身又出了错。
- [kvm-guest-drivers-windows #1475](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1475)：framebuffer 初始化失败后，已经创建的资源和 ID 没有被完整回收。
- [virtio-win-guest-tools-installer #87](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/87)：维护模式里，界面显示新功能已经装好，实际的文件和服务却没有部署。
- [ansible-runner #1306](https://github.com/ansible/ansible-runner/pull/1306)：把“有输入文件描述符”误当成“需要 TTY”，重定向输出时错误地进入了交互行为。2023 年 9 月提交，2026 年 2 月才合并。
- [podman #30079](https://github.com/podman-container-tools/podman/pull/30079)：去年的一个 bug，终于因为它有了头绪。

这些问题都卡在连接处：Ansible 的输入输出语义和容器的 TTY 分配之间，安装器的界面状态和提权后的实际安装之间，容器引擎、运行时和 cgroup 的行为之间。每一部分都可能有人负责，但“把这几部分连起来，追到真正的原因，再修到上游”，太难有人完整承担。我一直以来习惯做的，正是这段工作，但是我并不享受这种工作，因为它让我感到折磨，没有人为你发工资，而且做的越多你的简历看起来就越像 SRE、全栈，似乎开始越来越证明你就是一个肤浅的程序员。

但是，因为我需要用，我又不得不做。我的下游分支 [xz-dev/pi](https://github.com/xz-dev/pi) 也是这么来的。“这是我第一次如此讨厌一个我喜欢的工具，所以我 fork 了它。”Pi 官方处理社区贡献、修复 bug 都很慢，又总是说“不”，起源是 [Issue #6234](https://github.com/earendil-works/pi/issues/6234) 里的一次冲突。我分出来，就是因为工作途中发消息，没法及时中断当前的执行，按 Esc 也中止不了卡住的钩子和流式响应。以及其他的很多很多修复，但是这次我真正累了，我有上游 pi 的直接 PR 和 issues 的权限，但是我屈服了，我意识到，我之前所做的所感到痛苦的，是因为我是传话筒，在社区里传话筒往往最后会被赋予“协调人”的光荣身份，然后被被迫成体系的剥削。所以这次，我尝试另一个方式，就是放在这，让别人做。而这也是大厂作为一个企业所做的，可以开源可以贡献上游，但是补丁先上线自己项目。

> All patches in this fork are free to submit upstream directly, or to use as a reference for your own upstream PR. I waive any code ownership over these downstream patches; please credit this repository as the source in your PR.
>
> It tracks upstream main with a minimal downstream patch stack, using downstream-fork-maintain-skill as the blueprint for ongoing maintenance.

因为我意识到，如果我还留有希望去继续开发，那么我就不能是协调人。

### 软件开发与操作系统的割裂

我是被迫从后端开始工作的，但是我一直都安慰自己，熟悉软件开发，才以后更懂操作系统是为什么如此设计。所以逐渐的我看到了这个巨大的割裂。

在软件开发里，进程确实可以自己管，因为代码都是自己写的，你可以细致的管理好几乎一切，而且大家都真的以为操作系统会处理兜底。但大部分人对操作系统的了解并不深入，也就是说，他对自己的软件运行在什么样的环境里，其实并不知道很多。

而运维每天看到进程泄露或者软件低效，他不会以为这是需要优化的，或者他没有能力修复：第一，他不是开发，不了解细节；其次，大部分运维能力不足（运维能力不足是接下来要讲的这个结构性问题的另一面），而且公司也不给资源去做。

所以就变成了：写代码的不清楚具体运行的时候发生了什么，而知道运行状态的不知道具体细节。我上班的体验也是这样：很多程序员知道、背诵、感觉或者猜测自己程序运行的环境，但是基本没有正确的感觉，对于一个函数到底应该跑多久，谁也无法给一个估算。

维护的人不会写，写的人不会维护。

[Podman #30078](https://github.com/podman-container-tools/podman/issues/30078) 是一个具体的例子：

1. 使用 `--pid=host`，没有私有的 PID namespace 作为整体清理的边界；
2. rootless 场景下创建 cgroup 失败，但运行时允许在某些条件下忽略这个失败，继续启动；
3. 停止时又依赖 cgroup 给整个工作负载发信号，而没有 cgroup 路径时，相关的函数直接返回成功；
4. 上层等待退出，最后超时，进程仍然可能活着。

错误是显而易见的，修复方式也是显而易见的，可以说这只是一个 crun 这类大项目在漫长的开发周期中的遗漏。吗？

再往下一层，Linux 内核至今没有一种不依赖 PID namespace 和 cgroup、像 FreeBSD 那样按 reaper 管理后代的方式。FreeBSD 的 [`procctl(PROC_REAP_KILL)`](https://man.freebsd.org/cgi/man.cgi?query=procctl&sektion=2&format=html) 可以给 reaper 管理的后代发送指定的信号，也可以只选直接子进程或者某个子树。Linux 这边，[`PR_SET_CHILD_SUBREAPER`](https://man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html) 主要解决孤儿进程重新归属、退出通知和 `wait()` 回收；进程组不是后代树；[pidfd](https://man7.org/linux/man-pages/man2/pidfd_send_signal.2.html) 解决的是目标身份稳定，避免 PID 复用导致误发信号；[`cgroup.kill`](https://docs.kernel.org/admin-guide/cgroup-v2.html) 管的是 cgroup 子树，只能发 `SIGKILL`，范围也不是按进程血缘决定的。这也不是写一个递归遍历就能补齐的：应用掌握自己的源码，却管不住第三方子进程、并发 fork 和重新归属这些生命周期变化。

`cgroup.kill` 本身甚至就是后来才加上的，[2021 年](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit?id=661ee6280931548f7b3b887ad26a157474ae5ac4)进入 Linux 5.14 这一代。加上以后也没有结束：[2025 年](https://github.com/torvalds/linux/commit/b69bb476dee99d564d65d418e9a20acca6f32c3f)还在修 fork 和 `cgroup.kill` 之间的竞态，[2026 年](https://github.com/torvalds/linux/commit/8e359920216689b3b79e0fe8961a77fe312a511f)又修了 `CLONE_INTO_CGROUP` 的子进程被误杀的问题。

我一直觉得，Linux 驱动、bug 修复、性能优化什么的都能很快完善，而进程管理这些卡在中间的细节，完全没人搭理，也没人有意愿推动。说得更准确一点：子系统内部、归属明确的问题，和跨组件、缺少共同验收条件的问题，推动的路径根本不一样。

这种割裂至少有三层：

- **知识的割裂**：知道业务意图的人，不一定知道运行时的进程、信号、资源和故障语义；看到运行症状的人，不一定知道产生它的代码路径。
- **权限的割裂**：能看到泄漏的人，未必能修改源码、发布版本或者改变运行环境；能改代码的人，未必接触得到真实的故障现场。
- **激励的割裂**：交付功能有直接的验收，修复跨层的生命周期却需要好几个项目和团队配合，收益还分散给了未来的维护者和其他用户。

最危险的状态不是没有任何人负责，而是每一层都有人负责，却没有人负责证明这些层组合起来仍然正确。信息、能力、权限和责任，没有落在同一个闭环里。所以把这类问题交给开发或者运维任何一方，都不自然构成解决方案：前者可能只被要求对功能负责，后者却被要求对一个自己无法充分改变的系统负责。运维能力不足会加重问题，但即使换成优秀的运维，缺少研发时间、修改权限和跨项目推动的资源，也不会自动获得解决它的条件。

所以很多时候，我们会看见冒烟测试，但是这只能表达“我启动了它”，不等于整个系统已经能表达并兑现“它和它产生的所有工作，都由我负责到结束”。接缝变成弱点，不只是因为某个接口缺失，更是因为接口、运行环境和组织分工之间，缺少一条可验证的生命周期责任链。而且更加致命的是，其实这是有解决方案的，就是 Netflix 提出的混沌测试，但是要正确设计混沌测试本身，就需要这种长期在“接缝”工作的能力，但是事实上，综上，计算机界并不奖励培养这种能力的行为，所以这变成了一个鸡生蛋问题。

### 重要的缝隙往往不会显而易见

virtio-win 的 [issue #765](https://github.com/virtio-win/kvm-guest-drivers-windows/issues/765) 是另一个证明。它 2022 年 5 月开出来，到现在还没关，下面有 33 条评论，报告的版本从 0.1.215 一直到 0.1.271。报告的人各自想办法绕过去：用微软的疑难解答工具强行卸载，把系统盘临时改成 SATA，手动右键安装 INF，取消勾选某个组件，或者干脆退回 0.1.248。问题绕过去了，出错的现场也就没了。参与排查的人 2022 年就回复说复现不出来，请大家提供日志；2026 年 2 月分析了一份日志，还是不知道原因，在一台全新的 Win2025 上从头安装再升级，也没有复现出来。

我给它提了 [PR #85](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/85)，可写完以后，我自己也复现不出来了。后来使用 GPT 和 Claude 在虚拟机上一个个复现，花了昼夜不停的3天，才找到触发条件：其中一个是机器上有过一次被中断的旧安装，而全新的测试机恰恰没有这段历史；其他的失败还取决于设备安装策略、隐藏的子设备、被新 INF 改写的服务，以及 x86 驱动包的签名。维护者隔了半年回复，说他们也试过类似的方案，遇到过不能正确工作的情况，决定先放着，PR 继续开着。

所以，这个接缝处的问题在于：

1. 没有真正可能可以覆盖所有情况的规范，所以在不同系统里可能千奇百怪；
2. 遇到的时候一般是运维或者交付先发现，如果真的还能传导到开发，可能信息失真，或者早就遗失了原始环境，也就是通过别的手段临时修好了，但是也无法还原错误环境了；
3. 修好它是修 bug，只会是一种“弥补”，而非效益；
4. 修复它的责任大于所得，因为这只是一个“维护”，所以得到的回报远远小于开发一个原型或者“大型系统”的价值；
5. 修复它们往往不简单，或者说需要本身经验的积累、学识的积累和修复调试时间。

Eries 也说过：“毕竟人接收知识的速度是有限的。”

## 前端思维

我说的“前端思维”，不是指前端这个职业，而是一种做事的方式：不从正确实现的角度解决问题，而是被企业推着做的唯业务实现，用看得见的成功路径，代替完整的实现。

完成的标准被悄悄缩成了：按钮能点，接口能通，演示成功，所以功能完成。而真正决定软件能不能被托付的那些问题，被留给了别人：中途失败以后状态是什么？能不能安全重试？取消是不是真的停止了？资源由谁释放？用户怎样确认结果？性能退化以后谁来承担成本？

把问题盖住的修复，也一样能通过验收。virtio-win 的官方安装器，在设备安装策略限制或者部分升级的情况下会返回成功，设备却没有装上驱动，因为安装和卸载的错误被吞掉了。

红帽这种大的 SRE 企业也遗漏了很多很多，至少连我都能遇到这么多陈年而且显而易见的问题。看看我那些运维工具的修复，还有虚拟化相关的修复就知道了。

现在有了 AI，前端可以写后端了，情况就更加糟糕：性能根本远离了计算机优化的方向。AI 网关这类运维项目，就只剩下崩溃和凑合，还有一堆人看着、跟着一个前端写的垃圾项目；大部分企业说 AI 重要，却连 AI 网关都没有稳定的渠道。

所以我觉得，因为 AI 普及，计算机行业正在快速暴露一种以“责任倒置”为根因的“前端思维”的大规模腐烂，已经不再是运维和操作系统层面，而是扩大到了业务层。难道我们以后只能期待软件出错时爆出一串 JSON 错误（我前几天打开盒马 APP 的时候惊呆了，整个空白页上只有 json 字符串），因为根本没人测试，也没人思考如何优雅地处理错误；然后用户只能通过 AI 代理操作软件；而软件性能也会烂到真的只有 AI 有耐心使用吗？

[DORA 2026 年关于 AI 的分析](https://dora.dev/insights/balancing-ai-tensions/)也看到了类似的现象：代码生成节省的时间，经常又重新花在了审查和验证上；AI 用得越多，交付吞吐量越高，交付的不稳定性也越高。AI 更像是组织原有能力和缺陷的放大器，而不是自动修好工程体系的工具。危险在于，企业只兑现“写得更快”，却不为“验证更多”付钱，之后再用代理去应付软件的失败：软件难用，就让代理绕路；缺陷暂时不影响成交，修复的优先级就继续下降；软件于是更难用。

问题也不在 JSON 本身。面向程序的结构化错误完全可以是好设计；问题是软件只抛出一个错误，却不交代做了什么、没做什么、状态是否确定、下一步是否安全。所谓优雅地处理错误，不是换一句好听的提示，而是把这些责任完成。现在的软件提供方，越来越容易把没完成的工程责任，包装成用户或者代理应该具备的适应能力。“AI 能替我把它用起来”和“这个软件已经正确实现了”，必须始终是两件事。

而这种“以快为准”的风气，便又催生出“前端思维”的另一个问题，无尽的重复造轮子，而且又因为综上所述，整个系统并不奖励接缝，所以软件开发只能通过造轮子的方式实现。（突然想到 XRay，一个 V2Ray 分支，~~R主席万岁！~~）

## 责任倒置

我把这叫做责任倒置。因为不能直接、直觉上看到它产生收益，就不给这个岗位很多工资和资源；于是这个岗位就没有人愿意深耕；没有人深耕，这一部分就更加糟糕；更糟糕，就更没有人愿意留下来；而没有人深耕，企业也就以为运维就是很垃圾，自然不会花很多钱雇佣。最后的结果就跟 OpenSSL 那样，底层组件腐化了。所有人不是装作没看见，而是真的根本就没人在意，在意的人也无法解决这种问题。

大部分企业更加奇特：给运维的工资一定是最低的。这导致最影响企业、也最重要的那部分，反而没有出足够的钱雇人解决，只是在业务上花更多的钱和精力去弥补。管虚拟化的都是运维，而低价的运维根本不知道如何正确理解虚拟化。我经常抱怨：很多时候感觉 SRE 和业务比例失衡，很多运维工具长期有 bug 未修复。

但我说的不是红帽工资低。红帽不是低工资，问题是围绕着红帽的资源太少了：红帽修不完所有的 bug，而用这些软件的人明显也没有能力去修复，不然不会摆这么多年，一直等到我这种习惯修复系统和系统中间衔接的人去修。一家供应商的工程能力，不能自动覆盖整个下游生态积累的问题。下游也不只是“有没有聪明人”的问题：识别症状、定位跨层原因、写出修复、补上测试、推动上游接受，是不同的能力，还需要时间和组织许可。缺了其中一环，最后往往只剩下重启、配置绕过、固定旧版本。

> 我想这也是为什么 AI 今年给开源软件带来了巨大的“补缝”冲击。

当年给 OpenSSL 筹资的 Steve Marquess [写得很具体](https://veridicalsystems.com/blog/of-money-responsibility-and-pride/)：商业客户愿意为特定的交付付钱，却通常不资助版本管理、代码审查、重构、性能和安全这些基础维护。不是所有人都不知道它重要，而是“依赖它”没有自动变成“为维护它付钱”。

在一个组织里，责任倒置有三层：

1. **收益归功能，成本归维护。** 新功能算项目成绩，之后的故障算运维工作，而不是原来交付的一部分。
2. **承担责任的人缺乏决定权。** 要求运维保证稳定，却不给足够的设计参与权、修复时间，或者阻止不合格发布的权力。
3. **补救成功，反而掩盖了投入不足。** 人工救火和绕路让系统继续运行，管理层看到的是“还能用”，而不是维持“还能用”消耗了多少专业劳动。

回到接缝处的那五点：修好它只是“弥补”；修复它的责任大于所得；而修复它又需要多年的经验、学识和调试时间。所以综上，我们就创造了一个努力大于回报、而且随着积累一定会让人离开，或者被拉着做别的更有经济效益的项目的白领岗位。

这里有两个互相强化的缺口。在生态层面，大量使用者获得收益，少数维护者承担公共维护，投入无法随着依赖规模自动增长；在企业层面，员工因为眼前的交付获得评价，跨层理解、上游修复和长期效率未必得到相应的回报。于是懂得追根究底的人既稀缺，又没有足够的激励持续承担这些工作。AI 再把“让功能先跑起来”变得便宜，就可能进一步拉大这个差距，而不是自动填平它。

> 所以社会/企业对开源社区的剥削其实不是故意的，而是结构化的必然的剥削。因为只有开源维护者有用爱发电的信仰。

## 收入回报不对等

我现在做的这类工作，薪资水平都比不上那些前沿的方向，比如以前的电商移动端开发、Web 开发，现在的 AI。但是现在的 AI 又有我前面说的“前端思维”的问题，而且很多人甚至直接用 AI 替代了脑子，自己根本不知道原理，只知道答案在哪，根本不知道自己在做什么，但是他们得到的钱却比这种工作高。所以这是一种权责不对等，或者说收入回报不对等。

我跟朋友讨论过：公司并不会奖励你更懂技术这些，尽管可能你写得更加高效，但是别人如果也可以做到，公司并不那么在意。因此，我总是调侃，国家应该为我读了专业书籍付费。

不一定是企业没看见技术上的差异，也可能看见了，却没有为它额外付钱的动力。公司买的是“这个岗位把眼前的任务完成”，不是按一个人对计算机的理解深度逐级付费。如果别人用更浅的理解也能通过验收，更深的能力就未必变成薪酬上的差异。而这些改进的收益，可能落在未来接手维护的人身上，落在其他使用同一个上游软件的企业身上，落在还没有发生的故障和容量压力上，落在用户少花的等待、排查和绕路的时间上。这些收益可以是真实的，却不一定回到当前部门的预算，更不一定回到自己的工资。技术价值、企业能取得的价值、个人能获得的报酬，是三个不同的东西。所以不能简单地期待“市场自然会奖励更懂技术的人”。

那“别人也能做到”，究竟做到了哪一步？如果两种实现在真实负载、故障率和维护成本上确实没有重要的差别，公司不为额外的技术深度付钱，是正常的取舍，技术更精巧不自动等于商业上更值得投入。但常见的情况是：只证明两者眼前都能运行，就把它们当成整个生命周期都等价。一个实现需要不断救火，另一个能正确处理失败；一个消耗更多资源，另一个能稳定扩展。如果这些差异最后由运维、用户或者未来的团队承担，当前的交付者就仍然可以被视为“也做到了”。这才让凑合完成有了竞争力：不是它没有成本，而是成本没有算在同一笔账上。

求职也是一样。现在的求职环境期望人进来不需要任何学习就能工作，那自然是希望刚刚好的垂直深度，或者某个候选者的垂直方向够深，让面试官们可以想象他也有能力和意愿在需要的岗位上深挖。越全干，在面试官眼里就越不精。

行业高度依赖跨层理解和长期维护，却没有建立与这种依赖相匹配的投入和回报机制。不是技术没有价值，而是必要的技术价值，没有稳定的付费者和承担者。

## AI 能补缝吗

或许我们会说，AI 来了，AI 可以解决。Eries 跟我开过玩笑，说以后“没人看得懂代码 只有一个 promot 在编译的时候让 AI 直接生成 elf”，我回他：“Linus 说了 AI 是编译器。”

但是任何项目最终都是服务于人的，所以也由人负责。AI 确实在很多地方可以修复一些东西，但是作为开发者，是否真的能理解修复？如果真的能理解，那就又自动进入了我前面说的循环中；如果不能理解，就没有人真正对这个修复负责。AI 也找不回那些已经消失的出错现场。

我自己就大量用 AI 写代码，xz-dev/pi 几乎没有代码是我手写的，我完全地拥抱 AI，但也真切地感受到需要主动地从 AI 那“抢来”对于项目地掌控力。AI 一定是加速器，而是否能用好，则取决于是否清醒地使用 AI，而清醒地使用意味着“你真的只是把 AI 当作解释器”而不是把自己当作 Jev 模型（选择路由器）。

AI 辅助开发和系统工程责任并不矛盾，生成代码之后是否继续追究语义，才是分界。而一旦你开始追究，“你”就成了那个补缝的人。

## 结语

> Eries：所以才需要看很多底层的东西
>
> Eries：比如一次硬盘写入的时间 rpc调用的时间之类的
>
> 我：但是这样真的会有人给我们涨薪嘛，老大
>
> Eries：不会
>
> Eries：这就是矛盾的地方了

## 参考

- Podman：[issue #30078](https://github.com/podman-container-tools/podman/issues/30078)、[PR #30079](https://github.com/podman-container-tools/podman/pull/30079)
- virtio-win：[kvm-guest-drivers-windows #1473](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1473)、[#1475](https://github.com/virtio-win/kvm-guest-drivers-windows/pull/1475)、[issue #765](https://github.com/virtio-win/kvm-guest-drivers-windows/issues/765)；[virtio-win-guest-tools-installer #87](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/87)、[#85](https://github.com/virtio-win/virtio-win-guest-tools-installer/pull/85)
- [ansible-runner #1306](https://github.com/ansible/ansible-runner/pull/1306)
- [xz-dev/pi](https://github.com/xz-dev/pi)、[介绍帖](https://linux.do/t/topic/3004687)、[earendil-works/pi issue #6234](https://github.com/earendil-works/pi/issues/6234)
- [xz-dev/AI-gateway](https://github.com/xz-dev/AI-gateway)
- [FreeBSD procctl(2)](https://man.freebsd.org/cgi/man.cgi?query=procctl&sektion=2&format=html)、[Linux PR_SET_CHILD_SUBREAPER](https://man7.org/linux/man-pages/man2/PR_SET_CHILD_SUBREAPER.2const.html)、[Linux pidfd_send_signal(2)](https://man7.org/linux/man-pages/man2/pidfd_send_signal.2.html)、[Linux cgroup v2 文档](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- Linux 提交：[2021 年引入 cgroup.kill](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit?id=661ee6280931548f7b3b887ad26a157474ae5ac4)、[2025 年修复 fork 与 cgroup.kill 的竞态](https://github.com/torvalds/linux/commit/b69bb476dee99d564d65d418e9a20acca6f32c3f)、[2026 年修复 CLONE_INTO_CGROUP 误杀](https://github.com/torvalds/linux/commit/8e359920216689b3b79e0fe8961a77fe312a511f)
- Steve Marquess：[Of Money, Responsibility, and Pride](https://veridicalsystems.com/blog/of-money-responsibility-and-pride/)
- [DORA 2026 年关于 AI 的分析](https://dora.dev/insights/balancing-ai-tensions/)
- 延伸阅读：Bengt Holmstrom、Paul Milgrom（1991），[Multitask Principal-Agent Analyses: Incentive Contracts, Asset Ownership, and Job Design](https://people.duke.edu/~qc2/BA532/1991%20JLEO%20Holmstrom%20Milgrom.pdf)；Harvard Business School，[The Value of Open Source Software](https://www.hbs.edu/faculty/Pages/item.aspx?num=65230)
