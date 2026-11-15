# xzOS Blog

Personal blog of xz-dev, sharing IT tech and random thoughts.

**Live**: [https://xzos.net](https://xzos.net)

## Contributing

Feel free to open an Issue or PR to:

- Fix errors in articles
- Submit your own blog posts

Blog posts are located in `src/content/blog/`.

## Local Development

```sh
npm install
npm run dev
```

Visit `localhost:4321` to preview.

## Article timestamps

Record `pubDate` and optional `updatedDate` as **quoted ISO 8601 timestamps with the actual UTC offset at the place and moment of writing**, for example `"2026-10-25T01:00+08:00"` or `"2026-12-01T09:15:12-08:00"`. Use the offset in effect then, including daylight saving time; do not recalculate old posts from a new home timezone. `Z` records a UTC source. Preserve supplied minute, second or fractional-second precision rather than inventing it.

The content schema captures each original string before coercing dates. Article pages, publication/update dates, paginated lists and all language archives display numeric local date/time plus the recorded offset, e.g. `2026-10-25 01:00 UTC+08:00`; the home page's recent-posts rows show the date only (`2026-10-25`). The `<time datetime>` value retains that original ISO timestamp. Rendering is independent of build-host and reader timezones; sorting and RSS continue to use the same absolute instant.

Existing date-only records stay date-only: do not fabricate a time or offset. A legacy input already reduced to a JavaScript `Date` can only be represented in UTC, so quote new timestamps to retain the original local context. This display migration does not rewrite old Markdown or stored publication/update timestamps.

## Themes

- **Tokens:** every value lives in `src/styles/tokens.css`. `:root` holds the day palette and the type scale, spacing, widths and control sizes that both themes share; `:root[data-theme="tty"]` overrides colour values only. `src/styles/terminal.css` styles elements and the shared classes (page frame, controls, menu items, post list) from them; pages compose `PageFrame`, `PostMeta` and the `.control` class instead of styling their own.
- **Day (`data-theme="solarized"`, the attribute keeps its old name):** Termius Light (page `#e9ecf0`, surface `#dde1e7`, text `#2b3040`, secondary `#555d70`) with green accent `#117140`. Text reaches 4.5:1 on both fields; structural borders use `#768097` at 3:1 or more. Decorative separators use `--border-color` (`#cfd5de`).
- **Font (both themes):** `src/styles/fonts.css` loads the self-hosted **GNU Unifont**, including Latin, Chinese and other supported scripts, and `--font-ui` in `tokens.css` applies it once on `body`. Day and night, titles, prose, navigation, form controls and code share this pixel family (social preview cards under `/og/` are rendered at build time with GNU Unifont from `src/assets/og-fonts/`), so switching theme never changes a line break; no component sets its own `font-family`.
- **Header:** a terminal status line like tmux's (`xzOS For Coding Life │ 0:首页 1:文章* 2:关于 3:友链 lang: src* en zh-CN │ ☾ │` then the Mastodon, GitHub and Stack Overflow icons), groups split by `│`, one flat row of plain text on `--surface` with a 1px `--border-strong` bottom edge, the same in both themes. Entries are `.menu-item`s: hover recolours and underlines, the current page or section takes the accent and a trailing `*`; nothing is filled, framed or bevelled. The pixel logo and theme toggle are the same drawing in both themes. Details are in `docs/theme/design-language.md`.
- **Night / TTY:** Aura Dark (page `#15141b`, surface `#1f1d27`, text `#edecee`, secondary `#a19fad`) with purple accent `#a277ff`. The two themes have different accents: green by day, purple by night. Text reaches 4.5:1 on both fields; structural borders use `#6a677b` at 3:1 or more. The decorative border `#4f4a74` remains visible against the surface at 2:1. `tty.css` selects Shiki night colours and preserves the existing motion policy.
- **Browser dark modes:** `BaseHead.astro` declares `<meta name="color-scheme" content="light dark">` and `<meta name="darkreader-lock">`, so Dark Reader leaves the site's own themes alone; `tokens.css` sets `color-scheme: light` on day and `dark` on night, so native scrollbars and form controls follow the active theme.
- **Design language:** tokens, type scale, primitives, the header status line and the route-to-pattern map are in [`docs/theme/design-language.md`](docs/theme/design-language.md). Attribution and OFL license are in `public/fonts/unifont-OFL.txt`; only characters missing from the font use system glyph fallback.
- Both themes keep text sharp, with no glow, scanlines or vignette. The home logo and cursor stop under reduced motion and the pause control. Night UI feedback stays immediate, without transitions or smooth scrolling.
- Both directions of the theme switch are immediate. `ThemeToggle.astro` briefly sets `data-theme-switching`, commits the destination styles and removes the guard synchronously; neither theme has hover transitions. Do not leave the guard enabled or use an animation/timer to switch themes.
- Documents and controls stay flat in both themes, with the same geometry and focus outline. Code uses custom Termius Light and Aura Dark Shiki themes, and every token reaches 4.5:1 on its code surface (`src/lib/syntax-day.ts`). Article images keep their original colours; selection and marked prose use readable reverse video.
- Express night-only changes as token values in the night block of `tokens.css`, and limit them to colour: night never adds or changes a shape, frame, fill, size or spacing. Run `npm test` for palette/contrast and isolation regressions, then verify phone/desktop rendering, theme persistence and keyboard operation in a browser.

### Pixel typography

GNU Unifont 18.0.01 uses an 8×16 / 16×16 base grid and covers 58,910 code points in this build, including all 20,992 positions of the CJK Unified Ideographs block. The font is self-hosted as fixed Unicode-block WOFF2 subsets of the one family (Latin, other scripts, and CJK split into a common file of punctuation plus the 3,500 level-1 characters of the Table of General Standard Chinese Characters, with sixteen chunks for the remaining ideographs), declared with `unicode-range` so a page downloads only the blocks it renders; together they keep every code point. There is no external font service, per-article subsetting or CJK fallback to a modern sans face for supported characters. Ordinary body text is 1rem (16 CSS px at the default root size, the font's native grid); users can still zoom normally. Browsers may antialias grid outlines at fractional scaling — do not add blur or globally disable accessibility scaling.

The companion **Unifont Upper** is subset to the fixed supplementary-symbol range U+1F000–1FAFF (2,816 code points), including the site's emoji, so those also use monochrome pixel glyphs rather than the system's colored emoji. Both fonts are under the same OFL license. This is a fixed Unicode-range subset, not a per-article character list.

The source hashes, webfont hashes/sizes, coverage and outline/metric conversion checks are in [`docs/theme/tty-font.json`](docs/theme/tty-font.json). The original 4052 prints a **5×8 ASCII** character set (Tektronix Technical Data, printed page 2-12): this is a multilingual pixel adaptation, **not the 4052 original character font**. No Chinese historical authenticity is implied.

Unifont has one real weight and no italic. Disable synthetic bold/italic; use title size for headings and, following the terminal convention "bold is bright", the accent colour for `strong` and the secondary colour for `em` instead of thickening complex Chinese glyphs. The underline is reserved for links. Validate actual rendered Latin and CJK fonts in Chromium via `CSS.getPlatformFontsForNode`, not just `getComputedStyle().fontFamily` or `document.fonts.check()`.

To reproduce the webfont, download the pinned upstream OpenType source and its OFL text, then run this optional release-time tool (the normal Astro build has no Python dependency):

```sh
uv run --with fonttools==4.67.0 --with brotli==1.2.1 python scripts/build-tty-font.py /path/to/unifont-18.0.01.otf /path/to/OFL-1.1.txt /path/to/unifont_upper-18.0.01.otf
```

### Palette

The palette, accents and semantic terminal colours are documented in
[`docs/theme/design-language.md`](docs/theme/design-language.md).
`docs/theme/tty-dark.json` supplies the night favicon's foreground and is
checked against `tokens.css`; it contains no photographic reference or
derived palette. The day favicon remains `dotted_circle.png`.

For a deterministic local build without translation API calls or rewritten language variants:

```sh
env -u OPENAI_API_KEY -u OPENAI_MODEL npm run build
```

Run this in a checkout without an `.env` supplying those translation credentials.

## License

Blog content is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
