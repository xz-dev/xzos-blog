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

The content schema captures each original string before coercing dates. Article pages, publication/update dates, home/paginated lists and all language archives display numeric local date/time plus the recorded offset, e.g. `2026-10-25 01:00 UTC+08:00`. The `<time datetime>` value retains that original ISO timestamp. Rendering is independent of build-host and reader timezones; sorting and RSS continue to use the same absolute instant.

Existing date-only records stay date-only: do not fabricate a time or offset. A legacy input already reduced to a JavaScript `Date` can only be represented in UTC, so quote new timestamps to retain the original local context. This display migration does not rewrite old Markdown or stored publication/update timestamps.

## Themes

- **Tokens:** every value lives in `src/styles/tokens.css`. `:root` holds the day palette and the type scale, spacing, widths and control sizes that both themes share; `:root[data-theme="tty"]` overrides colours and night effect values (glow, scanlines, vignette) only. `src/styles/terminal.css` styles elements and the shared classes (page frame, controls, post list) from them; pages compose `PageFrame`, `PostMeta` and the `.control` class instead of styling their own.
- **Day (`data-theme="solarized"`):** the palette is a warm peach paper (page `#fff8f2`, surface `#ffeadb`, text `#42302a`, secondary `#76605a`, accent `#b4410f`) under a soft header gradient from `#ffe4cc`; every text color keeps WCAG AA (4.5:1) on the page, the code surface and both ends of the header gradient. Structural borders (tables, code, quotes) use `--border-strong` `#c3663c` at 3:1 or more on the page and the surface; the lighter `--border-color` is for decorative separators only. Day code uses GitHub Light's rules with its comment, keyword, tag and variable colours darkened in hue (`src/lib/syntax-day.ts`), so every syntax colour reaches 4.5:1 on the code surface. Fira Code 5.2 (the Google Fonts build it was previously loaded from) is self-hosted from `public/fonts/` (Latin and extended subsets built by `scripts/build-day-font.py`; OFL in `public/fonts/fira-code-OFL.txt`).
- **Night / TTY:** `src/styles/tty.css` applies the night glow, overlay and control bevels from the values in `tokens.css`, and loads the self-hosted **GNU Unifont**, including Latin, Chinese and other supported scripts. Titles, prose, navigation, form controls, code and generated text share this pixel family. Attribution and OFL license are in `public/fonts/unifont-OFL.txt`; only characters missing from the font use system glyph fallback.
- Night mode deliberately keeps the artistic distance of a monochrome terminal, not an actual reading barrier. Keep text legible, links recognizable and controls direct. Allowed effects are static only: a phosphor glow on text (`0 0 2px currentColor, 0 0 8px` at 45% of the foreground; code blocks stay sharp), scanlines (a 1px line at 12% black every 3px) and a soft vignette, both on a fixed layer behind the content that takes no pointer events, so they darken the field and never the text. No motion, flicker, moving lines, blur of the layout or curvature distortion. `prefers-contrast: more` turns the glow and the overlay off. Night UI states are immediate: disable CSS animations, transitions and smooth scrolling on the root, descendants and their before/after pseudo-elements. No decorative hover movement. Keep pressed/selected/focus feedback as instant state changes.
- Both directions of the theme switch are immediate. `ThemeToggle.astro` briefly sets `data-theme-switching`, commits the destination styles and removes the guard synchronously; neither theme has hover transitions. Do not leave the guard enabled or use an animation/timer to switch themes.
- Documents stay flat. Hard-edged raised/pressed relief belongs to controls, with a distinct keyboard-focus outline. **Code syntax is an explicit multicolour fluorescent exception** to the phosphor UI: pink keywords, cyan strings, violet functions/numbers and yellow parameters, with a separate neutral code foreground and readable green comments. Use crisp, bright, saturated accents, not muted pastels, glow, blur or animation. The independent syntax palette is declared in `astro.config.mjs` and `docs/theme/tty-dark.json`; it is not derived from the UI palette. Every declared syntax shade retains at least 7:1 text/surface contrast. Article images retain their original colors; marked prose and text selection use dark-on-phosphor reverse video.
- Keep night-only changes under `:root[data-theme="tty"]`, and limit them to colour, font, glow, overlay and bevels: night never adds or changes a shape, size or spacing. Run `npm test` for palette/contrast and isolation regressions, then verify phone/desktop rendering, theme persistence and keyboard operation in a browser.

### TTY pixel typography

GNU Unifont 18.0.01 uses an 8×16 / 16×16 base grid and covers 58,910 code points in this build, including all 20,992 positions of the CJK Unified Ideographs block. The font is self-hosted as fixed Unicode-block WOFF2 subsets of the one family (Latin, other scripts, and CJK split into a common file of punctuation plus the 3,500 level-1 characters of the Table of General Standard Chinese Characters, with sixteen chunks for the remaining ideographs), declared with `unicode-range` so a page downloads only the blocks it renders; together they keep every code point. There is no external font service, per-article subsetting or CJK fallback to a modern sans face for supported characters. Ordinary body text is 1rem (16 CSS px at the default root size, the font's native grid); users can still zoom normally. Browsers may antialias grid outlines at fractional scaling — do not add blur or globally disable accessibility scaling.

The companion **Unifont Upper** is subset to the fixed supplementary-symbol range U+1F000–1FAFF (2,816 code points), including the site's emoji, so those also use monochrome pixel glyphs rather than the system's colored emoji. Both fonts are under the same OFL license. This is a fixed Unicode-range subset, not a per-article character list.

The source hashes, webfont hashes/sizes, coverage and outline/metric conversion checks are in [`docs/theme/tty-font.json`](docs/theme/tty-font.json). The original 4052 prints a **5×8 ASCII** character set (Tektronix Technical Data, printed page 2-12): this is a multilingual pixel adaptation, **not the 4052 original character font**. No Chinese historical authenticity is implied.

Unifont has one real weight. Disable synthetic bold/italic; use title size and real underlines for emphasis instead of thickening complex Chinese glyphs. Validate actual rendered Latin and CJK fonts in Chromium via `CSS.getPlatformFontsForNode`, not just `getComputedStyle().fontFamily` or `document.fonts.check()`.

To reproduce the webfont, download the pinned upstream OpenType source and its OFL text, then run this optional release-time tool (the normal Astro build has no Python dependency):

```sh
uv run --with fonttools==4.67.0 --with brotli==1.2.1 python scripts/build-tty-font.py /path/to/unifont-18.0.01.otf /path/to/OFL-1.1.txt /path/to/unifont_upper-18.0.01.otf
```

### TTY active palette and photographic provenance

The active theme is **yellow-green phosphor on a dark olive field**. [`docs/theme/tty-dark.json`](docs/theme/tty-dark.json), generated by `scripts/derive-tty-dark.mjs`, records the palette, its derivation, the static effects and calculated contrast.

- Background `#141a03`, surface `#1d2606`, text `#d4ff3a`, secondary `#a8cc2a`, accent `#f0ff9a`. Control faces, borders and bevel edges mix the text color over the background at fixed weights; the bevel's dark edge is black.
- Text on the background has about **15.41:1** contrast, secondary text about **9.62:1**; the lowest text/field pair (secondary on a hovered control) is about **7.21:1**. These are calculated sRGB contrasts of flat colors, before glow and overlay, not measured display brightness.
- The [Electronix & More Tektronix 4052 photograph](https://www.electronixandmore.com/resources/teksystem/tek4052.gif) (**B**) stays in the unchanged historical [`docs/theme/tektronix-4052-b.json`](docs/theme/tektronix-4052-b.json), with its hash and pixel rectangles, as evidence only; no active color is taken from it. No physical 1:1 colorimetry claim is made.
- Keep the static-only effects above and the existing CJK pixel type. Article pictures, diagrams and screenshots keep their original assets and rendering. Archive thumbnails show a post's own hero or first image as a 64px square crop (`object-fit: cover`); a post without an image shows none.
- Hand-drawn night UI icons are documented in [`docs/theme/tty-icons.md`](docs/theme/tty-icons.md). Day mode retains its original artwork and favicon.

Reproduce the active manifest without a network request:

```sh
node scripts/derive-tty-dark.mjs
```

The original photo manifest can still be reproduced with `node scripts/derive-tty-reference.mjs /path/to/tek4052.gif`; it refuses source bytes that do not match the pinned hash. It is historical evidence, not the active palette.

For a deterministic local build without translation API calls or rewritten language variants:

```sh
env -u OPENAI_API_KEY -u OPENAI_MODEL npm run build
```

Run this in a checkout without an `.env` supplying those translation credentials.

## License

Blog content is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
