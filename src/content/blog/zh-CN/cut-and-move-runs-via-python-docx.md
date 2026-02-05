---
source_hash: "a8f101a5"
source_lang: "zh"
target_lang: "zh-CN"
is_copy: true
title: "Cut and move Runs via python-docx"
pubDate: "2024-03-19"
description: "如何在 python-docx 中实现 Run 对象的剪切和移动操作，解决库本身不支持的问题。"
author: "xz-dev"
category: "Tips"
tags: ["oxml", "python", "python-docx"]
---

> I want to cut and paste a run in one same document, but python-docx(1.1.0) don't have the function.
>
> Here are some related page, but it doesn't solve the problem: [How do I copy the contents of a word document?](https://stackoverflow.com/questions/48869423/how-do-i-copy-the-contents-of-a-word-document) [Copy paragraphs elements from one document to another](https://github.com/python-openxml/python-docx/issues/182#top)

So I carefully read the source code and found that:

- You can process OXML object via `paragraph._p` and `run._r`, also call `(paragraph/run)._element`
- If you add a `run._r` to an other `paragraph._p`, it will be automatically removed from the origin paragraph

Here's the code snippet:

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
