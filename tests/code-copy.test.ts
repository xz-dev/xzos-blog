import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ui } from '../src/i18n/ui.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('article code blocks get a [copy] control that copies the code text', () => {
	const post = read('../src/layouts/BlogPost.astro');
	assert.match(post, /<slot \/>\s*<CodeCopy lang=\{lang\} \/>/);
	const copy = read('../src/components/CodeCopy.astro');
	// Only article code, and only when the clipboard API exists: without script there is no button.
	assert.match(copy, /querySelectorAll<HTMLPreElement>\('\.article-body pre'\)/);
	assert.match(copy, /if \(labels && navigator\.clipboard\)/);
	assert.match(copy, /navigator\.clipboard\.writeText\(pre\.querySelector\('code'\)\?\.textContent/);
	// A real button with a constant accessible name and a polite status for the result.
	assert.match(copy, /button\.type = 'button'/);
	assert.match(copy, /setAttribute\('aria-label', labels\.label/);
	assert.match(copy, /setAttribute\('role', 'status'\)/);
	assert.match(copy, /labels\.copied : labels\.failed/);
});

test('the copy control has every label in every locale', () => {
	for (const lang of Object.keys(ui) as (keyof typeof ui)[]) {
		for (const key of ['code.copy', 'code.copied', 'code.copyFailed', 'code.copyLabel'] as const) {
			assert.ok(ui[lang][key], `${lang} ${key}`);
		}
	}
});

test('the control sits inside the block frame on its surface, plain text like the menu items', () => {
	const css = read('../src/styles/terminal.css');
	assert.match(css, /\.code-block\s*\{\s*position:\s*relative;/);
	assert.match(css, /\.code-copy\s*\{[^}]*position:\s*absolute;[^}]*background:\s*var\(--surface\);[^}]*color:\s*var\(--secondary\);/);
	assert.match(css, /\.code-copy:hover,\s*\.code-copy:focus-visible\s*\{\s*color:\s*var\(--accent\);\s*text-decoration:\s*underline;/);
	assert.doesNotMatch(css, /\.code-copy[^{]*\{[^}]*(box-shadow|border-radius:\s*[1-9])/);
});
