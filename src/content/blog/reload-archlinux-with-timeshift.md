---
title: "使用 timeshift 重装 Arch Linux"
pubDate: "2019-02-27"
description: "使用 Timeshift 备份和恢复工具实现 Arch Linux 系统整体迁移的完整指南，包括备份创建和系统恢复步骤。"
author: "xz-dev"
category: "ArchLinux"
tags: ["Arch Linux", "Timeshift"]
---

> timeshift 是一款[备份软件](https://wiki.archlinux.org/index.php/Synchronization_and_backup_programs_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))，它有增量/定时备份、管理备份等功能。

使用背景：需要整体迁移系统

具体操作步骤/注意事项如下：

1. 在原系统中安装 timeshift（可通过 [archlinuxcn源](https://www.archlinuxcn.org/archlinux-cn-repo-and-mirror/) 直接安装）
2. 创建一个**完整备份**（包含所有文件）
3. 在新环境中**最小化安装** linux系统（包含timeshift和 [xorg](https://wiki.archlinux.org/index.php/Xinit_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)#%E5%AE%89%E8%A3%85)）
4. 拷贝/链接备份文件至 /timeshift
5. 在 ~/.xinitrc（没有就创建）中添加代码 `exec timeshift-gtk`
6. 执行命令 `startx`
7. 恢复备份，自动重启
8. 按照机器差别修改各文件的 **uuid**（例如fstab、grub文件）
9. 检查环境是否有缺失（**docker 镜像**不会被同步）

PS：妥善保管备份，直到确认一切完好
