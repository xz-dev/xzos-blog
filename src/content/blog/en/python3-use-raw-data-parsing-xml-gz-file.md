---
source_hash: "fe031a23"
title: "Python3 Download and Parse xml.gz Files"
pubDate: "2020-05-28"
description: "Using Python3 to directly parse GZip-compressed XML files from raw data without saving to disk first."
author: "xz-dev"
category: "Code Notes"
tags: ["Python3", "Code Notes"]
---

> Scenario: Need to fetch a GZip-compressed XML file from the web and parse it using Python3.
>
> Requirement: Want to parse the raw data directly without saving as a file first.
>
> Common approach: First save as a file, then use Python3's [gzip library](https://docs.python.org/3/library/gzip.html) to open and parse the file.

<!--more-->

References: [Parsing a xml.gz file in python](https://stackoverflow.com/questions/33346729/parsing-a-xml-gz-file-in-python), [tmpfile and gzip combination problem](https://stackoverflow.com/questions/2607206/tmpfile-and-gzip-combination-problem)

Implementation (using [Xposed Module Repository](https://repo.xposed.info/) as example)

```python
import gzip
import requests
import tempfile
from xml.etree import ElementTree

raw = requests.get("https://dl-xda.xposed.info/repo/full.xml.gz", stream=True).raw.data  # Get raw data (bytes)

with tempfile.TemporaryFile(mode='w+b') as f:  # Create virtual file (in memory, cleared when closed)
    f.write(raw)
    f.flush()
    f.seek(0)  # Write data
    with gzip.GzipFile(mode='r', fileobj=f) as gzip_file:  # Parse virtual file
        tree = ElementTree.parse(gzip_file)
        print(tree.getroot())
```