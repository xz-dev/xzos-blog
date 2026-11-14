# Design language

One layout and one font in both themes; night only recolours. Day
(`data-theme="solarized"`) is peach paper and night (`data-theme="tty"`) is
phosphor on olive. Switching theme never moves or resizes anything, and no
frame, fill or bevel exists in one theme but not the other.

## Tokens

Every value comes from `src/styles/tokens.css`. `:root` holds the day
palette, the type scale, spacing, widths, sizes and the role tokens. The night
block redefines colours and the role tokens only.

- **Font:** `--font-ui` is GNU Unifont (`src/styles/fonts.css`), set once on
  `body`. It has one weight and no italic, so synthesis is off and emphasis
  follows the terminal rule "bold is bright": `strong` and `b` take
  `--accent`, `em` and `i` take `--secondary`, and neither is underlined.
  The underline means a link and nothing else. Inside a link, the link colour
  wins.
- **Type scale (rem; line heights land on whole pixels):** body 16/24,
  prose 16/28, page title 32/40, card title 24/32, h2 22/32, h3 20/28,
  meta 14/20, code 16/24.
- **Spacing:** `--space-1` to `--space-7` (4, 8, 16, 24, 32, 48, 64 px).
- **Radius:** `--radius: 0`. Every box is square.
- **Roles:** `--code-color`, `--selection-*`, `--text-glow` and
  `--field-overlay`. Night redefines the palette and these roles only: a glow
  and a scanline-and-vignette layer behind the content, and reverse-video
  selection. Controls, menu items and form fields are drawn the same in both
  themes. `prefers-contrast: more` removes the glow and the layer.

## Primitives

| Role | Primitive | Where |
|---|---|---|
| Page frame and title | `PageFrame` (`list`, `page`, `article`) with `.page-title` | `src/components/PageFrame.astro`, `terminal.css` |
| Menu item | `.menu-item`, `.menu-label`, `.menu-item-icon` | header status line, footer social links |
| Control | `.control` | pagination |
| Pixel mark (both themes) | `PixelIcon bothThemes` (`.pixel-icon`) | header logo, theme toggle |
| Meta line | `PostMeta` (`.post-meta`) | post lists, posts |
| Block cursor | `.cursor` (U+2588 after a `$` prompt) | home page |

## Status line

The header is a terminal status line, like tmux's, the same in both themes:

```
◌ xzOS   0:首页  1:文章*  2:关于  3:友链        lang: zh*  en  zh-CN   ☾
```

It is one flat row of plain text on `--surface` with a 1px `--border-strong`
bottom edge (`border-block-end`). The row holds the pixel logo (`--accent`),
the site name, the menus and a status area (the language field, the theme
toggle and the social links). Menu and language items are `.menu-item`s,
32px tall with `--space-1` inline padding; `--space-2` gaps leave two
character cells between entries.

- **Menus** read `index:label`. The order and labels come from `navItems` and
  `nav.*` in `src/i18n/ui.ts`; the index is a dim `.menu-label`
  (`--secondary`), hidden from assistive technology.
- **Languages** read `lang: zh en zh-CN`: the `lang.prefix` label, then the
  short codes. Each link's accessible name and tooltip is the full name from
  `languages` with the code, for example `English (en)`.
- **Current page or section** (`aria-current`) takes `--accent` and a
  trailing `*`, generated with empty alternative text. Nothing is filled or
  inverted.
- **Hover** turns the entry `--accent` and underlines it. **Focus** is the
  shared 2px `--accent` outline.
- **Theme toggle:** a pixel sun in day and moon at night, chosen by CSS from
  `data-theme`. `aria-pressed` (pressed = night) is set by an inline script
  right after the button, so it matches the theme at first paint.

Tablets put the menus on a second row. At 720px and below the title takes
its own row, the menus and the status area follow and share a row only when
both fit, and the tagline and social links (which the footer repeats) are
hidden.

Text slots wrap or stay on one line by declaration. A menu label never breaks
(`nowrap`); a row that runs out of room wraps whole items. Post titles and
prose wrap anywhere, and meta lines wrap between fields. Code blocks and
tables scroll in their own container.

## Routes and patterns

Every HTML page renders through `PageFrame`. `list`, `page` and `home` use
`--page-width` (960px). `article` uses `--prose-width` (720px) and puts the
meta line above the title. The `/en/` and `/zh-CN/` variants use the same
pattern as the `zh` route.

| Route | Pattern | Source |
|---|---|---|
| `/`, `/en/`, `/zh-CN/` | home | `layouts/Home.astro` |
| `/page/N/`, `/en/page/N/`, `/zh-CN/page/N/` | list | `layouts/BlogList.astro` (pending: kept reachable as is until the home redesign settles pagination and redirects) |
| `/blog/`, `/en/blog/`, `/zh-CN/blog/` | list | `layouts/BlogArchive.astro` |
| `/blog/<slug>/`, `/en/blog/<slug>/`, `/zh-CN/blog/<slug>/` | article | `layouts/BlogPost.astro` |
| `/about/`, `/en/about/`, `/zh-CN/about/` | page | `layouts/Page.astro` |
| `/link-exchange` | page | `pages/link-exchange.astro` |
| `/404` | page | `pages/404.astro` |

Endpoints that are not HTML pages have no pattern: `/rss.xml`
(`pages/rss.xml.js`), `/og/default.png` and `/og/<slug>.png` (`pages/og/`)
and `/favicon-tty.svg` (`pages/favicon-tty.svg.ts`).

## Home: boot screen

The home page reads like fastfetch at login. From 720px the art and the info
block sit side by side; below that the art stacks above the info.

- **Title:** `PageFrame` still draws the page's one h1 (`xzOS - For Coding
  Life`), visually hidden; the visible title line is the info block's
  `xz@xzos`. This is the only pattern whose h1 is not drawn on screen.
- **Logo:** the 16-dash ring of `pixel-icons.ts` as a 3D ring of characters
  (`src/lib/ascii-ring.ts`), on a fixed grid of 44 × 22 cells, 32 × 16 at
  420px and below. Cells are 8 × 16 (`--leading-art`), so the box never
  changes size. The dashes are a flat band (half-width 0.17 across the ring,
  0.11 along its axis, dash 50% of each 1/16 arc) with back faces culled, so
  the gaps stay empty; the ramp ` -=+*#%@` has no light marks. The ring
  leans back 14°–26° and swings up to 26° about the vertical axis, so the
  drawing keeps 19–21 of 22 rows. Bright marks use `--accent`, dim marks
  `--secondary`, the rest `--foreground`. The build renders frame 0; the
  page script animates it at 12 fps while it is on screen and the tab is
  visible. The art is `aria-hidden` with a visually hidden text alternative.
- **Pause:** `[pause]` is a plain menu item centred directly under the art
  (the art column is as wide as the ring), with `aria-pressed` and a
  constant accessible name. Pressed (paused) is marked like the status
  line's current entry: `--accent` and a trailing `*`, never inverted. It
  stops the logo and the cursor (`data-paused` on the frame).
- **Info block:** an 8ch label column in `--accent`, values in
  `--foreground` that wrap under their column, and a palette strip of the
  seven palette tokens. The current language in `Lang:` is marked like the
  status line's current entry (`--accent`, trailing `*`), never inverted.
- **Recent posts:** one blank line (`--space-4`) after the fetch output, a
  `$ ls -t ~/blog | head -5` prompt over a list of `YYYY-MM-DD  Title` rows
  (a 10ch date column that never wraps; titles wrap under the title column), a link to the locale's archive, then `$` and the
  block cursor.
- **Motion:** the logo and the cursor are the site's only motion, in both
  themes. `prefers-reduced-motion: reduce` keeps frame 0, hides the pause
  control and stops the blink.

## Night-only rules that remain

`src/styles/tty.css` turns motion off on every element, which a token cannot
reach, and lets the home page's cursor blink through (the logo is drawn by
script, which the reset does not touch). It also applies Shiki's per-span
`--shiki-dark` colours, which Shiki writes inline. `src/styles/tty-pixel-icons.css` swaps the social, notice,
contents and pagination icons for hand-drawn 16×16 pixel icons, because night
uses a different set of drawn assets. The logo and the theme toggle use the
pixel drawings in both themes. `ThemeToggle.astro` shows the sun or moon from
`data-theme` so the icon is right at first paint, before any script runs.
