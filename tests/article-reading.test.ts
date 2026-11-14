import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { ui } from '../src/i18n/ui.ts';
import { buildTocTree } from '../src/lib/toc-tree.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const base = read('../src/styles/terminal.css');
const tokens = read('../src/styles/tokens.css');
const rules = [...base.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
// Selector lists split at top-level commas only, so `:is(h2, h3)` stays whole.
const selectors = (list: string) => list.split(/,(?![^(]*\))/).map((x) => x.trim());
const ruleFor = (selector: string) => rules.filter((r) => selectors(r[1]).includes(selector)).map((r) => r[2]).join('');

const h = (depth: number, text: string) => ({ depth, slug: text.toLowerCase(), text });

test('the contents tree draws `tree` prefixes nested by heading depth', () => {
	const tree = buildTocTree([h(2, 'A'), h(3, 'A1'), h(3, 'A2'), h(2, 'B'), h(3, 'B1'), h(4, 'B1x'), h(2, 'C')]);
	const rows: string[] = [];
	const walk = (nodes: typeof tree) => nodes.forEach((node) => { rows.push(node.prefix + node.text); walk(node.children); });
	walk(tree);
	assert.deepEqual(rows, [
		'├─ A',
		'│  ├─ A1',
		'│  └─ A2',
		'├─ B',
		'│  └─ B1',
		'└─ C',
	]);
	assert.deepEqual(tree.map((node) => node.children.length), [2, 1, 0]);
});

test('the last top-level section closes its column, and a leading h3 stands at the top level', () => {
	const tree = buildTocTree([h(3, 'Intro'), h(2, 'A'), h(3, 'A1')]);
	assert.deepEqual(tree.map((node) => node.prefix + node.text), ['├─ Intro', '└─ A']);
	assert.equal(tree[1].children[0].prefix, '   └─ ');
});

test('posts with fewer than two h2/h3 headings get no contents', () => {
	assert.deepEqual(buildTocTree([]), []);
	assert.deepEqual(buildTocTree([h(2, 'Only')]), []);
	assert.deepEqual(buildTocTree([h(2, 'Only'), h(4, 'Deep')]), []);
	assert.equal(buildTocTree([h(2, 'A'), h(2, 'B')]).length, 2);
});

test('the contents are a real nested list with decorative prefixes and a current-section marker', () => {
	const toc = read('../src/components/TableOfContents.astro');
	const list = read('../src/components/TocList.astro');
	assert.match(toc, /const tree = buildTocTree\(headings\);/);
	assert.match(toc, /\{tree\.length > 0 && \(/);
	assert.match(toc, /<nav class="toc" aria-labelledby="toc-label">\s*<details open>/);
	// Nested <ul>s for assistive technology; the branch drawing is hidden from it.
	assert.match(list, /<ul>[\s\S]*<li>[\s\S]*<span class="toc-branch" aria-hidden="true">\{node\.prefix\}<\/span><a href=\{`#\$\{node\.slug\}`\}>/);
	assert.match(list, /<Astro\.self nodes=\{node\.children\} \/>/);
	assert.match(toc, /\.toc :global\(\.toc-branch\)\s*\{[^}]*color:\s*var\(--secondary\);[^}]*white-space:\s*pre;/);
	// The section in view: aria-current="location", the accent and a trailing `*`
	// whose cell every link reserves; set by an IntersectionObserver.
	assert.match(toc, /new IntersectionObserver\(/);
	assert.match(toc, /setAttribute\('aria-current', 'location'\)/);
	assert.match(toc, /\.toc :global\(a\[aria-current\]\)\s*\{\s*color:\s*var\(--accent\);\s*\}/);
	assert.match(toc, /\.toc :global\(a\)::after\s*\{\s*content:\s*"\*";\s*content:\s*"\*" \/ "";\s*visibility:\s*hidden;/);
	assert.doesNotMatch(toc, /data-theme|background:\s*var\(--accent\)/);
	// From 1280px a sticky column beside the body; below it, in the flow.
	assert.match(tokens, /--toc-width:\s*20rem;/);
	assert.match(base, /@media \(min-width: 1280px\)\s*\{[\s\S]*\.page-frame-article \.article > \.toc\s*\{[^}]*grid-column:\s*2;[^}]*position:\s*sticky;/);
	assert.match(read('../src/layouts/BlogPost.astro'), /<TableOfContents slot="aside" headings=\{headings\} lang=\{lang\} \/>/);
});

test('an article is a head block closed by a structural rule, the body, then the comments block', () => {
	const frame = read('../src/components/PageFrame.astro');
	assert.match(frame, /<article class="prose article">\s*<header class="article-head">\s*<slot name="hero" \/>\s*<slot name="meta" \/>\s*<h1 class="page-title">\{title\}<\/h1>\s*<slot name="head" \/>\s*<\/header>\s*<slot name="aside" \/>\s*<div class="article-body">\s*<slot \/>\s*<\/div>\s*<\/article>\s*<slot name="after" \/>/);
	assert.equal((frame.match(/<h1/g) ?? []).length, 2, 'one h1 per pattern branch');
	const head = ruleFor('.article-head');
	assert.match(head, /margin-block-end:\s*var\(--space-4\);/);
	assert.match(head, /padding-block-end:\s*var\(--space-4\);/);
	assert.match(head, /border-block-end:\s*var\(--hairline\) solid var\(--border-strong\);/);
	const post = read('../src/layouts/BlogPost.astro');
	assert.match(post, /<LanguageVersionNotice slot="head" /);
	assert.match(post, /<section slot="after" class="article-comments" aria-labelledby="comments-title">\s*<Prompt command=\{t\('term\.comments'\)\} \/>\s*<h2 id="comments-title" class="sr-only">\{t\('blog\.comments'\)\}<\/h2>\s*<Remark42Comments/);
	assert.doesNotMatch(post, /<hr \/>/);
	assert.match(ruleFor('.article-comments'), /border-block-start:\s*var\(--hairline\) solid var\(--border-strong\);/);
	for (const lang of ['zh', 'en', 'zh-CN'] as const) {
		assert.equal(ui[lang]['term.comments'], 'tail -f ~/comments');
		assert.ok(ui[lang]['blog.comments']);
	}
});

test('section headings carry Markdown markers in the accent and an extra blank line above h2', () => {
	assert.match(ruleFor('.article-body h2::before'), /content:\s*"## ";\s*content:\s*"## " \/ "";\s*color:\s*var\(--accent\);/);
	assert.match(ruleFor('.article-body h3::before'), /content:\s*"### ";\s*content:\s*"### " \/ "";\s*color:\s*var\(--accent\);/);
	assert.match(ruleFor('.article-body h2'), /margin-block-start:\s*var\(--space-6\);/);
	assert.match(ruleFor('.article-body :is(h2, h3, h4, h5, h6)'), /color:\s*var\(--emphasized\);/);
});

test('night glow stays off running text in a post and on its headings', () => {
	assert.match(ruleFor('.article-body'), /^\s*text-shadow:\s*none;\s*$/);
	assert.match(ruleFor('.article-body :is(h2, h3, h4, h5, h6)'), /text-shadow:\s*var\(--text-glow\);/);
	// Done by scoping the existing token, not a second glow value.
	assert.equal((base.match(/text-shadow:\s*var\(--text-glow\)/g) ?? []).length, 2);
});

test('quotes, code, tables and the contents share one box vocabulary', () => {
	for (const selector of ['pre', 'blockquote', '.table-scroll']) {
		assert.match(ruleFor(selector), /margin:\s*var\(--space-4\) 0;/, selector);
	}
	assert.match(read('../src/components/TableOfContents.astro'), /\.toc\s*\{[^}]*margin-block:\s*var\(--space-4\);[^}]*padding:\s*var\(--space-3\);/);
	assert.match(ruleFor('pre'), /padding:\s*var\(--space-3\);/);
	assert.match(ruleFor('blockquote'), /color:\s*var\(--secondary\);/);
	assert.match(ruleFor('img'), /border:\s*var\(--hairline\) solid var\(--border-color\);/);
});

test('post lists close each entry with a decorative rule and set the pages apart with a structural one', () => {
	const item = ruleFor('.post-item');
	assert.match(item, /margin-block-end:\s*var\(--space-4\);/);
	assert.match(item, /padding-block-end:\s*var\(--space-4\);/);
	assert.match(item, /border-block-end:\s*var\(--hairline\) solid var\(--border-color\);/);
	assert.match(ruleFor('.post-item:last-child'), /border-block-end:\s*none;/);
	assert.match(read('../src/layouts/BlogList.astro'), /\.pagination\s*\{[^}]*padding-block-start:\s*var\(--space-4\);[^}]*border-block-start:\s*var\(--hairline\) solid var\(--border-strong\);/);
});

test('the post column holds 36 CJK characters of 16px', () => {
	const rem = (name: string) => Number(tokens.match(new RegExp(`${name}:\\s*([\\d.]+)rem;`))![1]);
	assert.match(ruleFor('.page-frame-article'), /padding:\s*var\(--space-3\);/);
	// The frame's width minus its padding on both sides, in 16px cells.
	assert.equal(rem('--prose-width') - 2 * rem('--space-3'), 36);
});
