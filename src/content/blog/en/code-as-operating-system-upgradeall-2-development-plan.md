---
source_hash: "e1ce0d99"
title: "Code as Operating System (UpgradeAll 2 Development Plan)"
pubDate: "2023-10-18"
description: "Exploring operations from a programmer's perspective, proposing a new build system concept supporting rollback and feature-oriented design, along with UpgradeAll 2's development direction."
author: "xz-dev"
category: "Linux"
tags: ["Android", "Linux", "UpgradeAll"]
---

> As I use more electronic products spanning Linux desktops/servers and Android, I've realized there are limits to backup/restore OS configurations - the fundamental limitation being that it neither understands nor can understand the meaning of data.
>
> Whether it's DNS hosts or software database caches, they're all just "files" in its eyes.

## The Past

This led to the idea of "code as infrastructure," exemplified by Ansible and Terraform. However, their interpretation of "code" contains significant flaws. With software code, most side effects disappear when the software stops running, and the remaining side effects can be covered by test code.

## The Present

An operating system doesn't shut down when Ansible or Terraform stops running, nor do its side effects disappear simply because I delete a line in Ansible and rerun it. This creates so-called "configuration drift." Traditional infrastructure-as-code tools "self-deceptively" solve this with "idempotency." While idempotency is indeed important—preventing duplicate configurations or errors from unnecessary repetition—it doesn't address the rollback problem.

Yet most operations can be rolled back. With proper configuration, even file deletions can be undone. Modern operating systems provide many rollback tools: git, filesystem snapshots, even simple recycle bins. But from an operations perspective, reproducibility and rollback have shrunk to one-time snapshots—the approach of OCI and NixOS.

## The Future

I propose a new build system: operations from a programmer's perspective. It would add rollback support for all reversible operations. If you delete an operation from configuration code, the system would automatically roll back that specific operation during the next run.

Furthermore, I believe the experience of installing software and maintaining systems should be preserved as collective wisdom through programming, rather than forcing people to repeatedly relearn simple tasks.

The future of operations should resemble NixOS—feature-oriented, not package-oriented.

This system should have these characteristics:

- Designed for end users
- Goal-oriented, focusing on "unit tests" because OSes should serve functionality, not the abstract concept of "software"
- Supports rollback
- Primarily single-machine applications (though capable of remote execution)
- Compatible with existing ops technologies, preferably using them for configuration (initial version may use Ansible)—we don't need more wheels
- Can automatically inspect existing configured systems and generate configuration code
- Flexible logic code—part of this project's purpose is to advance Gentoo's development (source code freedom enables choice freedom and guarantees liberty)

## For Android

On Android, this system would manifest as UpgradeAll.

Because I want UpgradeAll to have these features:

- Compiled from source (you can freely use unmerged developer branches/features)
- Developer-friendly (you can program your update workflow)
- User-friendly (you focus on needed functionality rather than hunting apps—that's developers' job, see quickenergy)
- Promotes Android app openness (Android's closed nature stems largely from its binary distribution model, tui)