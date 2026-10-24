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

The source hashes, webfont hashes/sizes, coverage and outline/metric conversion checks are in [`docs/theme/tty-font.json`](docs/theme/tty-font.json). The original 4052 prints a **5×8 ASCII** character set (Tektronix Technical Data, printed page 2-12): this is a multilingual pixel adaptation, **not the 4052 original character font**. No Chinese historical authenticity is implied. The chosen B palette is unchanged.

Unifont has one real weight. Disable synthetic bold/italic; use title size and real underlines for emphasis instead of thickening complex Chinese glyphs. Validate actual rendered Latin and CJK fonts in Chromium via `CSS.getPlatformFontsForNode`, not just `getComputedStyle().fontFamily` or `document.fonts.check()`.

To reproduce the webfont, download the pinned upstream OpenType source and its OFL text, then run this optional release-time tool (the normal Astro build has no Python dependency):

```sh
uv run --with fonttools==4.67.0 --with brotli==1.2.1 python scripts/build-tty-font.py /path/to/unifont-18.0.01.otf /path/to/OFL-1.1.txt /path/to/unifont_upper-18.0.01.otf
```

### TTY photographic color reference

The selected target is **B**, the [Electronix & More Tektronix 4052 photograph](https://www.electronixandmore.com/resources/teksystem/tek4052.gif), not a generic P1/P31 green. The image hash, original-pixel sample regions, exact RGB anchors and all derived UI/syntax shades are recorded in [`docs/theme/tektronix-4052-b.json`](docs/theme/tektronix-4052-b.json).

- The unmarked screen field is `#248d54`; the brightest sampled green line core is `#31fea8`. Both are original photograph pixels, with no exposure, white-balance or saturation correction. The field is deliberately green rather than near-black.
- Main-field text stays at the full sampled emission color. Use weight and underlining for hierarchy, not gray/white mixing or dim metadata. Control relief, code surfaces and syntax shades are explicitly derived by scaling linear-light RGB, then encoding back to sRGB.
- **Contrast limitation:** the exact selected field/core pair is about **3.1663:1**, and even pure white on that background is only about **4.1891:1**. Normal-size text on the main field is **not WCAG AA/AAA**. Tests preserve the declared photo match and report this trade-off; they must not pretend the old 7:1 target still passes. Code and control surfaces are darker functional shades and retain a 4.5:1 text floor.
- This is a reproducible match to a user-approved photographic appearance, **not a calibrated physical 1:1 claim** about a CRT or every viewing monitor. Do not add curvature, bloom, blur or motion to imitate the photograph's optics.

To reproduce the manifest, download the linked original GIF without re-encoding it, then use the project's existing Sharp dependency:

```sh
node scripts/derive-tty-reference.mjs /path/to/tek4052.gif
```

The script refuses source bytes whose SHA-256 differs from the pinned photograph.

For a deterministic local build without translation API calls or rewritten language variants:

```sh
env -u OPENAI_API_KEY -u OPENAI_MODEL npm run build
```

Run this in a checkout without an `.env` supplying those translation credentials.

## License

Blog content is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
