---
title: "WebM/WebP to GIF with semi-transparency"
pubDate: "2024-09-15"
description: "如何将带有半透明效果的 WebM/WebP 格式转换为 GIF，并处理半透明像素的技术方案。"
author: "xz-dev"
category: "算法"
tags: ["FFMPEG", "PIL", "semi-transparent", "transparency", "WebM", "WebP"]
---

## Preface

Due to [Add support of animated sticker #78](https://github.com/maunium/stickerpicker/pull/78)

There is currently no direct way to convert WebM to GIF this on the Internet.

My idea is: WebM -> WebP -> GIF (due each steps have existing tools)

Here are the difficulties we need to overcome:

- Remove vp8/9 from WebM to let we more easy to do next (Refer [How can I convert WebM file to WebP file with transparency?](https://stackoverflow.com/questions/63554209/how-can-i-convert-webm-file-to-webp-file-with-transparency))
- Convert WebP to GIF (Refer [How to Convert WebP image to Gif with Python?](https://stackoverflow.com/questions/52016407/how-to-convert-webp-image-to-gif-with-python)) and handling semi-transparent pixels (here is what we need to face)

## How to handing semi-transparent in GIF

Firstly, GIF does not support semi-transparent pixels.

If we directly "Convert WebP to GIF" using PIL. We will see all semi-transparent pixels become white like this (you should see them in dark mode).

<figure style="display: flex; gap: 1rem;">
  <figure>
    <img src="/images/blog/webm-webp-to-gif-with-semi-transparency/webp-example-1.webp" alt="webp example" />
  </figure>
  <figure>
    <img src="/images/blog/webm-webp-to-gif-with-semi-transparency/gif-example-1.gif" alt="GIF example" />
  </figure>
</figure>

So, we can simply let all semi-transparent pixel become transparency, like this, but we will see another problem (also dark mode pls).

<figure style="display: flex; gap: 1rem;">
  <figure>
    <img src="/images/blog/webm-webp-to-gif-with-semi-transparency/webp-example-2.webp" alt="webp example 2" />
  </figure>
  <figure>
    <img src="/images/blog/webm-webp-to-gif-with-semi-transparency/gif-example-2.gif" alt="break GIF example 2" />
  </figure>
</figure>

Depending on your luck, you may see pixel holes or broken edges (Both of these problems exist in the example above).

Therefore, it seems we must use something to guess the semi-transparent pixel should been look like in human eyes.

### Binary classification (Delete all semi-transparent pixel)

Treat semi-transparent pixels as fully transparent or fully opaque:

- If the pixel's transparency (alpha value) is greater than or equal to the threshold `128`, set it to `255` (fully opaque).
- If the pixel's transparency (alpha value) is less than the threshold `128`, set it to `0` (fully transparent).

This ensures that there are no semi-transparent pixels, thus preventing white or other undesirable colors from appearing at edges.

### **Erosion** then **Dilation** (Fill/Smooth edges)

The erosion operation uses a minimum filter:

- The middle pixel value of the mask is replaced by the minimum value of its neighborhood.
- Erosion helps to eliminate small white noise points and shrink the edges.

The dilation operation uses a maximum filter:

- The middle pixel value of the mask is replaced by the maximum value in its neighborhood.
- Dilation helps to restore the main part and expand the edges.

By corroding and then dilating, the edges can be smoothed and small noise points that are not necessary in morphology can be filtered out while maintaining the main structure.

### Code Fragment

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

### Why is it so effective?

- **Eliminate semi-transparent pixels:** Threshold processing converts semi-transparent pixels into fully transparent or fully opaque pixels, respectively, thereby avoiding white or other noise at the edges.
- **Smooth edges:** The combined operation of erosion and dilation smoothes the edges of the image by shrinking and then expanding. Erosion can remove small noise points, and dilation can restore the main part – in this way, while eliminating small noise, large blocks of image information are retained as much as possible.
- **Keep color information:** Since only the Alpha channel is processed and the RGB color channels are not changed, the color information remains unchanged.

## Out-of-the-box code

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
