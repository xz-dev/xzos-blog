---
source_hash: "dc77e6ab"
title: "Fedora, Ubuntu and LineageOS"
pubDate: "2018-06-28"
description: "A comprehensive guide on compiling LineageOS under Fedora and Ubuntu systems, including dependency installation, source code downloading, and compilation configuration."
author: "xz-dev"
category: "LineageOS"
tags: ["Fedora", "Ubuntu", "LineageOS"]
---

> LineageOS officially builds using Ubuntu
>
> Here's how to build LineageOS with Fedora

## Installing Dependency Packages

### Fedora

Online sources suggest installing these packages:

```bash
sudo dnf -y install zip curl gcc gcc-c++ flex bison gperf glibc-devel.{x86_64,i686} zlib-devel.{x86_64,i686} ncurses-devel.i686 libX11-devel.i686 libstdc++.i686 readline-devel.i686 libXrender.i686 libXrandr.i686 perl-Digest-MD5-File python-markdown mesa-libGL-devel.i686 git schedtool pngcrush ncurses-compat-libs java-1.8.0-openjdk-devel xz-lzma-compat
```

**But actually some are redundant, the essential ones are:**

```bash
sudo dnf -y install zip curl gcc gcc-c++ flex bison gperf glibc-devel.{x86_64,i686} zlib-devel ncurses-devel libX11-devel libstdc++ readline-devel libXrender.libXrandr perl-Digest-MD5-File python-markdown mesa-libGL-devel git schedtool pngcrush ncurses-compat-libs java-1.8.0-openjdk-devel xz-lzma-compat libstdc++.so.6
```

### Ubuntu

```bash
sudo apt -y install bc bison build-essential ccache curl flex g++-multilib gcc-multilib git gnupg gperf imagemagick lib32ncurses5-dev lib32readline-dev lib32z1-dev liblz4-tool libncurses5-dev libsdl1.2-dev libssl-dev libwxgtk3.0-dev libxml2 libxml2-utils lzop pngcrush rsync schedtool squashfs-tools xsltproc zip zlib1g-dev
```

## Downloading Source Code Following Official Documentation (Using sagit (mi 6) as Example)

> Same for Ubuntu and Fedora

### 1. Install SDK

```bash
sudo snf -y install adb
```

### 2. Create Directories

```bash
mkdir -p ~/bin
mkdir -p ~/android/lineage
```

### 3. Install repo Command

```bash
curl https://storage.googleapis.com/git-repo-downloads/repo > ~/bin/repo
chmod a+x ~/bin/repo
```

### 4. Add ~/bin to PATH

```bash
# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi
```

### 5. Initialize LineageOS Source Repository

```bash
cd ~/android/lineage
repo init -u https://github.com/LineageOS/android.git -b lineage-15.1
```

### 6. Download Source Code (Full source is about 35G)

Slow network? Shadowsocks optimization [click here~](https://xzos.net/index.php/galaxy/2018/06/27/haproxy-shadowsocks/)

```bash
repo sync
```

Adding **"-c"** tells repo to fetch only the current branch, not all branches available on GitHub, reducing sync size

### 7. Prepare Device-Specific Code

After downloading source, ensure you're in the root directory (cd ~/android/lineage), then type:

```bash
source build/envsetup.sh
breakfast sagit  # replace sagit with your device codename
```

This downloads your device's specific configuration and kernel

***This step might error due to missing vendor files, don't worry - we'll fetch vendor files next***

#### 8. Get Vendor Files

Get from [https://github.com/TheMuppets](https://github.com/TheMuppets)

For sagit:

```bash
vim ~/android/lineage/.repo/local_manifests/roomservice.xml
```

Add:

```xml
<project name="TheMuppets/proprietary_vendor_xiaomi" path="vendor/xiaomi" remote="github"/>
```

Then execute again:

```bash
repo sync
```

## Starting Compilation

### Fedora

#### 1. Enable Cache for Faster Builds

```bash
export USE_CCACHE=1  # also add manually to ~/.bash_profile
```

#### 2. Set Maximum Cache Size

```bash
prebuilts/misc/darwin-x86/ccache/ccache -M 50G
```

#### 3. Enable ccache Compression (Optional)

```bash
export CCACHE_COMPRESS=1  # also add manually to ~/.bashrc
```

#### 4. Configure Jack

```bash
export ANDROID_JACK_VM_ARGS="-Dfile.encoding=UTF-8 -XX:+TieredCompilation -Xmx4G"  # also add manually to ~/.bash_profile
```

#### 5. Temporarily Remove All Localization Settings

```bash
export LC_ALL=C  # DO NOT add to ~/.bashrc
```

### Ubuntu

#### 1. Enable Cache for Faster Builds

```bash
export USE_CCACHE=1  # also add manually to ~/.bashrc
```

#### 2. Set Maximum Cache Size

```bash
ccache -M 50G
```

#### 3. Enable ccache Compression (Optional)

```bash
export CCACHE_COMPRESS=1  # also add manually to ~/.bashrc
```

#### 4. Configure Jack

```bash
export ANDROID_JACK_VM_ARGS="-Dfile.encoding=UTF-8 -XX:+TieredCompilation -Xmx4G"  # also add manually to ~/.bashrc
```

#### 5. Temporarily Remove All Localization Settings

```bash
export LC_ALL=C  # also add manually to ~/.bashrc
```

## Start Building

> Same for Ubuntu and Fedora

```bash
croot
brunch sagit  # replace sagit with your device codename
```

## Install Compiled Files

> Same for Ubuntu and Fedora

```bash
cd $OUT  # compilation location
```

There you'll find all created files. Two files are particularly important:
- recovery.img - LineageOS recovery image
- lineage-15.1-20180628-UNOFFICIAL-sagit.zip - LineageOS installation package

Then flash the package to your phone (recommended using adb sideload)

Friendly reminder from veteran flashers: ***Don't forget to backup***

Good Lucky!