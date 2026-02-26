---
source_hash: "94d18367"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "FocalTech 触摸板在 Linux 下的冻结问题修复（ASUS Vivobook S 16）"
pubDate: "2026-02-26"
description: "深入分析 FocalTech ASCF1201 触摸板在 Linux 下间歇性冻结的根本原因，对比内核补丁与 libinput quirks 两种解决方案。"
author: "xz-dev"
category: "Linux"
tags: ["Linux", "触摸板", "libinput", "内核", "ASUS", "FocalTech", "Gentoo"]
---

> 本文记录了在 ASUS Vivobook S 16 M5606WA 上修复 FocalTech 触摸板间歇性冻结问题的完整过程，包括问题分析、多次内核补丁尝试，以及最终的 libinput quirks 解决方案。

<!--more-->

## 问题描述

### 设备信息

- **笔记本**：ASUS Vivobook S 16 M5606WA（AMD Ryzen AI，Strix Point）
- **触摸板**：FocalTech ASCF1201
  - VID: `0x2808`
  - PID: `0x0231`
  - 总线：I2C-HID
- **系统环境**：Gentoo Linux, KDE Plasma, Wayland
- **内核版本**：6.19.3-cachyos

### 症状

使用触摸板时出现以下问题：

1. **光标间歇性冻结**：正常滑动过程中光标突然停止移动约 0.5-1 秒
2. **拖拽操作中断**：拖动文件或窗口时突然松开
3. **滚动卡顿**：双指滚动时出现明显停顿
4. **问题随时间加剧**：使用时间越长，问题越频繁

### 相关问题

在 [Arch Linux BBS](https://bbs.archlinux.org/viewtopic.php?pid=2288660) 上有用户报告了类似问题，设备是 Lenovo IdeaPad Slim 5 上的 FocalTech FTCS0038 触摸板（VID 也是 `0x2808`）。这表明这可能是 FocalTech 触摸板固件的通病。

## 问题分析

### 调试工具

主要使用以下工具进行调试：

```bash
# 查看 libinput 事件
sudo libinput debug-events

# 查看原始内核事件
sudo evtest /dev/input/eventX

# 查看设备信息
sudo libinput list-devices
```

### 发现问题

通过 `libinput debug-events --verbose` 观察，发现在光标冻结时，libinput 检测到了大量的 palm（手掌）事件循环：

```
event5  - palm: touch 0 (TOUCH_UPDATE), palm detected (tool-palm)
event5  - gesture: [1fg] event GESTURE_STATE_UNKNOWN → GESTURE_EVENT_RESET → GESTURE_STATE_NONE
event5  - palm: touch 0 (TOUCH_END), palm detected (tool-palm)
event5  - button state: touch 0 from BUTTON_STATE_AREA    event BUTTON_EVENT_UP          to BUTTON_STATE_NONE
event5  - palm: touch 0 (TOUCH_BEGIN), palm detected (tool-palm)
event5  - button state: touch 0 from BUTTON_STATE_NONE    event BUTTON_EVENT_IN_AREA     to BUTTON_STATE_AREA
event5  - palm: touch 0 (TOUCH_END), palm detected (tool-palm)
event5  - button state: touch 0 from BUTTON_STATE_AREA    event BUTTON_EVENT_UP          to BUTTON_STATE_NONE
event5  - palm: touch 0 (TOUCH_BEGIN), palm detected (tool-palm)
...
```

可以看到，即使只是正常的单指触摸，libinput 也在不断循环检测到 `palm detected (tool-palm)`，导致触摸事件被丢弃。

进一步使用 `evtest` 查看原始 HID 报告，发现触摸板的 **Confidence bit** 在正常触摸过程中频繁在 0 和 1 之间切换。当 `Confidence=0` 时，内核将其映射为 `MT_TOOL_PALM`，libinput 随即丢弃该事件。

### 问题链条分析

经过深入分析，确定了完整的问题链条：

```
FocalTech 固件 Confidence bit 不稳定（正常触摸时也会变成 0）
    ↓
内核 hid-multitouch 看到 Confidence=0
    ↓
因为设备匹配 MT_CLS_WIN_8（有 MT_QUIRK_CONFIDENCE）
    ↓
内核设置 MT_TOOL_PALM（ABS_MT_TOOL_TYPE=2）
    ↓
libinput 看到 MT_TOOL_PALM → 丢弃触摸事件
    ↓
光标冻结/抖动
```

### 关键发现

1. **Confidence bit 不可靠**：FocalTech 固件的 Confidence bit 实现有问题，在正常触摸时也会误报 `Confidence=0`
2. **设备没有面积传感器**：通过 `evtest` 确认设备不报告 `ABS_MT_TOUCH_MAJOR` 等面积数据，这意味着 libinput 无法使用基于触摸面积的手掌检测

## 解决方案一：内核补丁（禁用 Confidence 映射）

### 思路

既然 Confidence bit 不可靠，那就在内核层面禁用它。创建一个新的设备类 `MT_CLS_WIN_8_NO_CONFIDENCE`，它具有 Windows 8 精确触摸板的所有 quirks，但不设置 `MT_QUIRK_CONFIDENCE`。

### 实现 (kernel.patch)

```c
// drivers/hid/hid-ids.h - 添加设备 ID
#define I2C_VENDOR_ID_FOCALTECH        0x2808
#define I2C_PRODUCT_ID_FOCALTECH_ASCF1201    0x0231

// drivers/hid/hid-multitouch.c - 添加设备类定义
#define MT_CLS_WIN_8_NO_CONFIDENCE        0x0115

// 设备类配置 - 注意没有 MT_QUIRK_CONFIDENCE
{ .name = MT_CLS_WIN_8_NO_CONFIDENCE,
    .quirks = MT_QUIRK_ALWAYS_VALID |
        MT_QUIRK_IGNORE_DUPLICATES |
        MT_QUIRK_HOVERING |
        MT_QUIRK_CONTACT_CNT_ACCURATE |
        MT_QUIRK_STICKY_FINGERS |
        MT_QUIRK_WIN8_PTP_BUTTONS,
    .export_all_inputs = true },

// 设备匹配条目
{ .driver_data = MT_CLS_WIN_8_NO_CONFIDENCE,
    HID_DEVICE(BUS_I2C, HID_GROUP_MULTITOUCH_WIN_8,
        I2C_VENDOR_ID_FOCALTECH,
        I2C_PRODUCT_ID_FOCALTECH_ASCF1201) },
```

### 完整补丁

```diff
diff --git a/drivers/hid/hid-ids.h b/drivers/hid/hid-ids.h
index adad71cc8..9ac008210 100644
--- a/drivers/hid/hid-ids.h
+++ b/drivers/hid/hid-ids.h
@@ -500,6 +500,9 @@
 #define USB_DEVICE_ID_FFBEAST_RUDDER	0x5968
 #define USB_DEVICE_ID_FFBEAST_WHEEL	0x59d7
 
+#define I2C_VENDOR_ID_FOCALTECH		0x2808
+#define I2C_PRODUCT_ID_FOCALTECH_ASCF1201	0x0231
+
 #define USB_VENDOR_ID_FLATFROG		0x25b5
 #define USB_DEVICE_ID_MULTITOUCH_3200	0x0002
 
diff --git a/drivers/hid/hid-multitouch.c b/drivers/hid/hid-multitouch.c
index b1c3ef129..bd655fff1 100644
--- a/drivers/hid/hid-multitouch.c
+++ b/drivers/hid/hid-multitouch.c
@@ -231,6 +231,7 @@ static void mt_post_parse(struct mt_device *td, struct mt_application *app);
 #define MT_CLS_RAZER_BLADE_STEALTH		0x0112
 #define MT_CLS_SMART_TECH			0x0113
 #define MT_CLS_APPLE_TOUCHBAR			0x0114
+#define MT_CLS_WIN_8_NO_CONFIDENCE		0x0115
 #define MT_CLS_SIS				0x0457
 
 #define MT_DEFAULT_MAXCONTACT	10
@@ -428,6 +429,14 @@ static const struct mt_class mt_classes[] = {
 			MT_QUIRK_ALWAYS_VALID |
 			MT_QUIRK_CONTACT_CNT_ACCURATE,
 	},
+	{ .name = MT_CLS_WIN_8_NO_CONFIDENCE,
+		.quirks = MT_QUIRK_ALWAYS_VALID |
+			MT_QUIRK_IGNORE_DUPLICATES |
+			MT_QUIRK_HOVERING |
+			MT_QUIRK_CONTACT_CNT_ACCURATE |
+			MT_QUIRK_STICKY_FINGERS |
+			MT_QUIRK_WIN8_PTP_BUTTONS,
+		.export_all_inputs = true },
 	{ }
 };
 
@@ -2177,6 +2186,10 @@ static const struct hid_device_id mt_devices[] = {
 	{ .driver_data = MT_CLS_SERIAL,
 		MT_USB_DEVICE(USB_VENDOR_ID_CYGNAL,
 			USB_DEVICE_ID_FOCALTECH_FTXXXX_MULTITOUCH) },
+	{ .driver_data = MT_CLS_WIN_8_NO_CONFIDENCE,
+		HID_DEVICE(BUS_I2C, HID_GROUP_MULTITOUCH_WIN_8,
+			I2C_VENDOR_ID_FOCALTECH,
+			I2C_PRODUCT_ID_FOCALTECH_ASCF1201) },
 
 	/* GeneralTouch panel */
 	{ .driver_data = MT_CLS_GENERALTOUCH_TWOFINGERS,
```

### 结果

**成功解决冻结问题！** 触摸板不再出现间歇性冻结。

**但有新问题**：手掌检测完全失效。因为：
1. 内核不再将 `Confidence=0` 映射为 `MT_TOOL_PALM`
2. 设备没有面积传感器，libinput 无法使用基于面积的手掌检测
3. 整个手掌按在触摸板上时，光标会跟随移动（而不是被忽略）

这个方案虽然解决了冻结问题，但牺牲了手掌检测功能，不是完美的解决方案。

## 解决方案二：libinput quirks（推荐）

### 思路

既然内核补丁会破坏手掌检测，那么换一个思路：**不修改内核，而是让 libinput 忽略错误的 palm 判定**。

通过设置一个很高的 `AttrPalmSizeThreshold`，libinput 会忽略内核发来的 `MT_TOOL_PALM` 事件（因为达不到阈值）。但真正的手掌触摸会持续发送 `Confidence=0`，仍然可以被检测到。

### 为什么这个方案更好

| 特性 | 内核补丁 | libinput quirks |
|------|----------|-----------------|
| 冻结问题 | ✅ 解决 | ✅ 解决 |
| 手掌检测 | ❌ 完全失效 | ✅ 保留 |
| 维护成本 | 高（每次内核升级需要重新应用） | 低（配置文件） |
| 实现复杂度 | 高（修改内核源码） | 低（单个配置文件） |

### 原理详解

关键在于理解 Confidence bit 的行为差异：

- **瞬间误判**：正常触摸时，`Confidence=0` 只是瞬间出现，很快恢复为 1
- **真正的手掌**：手掌触摸时，`Confidence=0` 会持续存在

通过设置高阈值，瞬间的误判被过滤掉，而持续的手掌触摸仍然会触发手掌检测。

### 配置文件

创建 `/etc/libinput/local-overrides.quirks`：

```ini
# FocalTech ASCF1201 Touchpad (ASUS Vivobook S 16 M5606WA)
#
# Hardware: FocalTech I2C-HID Precision Touchpad
# VID:PID:  0x2808:0x0231
#
# 问题：FocalTech 固件的 Confidence bit 不稳定，在正常触摸时也会
# 误报 Confidence=0，导致内核错误地将触摸事件标记为 MT_TOOL_PALM，
# libinput 随即丢弃这些事件，造成光标间歇性冻结。
#
# 解决方案：设置一个很高的 AttrPalmSizeThreshold，让 libinput 忽略
# 瞬间的 palm 误判，同时保留对真正手掌触摸的检测能力。
#
# Reference: https://wayland.freedesktop.org/libinput/doc/latest/device-quirks.html

[FocalTech ASCF1201 Touchpad]
MatchUdevType=touchpad
MatchBus=i2c
MatchVendor=0x2808
MatchProduct=0x0231
AttrPalmSizeThreshold=1000
```

### 应用配置

配置文件在以下情况会生效：

1. **重启系统**（最可靠）
2. **注销并重新登录**
3. **重启桌面会话**

可以使用以下命令验证 quirks 是否生效：

```bash
sudo libinput quirks list /dev/input/eventX
```

其中 `eventX` 是触摸板对应的设备节点，可以通过 `sudo libinput list-devices` 查看。

## 总结

### 问题根因

FocalTech 触摸板固件的 **Confidence bit 实现不稳定**，在正常触摸过程中会错误地将 Confidence 设为 0，导致 Linux 内核的 `hid-multitouch` 驱动将触摸事件误判为手掌触摸。

### 方案对比

| 方案 | 思路 | 结果 |
|------|------|------|
| 内核补丁 | 内核不再使用 Confidence bit | ⚠️ 成功但手掌检测失效 |
| libinput quirks | 让 libinput 忽略错误的 palm 判定 | ✅ 完美解决 |

### 适用范围

本方案可能适用于其他使用 FocalTech 触摸板的设备，例如：

- Lenovo IdeaPad Slim 5 16AHP9（FTCS0038，VID 0x2808）
- 其他使用 FocalTech I2C-HID 触摸板的笔记本

如果你遇到类似问题，可以尝试将配置中的 `MatchProduct` 修改为你设备的 PID。

### 参考链接

- [Arch Linux BBS - FTCS0038 Touchpad 问题讨论](https://bbs.archlinux.org/viewtopic.php?pid=2288660)
- [libinput 设备 quirks 文档](https://wayland.freedesktop.org/libinput/doc/latest/device-quirks.html)
- [libinput 触摸板跳跃光标文档](https://wayland.freedesktop.org/libinput/doc/latest/touchpad-jumping-cursors.html)
