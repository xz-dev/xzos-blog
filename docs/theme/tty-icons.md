# TTY 手工栅格 UI 图标

夜间图标与夜间 Unifont 字体使用相同的硬边方格语言。这里是**第一方界面标记的手工重绘**，不是把现有曲线 SVG、PNG 或文章图片自动降采样；不声称复原 Tektronix 4052 的原始图标或品牌官方像素版本。

## 图形源与渲染

- 唯一图形源：`src/lib/pixel-icons.ts` 的 `PIXEL_ICONS`，每个图标明确写成 **16 × 16** 个 `.` / `#`。`.` 透明，`#` 为当前文字色的实心方格。
- `pixelIconRects()` 只合并同一行内相邻的实心格，输出整数坐标、整数宽高的 `<rect>`；没有曲线、斜线、圆角、滤镜、描边、栅格图或自动追踪步骤。
- `src/components/PixelIcon.astro` 输出 `fill="currentColor"`、`shape-rendering="crispEdges"` 的内联 SVG。常规图标为 16 CSS px；页眉品牌 48 px（3 倍），生成占位图品牌 80 px（5 倍）。浏览器缩放仍可由用户控制；不承诺非整数缩放或非整数设备像素比下没有浏览器重采样。
- Logo 保留原 `/dotted_circle.png` 的**断续圆环、空心中央**语义。原图约 18 段蓝色短条，在手工 16 格版本中简化为 16 段分离短线；没有替换成实心圆、方框或无关徽记。
- 所有夜间图标继承周围文字颜色；无模糊、光晕、曲面、动画或过渡。主题按钮的静态居中 `translate(-50%, -50%)` 不是运动效果。

## 全部覆盖清单

| 第一方表面 | 夜间手工图标 | 日间保留内容 |
| --- | --- | --- |
| `src/components/Header.astro` | 品牌 `logo`；`mastodon`、`github`、`stack-overflow` | 原 `/dotted_circle.png` 与三枚原曲线 SVG；社交链接、`sr-only` 名称不变 |
| `src/components/Footer.astro` | 同三枚社交图标 | 原三枚曲线 SVG 与链接名称 |
| `src/components/ThemeToggle.astro` | `moon` 当前夜间指示；也定义了配对 `sun` 网格 | 原 `sun-icon` / `moon-icon` SVG、20 px 尺寸与切换逻辑；维持日间太阳、夜间月亮的现有约定，手绘 `sun` 不会在夜间同时出现 |
| `src/components/LanguageVersionNotice.astro` | `globe` 语言版本标记；`translation` 机器人翻译标记 | 原 🌐 / 🤖；所有原提示文案、语言名与链接 |
| `src/components/TableOfContents.astro` | 关闭 `chevron-right`；打开 `chevron-down` | 原生 `<summary>` marker、目录文字与空格；仍是原生 `<details>` 键盘交互 |
| `src/layouts/BlogList.astro` | 上一页 `arrow-left`，下一页与继续阅读 `arrow-right` | 原中文/英文/简中文案与箭头字符，分页 URL、页码和省略号 |
| `src/components/PostThumbnail.astro` | 仅 `type: 'generated'` 分支的占位品牌 `logo` | 原生成占位卡与 PNG；真实 `Image` / `<img class="thumbnail-image">` 分支完全保留 |
| `src/components/BaseHead.astro` + `src/pages/favicon-tty.svg.ts` | 同源静态 `/favicon-tty.svg`，使用相同 `logo` 网格 | favicon 的 `/dotted_circle.png`、`image/png`、`192x192`；Apple touch icon 仍为原 PNG |

`LanguageSwitcher.astro` 是纯文字语言名称，页脚 RSS/Source/CC 是文字链接，不添加无必要的装饰图标。正文、摘要和页码中的 Unicode 标点属于内容/文字，继续使用原文字体；只替换列表 UI 标签中的 `←` / `→`。

## 日间隔离与可访问性

样式在 `src/styles/tty-pixel-icons.css`，由 `BaseHead.astro` 引入。新增 `.tty-pixel-icon` **默认 `display: none !important`**，只有 `:root[data-theme="tty"]` 显示；原图标只增加 `.tty-original-icon`，只有夜间隐藏。不新建改变原日间 flex/inline 层级的图标外框。

箭头文案由无外框的 `PixelArrowText.astro` 分成两个互斥分支：日间 `.tty-text-label` 保留**完整原字符串的单一文本节点**，夜间 `.tty-pixel-label` 才把箭头替换成方格 SVG。两个分支在各自主题使用 `display: contents`，避免 `.pagination span` 的内边距/边框创建新控件；显式继承颜色并禁用新增 span 自身过渡。不能只给日间箭头单独包 span：即使无盒子，也可能因文本运行被拆分而改变亚像素字宽。三个链接的 `aria-label` 仍为原 `t(...)` 全文；夜间分支与装饰 SVG 不重复加入可访问名称，所有文案、空格及原分页 URL 不变。

TOC 的两枚新图标与原“目录”在模板中连续相接，不引入日间空格。仅夜间清除原生 marker，并依据 `<details open>` 显示一个手工三角；不通过脚本重建展开控件。

装饰图标使用 `aria-hidden="true"` / `focusable="false"`。夜间品牌有与日间图片相同的 `xzOS logo` 可访问名称；社交链接保留原屏幕阅读器文字。

## Favicon

`favicon-tty.svg.ts` 是 `prerender = true` 的 Astro 静态 SVG endpoint，调用与页面相同的 `pixelIconRects()` 来源。独立 SVG 没有父元素颜色，因此设定 `color="#31fea8"` 后仍以 `currentColor` 填充方格；透明背景，不做 PNG 过滤或二次栅格化。

`BaseHead.astro` 在首次主题检测后立即同步 favicon 的 `href`、`type`、`sizes`，并用只观察 `data-theme` 的 `MutationObserver` 跟随手动切换及未锁定偏好时的系统主题变化。回到日间时恢复全部原值。不依赖轮询、计时器、外部图标服务或另一个可能漂移的 logo 文件。Apple touch icon 是平台安装/收藏资源，保持原日间 PNG，不伪称能够动态控制平台已缓存的图标。

## 不处理的边界

- **文章图片**、图表、正文内 SVG、真实缩略图、hero image、用户头像、友链图像和社交分享/OG 图片均不栅格化、不变色；没有全局 `img` / `svg` 像素化或 `image-rendering` 规则。
- **Remark42** 评论界面由 `https://remark42.xzos.net` 跨域 iframe 提供，不是本地 CSS 可控制的 DOM。本次不改评论服务、头像或第三方 UI；现有 light/dark 协议保持原样。
- 系统/浏览器自己的菜单、选择器、滚动条、标签页和已缓存的书签图标不冒充为可被网页完全控制的第一方图标。

## 验证

```sh
node --test tests/tty-icons.test.ts
```

测试校验全部网格、SVG 整数方格的精确重建/无曲线、断续品牌语义、每个组件的替换与原日间图形保留、箭头语言/空格/可访问名称、真实缩略图分支隔离、夜间整数尺寸/零动画、同源 favicon endpoint 及首次/手动/系统主题同步。

测试不能替代像素级浏览器验收：构建后还需与基线比较桌面/窄屏日间截图（包括链接悬停）、夜间按钮居中、TOC 开合、语言提示换行、首屏 favicon 与真实图片。生产构建、最终截图和发布由主任务统一执行；本图标分支不启动或修改生产服务。
