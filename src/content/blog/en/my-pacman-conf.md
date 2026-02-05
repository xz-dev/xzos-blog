---
source_hash: "4612b985"
title: "Pacman Universal Configuration"
pubDate: "2020-10-19"
description: "Universal configuration file for ArchLinux's Pacman package manager, including optimized settings for colored output, progress display, archlinuxcn repository, and more."
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "pacman", "ArchLinux"]
---

> Configuration file reference: [Arch manual pages](https://jlk.fjfi.cvut.cz/arch/manpages/man/pacman.conf.5)
>
> You can directly copy and replace your pacman.conf file (remember to back up)

> This article is part of the [ArchLinux Configuration Guide](https://xzos.net/archlinux-setup-guide/).
>
> Of course, you can also read it separately

<!--more-->

## My Configuration File

```bash
#
# /etc/pacman.conf
#
# See the pacman.conf(5) manpage for option and repository directives

#
# GENERAL OPTIONS
#
[options]
# The following paths are commented out with their default values listed.
# If you wish to use different paths, uncomment and update the paths.
#RootDir     = /
#DBPath      = /var/lib/pacman/
#CacheDir    = /var/cache/pacman/pkg/
#LogFile     = /var/log/pacman.log
#GPGDir      = /etc/pacman.d/gnupg/
#HookDir     = /etc/pacman.d/hooks/
#HookDir     = /home/xz/.local/share/pacman.d/hooks
HoldPkg     = pacman glibc
#XferCommand = /usr/bin/curl -L -C - -f -o %o %u
#XferCommand = /usr/bin/wget --passive-ftp -c -O %o %u
#CleanMethod = KeepInstalled
CleanMethod = KeepCurrent
Architecture = auto

#IgnorePkg   =
#IgnorePkg   =
#IgnoreGroup =

#NoUpgrade   =
#NoExtract   =

# Misc options
#UseSyslog
Color
TotalDownload
CheckSpace
#VerbosePkgLists

# By default, pacman accepts packages signed by keys that its local keyring
# trusts (see pacman-key and its man page), as well as unsigned packages.
#SigLevel    = Required DatabaseOptional
SigLevel = PackageRequired
LocalFileSigLevel = Optional
#RemoteFileSigLevel = Required

# NOTE: You must run `pacman-key --init` before first using pacman; the local
# keyring can then be populated with the keys of all official Arch Linux
# packagers with `pacman-key --populate archlinux`.

#
# REPOSITORIES
#   - can be defined here or included from another file
#   - pacman will search repositories in the order defined here
#   - local/custom mirrors can be added here or in separate files
#   - repositories listed first will take precedence when packages
#     have identical names, regardless of version number
#   - URLs will have $repo replaced by the name of the current repo
#   - URLs will have $arch replaced by the name of the architecture
#
# Repository entries are of the format:
#       [repo-name]
#       Server = ServerName
#       Include = IncludePath
#
# The header [repo-name] is crucial - it must be present and
# uncommented to enable the repo.
#

# The testing repositories are disabled by default. To enable, uncomment the
# repo name header and Include lines. You can add preferred servers immediately
# after the header, and they will be used before the default mirrors.

#[testing]
#Include = /etc/pacman.d/mirrorlist

[core]
Include = /etc/pacman.d/mirrorlist

[extra]
Include = /etc/pacman.d/mirrorlist

#[community-testing]
#Include = /etc/pacman.d/mirrorlist

[community]
Include = /etc/pacman.d/mirrorlist

# If you want to run 32 bit applications on your x86_64 system,
# enable the multilib repositories as required here.

#[multilib-testing]
#Include = /etc/pacman.d/mirrorlist

[multilib]
Include = /etc/pacman.d/mirrorlist

# An example of a custom package repository.  See the pacman manpage for
# tips on creating your own repositories.
#[custom]
#SigLevel = Optional TrustAll
#Server = file:///home/custompkgs

[archlinuxcn]
Include = /etc/pacman.d/archlinuxcn-mirrorlist
```

## Differences from Default Configuration

- Doesn't save previous versions of installed packages
- Colored output
- Displays total installation progress
- Doesn't request sig files from repositories (many mirror sources don't have sig files, and packages with errors won't pass pacman's gpg signature verification)
- Configured archlinuxcn repository

## Adding archlinuxcn Repository

### Adding archlinuxcn Configuration

Add the following at the end of pacman.conf:

```bash
[archlinuxcn]
Server = https://repo.archlinuxcn.org/$arch
```

Download archlinuxcn-related packages:

- archlinuxcn-keyring (GPG signature for archlinuxcn, without this you can't install any packages from archlinuxcn)
- archlinuxcn-mirrorlist-git (archlinuxcn mirror list, making your configuration more standardized) **(Optional)**

Configure archlinuxcn mirrors:

- Modify /etc/pacman.d/archlinuxcn-mirrorlist by uncommenting the mirrors you want to use
- Change the archlinuxcn section in pacman.conf to:

```bash
[archlinuxcn]
Include = /etc/pacman.d/archlinuxcn-mirrorlist
```