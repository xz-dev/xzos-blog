import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const base = read('../src/styles/terminal.css');
// Keep the night theme isolated: the Solarized stylesheet remains the baseline.
const tty = read('../src/styles/tty.css');
const reference = JSON.parse(read('../docs/theme/tektronix-4052-b.json'));
const palette = Object.fromEntries(
	[...tty.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]),
);

function luminance(hex: string) {
	const channels = hex.match(/[\da-f]{2}/gi)!.map((channel) => {
		const value = parseInt(channel, 16) / 255;
		return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	});
	return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(a: string, b: string) {
	const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (values[0] + 0.05) / (values[1] + 0.05);
}

test('B preserves its illuminated green field and declares its actual contrast trade-off', () => {
	for (const [name, value] of Object.entries(palette)) {
		const [r, g, b] = value.match(/[\da-f]{2}/gi)!.map((v) => parseInt(v, 16));
		assert.ok(g >= r && g >= b, `${name} must stay on the green phosphor axis`);
	}
	for (const name of ['--foreground', '--emphasized', '--accent']) {
		assert.ok(contrast(palette[name], palette['--background']) >= 3, `${name}: source-relative 3:1 floor, not normal-text AA`);
	}
	assert.ok(Math.abs(contrast(palette['--foreground'], palette['--background']) - reference.contrast.foregroundOnBackground) < 1e-10);
	assert.equal(reference.contrast.normalTextWcagAA, false);
	assert.ok(reference.contrast.whiteOnBackgroundCeiling < 4.5);
	assert.ok(contrast(palette['--secondary'], palette['--surface']) >= 4.5);
	assert.ok(contrast(palette['--foreground'], palette['--control-hover']) >= 4.5);
	for (const [role, color] of Object.entries(reference.syntax)) {
		if (role !== 'background') assert.ok(contrast(String(color), palette['--surface']) >= 4.5, role);
	}
});

test('night styles are scoped, with no screen simulation or blurred text', () => {
	const rules = [...tty.matchAll(/([^{}]+)\{[^{}]*\}/g)];
	assert.ok(rules.length > 10);
	for (const rule of rules) {
		const selector = rule[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
		if (selector === '@font-face') continue;
		assert.ok(selector.startsWith(':root[data-theme="tty"]'), selector);
	}
	assert.doesNotMatch(base + tty, /repeating-linear-gradient|drop-shadow\(|text-shadow:\s*0\s/i);
	assert.doesNotMatch(tty, /@keyframes|perspective|backdrop-filter|filter:\s*blur/i);
	assert.match(tty, /transition:\s*none\s*!important/);
	assert.match(tty, /border-radius:\s*0\s*!important/);
});

test('night typography is self-hosted, with real WOFF2 files and its license', () => {
	assert.match(tty, /font-variant-ligatures:\s*none/);
	for (const weight of [400, 600]) {
		const file = `../public/fonts/ibm-plex-mono-latin-${weight}-normal.woff2`;
		assert.equal(readFileSync(new URL(file, import.meta.url)).subarray(0, 4).toString(), 'wOF2');
		assert.ok(tty.includes(`/fonts/ibm-plex-mono-latin-${weight}-normal.woff2`));
	}
	assert.match(read('../public/fonts/ibm-plex-mono-OFL.txt'), /SIL OPEN FONT LICENSE/i);
});

test('Solarized day colors and the original font stack stay unchanged', () => {
	const root = base.match(/:root\s*\{([^}]+)\}/)![1];
	for (const [name, value] of Object.entries({
		background: '#fdf6e3', foreground: '#657b83', accent: '#268bd2',
		secondary: '#93a1a1', emphasized: '#586e75', 'border-color': '#93a1a1',
	})) assert.ok(root.includes(`--${name}: ${value};`));
	assert.match(base, /font-family:\s*"Fira Code",\s*"JetBrains Mono"/);
	assert.match(read('../src/components/BaseHead.astro'), /import '\.\.\/styles\/tty\.css';/);
});

test('controls provide square, raised and pressed states plus keyboard focus', () => {
	assert.match(tty, /border-radius:\s*0/);
	assert.match(tty, /:active/);
	assert.match(tty, /:focus-visible/);
	assert.match(tty, /box-shadow:\s*inset/);
	assert.match(tty, /#theme-toggle/);
	assert.match(tty, /\.pagination/);
	assert.match(tty, /\.lang-link/);
});
