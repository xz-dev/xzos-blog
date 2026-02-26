---
source_hash: "94d18367"
source_lang: "zh"
target_lang: "en"
title: "Fixing FocalTech Touchpad Freezing Issues on Linux (ASUS Vivobook S 16)"
pubDate: "2026-02-26"
description: "In-depth analysis of the root cause behind intermittent freezing of FocalTech ASCF1201 touchpads on Linux, comparing kernel patch and libinput quirks solutions."
author: "xz-dev"
category: "Linux"
tags: ["Linux", "Touchpad", "libinput", "Kernel", "ASUS", "FocalTech", "Gentoo"]
---

> This article documents the complete process of fixing intermittent freezing issues with FocalTech touchpads on ASUS Vivobook S 16 M5606WA, including problem analysis, multiple kernel patch attempts, and the final libinput quirks solution.

<!--more-->

## Problem Description

### Device Information

- **Laptop**: ASUS Vivobook S 16 M5606WA (AMD Ryzen AI, Strix Point)
- **Touchpad**: FocalTech ASCF1201
  - VID: `0x2808`
  - PID: `0x0231`
  - Bus: I2C-HID
- **System Environment**: Gentoo Linux, KDE Plasma, Wayland
- **Kernel Version**: 6.19.3-cachyos

### Symptoms

The following issues occur when using the touchpad:

1. **Intermittent cursor freezing**: Cursor suddenly stops moving for 0.5-1 second during normal operation
2. **Drag operation interruption**: Suddenly releases during file/window dragging
3. **Scrolling stutter**: Noticeable pauses during two-finger scrolling
4. **Worsening over time**: Issues become more frequent with prolonged use

### Related Issues

Similar problems were reported on [Arch Linux BBS](https://bbs.archlinux.org/viewtopic.php?pid=2288660) for Lenovo IdeaPad Slim 5 with FocalTech FTCS0038 touchpad (same VID `0x2808`), suggesting this might be a common firmware issue with FocalTech touchpads.

## Problem Analysis

### Debugging Tools

Main tools used for debugging:

```bash
# View libinput events
sudo libinput debug-events

# View raw kernel events
sudo evtest /dev/input/eventX

# View device information
sudo libinput list-devices
```

### Findings

Through `libinput debug-events --verbose`, we observed that during cursor freezing, libinput detected numerous palm event loops:

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

Even during normal single-finger touch, libinput kept detecting `palm detected (tool-palm)`, causing touch events to be discarded.

Further examination with `evtest` revealed the touchpad's **Confidence bit** frequently toggled between 0 and 1 during normal operation. When `Confidence=0`, the kernel mapped it to `MT_TOOL_PALM`, causing libinput to discard the event.

### Problem Chain Analysis

The complete issue chain was identified as:

```
FocalTech firmware's unstable Confidence bit (switches to 0 during normal touch)
    ↓
Kernel hid-multitouch sees Confidence=0
    ↓
Device matches MT_CLS_WIN_8 (with MT_QUIRK_CONFIDENCE)
    ↓
Kernel sets MT_TOOL_PALM (ABS_MT_TOOL_TYPE=2)
    ↓
libinput sees MT_TOOL_PALM → discards touch event
    ↓
Cursor freezing/jittering
```

### Key Discoveries

1. **Unreliable Confidence bit**: FocalTech firmware incorrectly reports `Confidence=0` during normal touch
2. **No area sensor**: Device doesn't report `ABS_MT_TOUCH_MAJOR`, preventing libinput from using area-based palm detection

## Solution 1: Kernel Patch (Disable Confidence Mapping)

### Approach

Since the Confidence bit is unreliable, disable it at kernel level by creating a new device class `MT_CLS_WIN_8_NO_CONFIDENCE` with all Windows 8 precision touchpad quirks except `MT_QUIRK_CONFIDENCE`.

### Implementation (kernel.patch)

```c
// drivers/hid/hid-ids.h - Add device ID
#define I2C_VENDOR_ID_FOCALTECH        0x2808
#define I2C_PRODUCT_ID_FOCALTECH_ASCF1201    0x0231

// drivers/hid/hid-multitouch.c - Add device class definition
#define MT_CLS_WIN_8_NO_CONFIDENCE        0x0115

// Device class config - Note absence of MT_QUIRK_CONFIDENCE
{ .name = MT_CLS_WIN_8_NO_CONFIDENCE,
    .quirks = MT_QUIRK_ALWAYS_VALID |
        MT_QUIRK_IGNORE_DUPLICATES |
        MT_QUIRK_HOVERING |
        MT_QUIRK_CONTACT_CNT_ACCURATE |
        MT_QUIRK_STICKY_FINGERS |
        MT_QUIRK_WIN8_PTP_BUTTONS,
    .export_all_inputs = true },

// Device matching entry
{ .driver_data = MT_CLS_WIN_8_NO_CONFIDENCE,
    HID_DEVICE(BUS_I2C, HID_GROUP_MULTITOUCH_WIN_8,
        I2C_VENDOR_ID_FOCALTECH,
        I2C_PRODUCT_ID_FOCALTECH_ASCF1201) },
```

### Full Patch

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

### Results

**Successfully fixed freezing issues!** The touchpad no longer freezes intermittently.

**New issue**: Complete loss of palm detection because:
1. Kernel no longer maps `Confidence=0` to `MT_TOOL_PALM`
2. Device lacks area sensors, preventing libinput from area-based palm detection
3. Full palm contact moves the cursor instead of being ignored

While this solution fixes freezing, it sacrifices palm detection functionality, making it imperfect.

## Solution 2: libinput Quirks (Recommended)

### Approach

Instead of modifying the kernel, configure libinput to ignore incorrect palm detection by setting a high `AttrPalmSizeThreshold`. This filters out momentary palm misdetections while preserving actual palm detection.

### Why This Solution is Better

| Feature | Kernel Patch | libinput Quirks |
|---------|-------------|-----------------|
| Freezing | ✅ Fixed | ✅ Fixed |
| Palm Detection | ❌ Lost | ✅ Preserved |
| Maintenance | High (reapply on kernel updates) | Low (config file) |
| Complexity | High (kernel modification) | Low (single config file) |

### Technical Explanation

The key lies in the behavioral difference of Confidence bit:

- **Momentary misdetection**: During normal touch, `Confidence=0` appears briefly
- **Actual palm contact**: During palm touch, `Confidence=0` persists

By setting a high threshold, momentary misdetections are filtered while persistent palm contact still triggers detection.

### Configuration File

Create `/etc/libinput/local-overrides.quirks`:

```ini
# FocalTech ASCF1201 Touchpad (ASUS Vivobook S 16 M5606WA)
#
# Hardware: FocalTech I2C-HID Precision Touchpad
# VID:PID:  0x2808:0x0231
#
# Issue: FocalTech firmware's unstable Confidence bit causes
# false MT_TOOL_PALM reports during normal touch, making libinput
# discard events and causing cursor freezing.
#
# Solution: Set high AttrPalmSizeThreshold to filter momentary
# palm misdetections while preserving actual palm detection.
#
# Reference: https://wayland.freedesktop.org/libinput/doc/latest/device-quirks.html

[FocalTech ASCF1201 Touchpad]
MatchUdevType=touchpad
MatchBus=i2c
MatchVendor=0x2808
MatchProduct=0x0231
AttrPalmSizeThreshold=1000
```

### Applying Configuration

The configuration takes effect under these conditions:

1. **System reboot** (most reliable)
2. **Log out and back in**
3. **Restart desktop session**

Verify quirks activation with:

```bash
sudo libinput quirks list /dev/input/eventX
```

Where `eventX` is the touchpad device node (find with `sudo libinput list-devices`).

## Conclusion

### Root Cause

FocalTech touchpad firmware's **unstable Confidence bit implementation** incorrectly reports `Confidence=0` during normal touch, causing Linux kernel's `hid-multitouch` driver to misidentify touches as palm contacts.

### Solution Comparison

| Solution | Approach | Result |
|----------|----------|--------|
| Kernel Patch | Disable Confidence bit usage | ⚠️ Works but loses palm detection |
| libinput Quirks | Filter incorrect palm detection | ✅ Perfect solution |

### Applicability

This solution may work for other FocalTech touchpad devices such as:

- Lenovo IdeaPad Slim 5 16AHP9 (FTCS0038, VID 0x2808)
- Other laptops with FocalTech I2C-HID touchpads

For similar issues, try modifying the `MatchProduct` value in the configuration to match your device's PID.

### References

- [Arch Linux BBS - FTCS0038 Touchpad Discussion](https://bbs.archlinux.org/viewtopic.php?pid=2288660)
- [libinput Device Quirks Documentation](https://wayland.freedesktop.org/libinput/doc/latest/device-quirks.html)
- [libinput Touchpad Jumping Cursors Documentation](https://wayland.freedesktop.org/libinput/doc/latest/touchpad-jumping-cursors.html)