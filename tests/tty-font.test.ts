import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const tty = read('../src/styles/tty.css');

test('all night text, including forms and generated text, uses one CJK-capable pixel family', () => {
	assert.match(tty, /--tty-font:\s*"Unifont",\s*"Unifont Upper",\s*monospace;/);
	assert.doesNotMatch(tty, /IBM Plex Mono|Microsoft YaHei|PingFang SC|Noto Sans/);
	const universal = tty.match(/:root\[data-theme="tty"\] \*,\s*:root\[data-theme="tty"\] \*::before,\s*:root\[data-theme="tty"\] \*::after\s*\{([^}]+)\}/)![1];
	assert.match(universal, /font-family:\s*var\(--tty-font\)\s*!important;/);
	assert.match(universal, /font-synthesis:\s*none;/);
});

test('self-hosted Unifont preserves its grid, Unicode coverage, metrics and licensing', () => {
	const manifest = JSON.parse(read('../docs/theme/tty-font.json'));
	assert.equal(manifest.family, 'Unifont');
	assert.equal(manifest.source.sha256, '88d0a14d4aa9a96419720b39ba5da921a59560d76d4ec7d523acc06ed85cd3c2');
	assert.equal(manifest.grid.height, 16);
	assert.deepEqual(manifest.grid.widths, [8, 16]);
	assert.equal(manifest.unicodeCodepoints, 58910);
	assert.equal(manifest.cjkUnifiedIdeographs, 20992);
	assert.equal(manifest.conversion.preservesCmap, true);
	assert.equal(manifest.conversion.preservesMetrics, true);
	assert.equal(manifest.conversion.preservesSampleOutlines, true);
	const bytes = readFileSync(new URL('../public' + manifest.asset.url, import.meta.url));
	assert.equal(bytes.subarray(0, 4).toString(), 'wOF2');
	assert.equal(bytes.length, manifest.asset.bytes);
	assert.ok(bytes.length < 1_000_000);
	assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.asset.sha256);
	assert.ok(tty.includes(`url('${manifest.asset.url}') format('woff2')`));
	const license = read('../public/fonts/unifont-OFL.txt');
	assert.match(license, /Copyright © 1998-2026 Roman Czyborra/);
	assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
});

test('single-weight bitmap outlines are not artificially emboldened or slanted', () => {
	assert.match(tty, /font-synthesis:\s*none;/);
	assert.match(tty, /:root\[data-theme="tty"\] strong,\s*:root\[data-theme="tty"\] b,\s*:root\[data-theme="tty"\] em\s*\{[^}]*text-decoration:\s*underline;/);
});

test('supplementary emoji and symbols use the companion pixel font, not a color emoji fallback', () => {
	const manifest = JSON.parse(read('../docs/theme/tty-font.json'));
	const symbols = manifest.symbols;
	assert.equal(symbols.family, 'Unifont Upper');
	assert.equal(symbols.source.sha256, '472201e45a050bff4c7658208b8c73e34ebce3764b287a5a46c7774038ef9391');
	assert.equal(symbols.unicodeRange, 'U+1F000-1FAFF');
	assert.equal(symbols.codepoints, 2816);
	assert.ok(symbols.preservesSampleOutlines);
	const bytes = readFileSync(new URL('../public' + symbols.asset.url, import.meta.url));
	assert.equal(bytes.subarray(0, 4).toString(), 'wOF2');
	assert.equal(bytes.length, symbols.asset.bytes);
	assert.ok(bytes.length < 100_000);
	assert.equal(createHash('sha256').update(bytes).digest('hex'), symbols.asset.sha256);
	assert.ok(tty.includes(`url('${symbols.asset.url}') format('woff2')`));
});

test('the font documentation distinguishes CJK adaptation from the ASCII-only 4052', () => {
	const readme = read('../README.md');
	assert.match(readme, /GNU Unifont/);
	assert.match(readme, /5.?×.?8|5.?x.?8/);
	assert.match(readme, /not.*4052.*(?:font|character)/i);
});
