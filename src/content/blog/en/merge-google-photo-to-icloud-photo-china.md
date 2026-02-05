---
source_hash: "eeff1d87"
title: "Migrating Google Photos to Guizhou Cloud iCloud Photos"
pubDate: "2025-03-07"
description: "A detailed guide on migrating photos from Google Photos to China's Guizhou Cloud iCloud Photos, including the complete process of batch downloading, converting, and uploading."
author: "xz-dev"
category: "Tips"
tags: ["Google Photo", "iCloud Photo", "云上贵州"]
---

> Recently, my girlfriend gifted me an iPhone, which led to this unconventional operation—probably something only tech-savvy users in mainland China would need to do.
>
> For Google Photos to iCloud transfers in the US region, you can directly use Google Takeout for one-click migration.

## Download All Google Photos

1. Follow the [Google Photos Takeout Helper README](https://github.com/TheLastGimbus/GooglePhotosTakeoutHelper?tab=readme-ov-file#1-get-all-your-photos-from-google-takeout-) to create a new export task.

2. Wait for the export completion email and open one to gather basic data for batch downloading using scripts.

   - File list:

     ![Takeout file list](/images/blog/merge-google-photo-to-icloud-photo-china/takeout-file-list.png)

   - Right-click to copy a download link:

     ```
     https://takeout.google.com/takeout/download?j=1162e805-3b09-494c-ba99-6bb0bb7719b9&i=0&user=105433832262546547905
     ```

   - Install a browser extension that can export download tasks as command-line tools, such as cliget:

     ![cliget extension](/images/blog/merge-google-photo-to-icloud-photo-china/cliget-extension.png)

   - Obtain the command:

     ```
     aria2c --header 'Host: takeout-download.usercontent.google.com' --user-agent ... 'https://takeout-download.usercontent.google.com/download/takeout-20250303T133330Z-001.zip?j=1162e805-3b09-494c-ba99-6bb0bb7719b9&i=0&user=779537051113&authuser=0' --out 'takeout-20250303T133330Z-001.zip'
     ```

   - Notice that the file index is controlled by the "&i=0&user=" parameter in the URL, where the first file corresponds to i=0.

3. Write a batch download script:

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

4. After downloading multiple ZIP files, extract them (since these ZIPs are not stripped archives but individual compressed files):

   ```fish
   for file in *.zip
       7z x "$file"
   end
   ```

5. Use [Google Photos Takeout Helper](https://github.com/TheLastGimbus/GooglePhotosTakeoutHelper) to process the files:

   - Fix timestamps:

     ```bash
     gpth-linux --fix Takeout/
     ```

   - Convert:

     ```bash
     gpth-linux --input Takeout/ --output photo/ --albums "shortcut"
     ```

   - Fix timestamps in the target folder:

     ```bash
     gpth-linux --fix photo/
     ```

## Import to iCloud Photos

1. Set up a macOS virtual machine for uploading photos. Third-party tools like rclone can upload to iCloud (though not Photos specifically), but they are slow—testing showed it could take up to 3 days.

   - Follow **[ultimate-macOS-KVM](https://github.com/Coopydood/ultimate-macOS-KVM)**.
   - Install macOS (I chose OSX14) and allocate sufficient storage (I allocated 256GB). Log in with your China-region iCloud account.

2. Enable SSH: [Allow a remote computer to access your Mac](https://support.apple.com/lt-lt/guide/mac-help/mchlp1066/14.0/mac/14.0).

   - Edit the `boot.sh` VM startup script:

     ```bash
     ############## REMOVE THESE LINES AFTER MACOS INSTALLATION ###############
     #-drive id=BaseSystem,if=none,file="$VM_PATH/BaseSystem.img",format=raw
     #-device ide-hd,bus=sata.4,drive=BaseSystem
     ##########################################################################

     -netdev user,id=net0,hostfwd=tcp::5555-:22 -device "$NETWORK_DEVICE",netdev=net0,id=net0,mac="$MAC_ADDRESS"
     -device qxl-vga,vgamem_mb=128,vram_size_mb=128
     -monitor stdio
     ```

   - Connect from the host machine:

     ```bash
     ssh <your-name>@localhost -p 5555
     ```

3. Run a WebDAV server in the `photo` folder and forward the port to macOS:

   - ```bash
     rclone serve webdav --addr :8080 .
     ```

   - ```bash
     ssh -R 8080:127.0.0.1:8080 <your-name>@localhost -p 5555
     ```

4. Mount WebDAV in macOS: [Mounting a Shared Folder Using WebDAV on Mac](https://docs.qnap.com/operating-system/qts/4.5.x/en-us/GUID-C53F5A0E-1F28-45ED-9602-E1621BEDCE94.html).

5. Use macOS Photos to import the images. Follow this method: [Reddit r/applehelp](https://www.reddit.com/r/applehelp/comments/1dxz9se/possible_fix_photos_cannot_import_item/).

6. Wait for the upload to complete. Testing showed that 150GB (~11k photos) took about a full day.

   - Disable Mac power-saving to prevent upload pauses: [Set sleep and wake settings for your Mac](https://support.apple.com/en-sg/guide/mac-help/mchle41a6ccd/14.0/mac/14.0).

     ![MacOS disable powersave](/images/blog/merge-google-photo-to-icloud-photo-china/macos-disable-powersave.png)

   - Then, wait:

     ![iCloud photo upload](/images/blog/merge-google-photo-to-icloud-photo-china/icloud-photo-upload.png)

## Conclusion

As geeks, we must investigate whether we have an exit strategy—meaning ways to export our data. Similarly, the Mac VM serves this purpose.

In summary, **Apple** is a great design company but also a **terrible** tech company.