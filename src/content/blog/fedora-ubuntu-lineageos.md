---
title: "Fedora、Ubuntu 与 LineageOS"
pubDate: "2018-06-28"
description: "详细介绍如何在 Fedora 和 Ubuntu 系统下编译 LineageOS 的完整指南，包括依赖安装、源码下载和编译配置。"
author: "xz-dev"
category: "LineageOS"
tags: ["Fedora", "Ubuntu", "LineageOS"]
---

> LineageOS 官方用 Ubuntu 构建 LineageOS
>
> 这里整理一下如何用 Fedora 构建 LineageOS

## 安装依赖软件包

### Fedora

网传需要安装这些软件包

```bash
sudo dnf -y install zip curl gcc gcc-c++ flex bison gperf glibc-devel.{x86_64,i686} zlib-devel.{x86_64,i686} ncurses-devel.i686 libX11-devel.i686 libstdc++.i686 readline-devel.i686 libXrender.i686 libXrandr.i686 perl-Digest-MD5-File python-markdown mesa-libGL-devel.i686 git schedtool pngcrush ncurses-compat-libs java-1.8.0-openjdk-devel xz-lzma-compat
```

**但其实有多余的，精简后只需要这些**

```bash
sudo dnf -y install zip curl gcc gcc-c++ flex bison gperf glibc-devel.{x86_64,i686} zlib-devel ncurses-devel libX11-devel libstdc++ readline-devel libXrender.libXrandr perl-Digest-MD5-File python-markdown mesa-libGL-devel git schedtool pngcrush ncurses-compat-libs java-1.8.0-openjdk-devel xz-lzma-compat libstdc++.so.6
```

### Ubuntu

```bash
sudo apt -y install bc bison build-essential ccache curl flex g++-multilib gcc-multilib git gnupg gperf imagemagick lib32ncurses5-dev lib32readline-dev lib32z1-dev liblz4-tool libncurses5-dev libsdl1.2-dev libssl-dev libwxgtk3.0-dev libxml2 libxml2-utils lzop pngcrush rsync schedtool squashfs-tools xsltproc zip zlib1g-dev
```

## 按照官方文档下载软件源码(以 sagit (mi 6) 为例)

> 不区分 Ubuntu 与 Fedora

### 1. 安装SDK

```bash
sudo snf -y install adb
```

### 2. 创建目录

```bash
mkdir -p ~/bin
mkdir -p ~/android/lineage
```

### 3. 安装repo命令

```bash
curl https://storage.googleapis.com/git-repo-downloads/repo > ~/bin/repo
chmod a+x ~/bin/repo
```

### 4. 将~/bin目录放在执行路径中

```bash
# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi
```

### 5. 初始化LineageOS源代码库

```bash
cd ~/android/lineage
repo init -u https://github.com/LineageOS/android.git -b lineage-15.1
```

### 6. 下载源代码 (完整源码大约35G)

网速太慢？shadowsocks 网速优化 [点这里~](https://xzos.net/index.php/galaxy/2018/06/27/haproxy-shadowsocks/)

```bash
repo sync
```

添加 **"-c"** 要求 repo 只引入当前分支，而不是 GitHub 上可用的所有分支，减少同步源码的大小

### 7. 准备设备特定的代码

源代码下载后，确保你在源代码的根目录下（cd ~/android/lineage），然后键入：

```bash
source build/envsetup.sh
breakfast sagit  # saigt 换成你自己编译的手机的代号
```

这将下载您的设备的特定配置和内核

***这一步可能会因为没有vender文件报错，不用担心，下一步再拉取 vender 文件***

#### 8.获取手机厂商vendor文件

在 [https://github.com/TheMuppets](https://github.com/TheMuppets) 上获取

以 sagit 为例：

```bash
vim ~/android/lineage/.repo/local_manifests/roomservice.xml
```

添加

```xml
<project name="TheMuppets/proprietary_vendor_xiaomi" path="vendor/xiaomi" remote="github"/>
```

再次执行

```bash
repo sync
```

## 开始编译

### Fedora

#### 1. 打开缓存加快构建

```bash
export USE_CCACHE=1  # 并手动加入 ~/.bash_profile
```

#### 2. 指定缓存的最大磁盘空间量

```bash
prebuilts/misc/darwin-x86/ccache/ccache -M 50G
```

#### 3. 启用ccache压缩(可选)

```bash
export CCACHE_COMPRESS=1  # 并手动加入 ~/.bashrc
```

#### 4. 配置 Jack

```bash
export ANDROID_JACK_VM_ARGS="-Dfile.encoding=UTF-8 -XX:+TieredCompilation -Xmx4G"  # 并手动加入 ~/.bash_profile
```

#### 5. 设置暂时去除所有本地化的设置

```bash
export LC_ALL=C  # 不可加入 ~/.bashrc
```

### Ubuntu

#### 1. 打开缓存加快构建

```bash
export USE_CCACHE=1  # 并手动加入 ~/.bashrc
```

#### 2. 指定缓存的最大磁盘空间量

```bash
ccache -M 50G
```

#### 3. 启用ccache压缩(可选)

```bash
export CCACHE_COMPRESS=1  # 并手动加入 ~/.bashrc
```

#### 4. 配置 Jack

```bash
export ANDROID_JACK_VM_ARGS="-Dfile.encoding=UTF-8 -XX:+TieredCompilation -Xmx4G"  # 并手动加入 ~/.bashrc
```

#### 5. 设置暂时去除所有本地化的设置

```bash
export LC_ALL=C  # 并手动加入 ~/.bashrc
```

## 开始构建

> 不区分 Ubuntu 与 Fedora

```bash
croot
brunch sagit  # saigt 换成你自己编译的手机的代号
```

## 安装编译

> 不区分 Ubuntu 与 Fedora

```bash
cd $OUT  # 编译位置
```

在那里，你会发现创建的所有文件。有两个文件你应该很感兴趣，分别是：

- recovery.img，这是LineageOS恢复图像。
- lineage-15.1-20180628-UNOFFICIAL-sagit.zip，这是LineageOS安装程序包。

然后，把安装包刷进你的手机，建议使用 adb sideload 命令

刷机老司机温馨提醒：***别忘记备份哦***

Good Lucky!
