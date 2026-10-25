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

## Themes

- **Day / Solarized:** existing colors, typography and layout remain in `src/styles/terminal.css`.
- **Night / TTY:** `src/styles/tty.css` owns the green-phosphor palette and self-hosted **GNU Unifont**, including Latin, Chinese and other supported scripts. Titles, prose, navigation, form controls, code and generated text share this pixel family. Attribution and OFL license are in `public/fonts/unifont-OFL.txt`; only characters missing from the font use system glyph fallback.
- Night mode deliberately keeps the artistic distance of a monochrome terminal, not an actual reading barrier. Keep text sharp, links recognizable and controls direct; do not add simulated curvature, blur, scanlines or glitches. Night UI states are immediate: disable CSS animations, transitions and smooth scrolling on the root, descendants and their before/after pseudo-elements. No decorative hover movement. Keep pressed/selected/focus feedback as instant state changes.
- Both directions of the theme switch are immediate. `ThemeToggle.astro` briefly sets `data-theme-switching`, commits the destination styles and removes the guard synchronously; normal day-mode hover transitions remain unchanged. Do not leave the guard enabled or use an animation/timer to switch themes.
- Documents stay flat. Hard-edged raised/pressed relief belongs to controls, with a distinct keyboard-focus outline. Code syntax uses green luminance levels configured in `astro.config.mjs`; article images retain their original colors.
- Keep night-only changes under `:root[data-theme="tty"]`. Run `npm test` for palette/contrast and isolation regressions, then verify phone/desktop rendering, theme persistence and keyboard operation in a browser.

### TTY pixel typography

GNU Unifont 18.0.01 uses an 8×16 / 16×16 base grid and covers 58,910 code points in this build, including all 20,992 positions of the CJK Unified Ideographs block. The full WOFF2 is self-hosted: there is no external font service, per-article subsetting or CJK fallback to a modern sans face for supported characters. Ordinary body text is 1.25rem (20 CSS px at the default root size); users can still zoom normally. Browsers may antialias grid outlines at fractional scaling — do not add blur or globally disable accessibility scaling.

The companion **Unifont Upper** is subset to the fixed supplementary-symbol range U+1F000–1FAFF (2,816 code points), including the site's emoji, so those also use monochrome pixel glyphs rather than the system's colored emoji. Both fonts are under the same OFL license. This is a fixed Unicode-range subset, not a per-article character list.

The source hashes, webfont hashes/sizes, coverage and outline/metric conversion checks are in [`docs/theme/tty-font.json`](docs/theme/tty-font.json). The original 4052 prints a **5×8 ASCII** character set (Tektronix Technical Data, printed page 2-12): this is a multilingual pixel adaptation, **not the 4052 original character font**. No Chinese historical authenticity is implied. The active theme retains B's emission color but now uses an explicitly darkened field.

Unifont has one real weight. Disable synthetic bold/italic; use title size and real underlines for emphasis instead of thickening complex Chinese glyphs. Validate actual rendered Latin and CJK fonts in Chromium via `CSS.getPlatformFontsForNode`, not just `getComputedStyle().fontFamily` or `document.fonts.check()`.

To reproduce the webfont, download the pinned upstream OpenType source and its OFL text, then run this optional release-time tool (the normal Astro build has no Python dependency):

```sh
uv run --with fonttools==4.67.0 --with brotli==1.2.1 python scripts/build-tty-font.py /path/to/unifont-18.0.01.otf /path/to/OFL-1.1.txt /path/to/unifont_upper-18.0.01.otf
```

### TTY active dark field and photographic provenance

The active theme is **dark-green background + brighter green text**, not a reproduction of an illuminated photographic field. [`docs/theme/tty-dark.json`](docs/theme/tty-dark.json) records the palette, derivation and calculated contrast.

- Background: `#011307`; text/emission: `#31fea8`. Surfaces, controls and code are also dark, not bright green panels.
- The emitted green is retained from **B**, the [Electronix & More Tektronix 4052 photograph](https://www.electronixandmore.com/resources/teksystem/tek4052.gif). The original `#248d54` photo field is kept only in the unchanged historical [`docs/theme/tektronix-4052-b.json`](docs/theme/tektronix-4052-b.json), with its hash and pixel rectangles. It is no longer the active background.
- Active colors scale the recorded photo colors in linear light, without adding white or replacing them with gray/mint. Text on the background has about **14.46:1** contrast; secondary text about **10.40:1**. The lowest declared secondary-text/control combination is about **7.71:1**. These are calculated sRGB color-pair contrasts, not a full accessibility certification or measured display brightness.
- A photograph's background is affected by lighting, exposure, filters and operating conditions. Neither the historical photo nor this deliberately darker adaptation establishes the only healthy/factory appearance of a 4052. No physical 1:1 colorimetry claim is made.
- Keep no motion, no curvature/bloom/blur and the existing CJK pixel type. Article pictures, diagrams, screenshots and genuine image thumbnails keep their original assets and rendering.
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
