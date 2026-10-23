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
- Night mode deliberately keeps the artistic distance of a monochrome terminal, not an actual reading barrier. Keep text sharp, links recognizable and controls direct; do not add simulated curvature, blur, scanlines, glitches or decorative animation.
- Documents stay flat. Hard-edged raised/pressed relief belongs to controls, with a distinct keyboard-focus outline. Code syntax uses green luminance levels configured in `astro.config.mjs`; article images retain their original colors.
- Keep night-only changes under `:root[data-theme="tty"]`. Run `npm test` for palette/contrast and isolation regressions, then verify phone/desktop rendering, theme persistence and keyboard operation in a browser.

For a deterministic local build without translation API calls or rewritten language variants:

```sh
env -u OPENAI_API_KEY -u OPENAI_MODEL npm run build
```

Run this in a checkout without an `.env` supplying those translation credentials.

## License

Blog content is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
