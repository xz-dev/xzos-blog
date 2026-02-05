---
source_hash: "a673aa84"
title: "Displaying Only Dotfiles with exa"
pubDate: "2022-08-16"
description: "exa is a replacement for the ls command. This article explains how to use exa to display only dotfiles."
author: "xz-dev"
category: "Linux"
tags: ["Arch Linux", "exa", "shell"]
---

> exa is a replacement for the ls command, designed to provide a more user-friendly and colorful interface, similar to what bat aims to achieve.

## Background

After briefly trying exa, I decided to alias it to replace ls for a trial period. Then I discovered that the `ls -al --ignore="[^.]*"` command couldn't be directly replaced since exa doesn't have an ignore parameter.

## Testing Commands

After checking the documentation, I found that exa supports filtering based on glob syntax ([Filtering section in the docs](https://the.exa.website/features/filtering)).

So the command to display only dotfiles should be:

```bash
exa -la --ignore-glob="[!.]*"
```

Here, `"!"` means "not include".

## Adding Aliases

Finally, my modified rc file looks like this (the color option is just for convenience when switching back to ls, as exa enables colors by default):

```bash
alias ls='exa'
alias l.='exa -la --ignore-glob="[!.]*"'
alias ll='ls --color=auto -l'
alias la='ls --color=auto -la'
```