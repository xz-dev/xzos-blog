---
source_hash: "8eb6de71"
title: "Seamlessly Migrating from Firefox Stable to Developer Edition"
pubDate: "2020-06-05"
description: "Due to Mozilla's certificate expiration incident causing Firefox extensions to fail, this article explains how to seamlessly migrate Firefox data from the stable version to the developer edition."
author: "xz-dev"
category: "Firefox"
tags: ["Firefox", "Linux"]
---

> Mozilla's Major Blunder: Certificate Expiration Renders Firefox Extensions Unusable Worldwide
> This morning Mozilla played a not-so-small joke on Firefox users worldwide. Many woke up to find all their browser extensions non-functional, including on mobile versions.

Thus, how to seamlessly transfer data became the primary goal.

First, back up Firefox's user data folder. On Linux, this is the `.mozilla` folder in the user directory.

Then, rename the entire folder to `.mozilla.bak`.

Open Firefox Developer Edition, then close it (this generates a new user data directory).

Locate the `.mozilla` folder again (containing several database files) (as shown below) and overwrite all files inside with the corresponding backup folder (do not modify folder names).

![.mozilla folder structure](/images/blog/firefox-moved-from-stable-version-to-develop-version/mozilla-folder-structure.png)

Do not modify other folders.

Finally, restart Firefox Developer Edition - you'll find your data has been transferred.

PS: For fixing this blunder:

In `about:config` (Developer Edition required), modify:

1. Set `xpinstall.signatures.required` to `false` (extension signing)
2. Set `extensions.langpacks.signatures.required` to `false` (language pack signing)