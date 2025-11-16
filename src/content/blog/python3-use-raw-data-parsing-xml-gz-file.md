---
title: "Python3 下载并解析 xml.gz 文件"
pubDate: "2020-05-28"
description: "使用 Python3 直接从原始数据解析 GZip 格式压缩的 XML 文件，无需先保存到磁盘。"
author: "xz-dev"
category: "代码笔记"
tags: ["Python3", "代码笔记"]
---

> 问题场景：需要从网上获取一个以 GZip 格式压缩的 xml 文件，并使用 Python3 解析。
>
> 前提需求：希望直接解析 raw 数据而不是先保存为文件。
>
> 一般处理方法：先保存为文件，再通过 Python3 的 [gzip 库](https://docs.python.org/3/library/gzip.html) 打开文件解析。

<!--more-->

参考资料：[Parsing a xml.gz file in python](https://stackoverflow.com/questions/33346729/parsing-a-xml-gz-file-in-python)、[tmpfile and gzip combination problem](https://stackoverflow.com/questions/2607206/tmpfile-and-gzip-combination-problem)

代码实现（以 [Xposed 模块官方仓库](https://repo.xposed.info/) 为例）

```python
import gzip
import requests
import tempfile
from xml.etree import ElementTree

raw = requests.get("https://dl-xda.xposed.info/repo/full.xml.gz", stream=True).raw.data  # 获取原始数据（bytes）

with tempfile.TemporaryFile(mode='w+b') as f:  # 创建虚拟文件（生成在内存中，关闭即清除）
    f.write(raw)
    f.flush()
    f.seek(0)  # 写入数据
    with gzip.GzipFile(mode='r', fileobj=f) as gzip_file:  # 解析虚拟文件
        tree = ElementTree.parse(gzip_file)
        print(tree.getroot())
```
