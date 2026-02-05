---
source_hash: "ccec3796"
title: "Modifying the Parent Commit of a Historical Commit"
pubDate: "2021-02-06"
description: "Using Git's grafts and filter-repo tools to modify the parent commit order in history, solving the issue of incorrect merge direction."
author: "xz-dev"
category: "Git"
tags: ["Git", "UpgradeAll"]
---

Half a year ago, when merging the hotfix branch, the merge direction was reversed, causing the hotfix branch to become the new main branch. There was no solution at the time, but today I revisited the issue and attempted to fix it.

<!--more-->

> References
>
> 1. [How do I swap the order of two parents of a Git commit?](https://stackoverflow.com/questions/25265528/how-do-i-swap-the-order-of-two-parents-of-a-git-commit) (Introduction)
> 2. [How do git grafts and replace differ? (Are grafts now deprecated?)](https://stackoverflow.com/questions/6800692/how-do-git-grafts-and-replace-differ-are-grafts-now-deprecated)
> 3. [Setting git parent pointer to a different parent](https://stackoverflow.com/questions/3810348/setting-git-parent-pointer-to-a-different-parent) (Solution source)

## Preview of Results

- Before Fix

![Git Commit Tree Before Fix](/images/blog/how-to-swap-the-order-of-two-parents-of-a-git-commit/before.png)

- After Fix

![Git Commit Tree After Fix](/images/blog/how-to-swap-the-order-of-two-parents-of-a-git-commit/after.png)

## Steps

> Backup project files (create a compressed archive)

### Create a Graft Commit

Switch (modify) the target branch's information (including parent branches, etc.) ([Reference](https://stackoverflow.com/a/40540389))

```bash
git replace --graft <target commit> <main branch parent node> <hotfix branch parent node>
```

### Verify Changes

Check if the grafted commit information is correct and meets expectations (the original commit hasn't been modified yet; it's only saved in .git/refs/replace/)

View original commit information:

```bash
git cat-file commit <target commit>
```

View grafted commit information:

```bash
git --no-replace-objects cat-file commit <target commit>
```

### Overwrite Original Commit

Install git-filter-repo (requires Git version 2.22 or higher)

Overwrite the commit ([Reference](https://stackoverflow.com/a/62479351)):

```bash
git filter-repo --force
```

### Rebind Remote Repository

```bash
git remote add origin <your remote repository URL>
```

### Push Changes

> Push the changes (required for each branch):

```bash
git push -f <branch name>
```

## Notify Project Stakeholders

Inform fellow developers to save their current code and re-pull the project 🙂