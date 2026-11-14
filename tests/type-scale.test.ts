import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

// Unifont is a 16px bitmap font. The scale has three sizes and no other:
// 16px for text, 24px for section and list titles, 32px for the page title.
// The social images (src/lib/og-image.ts and src/pages/og/) are rendered to
// PNG by satori, not drawn in the page.
const ALLOWED = [16, 24, 32];

const src = new URL('../src/', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, src), 'utf8');
const tokens = read('styles/tokens.css');
const day = tokens.match(/:root\s*\{([^}]+)\}/)![1].replace(/\/\*[\s\S]*?\*\//g, '');
const values = new Map([...day.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

/** A length in px, following var() chains through the day tokens. */
function px(value: string): number {
	const v = value.replace(/\s*!important$/, '').trim();
	const ref = v.match(/^var\((--[\w-]+)\)$/);
	if (ref) {
		assert.ok(values.has(ref[1]), `${ref[1]} is a token`);
		return px(values.get(ref[1])!);
	}
	const len = v.match(/^([\d.]+)(rem|px)$/);
	assert.ok(len, `${value} is a rem or px length`);
	return Number(len[1]) * (len[2] === 'rem' ? 16 : 1);
}

function files(dir: URL): URL[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const url = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dir);
		if (entry.isDirectory()) return entry.name === 'content' || url.href.endsWith('/pages/og/') ? [] : files(url);
		return /\.(css|astro|ts|tsx|js|mjs)$/.test(entry.name) && !url.href.endsWith('/lib/og-image.ts') ? [url] : [];
	});
}

test('the type tokens hold three sizes, 16, 24 and 32px, on whole-pixel lines', () => {
	// --text-glow is a text-shadow role, not a size.
	const sizes = [...values.keys()].filter((name) => name === '--font-size' || (name.startsWith('--text-') && name !== '--text-glow'));
	assert.ok(sizes.length >= 8, sizes.join());
	for (const name of sizes) assert.ok(ALLOWED.includes(px(values.get(name)!)), `${name}: ${px(values.get(name)!)}px`);
	assert.deepEqual([...new Set(sizes.map((name) => px(values.get(name)!)))].sort((a, b) => a - b), ALLOWED);
	assert.equal(px('var(--text-page-title)'), 32);
	assert.equal(px('var(--text-h2)'), 24);
	assert.equal(px('var(--text-card-title)'), 24);
	for (const name of ['--text-h3', '--text-meta', '--text-code']) assert.equal(px(`var(${name})`), 16, name);
	const leadings = [...values.keys()].filter((name) => name === '--line-height' || name.startsWith('--leading-'));
	for (const name of leadings) assert.ok(Number.isInteger(px(values.get(name)!)), name);
});

test('every font size in the components and stylesheets is 16, 24 or 32px', () => {
	let declarations = 0;
	for (const url of files(src)) {
		const text = readFileSync(url, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
		const path = url.pathname.slice(src.pathname.length);
		assert.doesNotMatch(text, /fontSize/, path);
		for (const m of text.matchAll(/(?<![\w-])font:\s*([^;}]+)/g)) assert.equal(m[1].trim(), 'inherit', `${path}: font: ${m[1]}`);
		for (const m of text.matchAll(/(?<![\w-])font-size:\s*([^;}]+)/g)) {
			declarations++;
			const value = m[1].trim();
			if (/^inherit(\s*!important)?$/.test(value)) continue;
			assert.ok(ALLOWED.includes(px(value)), `${path}: font-size: ${value}`);
		}
	}
	assert.ok(declarations >= 10, `${declarations} font-size declarations scanned`);
});

test('elements the UA draws smaller keep their context size, inline post styles included', () => {
	const base = read('styles/terminal.css').replace(/\/\*[\s\S]*?\*\//g, '');
	assert.match(base, /\nsmall,\s*sub,\s*sup\s*\{\s*font-size:\s*inherit;\s*\}/);
	// Posts may carry `<small style="font-size: …">`; the stylesheet overrides it.
	assert.match(base, /\n\.prose small\s*\{[^}]*font-size:\s*inherit !important;/);
	const posts = (dir: URL): URL[] => readdirSync(dir, { withFileTypes: true })
		.flatMap((entry) => entry.isDirectory() ? posts(new URL(entry.name + '/', dir)) : /\.mdx?$/.test(entry.name) ? [new URL(entry.name, dir)] : []);
	for (const url of posts(new URL('content/', src))) {
		for (const m of readFileSync(url, 'utf8').matchAll(/<(\w+)[^>]*style="[^"]*font-size/g)) {
			assert.equal(m[1], 'small', `${url.pathname}: inline font-size on <${m[1]}>`);
		}
	}
});
