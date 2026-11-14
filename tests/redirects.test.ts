import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { legacyRedirects, renderLegacyRedirects } from '../src/lib/legacy-redirects.ts';

const root = new URL('../', import.meta.url);
const redirects = readFileSync(new URL('public/_redirects', root), 'utf8');
const rules = redirects
	.split('\n')
	.filter((line) => line.trim() && !line.startsWith('#'))
	.map((line) => line.trim().split(/\s+/));

test('public/_redirects carries the legacy block exactly as generated', () => {
	assert.ok(
		redirects.endsWith(renderLegacyRedirects()),
		'public/_redirects is stale: run `npm run redirects`',
	);
});

test('every legacy source redirects with a 301 in both its no-slash and slash form', () => {
	for (const [from, to] of Object.entries(legacyRedirects)) {
		assert.match(from, /^\/[a-z0-9_-]+$/, `${from}: sources are one ASCII segment without a trailing slash`);
		for (const source of [from, `${from}/`]) {
			const matches = rules.filter(([s]) => s === source);
			assert.deepEqual(matches, [[source, to, '301']], source);
		}
	}
});

test('every legacy target is a built route', () => {
	const posts = new Set(
		readdirSync(new URL('src/content/blog/', root)).filter((f) => /\.mdx?$/.test(f)).map((f) => f.replace(/\.mdx?$/, '')),
	);
	for (const to of new Set(Object.values(legacyRedirects))) {
		assert.match(to, /^\/.*\/$/, `${to}: targets end in a slash`);
		if (to === '/about/') assert.ok(existsSync(new URL('src/pages/about.astro', root)));
		else {
			const slug = to.match(/^\/blog\/([^/]+)\/$/)?.[1];
			assert.ok(slug && posts.has(slug), `${to} has no post in src/content/blog`);
		}
	}
});

test('a legacy source is not a route of the site: Pages redirects even when an asset matches', () => {
	const top = new Set(
		readdirSync(new URL('src/pages/', root)).map((f) => f.replace(/\.(astro|ts|js)$/, '').replace(/\.(xml|svg)$/, '')),
	);
	for (const lang of ['en', 'zh-CN']) top.add(lang);
	for (const from of Object.keys(legacyRedirects)) {
		assert.ok(!top.has(from.slice(1)), `${from} would shadow a page`);
		assert.ok(!existsSync(new URL(`public${from}`, root)), `${from} would shadow a public file`);
	}
});

test('the rule count stays within the Pages _redirects limit of 2,000 static rules', () => {
	assert.ok(rules.length <= 2000);
	assert.ok(rules.every((rule) => !/[:*]/.test(rule[0]) && rule.length === 3), 'static three-field rules only');
});
