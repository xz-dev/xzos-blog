import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ui } from '../src/i18n/ui.ts';

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
	assert.match(pages.links, /<Prompt command=\{t\('term\.friends'\)\} \/>/);
	assert.match(pages.about, /<Prompt command=\{t\('term\.cat', \{ file: `\$\{slug\}\.md` \}\)\} \/>/);
	// Commands are i18n keys in every locale.
	for (const lang of Object.keys(ui) as (keyof typeof ui)[]) {
		for (const key of ['term.recent', 'term.cat', 'term.friends'] as const) assert.ok(ui[lang][key], `${lang} ${key}`);
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

test('output rows align on shared tracks; only the home cursor blinks', () => {
	assert.match(css, /\.term-output\s*\{[^}]*grid-template-columns:\s*fit-content\(var\(--term-left-max, 50%\)\) minmax\(0, 1fr\);/);
	assert.match(css, /\.term-output li\s*\{[^}]*grid-template-columns:\s*subgrid;/);
	assert.match(css, /\.term-output li > \*\s*\{[^}]*overflow-wrap:\s*anywhere;/);
	// The cursor blinks only with data-blink, set by `blink`, which only the
	// home page (it has a pause control) passes.
	assert.match(read('../src/components/term/Cursor.astro'), /data-blink=\{blink \? '' : undefined\}/);
	assert.match(css, /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*\.cursor\[data-blink\]\s*\{\s*animation:\s*var\(--cursor-blink\);/);
	assert.doesNotMatch(css, /\n\s*\.cursor\s*\{[^}]*animation/);
	assert.match(tty, /\.cursor\[data-blink\]:not\(\[data-paused\] \*\)\s*\{\s*animation:\s*var\(--cursor-blink\) !important;/);
	assert.match(pages.home, /<Prompt cursor blink \/>/);
	assert.match(pages.about, /<Prompt cursor \/>/);
	assert.match(pages.links, /<Prompt cursor \/>/);
});

test('current markers are the accent and a trailing *, never an inverted block', () => {
	const sources = [...Object.values(pages), ...['Prompt', 'OutputList', 'Cursor'].map((f) => read(`../src/components/term/${f}.astro`))];
	for (const source of sources) {
		// No rule in these pages fills a box with the accent or sets text to the page colour.
		assert.doesNotMatch(source, /background(?:-color)?:\s*var\(--accent\)|color:\s*var\(--background\)/);
	}
	for (const selector of ['.fetch dd a[aria-current]', '.ring-toggle[aria-pressed="true"]']) {
		const at = pages.home.indexOf(`${selector} {`);
		assert.ok(at > 0, selector);
		assert.match(pages.home.slice(at), /^[^{]*\{\s*color:\s*var\(--accent\);\s*\}/, selector);
		assert.match(pages.home, new RegExp(`${selector.replace(/[.[\]"=*]/g, '\\$&')}::after\\s*\\{\\s*content:\\s*"\\*";\\s*content:\\s*"\\*" / "";`), selector);
	}
});
