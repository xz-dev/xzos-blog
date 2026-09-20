---
source_hash: "563845ad"
source_lang: "en"
target_lang: "zh-CN"
lang: "zh-CN"
title: "将带有半透明效果的 WebM/WebP 转换为 GIF"
description: "如何将带有半透明效果的 WebM/WebP 格式转换为 GIF，并处理半透明像素的技术方案。"
pubDate: "2024-09-15T00:00:00+08:00"
author: "xz-dev"
category: "算法"
tags: ["FFMPEG", "PIL", "semi-transparent", "transparency", "WebM", "WebP"]
---

## 前言

由于 [Add support of animated sticker #78](https://github.com/maunium/stickerpicker/pull/78)

目前互联网上没有直接将 WebM 转换为 GIF 的方法。

我的思路是：WebM -> WebP -> GIF（因为每一步都有现成的工具）

以下是需要克服的难点：

- 从 WebM 中移除 vp8/9，以便后续操作更容易（参考 [How can I convert WebM file to WebP file with transparency?](https://stackoverflow.com/questions/63554209/how-can-i-convert-webm-file-to-webp-file-with-transparency)）
- 将 WebP 转换为 GIF（参考 [How to Convert WebP image to Gif with Python?](https://stackoverflow.com/questions/52016407/how-to-convert-webp-image-to-gif-with-python)），并处理半透明像素（这正是我们需要面对的问题）

## 如何处理 GIF 中的半透明

首先，GIF 不支持半透明像素。

如果我们直接用 PIL 将 WebP 转换为 GIF，会看到所有半透明像素都变成白色，就像这样（建议在深色模式下查看）。

<figure style="display: flex; gap: 1rem;">
  <figure>
    <img src="/images/blog/webm-webp-to-gif-with-semi-transparency/webp-example-1.webp" alt="webp 示例" />
  </figure>
  <figure>
    <img src="/images/blog/webm-webp-to-gif-with-semi-transparency/gif-example-1.gif" alt="GIF 示例" />
  </figure>
</figure>

所以，我们可以简单地将所有半透明像素变为透明，就像这样，但我们会看到另一个问题（也请在深色模式下查看）。

<figure style="display: flex; gap: 1rem;">
  <figure>
    <img src="/images/blog/webm-webp-to-gif-with-semi-transparency/webp-example-2.webp" alt="webp 示例 2" />
  </figure>
  <figure>
    <img src="/images/blog/webm-webp-to-gif-with-semi-transparency/gif-example-2.gif" alt="损坏的 GIF 示例 2" />
  </figure>
</figure>

根据运气不同，你可能会看到像素空洞或边缘破损（上面的示例中这两个问题都存在）。

因此，我们似乎必须用某种方法来推测半透明像素在人眼中应该是什么样子。

### 二值分类（删除所有半透明像素）

将半透明像素视为完全透明或完全不透明：

- 如果像素的透明度（alpha 值）大于或等于阈值 `128`，则将其设为 `255`（完全不透明）。
- 如果像素的透明度（alpha 值）小于阈值 `128`，则将其设为 `0`（完全透明）。

这样可以确保没有半透明像素，从而防止边缘出现白色或其他不期望的颜色。

### **腐蚀**然后**膨胀**（填充/平滑边缘）

腐蚀操作使用最小值滤波器：

- 掩码的中心像素值被其邻域的最小值替换。
- 腐蚀有助于消除小的白色噪点并收缩边缘。

膨胀操作使用最大值滤波器：

- 掩码的中心像素值被其邻域的最大值替换。
- 膨胀有助于恢复主体部分并扩展边缘。

通过先腐蚀后膨胀，可以平滑边缘，并过滤掉形态学中不必要的小噪点，同时保持主体结构。

### 代码片段

```python
def process_frame(frame):
    """
    Process GIF frame, repair edges, ensure no white or semi-transparent pixels,
    while keeping color information intact.
    """
    frame = frame.convert('RGBA')

    # Decompose Alpha channel
    alpha = frame.getchannel('A')

    # Process Alpha channel with threshold, remove semi-transparent pixels
    # Threshold can be adjusted as needed (0-255), 128 is the middle value
    threshold = 128
    alpha = alpha.point(lambda x: 255 if x >= threshold else 0)

    # Process Alpha channel with MinFilter, remove edge noise
    alpha = alpha.filter(ImageFilter.MinFilter(3))

    # Process Alpha channel with MaxFilter, repair edges
    alpha = alpha.filter(ImageFilter.MaxFilter(3))

    # Apply processed Alpha channel back to image
    frame.putalpha(alpha)

    return frame
```

### 为什么如此有效？

- **消除半透明像素：** 阈值处理将半透明像素分别转换为完全透明或完全不透明的像素，从而避免边缘出现白色或其他噪点。
- **平滑边缘：** 腐蚀和膨胀的组合操作通过先收缩再扩展来平滑图像边缘。腐蚀可以去除小噪点，膨胀可以恢复主体部分——这样，在消除小噪点的同时，尽可能保留大块图像信息。
- **保留颜色信息：** 由于只处理 Alpha 通道，不改变 RGB 颜色通道，因此颜色信息保持不变。

## 开箱即用的代码

```bash
# python convert.py example.webp exanple.gif
# python convert.py example.webm exanple.gif
```

```python
import mimetypes
import subprocess
import tempfile
from PIL import Image, ImageSequence, ImageFilter
import os
import sys

def guess_mime(data: bytes) -> str:
    import magic
    mime = magic.Magic(mime=True)
    return mime.from_buffer(data)

def _video_to_webp(data: bytes) -> bytes:
    mime = guess_mime(data)
    ext = mimetypes.guess_extension(mime)
    with tempfile.NamedTemporaryFile(suffix=ext) as video:
        video.write(data)
        video.flush()
        with tempfile.NamedTemporaryFile(suffix=".webp") as webp:
            print(".", end="", flush=True)
            ffmpeg_encoder_args = []
            if mime == "video/webm":
                encode = subprocess.run(
                    ["ffprobe", "-v", "error", "-select_streams", "v:0",
                     "-show_entries", "stream=codec_name",
                     "-of", "default=nokey=1:noprint_wrappers=1", video.name],
                    capture_output=True, text=True
                ).stdout.strip()
                ffmpeg_encoder = None
                if encode == "vp8":
                    ffmpeg_encoder = "libvpx"
                elif encode == "vp9":
                    ffmpeg_encoder = "libvpx-vp9"
                if ffmpeg_encoder:
                    ffmpeg_encoder_args = ["-c:v", ffmpeg_encoder]
            result = subprocess.run(
                ["ffmpeg", "-y", "-threads", "auto", *ffmpeg_encoder_args,
                 "-i", video.name, "-lossless", "1", webp.name],
                capture_output=True
            )
            if result.returncode != 0:
                raise RuntimeError(
                    f"Run ffmpeg failed with code {result.returncode}, "
                    f"Error occurred:\\n{result.stderr}"
                )
            webp.seek(0)
            return webp.read()

def video_to_webp(data: bytes) -> bytes:
    mime = guess_mime(data)
    ext = mimetypes.guess_extension(mime)
    with tempfile.NamedTemporaryFile(suffix=ext) as temp:
        temp.write(data)
        temp.flush()
        with tempfile.NamedTemporaryFile(suffix=ext) as temp_fixed:
            print(".", end="", flush=True)
            result = subprocess.run(
                ["ffmpeg", "-y", "-threads", "auto", "-i", temp.name,
                 "-codec", "copy", temp_fixed.name],
                capture_output=True
            )
            if result.returncode != 0:
                raise RuntimeError(
                    f"Run ffmpeg failed with code {result.returncode}, "
                    f"Error occurred:\\n{result.stderr}"
                )
            temp_fixed.seek(0)
            data = temp_fixed.read()
    return _video_to_webp(data)

def process_frame(frame):
    frame = frame.convert('RGBA')
    alpha = frame.getchannel('A')
    threshold = 128
    alpha = alpha.point(lambda x: 255 if x >= threshold else 0)
    alpha = alpha.filter(ImageFilter.MinFilter(3))
    alpha = alpha.filter(ImageFilter.MaxFilter(3))
    frame.putalpha(alpha)
    return frame

def webp_to_gif(data: bytes) -> bytes:
    with tempfile.NamedTemporaryFile(suffix=".webp") as webp:
        webp.write(data)
        webp.flush()
        with tempfile.NamedTemporaryFile(suffix=".gif") as img:
            print(".", end="", flush=True)
            im = Image.open(webp.name)
            im.info.pop('background', None)
            frames = []
            duration = []
            for frame in ImageSequence.Iterator(im):
                frame = process_frame(frame)
                frames.append(frame)
                duration.append(frame.info.get('duration', 100))
            frames[0].save(
                img.name, save_all=True, lossless=True, quality=100, method=6,
                append_images=frames[1:], loop=0, duration=duration, disposal=2
            )
            img.seek(0)
            return img.read()

def convert(input_path: str, output_path: str):
    with open(input_path, 'rb') as f:
        data = f.read()
    mime = guess_mime(data)
    if mime in ["video/webm", "image/webp"]:
        if mime == "video/webm":
            data = video_to_webp(data)
        gif_data = webp_to_gif(data)
        with open(output_path, 'wb') as f:
            f.write(gif_data)
    else:
        raise ValueError("Unsupported file type")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python convert_video.py <input_path> <output_path>")
        sys.exit(1)
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    if not os.path.isfile(input_path):
        print(f"Input file does not exist: {input_path}")
        sys.exit(1)
    convert(input_path, output_path)
    print(f"Conversion completed. Output saved to {output_path}")
```