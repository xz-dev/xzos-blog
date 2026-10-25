# Dependency maintenance

Use `npm ci --no-audit --no-fund` to reproduce the committed lockfile. Run
`npm outdated` and `npm audit` before and after an intentional dependency
refresh; do not apply `npm audit fix --force` to downgrade the Astro adapter
across major versions merely to satisfy a suggested audit remediation.

## Security overrides

- `wrangler` and `esbuild` retain the repository's existing overrides, with
  updated minimum versions. Keep the Cloudflare packages and their tooling
  compatible when refreshing the lockfile.
- `satori > fflate`: Satori 0.63.2 still pins fflate 0.7.3, which is affected
  by the fflate advisory reported by `npm audit`. Scope the patched 0.8.3
  dependency to Satori's subtree instead of changing unrelated consumers.
- `miniflare > undici`: the current Miniflare dependency pins undici 7.29.1;
  the EventSource memory-exhaustion, integrity-token and content-encoding
  advisories are fixed in 7.30.1. Keep this override within undici major 7
  instead of forcing Miniflare onto undici major 8.

Re-evaluate scoped overrides when the corresponding upstream releases
adopt patched versions. Remove an override only after a fresh lockfile
resolution remains audit-clean and the site passes the checks below.

## Verification

Run `npm test`, then `env -u OPENAI_API_KEY -u OPENAI_MODEL npm run build`
without a checkout-local `.env` file. The unset translation credentials
prevent a maintenance build from regenerating article translations.

Changes to Satori, its font/decompression dependencies, or Sharp also require
checking actual generated 1200×630 PNG social cards in all site languages.
The root card explicitly uses `boxSizing: 'border-box'`: current Satori/Yoga
would otherwise add padding outside the fixed canvas and clip the logo and
footer. The PNG-content regression test checks their original canvas regions;
PNG dimensions alone are insufficient to detect that failure.
Check representative desktop/narrow pages in both themes and verify theme
switching, favicon, fonts, article images, RSS and sitemap. Confirm the exact
merged commit's Cloudflare Pages check and read back the production site;
a successful push or preview build alone does not verify production.
