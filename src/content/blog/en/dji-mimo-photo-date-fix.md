---
source_hash: "d1fb81d1"
title: "Batch Fix Shooting Time for DJI Mimo Exported Photos/Videos"
pubDate: "2026-01-04"
description: "Using osxphotos timewarp command to extract correct shooting time from filenames and batch fix dates for DJI Mimo exported files in Apple Photos"
author: "xz-dev"
category: "Tips"
tags: ["DJI Mimo", "Apple Photos", "osxphotos", "macOS", "Photo Management"]
---

When importing photos and videos exported from DJI Mimo APP into Apple Photos, the dates may display incorrectly. More frustratingly, Apple Photos doesn't natively support batch restoration of original shooting times - the "Restore" button disappears when selecting multiple photos.

This article explains how to use the osxphotos timewarp command to extract correct shooting times from filenames and perform batch fixes.

<!--more-->

## Prerequisites

This method requires a macOS environment. You can choose:

- Use a Mac computer
- Create a macOS virtual machine via [quickemu](https://github.com/quickemu-project/quickemu) (recommended)
- Create a macOS virtual machine via [ultimate-macOS-KVM](https://github.com/Coopydood/ultimate-macOS-KVM)

## DJI Mimo Filename Structure

First, understand DJI Mimo's filename structure:

```
dji_mimo_20260101_151718_20260101151719_1767262128881_photo.jpg
│        │        │      │              │             │
│        │        │      │              │             └─ Type identifier (photo/video)
│        │        │      │              └─ Unix timestamp (milliseconds)
│        │        │      └─ Second timestamp: YYYYMMDDHHMMSS (actual shooting time)
│        │        └─ First timestamp's time part: HHMMSS
│        └─ First timestamp's date part: YYYYMMDD
└─ Fixed prefix
```

### Difference Between Two Timestamps

| Timestamp | Example | Meaning |
|--------|------|------|
| First | `20260101_151718` | File creation/save time |
| Second | `20260101151719` | **Actual shooting time** (what we need) |

> For videos, the difference may be the video duration (end vs start of recording); for photos, usually just about 1 second apart.

## osxphotos parse-date Parsing Rules

The `--parse-date` parameter uses strptime-like format with extended wildcards:

| Symbol | Meaning | Example |
|------|------|------|
| `%Y` | 4-digit year | `2026` |
| `%m` | 2-digit month | `01` |
| `%d` | 2-digit day | `01` |
| `%H` | 2-digit hour (24h) | `15` |
| `%M` | 2-digit minute | `17` |
| `%S` | 2-digit second | `19` |
| `*` | Match any characters (wildcard) | Skip unwanted parts |
| `?` | Match single character | More precise skipping |

### Parsing Pattern Explanation

```
dji_mimo_*_*_%Y%m%d%H%M%S
│        │ │ └─ Extract: 20260101151719
│        │ └─ Skip: 151718
│        └─ Skip: 20260101
└─ Fixed match: dji_mimo_
```

Why use `*` instead of `????????`:
- `*` matches any length, more flexible
- `????????` exactly matches 8 characters, more strict
- For DJI Mimo files, `*` is sufficient and more concise

## Install osxphotos

```bash
brew install osxphotos
```

Detailed installation instructions: [osxphotos Official Installation Docs](https://github.com/RhetTbull/osxphotos?tab=readme-ov-file#installation-using-brew)

## Steps

### 1. Organize Photos into Album

In Apple Photos, gather all DJI Mimo exported files into one album (e.g., `DJI Album`).

### 2. Run Fix Command

```bash
osxphotos timewarp \
  --album "DJI Album" \
  --parse-date "dji_mimo_*_*_%Y%m%d%H%M%S" \
  --timezone "Asia/Shanghai" \
  --verbose
```

### Parameter Explanation

| Parameter | Description |
|------|------|
| `--album` | Specify album name to process |
| `--parse-date` | Filename parsing pattern |
| `--timezone` | Timezone setting (adjust based on your location) |
| `--verbose` | Show detailed output |

### 3. Verify Results

Two methods:

**Directly in Apple Photos (recommended)**: Open Photos app and check if photo/video dates have been updated.

**Command line query (optional)**:

```bash
osxphotos query --album "DJI Album" --json | jq | head -100
```

Note: `--json` output is single-line JSON, requiring `jq` for readable formatting.

## Notes

> **Must log in with your own iCloud account**: iCloud sync is global, you can't switch Photos account separately. If using a VM, log in with your Apple ID in the VM.

- Recommended to back up photo library before operation
- This method works for both photos and videos