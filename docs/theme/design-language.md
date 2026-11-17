# Design language

One layout and one font in both themes; night only recolours. Day
(`data-theme="solarized"`, an attribute that keeps its old name) is Termius Light
with a green accent and night (`data-theme="tty"`) is Aura Dark with a purple accent.
The two themes have different accents. Switching theme never moves or resizes anything, and no
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
- **Type scale: three sizes on Unifont's pixel grid.** Unifont is a 16px
  bitmap font; text takes 16px for text (`--font-size`), 24px for section and
  list titles (`--text-medium`) and 32px for the page title (`--text-large`),
  and no other size. Body and UI 16/24, prose 16/28, h3, meta and code 16/24;
  h2 and post-list titles 24/32; the page's one h1 32/40. The UA's smaller
  `small`, `sub` and `sup` take their context's size. Text of one size is
  told apart by colour and markers: h3 is `--emphasized` with an accent
  `### ` (a list excerpt's headings read as h3 and take `### ` too), h2 adds
  `## ` and an extra blank line above, and meta text is `--secondary`. Line
  heights are rem lengths that land on whole pixels.
- **Spacing:** `--space-1` to `--space-7` (4, 8, 16, 24, 32, 48, 64 px).
- **Radius:** `--radius: 0`. Every box is square.
- **Roles:** `--code-color`, `--selection-*`, `--text-glow` and
  `--field-overlay`. Both themes use reverse-video selection, no glow and no
  overlay. Controls, menu items and form fields share their geometry.

### Palette

Termius Light supplies the day fields and Aura Dark the night fields; each
theme keeps its own accent, green by day and purple by night. Every text role
reaches 4.5:1 on both fields; structural borders reach 3:1. Decorative borders
do not convey state.

| Token | Light | Dark |
|---|---|---|
| `--background` | `#e9ecf0` | `#15141b` |
| `--surface` | `#dde1e7` | `#1f1d27` |
| `--foreground` | `#2b3040` | `#edecee` |
| `--emphasized` | `#141824` | `#ffffff` |
| `--secondary` | `#555d70` | `#a19fad` |
| `--accent` | `#117140` | `#a277ff` |
| `--border-strong` | `#768097` | `#6a677b` |
| `--border-color` | `#cfd5de` | `#4f4a74` |

Aura Dark's own colours already reach 4.5:1, so night needs no lightness
adjustment. Structural borders are chosen to reach 3:1 against both fields
(light 3.016:1 on the surface, dark 3.039:1 on the surface). The night
decorative border is 2.03:1 against its surface. Selection and `mark` use the
accent as their background and the page background as their foreground.

Shiki uses two custom themes in `src/lib/syntax-day.ts`, since Shiki bundles
neither palette. Their keyword, string, function, type, constant and comment
colours come from each palette: night keeps Aura's token colours except the
comment grey, lifted to `#858585` for 4.5:1 on the code surface; day uses
Termius Light's hues on `#dde1e7`. Every token reaches 4.5:1 on its code
surface (day 4.514:1 at the lowest, night 4.505:1). Inline code uses the page
foreground. The 16 home swatches are the tokens `--ansi-0` to `--ansi-15`: Termius
Light's terminal colours by day, Aura Dark's by night; they are decorative.
`docs/theme/tty-dark.json` retains only the night favicon's foreground
(`#edecee`); a test checks it against the CSS token. OG cards use the fixed
night palette (Aura Dark), titles in the emphasized colour.

### Semantic colours

Like a shell's prompt and `LS_COLORS`, colour in terminal output says what a
thing is. Day roles use Termius Light's hues and night roles Aura Dark's own colours, so each
reaches 4.5:1 on `--background` and `--surface` in its theme. Colour only:
Unifont has one weight, so nothing is bold, boxed or filled.

| Role | Token | Where |
|---|---|---|
| Prompt, command name (green) | `--term-prompt` | the `$` of every prompt (`.term-sign`: `term/Prompt`, the shell's prompt and echoed commands); command names in `help` (`.term-name`) |
| Path (blue) | `--term-path` | path arguments in prompt commands (`.term-path`, split by `commandParts` in `src/lib/term-command.ts`): `~/blog`, `~/friends`, `~/communities`, `~/comments`, `~/about.md` |
| External link (cyan) | `--term-link` | external links in terminal output (`.term-link`): link-exchange names, the fetch block's `Links:`, external links in a `cat` page (about) |
| Date (yellow) | `--term-date` | dates in listings (`.term-date`: home and shell `ls`) and in `PostMeta` (lists, archive, posts) |
| Tag (magenta) | `--term-tag` | the category in `PostMeta` (`.post-category`) |
| Error (red) | `--error` | shell errors (`.shell-error`) |

Everything else keeps its role: `--accent` for fetch keys and `user@host`,
`##` heading markers, current markers (`*`) and links in prose;
`--secondary` for comments and meta text; `--foreground` for body text,
post titles and `help`'s descriptions.

## Primitives

| Role | Primitive | Where |
|---|---|---|
| Page frame and title | `PageFrame` (`list`, `page`, `article`, `home`; `hideTitle`) with `.page-title` | `src/components/PageFrame.astro`, `terminal.css` |
| Menu item | `.menu-item`, `.menu-label`, `.menu-item-icon` | header status line, footer social links |
| Control | `.control` | pagination |
| Icon | `PixelIcon` (`.pixel-icon`): one hand-drawn 16×16 set, the same in both themes, coloured by `currentColor` | header logo, social links, theme toggle, notices, contents, pagination and read-more arrows |
| Meta line | `PostMeta` (`.post-meta`) | post lists, posts |
| Article head | `.article-head` in `PageFrame` `article`: hero, meta line, h1, language line, then one structural rule | posts |
| Contents tree | `TableOfContents` + `TocList` (`.toc`), drawn by `buildTocTree` (`src/lib/toc-tree.ts`) | posts with two or more h2/h3 |
| Comments block | `.article-comments`: structural rule, `$ tail -f ~/comments` prompt, `sr-only` h2, Remark42 | posts |
| Prompt line | `term/Prompt` (`.term-prompt`, `.term-command`): `$ command`, or `$` and the cursor | home, about, link-exchange |
| Command output | `term/OutputList` (`.term-output`): aligned `left  right` rows | home (recent posts), link-exchange |
| Page as output | `.term-text` on the content under a `cat` prompt | about |
| Block cursor | `term/Cursor` (`.cursor`, U+2588); `blink` only with a pause control | home (blinking), about, link-exchange (steady) |

## Shell session

Home, about and link-exchange read as one shell session, built from the
`src/components/term/` primitives and their classes in `terminal.css`. The
commands are i18n keys (`term.*`), shown verbatim in every locale.

- **Prompt:** `$` in `--term-prompt`, the command in `--foreground` with
  path arguments in `--term-path`; the text is unchanged, so a copied prompt
  is the command as typed. A prompt
  follows output after one blank line (`--space-4`); the first one in a
  block has no top margin. The line is `aria-hidden`: it is the visible
  title or decoration, and the page's h1 or a `sr-only` h2 carries the
  meaning.
- **Output rows:** `OutputList` measures each column's widest entry in
  character cells (`cellWidth` in `src/lib/term-width.ts`: wide East Asian
  characters count two) and sets every left cell to that width, so the right
  column lines up and dates and names never wrap; the right cell takes the
  rest of the row and wraps inside it. Columns are `--cell-gap` (2ch) apart.
  Linked cells are `--foreground` (`--term-link` when external); hover turns
  them `--accent` and underlines them, with no fill. Dates are `--term-date`;
  other plain cells (hosts, `help`'s synopses) are `--secondary`, except
  cells marked as body text (`help`'s descriptions), which are
  `--foreground`. A `stack` list keeps the right column on one line as well:
  when the row is narrower than the widest `left  right` pair, every row
  puts its right cell on its own line, 2ch in, at once. The switch follows
  the entries, not a breakpoint. Words break only when one alone is wider
  than the row.
- **Page as output:** under its prompt, a page's content uses the body line
  height, paragraphs one blank line apart, quotes as indented output behind
  the 2px `--rule` in `--border-strong`, list items as `- ` rows with a
  hanging indent; links keep their underline, external ones in
  `--term-link`.
- **Cursor:** blinks only with `blink` (`data-blink`), which only the home
  page sets, because it has a pause control (WCAG 2.2.2). Other cursors are
  steady.
- **Current markers** (the `Theme:` and `Locale:` rows, the pause control) take `--accent`
  and a trailing `*`, as in the status line; nothing is inverted.
- **Title:** the prompt line, or fastfetch's `xz@xzos` on the home page, is
  the visible title, so these pages pass `hideTitle` to `PageFrame`: the one
  h1 stays in the document, visually hidden (`sr-only`).

## Status line

The header is a terminal status line, like tmux's, the same in both themes:

```
◌ xzOS  0:首页   1:文章*  2:关于   3:友链        lang:  zh*  en   zh-CN   │  ☾  │  M  G  S
```

It is one flat row of plain text on `--surface` with a 1px `--border-strong`
bottom edge (`border-block-end`). The row holds the pixel logo (`--accent`),
the site name, the menus and a status area (the language field, the theme
toggle and the social links). The row is a character grid: menu and
language items are `.menu-item`s, 32px tall with no inline padding, so the
`--cell-gap` (2ch) between two items is their distance edge to edge. Only the
current item draws its `*`; no cell is reserved for it, so the visible gap
between any two items is the same 2ch. The status area's
groups (languages, theme, social links) are split by an `aria-hidden` `│` in
`--secondary` with a `--cell-gap` on each side. Icons (theme toggle, social
links) are 16px glyphs in a 2ch cell, centred on the row like the labels.

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
both fit, and the tagline, the `│` separators and the social links (which
the footer repeats) are hidden.

Text slots wrap or stay on one line by declaration. A menu label never breaks
(`nowrap`); a row that runs out of room wraps whole items. Post titles and
prose wrap anywhere, and meta lines wrap between fields. Code blocks and
tables scroll in their own container.

## Routes and patterns

Every HTML page renders through `PageFrame`. `list`, `page` and `home` use
`--page-width` (960px). `article` uses `--prose-width` (608px with its 16px
padding, so the text column is 576px: 36 CJK characters or 72 Latin cells
per line) and puts the meta line above the title. The `/en/` and `/zh-CN/`
variants use the same pattern as the `zh` route.

### Article

An article is three blocks: one column below 1280px, and from 1280px two
columns (head and body, then the contents) when it has contents:

1. **Head** (`.article-head`): the meta line, the h1 (the page's only one)
   and the language line (`LanguageVersionNotice`: other language versions
   and, on a machine translation, the translation notice), closed by a
   hairline `--border-strong` rule with one blank line (24px) above and
   below it.
2. **Body** (`.article-body`): sections are marked like Markdown source. h2
   reads `## Title` and h3 `### Title`; the marker is generated in
   `--accent` with empty alternative text, so ids, anchors and the
   accessible name are unchanged. The title is `--emphasized`. An h2 has one
   more blank line above it (48px) than a paragraph.
3. **Comments** (`.article-comments`, outside the `<article>`): a hairline
   `--border-strong` rule, one blank line, a `$ tail -f ~/comments` prompt
   as the visible title (`term.comments`) with a `sr-only` h2
   (`blog.comments`), then Remark42.

**Contents.** A post with two or more h2/h3 headings gets a contents box
drawn like `tree` output: `├─ `, `└─ ` and `│  ` prefixes in
`--secondary`, `aria-hidden`, while the entries stay a nested `<ul>` of
links. The label line is `▾ 目录` (`blog.toc`) in a `<details open>`.
Below 1280px the box follows the head block. From 1280px it leaves the flow
for a sticky right column (`--toc-width`, 320px) that starts beside the head
and runs along the body, `--space-5` apart; the frame widens by that column,
so the text column keeps its 576px and the comments block below spans the
frame's full content width.
With script, an IntersectionObserver marks the section being read (the
last heading above the top 30% of the viewport): the link takes `--accent`,
a trailing `*` and `aria-current="location"`. Every link reserves the `*`
cell, so marking one never rewraps it. Without script it is a plain list.

### Boxes and rules

One vocabulary for everything that sets a block apart, in both themes:

| Component | Border | Background | Padding | Margin |
|---|---|---|---|---|
| Code block (`pre`) | 1px `--border-strong` | `--surface` | 16px | 24px 0 |
| Contents (`.toc`) | 1px `--border-strong` | `--surface` | 16px | 24px 0 (0 as a sidebar) |
| Table cell | 1px `--border-strong` | `th`: `--surface` | 8px | table: 24px 0 |
| Quote (`blockquote`) | 2px `--rule` `--border-strong`, start edge only; text `--secondary` | none | 16px start | 24px 0 |
| Image | 1px `--border-color` | none | 0 | 24px 0; caption `--secondary` |
| Article head end | 1px `--border-strong`, bottom | none | 24px below | 24px below |
| Comments start | 1px `--border-strong`, top | none | 24px above | 24px above |
| Post-list entry | 1px `--border-color`, bottom; none on the last | none | 24px below | 24px below |
| Pagination | 1px `--border-strong`, top | none | 24px above | 24px above |
| Footer | 2px `--rule` `--accent`, top | `--background` | 48px | 64px above |

`--border-strong` outlines structure and passes 3:1; `--border-color` only
decorates. No box has a shadow, gradient or radius.

**Post lists.** An entry reads title, excerpt (the paged list only), then
the meta line, which closes it; the rule sits one blank line under the meta
line and one above the next title, so it belongs to the entry above it.

| Route | Pattern | Source |
|---|---|---|
| `/`, `/en/`, `/zh-CN/` | home | `layouts/Home.astro` |
| `/page/N/`, `/en/page/N/`, `/zh-CN/page/N/` (N ≥ 2) | list | `layouts/BlogList.astro`; page 1 is the post list: `/page/1/` is not built and `public/_redirects` sends it to `/blog/` (301, per locale) |
| `/blog/`, `/en/blog/`, `/zh-CN/blog/` | list | `layouts/BlogArchive.astro` |
| `/blog/<slug>/`, `/en/blog/<slug>/`, `/zh-CN/blog/<slug>/` | article | `layouts/BlogPost.astro` |
| `/about/`, `/en/about/`, `/zh-CN/about/` | page, shell session (`$ cat ~/about.md`, `hideTitle`) | `layouts/Page.astro` |
| `/link-exchange/` (root only) | page, shell session (`$ ls ~/friends`, then `$ ls ~/communities`, `hideTitle`) | `pages/link-exchange.astro` |
| `/404.html`, `/en/404.html`, `/zh-CN/404.html` | page, noindex | `layouts/NotFound.astro` via `pages/404.astro` and `pages/[lang]/404.astro`; `integrations/localized-404.ts` moves `<locale>/404/index.html` to `<locale>/404.html`, and Cloudflare Pages answers a missing address with the nearest one |

Every internal link ends with a slash (`/about/`, `/en/blog/<slug>/`,
`/link-exchange/`), the shape the build writes, so no click costs a 308.
Canonical and hreflang follow `src/i18n/seo.ts`. Posts carry a schema.org
`BlogPosting` and the home pages a `WebSite` with the author's `Person`, as
JSON-LD built in `src/lib/structured-data.ts`. Sitemap post URLs carry
`lastmod` (updatedDate, else pubDate; `src/lib/sitemap-lastmod.ts`); other
pages have none. `public/_headers` caches `/_astro/*` and `/fonts/*.woff2`
for a year as immutable: their names change with their content (Vite's hash,
the Unifont version). The 56 addresses of the
old WordPress site are 301s in `public/_redirects`, generated from
`src/lib/legacy-redirects.ts` by `npm run redirects`.

Endpoints that are not HTML pages have no pattern: `/rss.xml`
(`pages/rss.xml.js`), `/og/default.png` and `/og/<slug>.png` (`pages/og/`)
and `/favicon-tty.svg` (`pages/favicon-tty.svg.ts`).

**Open Graph.** The 1200×630 PNG cards use the night palette from the exported
`OG_PALETTE` in `src/lib/og-image.ts` and only GNU Unifont 18.0.01. A flat
status line uses the site navigation translations on the surface colour
with a 1px strong bottom border. Post cards mark the Posts entry as current;
the shared default card has no current marker.
Post cards put a `$ cat ~/blog/<slug>.md` prompt before the title:
64px for short titles, otherwise 48px, wrapped on character cells into at
most three lines with an ellipsis. Latin words wrap at spaces or hyphens;
only words wider than a line split. CJK closing punctuation stays with the
preceding character. The default card shows `$ fastfetch`, `xz@xzos`, a
dash rule and OS, Shell, Packages and Locale rows with accent-coloured keys.
The default route counts the root blog collection for Packages. Other text
is 32px (the fetch heading is 48px); all positions are
whole pixels, with no synthesized weight or italic. The meta line carries
the original publication day, category when present and `src`/`en`/`zh-CN`.
Long slugs and categories are truncated to keep their rows inside the frame.
The bottom row carries `xzos.net` and a steady block cursor. Cards have no
grid, gradient, shadow, glow or rounded corners; rendering uses no clock.


## Home: boot screen

The home page reads like fastfetch at login. Above 800px the art and the info
block sit side by side on one line grid (`--line-height`, 24px), the ring's
top row on the title line, so row k of the art sits beside line k of the
info; below that the art stacks above the info.

- **Title:** `PageFrame` still draws the page's one h1 (`xzOS - For Coding
  Life`), visually hidden (`home` sets `hideTitle` by default); the visible
  title line is the info block's `xz@xzos`.
- **Logo:** the 16-dash ring of `pixel-icons.ts` as a 3D ring of characters
  (`src/lib/ascii-ring.ts`), on a fixed grid of 45 × 15 cells, one row per
  line of the info block (the blank line and the two palette rows included),
  and 30 × 10 at 420px and below. Cells are
  8 × 24 (one character on a body line), so x is scaled three times y to
  keep the ring round, and the box never changes size. The dashes are a flat band (half-width 0.17 across the ring,
  0.08 along its axis, dash 42% of each 1/16 arc) with back faces culled, so
  the gaps stay empty; the ramp ` -=+*#%@` has no light marks. Bright marks
  use `--accent`, dim marks `--secondary`, the rest `--foreground`. Eight
  variants (`RING_VARIANTS`) animate it, all on the same grids:
  - `tumble`: the dashes run round while the ring leans back 14°–26° and
    swings up to 26° about the vertical axis, so the drawing keeps all but
    one or two rows;
  - `spinner`: face on, a bright head steps round the dashes with a fading
    tail;
  - `coin`: a full turn about the vertical axis, a thin line when edge on;
  - `boot`: the dashes fly in one by one, the logo turns, then they drop
    out (8 s loop);
  - `decode`: noise settles cell by cell into the still logo and scrambles
    again (6 s loop);
  - `gyro`: the logo's ring outside a thin plain ring turning about another
    axis;
  - `wave`: a wave runs round and pushes the dashes it passes outwards and
    brighter;
  - `slide`: a fixed lean, only the dashes sliding slowly round.

  The build renders `tumble`'s frame 0. The page script plays a variant
  chosen at random at 12 fps while it is on screen and the tab is visible,
  and every 20 s of animation moves to a different random one, starting it
  from t = 0; both grids always show the same variant. The art is
  `aria-hidden` with a visually hidden text alternative.
- **Pause:** `[pause]` is a plain menu item at the bottom right of the boot
  block, on the last palette row's line, so it takes no line of its own. It has
  `aria-pressed` and a constant accessible name, and the page script
  unhides it; without script the page has no motion to stop. Pressed (paused) is marked like the status
  line's current entry: `--accent` and a trailing `*`, never inverted. It
  stops the logo, its variant clock and the cursor (`data-paused` on the frame).
- **Next:** `[next]` sits left of `[pause]`, one cell gap apart, the same
  plain menu item. It switches to another random variant from its first step;
  while paused it shows that step and stays paused. Reduced motion hides it
  with the pause control.
- **Info block:** fastfetch's layout: `xz@xzos` (names in `--accent`, `@`
  plain), a rule of as many dashes, then `Key: value` lines with no column
  alignment, keys in `--accent` and `:` and values in `--foreground`. Keys
  are fastfetch's English names in every locale: OS, Init System, Kernel
  (the Astro version that built the page), Uptime, Packages (the post
  count), Shell, Theme, Font (the version in `tty-font.json`), Locale,
  Links. The theme in use (it follows `data-theme`) and the current locale
  are marked like the status line's current entry (`--accent`, trailing
  `*`), never inverted. Links are values with a dotted 1px underline, solid
  on hover and focus: `Locale:` in `--foreground`, the external `Links:` in
  `--term-link`. After one blank line come 16 decorative
  swatches from `--ansi-0` to `--ansi-15`, the current
  theme's terminal colours. The shell's errors use `--error` (see Semantic colours).
- **Recent posts:** one blank line (`--space-4`) after the fetch output, a
  `$ ls -t ~/blog | head -5` prompt over a list of `YYYY-MM-DD  Title` rows
  (`OutputList`: dates never wrap; titles wrap under the title column), a
  link to the locale's archive (the `→ ` stays off its underline), then `$`
  and the blinking block cursor. With script, the shell (xzsh) takes that
  prompt's place and prints its login message above its prompt: the
  localized help hint (`shell.hint`) in `--secondary`. `clear` wipes it.
- **Motion:** the logo and the cursor are the site's only motion, in both
  themes. `prefers-reduced-motion: reduce` keeps `tumble`'s frame 0, with no
  variant switching, hides the next and pause controls and stops the blink. The cursor blinks only while the script has
  shown the pause control (`data-pausable`), so without script it is
  steady. The ring rewrites its `innerHTML` 12 times a second; at 4× CPU
  throttling on `/` (1440px, day) five seconds of animation produced no long
  task, about 6 ms of script and 1 ms of layout per ring frame, and the page
  kept its 60 fps animation-frame rate.

## Night-only rules that remain

`src/styles/tty.css` turns motion off on every element, which a token cannot
reach, and lets the home page's cursor blink through (the logo is drawn by
script, which the reset does not touch). It also applies Shiki's per-span
`--shiki-dark` colours, which Shiki writes inline. Icons are not night-only:
every first-party UI icon is the same 16×16 pixel drawing in both themes
(`PixelIcon`, see `docs/theme/tty-icons.md`); only its colour changes.
`ThemeToggle.astro` shows the sun or moon from `data-theme` as a state
indicator, so the icon is right at first paint, before any script runs. The
favicon still switches from the day PNG to `/favicon-tty.svg` at night.
