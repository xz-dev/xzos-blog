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
- **Night / TTY:** `src/styles/tty.css` owns the green-phosphor palette, self-hosted IBM Plex Mono and native CJK fallbacks. Font attribution and OFL license are in `public/fonts/ibm-plex-mono-OFL.txt`.
- Night mode deliberately keeps the artistic distance of a monochrome terminal, not an actual reading barrier. Keep text sharp, links recognizable and controls direct; do not add simulated curvature, blur, scanlines or glitches. Night UI states are immediate: disable CSS animations, transitions and smooth scrolling on the root, descendants and their before/after pseudo-elements. No decorative hover movement. Keep pressed/selected/focus feedback as instant state changes.
- Both directions of the theme switch are immediate. `ThemeToggle.astro` briefly sets `data-theme-switching`, commits the destination styles and removes the guard synchronously; normal day-mode hover transitions remain unchanged. Do not leave the guard enabled or use an animation/timer to switch themes.
- Documents stay flat. Hard-edged raised/pressed relief belongs to controls, with a distinct keyboard-focus outline. Code syntax uses green luminance levels configured in `astro.config.mjs`; article images retain their original colors.
- Keep night-only changes under `:root[data-theme="tty"]`. Run `npm test` for palette/contrast and isolation regressions, then verify phone/desktop rendering, theme persistence and keyboard operation in a browser.

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
