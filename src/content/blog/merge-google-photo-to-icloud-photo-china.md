---
title: "迁移 Google Photo 到云上贵州 iCloud Photo"
pubDate: "2025-03-07"
description: "详细记录如何将 Google Photo 的照片迁移到中国大陆的云上贵州 iCloud Photo，包括批量下载、转换和上传的完整流程。"
author: "xz-dev"
category: "Tips"
tags: ["Google Photo", "iCloud Photo", "云上贵州"]
---

> 最近女友送我一台 iPhone，所以就有了如此逆向的操作，估计也就只有中国大陆的玩机用户需要这样吧。
>
> Google photo to iCloud 美区可以直接使用 Google Takeout 一键转移

## 下载所有 Google Photo 的照片

1. Follow [Google Photos Takeout Helper README](https://github.com/TheLastGimbus/GooglePhotosTakeoutHelper?tab=readme-ov-file#1-get-all-your-photos-from-google-takeout-)，去新建一个导出任务

2. 等待导出成功的邮件，并点开一个，我们来获取用脚本批量下载的基本数据

   - 文件列表

     ![Takeout file list](/images/blog/merge-google-photo-to-icloud-photo-china/takeout-file-list.png)

   - 右键复制一个下载链接

     ```
     https://takeout.google.com/takeout/download?j=1162e805-3b09-494c-ba99-6bb0bb7719b9&i=0&user=105433832262546547905
     ```

   - 浏览器装一个可以导出下载任务为命令行工具的插件，比如我这里用 cliget

     ![cliget extension](/images/blog/merge-google-photo-to-icloud-photo-china/cliget-extension.png)

   - 得到命令：

     ```
     aria2c --header 'Host: takeout-download.usercontent.google.com' --user-agent ... 'https://takeout-download.usercontent.google.com/download/takeout-20250303T133330Z-001.zip?j=1162e805-3b09-494c-ba99-6bb0bb7719b9&i=0&user=779537051113&authuser=0' --out 'takeout-20250303T133330Z-001.zip'
     ```

   - 现在我们可以发现具体下载第几个文件是 URL 里的 "&i=0&user=" 的 i 控制的，第一个文件就是 i=0

3. 编写一个批量下载脚本

   ```python
   #!/usr/bin/env python3
   import subprocess
   from pathlib import Path

   command_template = r"aria2c --header 'Host: takeout-download.usercontent.google.com' --user-agent ...'https://takeout-download.usercontent.google.com/download/takeout-20250303T133330Z-011.zip?j=1162e805-3b09-494c-ba99-6bb0bb7719b9&i={{index}}&user=779537051113&authuser=0' --out 'takeout-20250303T133330Z-{{index}}.zip'"

   for i in range(50):
       print(i)
       if Path(f"takeout-20250303T133330Z-{i}.zip").exists() and not Path(f"takeout-20250303T133330Z-{i}.zip.aria2").exists():
           print(f"takeout-20250303T133330Z-{i}.zip exists")
           continue
       url = f"https://accounts.google.com/AccountChooser?continue=https://takeout.google.com/settings/takeout/download?j%3D1162e805-3b09-494c-ba99-6bb0bb7719b9%26i%3D{i}&Email=zxz1054855541@gmail.com"
       # download to photos_{i}.zip
       command = command_template.replace("{{index}}", str(i))
       subprocess.run(command, shell=True)
   ```

4. 现在我们下下来一堆 zip 文件，我们批量解压（因为这个 zip 根本不是 strip 压缩包，而只是多个单独的压缩文件

   ```fish
   for file in *.zip
       7z x "$file"
   end
   ```

5. 然后我们用 [Google Photos Takeout Helper](https://github.com/TheLastGimbus/GooglePhotosTakeoutHelper) 去转换

   - 修复时间戳：

     ```bash
     gpth-linux --fix Takeout/
     ```

   - ```bash
     gpth-linux --input Takeout/ --output photo/ --albums "shortcut"
     ```

   - 修复目标的时间戳：

     ```bash
     gpth-linux --fix photo/
     ```

## 导入 iCloud Photo

1. 接下在我们配置一个 macOS 的虚拟机来上传照片。rclone 等第三方是可以传 iCloud （这里也不是 Photo），但是很慢，实测需要3天

   - Follow **[ultimate-macOS-KVM](https://github.com/Coopydood/ultimate-macOS-KVM)**
   - 跟着 README 去安装好（一定不要只分配80G，我留了256G，按照你需要传的照片看）（我这里选择 OSX14），登录你自己的国区 iCloud 帐号

2. 启用 SSH ：[Allow a remote computer to access your Mac](https://support.apple.com/lt-lt/guide/mac-help/mchlp1066/14.0/mac/14.0)

   - 编辑 boot.sh 虚拟机启动脚本

     ```bash
     ############## REMOVE THESE LINES AFTER MACOS INSTALLATION ###############
     #-drive id=BaseSystem,if=none,file="$VM_PATH/BaseSystem.img",format=raw
     #-device ide-hd,bus=sata.4,drive=BaseSystem
     ##########################################################################

     -netdev user,id=net0,hostfwd=tcp::5555-:22 -device "$NETWORK_DEVICE",netdev=net0,id=net0,mac="$MAC_ADDRESS"
     -device qxl-vga,vgamem_mb=128,vram_size_mb=128
     -monitor stdio
     ```

   - 然后我们可以宿主机登录了：

     ```bash
     ssh <your-name>@localhost -p 5555
     ```

3. 运行一个在 photo 文件夹下 WebDAV 服务器，并转发端口到 macOS 里

   - ```bash
     rclone serve webdav --addr :8080 .
     ```

   - ```bash
     ssh -R 8080:127.0.0.1:8080 <your-name>@localhost -p 5555
     ```

4. macOS 里挂载 WebDAV：[Mounting a Shared Folder Using WebDAV on Mac](https://docs.qnap.com/operating-system/qts/4.5.x/en-us/GUID-C53F5A0E-1F28-45ED-9602-E1621BEDCE94.html)

5. 使用 macOS 里的 photo 软件导入图片们，一定要使用这个方法：[Reddit r/applehelp](https://www.reddit.com/r/applehelp/comments/1dxz9se/possible_fix_photos_cannot_import_item/)

6. 接下来就是等着咯，实测我150G，11k 照片需要一整天

   - 关闭 Mac 节能，避免上传暂停 [Set sleep and wake settings for your Mac](https://support.apple.com/en-sg/guide/mac-help/mchle41a6ccd/14.0/mac/14.0)

     ![MacOS disable powersave](/images/blog/merge-google-photo-to-icloud-photo-china/macos-disable-powersave.png)

   - 然后，等着

     ![iCloud photo upload](/images/blog/merge-google-photo-to-icloud-photo-china/icloud-photo-upload.png)

## 结语

作为一个极客，我们肯定要调查清楚我们是否有退路，也就是导出数据的方法。同样，Mac 虚拟机

综上，**苹果**，一个好的设计公司，也是一个**垃圾的**科技公司。
