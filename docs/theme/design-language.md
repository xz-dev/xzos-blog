# Design language

One layout and one font in both themes; night only recolours. Day
(`data-theme="solarized"`) is peach paper and night (`data-theme="tty"`) is
phosphor on olive. Switching theme never moves or resizes anything.

## Tokens

Every value comes from `src/styles/tokens.css`. `:root` holds the day
palette, the type scale, spacing, widths, sizes and the role tokens. The night
block redefines colours and the role tokens only.

- **Font:** `--font-ui` is GNU Unifont (`src/styles/fonts.css`), set once on
  `body`. It has one weight and no italic, so synthesis is off; `strong`, `b`
  and `em` are underlined.
- **Type scale (rem; line heights land on whole pixels):** body 16/24,
  prose 16/28, page title 32/40, card title 24/32, h2 22/32, h3 20/28,
  meta 14/20, code 16/24.
- **Spacing:** `--space-1` to `--space-7` (4, 8, 16, 24, 32, 48, 64 px).
- **Radius:** `--radius: 0`. Every box is square.
- **Roles:** `--control-*` (fill, edge, bevel, hover, current), `--field-*`,
  `--menu-hover`, `--code-color`, `--selection-*`, `--text-glow` and
  `--field-overlay`. Day controls are flat. Night adds a hard bevel, a glow
  and a scanline-and-vignette layer. `prefers-contrast: more` removes the
  glow and the layer.

## Primitives

| Role | Primitive | Where |
|---|---|---|
| Page frame and title | `PageFrame` (`list`, `page`, `article`) with `.page-title` | `src/components/PageFrame.astro`, `terminal.css` |
| Menu item | `.menu-item`, `.menu-item-icon` | header bar, footer social links |
| Control | `.control` and `button` | pagination, contents summary |
| Meta line | `PostMeta` (`.post-meta`) | post lists, posts |

## Menu bar

The header is one flat row on `--surface` with a 1px `--border-strong`
bottom edge. The row holds the logo, the site name, the menus (home, blog,
about, links) and a status area (languages, theme toggle, social links).
Menu items are plain text, 32px tall, with `--space-2` inline padding. Hover
tints the bar with `--menu-hover`. The current page (`aria-current`) shows
accent background with page-colour text. The theme toggle carries
`aria-pressed` (pressed = night). Tablets put the menus on a second row.
Phones use three rows (title, menus, status) and hide the tagline and social
links, which the footer repeats.

Text slots wrap or stay on one line by declaration. A menu label never breaks
(`nowrap`); a row that runs out of room wraps whole items. Post titles and
prose wrap anywhere, and meta lines wrap between fields. Code blocks and
tables scroll in their own container.

## Routes and patterns

Every route renders through `PageFrame`. `list` and `page` use
`--page-width` (960px). `article` uses `--prose-width` (720px) and puts the
meta line above the title. The `/en/` and `/zh-CN/` variants use the same
pattern as the `zh` route.

| Route | Pattern | Source |
|---|---|---|
| `/`, `/en/`, `/zh-CN/` | list | `layouts/BlogList.astro` |
| `/page/N/`, `/en/page/N/`, `/zh-CN/page/N/` | list | `layouts/BlogList.astro` |
| `/blog/`, `/en/blog/`, `/zh-CN/blog/` | list | `layouts/BlogArchive.astro` |
| `/blog/<slug>/`, `/en/blog/<slug>/`, `/zh-CN/blog/<slug>/` | article | `layouts/BlogPost.astro` |
| `/about/`, `/en/about/`, `/zh-CN/about/` | page | `layouts/Page.astro` |
| `/link-exchange` | page | `pages/link-exchange.astro` |
| `/404` | page | `pages/404.astro` |

## Night-only rules that remain

`src/styles/tty.css` turns motion off on every element, which a token cannot
reach. It also applies Shiki's per-span `--shiki-dark` colours, which Shiki
writes inline. `src/styles/tty-pixel-icons.css` swaps the original icons for
hand-drawn 16×16 pixel icons, because night uses a different set of drawn
assets. `ThemeToggle.astro` shows the sun or moon from `data-theme` because
the icon must be right at first paint, before its script runs.
