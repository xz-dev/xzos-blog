---
source_hash: "8eb6de71"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "FireFox 从 stable 版本无缝转移到 develop 版本"
pubDate: "2020-06-05"
description: "由于 Mozilla 证书过期事件导致 Firefox 扩展失效，本文介绍如何无缝地将 Firefox 数据从稳定版本迁移到开发版。"
author: "xz-dev"
category: "Firefox"
tags: ["Firefox", "Linux"]
---

> Mozilla曝出大乌龙 证书过期导致全球Firefox用户无法使用扩展
> 今天早上Mozilla和全球的Firefox用户开了个不大不小的玩笑，许多人一大早起来打开浏览器发现所有的扩展都无法使用，就连手机版也是如此。

于是，如何无缝转移数据成了首要目标

首先备份firefox用户数据文件夹，Linux下是用户文件夹下的 .mozilla 文件夹

然后，重命名整个文件夹 .mozilla.bak，

打开Firefox Develop，然后关闭（生成新的用户数据目录）

再次找到 .mozilla 文件夹(该文件夹下有几个数据库文件)（如下图）用相应文件夹备份覆盖掉（不要修改文件夹名称）文件夹里面的所有文件

![.mozilla 文件夹结构](/images/blog/firefox-moved-from-stable-version-to-develop-version/mozilla-folder-structure.png)

其他文件夹不要改动

最后再次开启Firefox Develop，你会发现数据转移了

PS: 就此次乌龙修补，

在about:config 下（前提：Develop版本），修改

1. xpinstall.signatures.required 为 false（插件签名）
2. extensions.langpacks.signatures.required 为 false（语言包签名）
