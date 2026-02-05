---
source_hash: "e83c86eb"
title: "Reinstalling Arch Linux Using Timeshift"
pubDate: "2019-02-27"
description: "A comprehensive guide to migrating an entire Arch Linux system using Timeshift backup and restore tool, including steps for creating backups and system recovery."
author: "xz-dev"
category: "ArchLinux"
tags: ["Arch Linux", "Timeshift"]
---

> Timeshift is a [backup utility](https://wiki.archlinux.org/index.php/Synchronization_and_backup_programs_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)) that features incremental/scheduled backups and backup management.

Use case: Need to migrate the entire system

Detailed steps/precautions:

1. Install timeshift on the original system (can be installed directly via [archlinuxcn repo](https://www.archlinuxcn.org/archlinux-cn-repo-and-mirror/))
2. Create a **full backup** (including all files)
3. Perform a **minimal installation** of Linux on the new environment (including timeshift and [xorg](https://wiki.archlinux.org/index.php/Xinit_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%AE%89%E8%A3%85))
4. Copy/link backup files to /timeshift
5. Add `exec timeshift-gtk` to ~/.xinitrc (create if it doesn't exist)
6. Execute command `startx`
7. Restore backup, automatic reboot will occur
8. Modify **uuid** in various files according to machine differences (e.g. fstab, grub files)
9. Check environment for missing components (**docker images** won't be synchronized)

PS: Keep backups secure until confirming everything works properly