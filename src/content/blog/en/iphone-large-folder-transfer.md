---
source_hash: "499bba7d"
title: "How to Transfer a 10GB Folder with 110K Files (WeChat Archive) from One iPhone to Another"
description: "Using a combination of a-Shell and SSH/tar with a Linux computer as intermediary for efficient transfer of large folders between iPhones"
pubDate: "2025-12-20"
updatedDate: "2025-12-20"
author: "xz-dev"
category: "Tips"
tags: ["iPhone", "a-Shell", "SSH", "tar", "File Transfer", "WeChat"]
---

When you need to transfer a WeChat archive containing 10GB and 110,000 files between two iPhones, traditional methods often fall short:

- **AirDrop**: Gets stuck indefinitely on "Preparing files" and never starts transferring
- **iCloud**: Directly reports an error, unable to handle such a large number of files

This article introduces an efficient solution using a-Shell + SSH + tar.

<!--more-->

## Why Not Use iSH

You might consider using iSH, a Linux emulator for iOS. However, iSH suffers from severe IO performance bottlenecks when mounting iOS filesystems with `mount -t ios`.

### Performance Issues

iSH's performance problems stem from its underlying architecture: it fully emulates x86 instruction sets in user space, resulting in significant performance degradation. When using `mount -t ios` to mount iOS File Provider, it must additionally go through iOS's filesystem API layer, further increasing IO overhead.

### Speed Performance

According to user reports, iSH runs orders of magnitude slower than native execution. Developers have stated that even with code improvements, commands like `youtube-dl --help` still take about a minute to complete, making it difficult to optimize below 10 seconds. These limitations are equally apparent when working with mounted iOS filesystems.

### JIT Optimization Attempts

The development team attempted to introduce JIT (Just-In-Time compilation) to improve performance by 2-5x, but Apple rejected this request. Currently on iOS, users must choose between flexibility (iSH's complete shell environment) and performance (native solutions like a-Shell).

## Choosing a-Shell

a-Shell is a native iOS terminal application that offers better performance than iSH. However, it also has limitations:

- No rsync support
- No SSH server functionality

Therefore, we need to use a computer as an intermediary.

## Why Use a Linux Computer as Intermediary

Some filename formats supported by iPhone aren't supported by Windows (such as filenames containing special characters). To avoid filename compatibility issues, we recommend using a Linux computer as intermediary.

If you only have a Windows computer, you can choose the **non-extracted tar archive** solution (see below).

## Complete Step-by-Step Guide

### Solution 1: Using Linux Computer as Intermediary (Extracted Storage)

#### Step 1: Open a-Shell on Source iPhone and Select Directory

```bash
pickFolder  # Select the WeChat archive directory to transfer
```

#### Step 2: Upload to Linux Computer

```bash
tar czf - ./wx | ssh user@ip "cd ~/upload && tar xzf -"
```

This command will:
1. Compress the `./wx` directory into a tar.gz stream
2. Transfer via SSH to the computer
3. Extract in real-time on the computer

#### Step 3: Verify on Computer

```bash
# Check file count
find . -type f | wc -l

# Check total size
du -sh .
```

#### Step 4: Download to Target iPhone

In a-Shell on the new iPhone:

```bash
pickFolder  # Select target directory
```

Then execute the download command:

```bash
ssh -c aes128-ctr user@ip "cd ~/upload && tar czf - ." | tar xzf -
```

> Using `-c aes128-ctr` encryption algorithm can improve transfer speed.

### Solution 2: Non-Extracted Tar Archive (For Windows)

If you're using a Windows computer or want to avoid filename compatibility issues, you can choose not to extract the tar on the computer.

#### Upload (From Source iPhone)

```bash
pickFolder  # Select directory to transfer
tar czf - . | ssh user@ip "cat > ~/wx_backup.tar.gz"
```

#### Download (To Target iPhone)

```bash
pickFolder  # Select target directory
ssh -c aes128-ctr user@ip "cat ~/wx_backup.tar.gz" | tar xzf -
```

This keeps the tar archive compressed on the computer and only extracts on the iPhone, completely avoiding Windows filename compatibility issues.

## Monitoring Transfer Progress

Monitor progress on the computer (for Solution 1):

```bash
watch -n 3 'echo "Size: $(du -sh . 2>/dev/null | cut -f1)"; echo "Files: $(find . -type f 2>/dev/null | wc -l)"'
```

This refreshes every 3 seconds, showing current directory size and file count.

For Solution 2, monitor tar file size:

```bash
watch 'ls -lh ~/wx_backup.tar.gz'
```

### Verifying File Count in Tar Archive

If using Solution 2 (non-extracted tar), you can count files without extracting:

```bash
# Count files in tar.gz
tar tzf ~/wx_backup.tar.gz | wc -l

# To count only files (excluding directories)
tar tzf ~/wx_backup.tar.gz | grep -v '/$' | wc -l
```

> `tar tzf` lists archive contents without extracting, `-t` means list, `-z` means gzip compression, `-f` specifies file.

> **Windows Users Note**: The above monitoring and verification commands are for Linux/macOS. Windows users can use AI (like ChatGPT, Claude) to convert these commands to PowerShell or Windows Command Prompt equivalents.

## Summary

| Solution | Advantages | Disadvantages |
|------|------|------|
| Solution 1 (Linux extract) | Can view/manage files on computer | Requires Linux environment |
| Solution 2 (Non-extracted tar) | Windows compatible, no filename issues | Cannot directly view files on computer |

For transferring 10GB with 110K files, this SSH + tar streaming solution is much more efficient than file-by-file copying and more reliable than AirDrop.

## Actual Test Speed

In a Wi-Fi LAN environment, transfer speeds can reach **100Mbps** (~12.5MB/s). At this speed, 10GB of data takes approximately **13-15 minutes** to transfer.