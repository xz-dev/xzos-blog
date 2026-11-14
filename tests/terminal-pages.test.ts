import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ui } from '../src/i18n/ui.ts';
import { RING_GRIDS } from '../src/lib/ascii-ring.ts';
import { cellWidth } from '../src/lib/term-width.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const pages = {
	home: read('../src/layouts/Home.astro'),
	about: read('../src/layouts/Page.astro'),
	links: read('../src/pages/link-exchange.astro'),
};
const css = read('../src/styles/terminal.css');
const tty = read('../src/styles/tty.css');

test('home, about and link-exchange are drawn with the shared terminal primitives', () => {
	for (const [name, source] of Object.entries(pages)) {
		assert.match(source, /import Prompt from '\.\.\/components\/term\/Prompt\.astro';/, name);
		// Opens with a command prompt, ends with the cursor prompt.
		assert.match(source, /<Prompt command=\{t\('term\.\w+'/, name);
		assert.match(source, /<Prompt cursor(?: blink)? \/>/, name);
		// No page draws its own prompt or cursor.
		assert.doesNotMatch(source, /class="(?:prompt|cursor)"|█/, name);
	}
	for (const name of ['home', 'links'] as const) {
		assert.match(pages[name], /import OutputList from '\.\.\/components\/term\/OutputList\.astro';/, name);
		assert.match(pages[name], /<OutputList\b/, name);
	}
	assert.match(pages.about, /<article class="prose term-text">/);
	// Friends, then communities, each its own `ls` block of stacked rows; the cursor prompt is last.
	assert.match(
		pages.links,
		/<Prompt command=\{t\('term\.friends'\)\} \/>\s*<OutputList rows=\{rows\(friends\)\} stack label=\{t\('links\.friends'\)\} \/>\s*<Prompt command=\{t\('term\.communities'\)\} \/>\s*<OutputList rows=\{rows\(communities\)\} stack label=\{t\('links\.communities'\)\} \/>\s*<Prompt cursor \/>/,
	);
	assert.match(pages.links, /const communities = \[\{ name: 'Gentoo 中文社群', url: 'https:\/\/gentoozh\.org\/zh-tw\/' \}\];/);
	assert.equal(pages.links.match(/gentoozh\.org/g)?.length, 1);
	assert.match(pages.about, /<Prompt command=\{t\('term\.cat', \{ file: `\$\{slug\}\.md` \}\)\} \/>/);
	// Commands are i18n keys in every locale.
	for (const lang of Object.keys(ui) as (keyof typeof ui)[]) {
		for (const key of ['term.recent', 'term.cat', 'term.friends', 'term.communities'] as const) assert.ok(ui[lang][key], `${lang} ${key}`);
	}
});

test('the prompt line is the visible title; each page keeps one visually hidden h1', () => {
	const frame = read('../src/components/PageFrame.astro');
	assert.match(frame, /hideTitle = pattern === 'home'/);
	assert.match(frame, /<h1 class:list=\{\['page-title', hideTitle && 'sr-only'\]\}>/);
	assert.match(pages.about, /<PageFrame title=\{page\.data\.title\} hideTitle>/);
	assert.match(pages.links, /<PageFrame title=\{t\('nav\.links'\)\} hideTitle>/);
	assert.match(pages.home, /<PageFrame title=\{pageTitle\} pattern="home">/);
	for (const source of Object.values(pages)) assert.doesNotMatch(source, /<h1\b/);
	assert.match(read('../src/components/term/Prompt.astro'), /<p class="term-prompt" aria-hidden="true">/);
});

test('cellWidth counts wide East Asian characters as two cells', () => {
	assert.equal(cellWidth('limu'), 4);
	assert.equal(cellWidth('简记'), 4);
	assert.equal(cellWidth('星梦的小站（坂本dalao）'), 23);
	assert.equal(cellWidth("Ran's Blog | 旋律的博客"), 23);
	assert.equal(cellWidth(''), 0);
});

test('output rows: the left column is as wide as its widest entry and never wraps', () => {
	const list = read('../src/components/term/OutputList.astro');
	assert.match(list, /style=\{`--term-left: \$\{left\}ch; --term-right: \$\{right\}ch`\}/);
	assert.doesNotMatch(list, /leftMax/);
	assert.match(css, /\.term-output li\s*\{[^}]*display:\s*flex;[^}]*flex-wrap:\s*wrap;[^}]*column-gap:\s*var\(--cell-gap\);/);
	assert.match(css, /\.term-output li > :first-child\s*\{\s*flex:\s*none;\s*width:\s*min\(var\(--term-left\), 100%\);/);
	assert.match(css, /\.term-output li > :last-child\s*\{\s*flex:\s*1 1 0;/);
	// Words break only when one alone is wider than the row.
	assert.match(css, /\.term-output li > \*\s*\{[^}]*overflow-wrap:\s*break-word;/);
	assert.doesNotMatch(css, /term-left-max|overflow-wrap:\s*anywhere;\s*\}\s*\.term-output/);
	// A stacked list switches every row at once when the widest pair no longer fits; no breakpoint.
	assert.match(css, /\.term-output-stack\s*\{\s*--term-row:\s*calc\(var\(--term-left\) \+ var\(--cell-gap\) \+ var\(--term-right\)\);/);
	assert.match(css, /\.term-output-stack li > :first-child\s*\{\s*width:\s*max\(min\(var\(--term-left\), 100%\), calc\(\(var\(--term-row\) - 100%\) \* 999\)\);\s*max-width:\s*100%;/);
	assert.match(css, /\.term-output-stack li > :last-child\s*\{\s*padding-inline-start:\s*clamp\(0px, calc\(\(var\(--term-row\) - 100%\) \* 999\), var\(--cell-gap\)\);/);
});

test('link hover changes colour and underlines; no hover or focus paints a fill', () => {
	assert.match(css, /\.term-output \.term-cell > a:hover\s*\{\s*color:\s*var\(--accent\);\s*text-decoration:\s*underline;\s*\}/);
	const sheets = [css, tty, read('../src/components/Header.astro'), read('../src/components/Footer.astro'), ...Object.values(pages)];
	for (const sheet of sheets) {
		for (const [, body] of sheet.matchAll(/:(?:hover|focus|focus-visible|active)[^{,]*\{([^}]*)\}/g)) {
			assert.doesNotMatch(body, /background/, body);
		}
	}
});

test('home: ring rows sit beside fetch lines on one line grid; the all-posts arrow is off the underline', () => {
	assert.match(pages.home, /\.boot\s*\{[^}]*align-items:\s*start;/);
	assert.match(pages.home, /\.ring\s*\{[^}]*height:\s*calc\(var\(--rows\) \* var\(--line-height\)\);\s*line-height:\s*var\(--line-height\);/);
	// fastfetch: title, rule, one line per key, a blank line and one row of the theme's own colours.
	const keys = pages.home.match(/<div><dt>/g)?.length ?? 0;
	assert.equal(RING_GRIDS.wide.rows, keys + 4);
	assert.match(pages.home, /\.palette\s*\{[^}]*grid-template-columns:\s*repeat\(6, 3ch\);\s*grid-auto-rows:\s*var\(--line-height\);\s*margin-top:\s*var\(--line-height\);/);
	assert.match(pages.home, /<a class="all-posts" href=\{`\$\{blogPrefix\}\/`\}><span class="all-posts-arrow"><PixelArrowText text="→" \/><\/span>\{allPosts\}<\/a>/);
	assert.match(pages.home, /\.all-posts-arrow\s*\{\s*display:\s*inline-block;\s*margin-inline-end:\s*1ch;/);
});

test('status line: items 2ch apart, a reserved `*` cell, `│` between groups, glyph-size icons', () => {
	const header = read('../src/components/Header.astro');
	assert.match(read('../src/styles/tokens.css'), /--cell-gap:\s*2ch;/);
	assert.match(header, /\.internal-links,\s*\.right-section,\s*\.social-links\s*\{[^}]*gap:\s*var\(--cell-gap\);/);
	assert.match(read('../src/components/LanguageSwitcher.astro'), /gap:\s*var\(--cell-gap\);/);
	assert.match(header, /\.internal-links :global\(\.menu-item\),\s*\.right-section :global\(\.menu-item\)\s*\{\s*padding-inline:\s*0;/);
	assert.match(header, /:global\(\.lang-link\)::after\s*\{\s*content:\s*"\*";\s*content:\s*"\*" \/ "";\s*visibility:\s*hidden;/);
	assert.match(header, /:global\(\.lang-link\[aria-current\]\)::after\s*\{\s*visibility:\s*visible;/);
	assert.equal(header.match(/<span class="status-sep" aria-hidden="true">│<\/span>/g)?.length, 2);
	assert.match(header, /\.social-links :global\(\.menu-item-icon svg\)\s*\{\s*width:\s*var\(--pixel-icon-size\);\s*height:\s*var\(--pixel-icon-size\);/);
});

test('only the home cursor blinks', () => {
	// The cursor blinks only with data-blink, set by `blink`, which only the
	// home page (it has a pause control) passes, and only under [data-pausable],
	// which the home script sets while the pause control is shown: no script, no blink.
	assert.match(read('../src/components/term/Cursor.astro'), /data-blink=\{blink \? '' : undefined\}/);
	assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*:where\(\[data-pausable\]\) \.cursor\[data-blink\]\s*\{\s*animation:\s*var\(--cursor-blink\);/);
	assert.doesNotMatch(css, /\n\s*\.cursor\s*\{[^}]*animation/);
	assert.match(tty, /\[data-pausable\] \.cursor\[data-blink\]:not\(\[data-paused\] \*\)\s*\{\s*animation:\s*var\(--cursor-blink\) !important;/);
	assert.match(pages.home, /<Prompt cursor blink \/>/);
	assert.match(pages.home, /button\.hidden = reduce\.matches;\s*(?:\/\/[^\n]*\n\s*)?main\?\.toggleAttribute\('data-pausable', !button\.hidden\);/);
	assert.match(pages.about, /<Prompt cursor \/>/);
	assert.match(pages.links, /<Prompt cursor \/>/);
});

test('current markers are the accent and a trailing *, never an inverted block', () => {
	const sources = [...Object.values(pages), ...['Prompt', 'OutputList', 'Cursor'].map((f) => read(`../src/components/term/${f}.astro`))];
	for (const source of sources) {
		// No rule in these pages fills a box with the accent or sets text to the page colour.
		assert.doesNotMatch(source, /background(?:-color)?:\s*var\(--accent\)|color:\s*var\(--background\)/);
	}
	for (const selector of ['.fetch a[aria-current]', '.ring-toggle[aria-pressed="true"]']) {
		const at = pages.home.indexOf(`${selector} {`);
		assert.ok(at > 0, selector);
		assert.match(pages.home.slice(at), /^[^{]*\{\s*color:\s*var\(--accent\);\s*\}/, selector);
		assert.match(pages.home, new RegExp(`${selector.replace(/[.[\]"=*]/g, '\\$&')}::after\\s*\\{\\s*content:\\s*"\\*";\\s*content:\\s*"\\*" / "";`), selector);
	}
	// The fetch block's Theme line marks the theme in use, following data-theme.
	assert.match(pages.home, /:root:not\(\[data-theme="tty"\]\) \.fetch-theme-day,\s*:root\[data-theme="tty"\] \.fetch-theme-night\s*\{\s*color:\s*var\(--accent\);\s*\}/);
	assert.match(pages.home, /:root:not\(\[data-theme="tty"\]\) \.fetch-theme-day::after,\s*:root\[data-theme="tty"\] \.fetch-theme-night::after\s*\{\s*content:\s*"\*";\s*content:\s*"\*" \/ "";/);
	// The marker is silent; assistive tech reads a hidden "current" shown by the same selectors.
	assert.match(pages.home, /\.fetch-current\s*\{\s*display:\s*none;\s*\}\s*:root:not\(\[data-theme="tty"\]\) \.fetch-theme-day \.fetch-current,\s*:root\[data-theme="tty"\] \.fetch-theme-night \.fetch-current\s*\{\s*display:\s*inline;/);
	assert.equal(pages.home.match(/<span class="sr-only fetch-current">\{t\('home\.themeCurrent'\)\}<\/span>/g)?.length, 2);
});
