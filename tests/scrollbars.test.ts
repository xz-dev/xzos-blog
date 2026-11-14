import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/styles/terminal.css', import.meta.url), 'utf8');
const block = (query: string) => {
	const start = css.indexOf(`@supports ${query} {`);
	assert.ok(start >= 0, query);
	let depth = 0;
	for (let i = css.indexOf('{', start); i < css.length; i++) {
		if (css[i] === '{') depth++;
		if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1);
	}
	return '';
};

test('Chromium and WebKit: square token-coloured bars, no arrows, no hover fill', () => {
	const webkit = block('selector(::-webkit-scrollbar)');
	assert.match(webkit, /::-webkit-scrollbar\s*\{\s*width:\s*12px;\s*height:\s*12px;\s*background:\s*var\(--background\);/);
	assert.match(webkit, /pre::-webkit-scrollbar,\s*\.table-scroll::-webkit-scrollbar,\s*\.toc::-webkit-scrollbar\s*\{\s*width:\s*8px;\s*height:\s*8px;/);
	assert.match(webkit, /pre::-webkit-scrollbar\s*\{\s*background:\s*var\(--surface\);/);
	assert.match(webkit, /::-webkit-scrollbar-thumb\s*\{\s*background:\s*var\(--border-strong\);\s*border-radius:\s*var\(--radius\);/);
	assert.doesNotMatch(webkit, /:hover/);
	assert.match(webkit, /::-webkit-scrollbar-button,\s*::-webkit-scrollbar-corner\s*\{\s*display:\s*none;/);
	// scrollbar-color would switch these pseudo-elements off in Chromium.
	assert.doesNotMatch(webkit, /scrollbar-color|scrollbar-width/);
});

test('other engines: the standard properties with the same tokens', () => {
	const standard = block('not selector(::-webkit-scrollbar)');
	assert.match(standard, /html\s*\{\s*scrollbar-color:\s*var\(--border-strong\) var\(--background\);/);
	assert.match(standard, /pre\s*\{\s*scrollbar-color:\s*var\(--border-strong\) var\(--surface\);/);
	assert.match(standard, /pre,\s*\.table-scroll,\s*\.toc\s*\{\s*scrollbar-width:\s*thin;/);
});
