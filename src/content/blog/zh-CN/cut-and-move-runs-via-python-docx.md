---
source_hash: "55d6dedb"
source_lang: "en"
target_lang: "zh-CN"
lang: "zh-CN"
title: "通过 python-docx 剪切和移动 Run"
pubDate: "2024-03-19T00:00:00+08:00"
description: "如何在 python-docx 中实现 Run 对象的剪切和移动操作，解决库本身不支持的问题。"
author: "xz-dev"
category: "Tips"
tags: ["oxml", "python", "python-docx"]
---

> 我想在同一个文档中剪切并粘贴一个 run，但 python-docx(1.1.0) 没有这个功能。
>
> 这里有一些相关页面，但并没有解决这个问题：[How do I copy the contents of a word document?](https://stackoverflow.com/questions/48869423/how-do-i-copy-the-contents-of-a-word-document) [Copy paragraphs elements from one document to another](https://github.com/python-openxml/python-docx/issues/182#top)

所以我仔细阅读了源代码，发现：

- 你可以通过 `paragraph._p` 和 `run._r` 处理 OXML 对象，也可以调用 `(paragraph/run)._element`
- 如果你把一个 `run._r` 添加到另一个 `paragraph._p`，它会自动从原段落中移除

代码如下：

```python
# Get all_para and para_number
# all_para: all_para in document, para_number: current index in all_para
try:
    next_para = all_para[para_number + 1]
    new_para = next_para.insert_paragraph_before(style=para.style)
except IndexError:
    new_para = para._parent.add_paragraph(para.style)

run = para.runs[-1]
new_para._p.append(run._r)

# save document
```