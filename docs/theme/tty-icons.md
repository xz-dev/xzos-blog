# TTY 手工栅格 UI 图标

第一方界面图标只有一套：手工 16 × 16 像素图标，日夜两个主题显示同一幅图，只有颜色随主题 token 变化。它们与 Unifont 字体使用相同的硬边方格语言。这里是**第一方界面标记的手工重绘**，不是把现有曲线 SVG、PNG 或文章图片自动降采样；不声称复原 Tektronix 4052 的原始图标或品牌官方像素版本。

## 图形源与渲染

- 唯一图形源：`src/lib/pixel-icons.ts` 的 `PIXEL_ICONS`，每个图标明确写成 **16 × 16** 个 `.` / `#`。`.` 透明，`#` 为当前文字色的实心方格。
- `pixelIconRects()` 只合并同一行内相邻的实心格，输出整数坐标、整数宽高的 `<rect>`；没有曲线、斜线、圆角、滤镜、描边、栅格图或自动追踪步骤。
- `src/components/PixelIcon.astro` 输出 `fill="currentColor"`、`shape-rendering="crispEdges"` 的内联 SVG。常规图标与页眉 logo 都是 16 CSS px（`--pixel-icon-size`，与正文字号相同，1 倍）。浏览器缩放仍可由用户控制；不承诺非整数缩放或非整数设备像素比下没有浏览器重采样。
- Logo 保留原 `/dotted_circle.png` 的**断续圆环、空心中央**语义。原图约 18 段蓝色短条，在手工 16 格版本中简化为 16 段分离短线；没有替换成实心圆、方框或无关徽记。
- 所有像素图标继承周围文字颜色，页眉 logo 取 `--accent`；无模糊、光晕、曲面、动画或过渡。
- 每个 `PixelIcon` 都带 `.pixel-icon`（`terminal.css`：16 px、`vertical-align: -2px`），没有按主题切换的类或样式表。原曲线 SVG（Mastodon、GitHub、Stack Overflow）已删除；`tty-pixel-icons.css` 与其中的 `!important` 切换规则已删除。

## 全部覆盖清单

| 第一方表面 | 像素图标（日夜相同） | 保留内容 |
| --- | --- | --- |
| `src/components/Header.astro` | `logo`（`--accent`）、`mastodon`、`github`、`stack-overflow` | 社交链接与 `sr-only` 名称不变；页眉不使用 `/dotted_circle.png`，该 PNG 只作日间 favicon |
| `src/components/Footer.astro` | 同三枚社交图标 | 链接与 `sr-only` 名称不变 |
| `src/components/ThemeToggle.astro` | 日间显示 `sun`，夜间显示 `moon` | 太阳/月亮表示当前主题，由 CSS 按 `data-theme` 二选一，首帧即正确；两枚都是像素图 |
| `src/components/LanguageVersionNotice.astro` | `globe` 语言版本标记；`translation` 机器翻译标记（`.notice-mark`） | 语言名与链接；原 🌐 / 🤖 已移除 |
| `src/components/TableOfContents.astro` | 关闭 `chevron-right`；打开 `chevron-down` | 不显示原生 `<summary>` marker；仍是原生 `<details>` 键盘交互 |
| `src/layouts/BlogList.astro` | 上一页 `arrow-left`，下一页与继续阅读 `arrow-right` | 中文/英文/简中文案，分页 URL、页码（当前页显示为 `[n]`）和省略号 |
| `src/components/PostThumbnail.astro` | 无（没有生成的 logo 或占位卡，没有真实图片的文章不显示缩略图） | 真实 `Image` / `<img class="thumbnail-image">`，归档列表中的 64 px 方形裁切（`object-fit: cover`），图片链接到文章 |
| `src/components/BaseHead.astro` + `src/pages/favicon-tty.svg.ts` | 夜间 favicon 为同源静态 `/favicon-tty.svg`，使用相同 `logo` 网格 | 日间 favicon 仍为 `/dotted_circle.png`（`image/png`、`192x192`）；Apple touch icon 仍为原 PNG |

`LanguageSwitcher.astro` 是纯文字语言代码（`zh` / `en` / `zh-CN`），页脚 RSS/Source/CC 是文字链接，不添加无必要的装饰图标。正文、摘要和页码中的 Unicode 标点属于内容/文字，继续使用原文字体；只替换列表 UI 标签中的 `←` / `→`。

## 日夜一致与可访问性

图标形状不随主题变化：日间与夜间渲染同一组 `<rect>`，只有 `currentColor` 继承的颜色不同。页眉社交图标与主题按钮在两个主题中都是 16 px 图标、`2ch` 宽的条目，切换主题不改变页眉布局。

`PixelArrowText.astro` 保留文案文本，只把 `←` / `→` 换成像素图标，日夜相同。分页链接的 `aria-label` 仍为原 `t(...)` 全文；“继续阅读”链接为 `t(...)` 全文加空格和文章标题，使同页各条链接的可访问名称互不相同。

TOC 的两枚图标与“目录”在模板中连续相接。`TableOfContents.astro` 去掉原生 marker，并依据 `<details open>` 显示一个手工三角；不通过脚本重建展开控件。

装饰图标使用 `aria-hidden="true"` / `focusable="false"`。页眉 logo 的可访问名称为 `site.logoAlt`（如 `xzOS logo`）；社交链接保留原屏幕阅读器文字。

## Favicon

favicon 保留日夜切换：日间是原 PNG 品牌图（Apple touch icon 也用它），夜间深色标签栏上用前景色绘制的像素 logo。`favicon-tty.svg.ts` 是 `prerender = true` 的 Astro 静态 SVG endpoint，调用与页面相同的 `pixelIconRects()` 来源。独立 SVG 没有父元素颜色，因此设定 `color="#d4ff3a"` 后仍以 `currentColor` 填充方格；透明背景，不做 PNG 过滤或二次栅格化。

`BaseHead.astro` 在首次主题检测后立即同步 favicon 的 `href`、`type`、`sizes`，并用只观察 `data-theme` 的 `MutationObserver` 跟随手动切换及未锁定偏好时的系统主题变化。回到日间时恢复全部原值。不依赖轮询、计时器、外部图标服务或另一个可能漂移的 logo 文件。Apple touch icon 是平台安装/收藏资源，保持原日间 PNG，不伪称能够动态控制平台已缓存的图标。

## 不处理的边界

- **文章图片**、图表、正文内 SVG、真实缩略图、hero image、用户头像、友链图像和社交分享/OG 图片均不栅格化、不变色；没有全局 `img` / `svg` 像素化或 `image-rendering` 规则。
- **Remark42** 评论界面由 `https://remark42.xzos.net` 跨域 iframe 提供，不是本地 CSS 可控制的 DOM。本次不改评论服务、头像或第三方 UI；现有 light/dark 协议保持原样。
- 系统/浏览器自己的菜单、选择器、滚动条、标签页和已缓存的书签图标不冒充为可被网页完全控制的第一方图标。

## 验证

```sh
node --test tests/tty-icons.test.ts
```

测试校验全部网格、SVG 整数方格的精确重建/无曲线、断续品牌语义、每个组件只用像素图标且没有原曲线 SVG 或按主题切换的规则、箭头语言/空格/可访问名称、真实缩略图分支隔离、16 px 尺寸、同源 favicon endpoint 及首次/手动/系统主题同步。

测试不能替代像素级浏览器验收：还需比较桌面/窄屏日夜截图中的图标形状（包括链接悬停）、主题按钮图标、TOC 开合、语言提示换行、首屏 favicon 与真实图片。生产构建、最终截图和发布由主任务统一执行；本图标分支不启动或修改生产服务。
