import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const base = read('../src/styles/terminal.css');
// Keep the night theme isolated: the day stylesheet remains the baseline.
const tty = read('../src/styles/tty.css');
const reference = JSON.parse(read('../docs/theme/tty-dark.json'));
const tokens = read('../src/styles/tokens.css');
const nightTokens = tokens.match(/:root\[data-theme="tty"\]\s*\{([^}]+)\}/)![1];
const palette = Object.fromEntries(
	[...nightTokens.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]),
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

test('the active dark field stays on the green-dominant phosphor axis with AAA text contrast', () => {
	for (const [name, value] of Object.entries(palette)) {
		const [r, g, b] = value.match(/[\da-f]{2}/gi)!.map((v) => parseInt(v, 16));
		assert.ok(g >= r && g >= b, `${name} must stay on the green phosphor axis`);
	}
	for (const name of ['--foreground', '--emphasized', '--accent', '--secondary']) {
		assert.ok(contrast(palette[name], palette['--background']) >= 7, `${name}: 7:1 text floor`);
	}
	assert.ok(luminance(palette['--background']) < 0.01);
	assert.ok(Math.abs(contrast(palette['--foreground'], palette['--background']) - reference.contrast.foregroundOnBackground) < 1e-10);
	assert.equal(reference.contrast.normalTextWcagAAA, true);
	assert.ok(contrast(palette['--secondary'], palette['--surface']) >= 7);
	assert.ok(contrast(palette['--secondary'], palette['--control-hover']) >= 7);
	for (const [role, color] of Object.entries(reference.syntax)) {
		if (role !== 'background') assert.ok(contrast(String(color), palette['--surface']) >= 7, role);
	}
});

test('night styles are scoped; glow, scanlines and vignette are static and opt out for more contrast', () => {
	const rules = [...tty.matchAll(/([^{}]+)\{[^{}]*\}/g)];
	assert.ok(rules.length > 10);
	for (const rule of rules) {
		const selector = rule[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
		if (selector === '@font-face') continue;
		assert.ok(selector.startsWith(':root[data-theme="tty"]'), selector);
	}
	assert.match(nightTokens, /--tty-glow:\s*0 0 2px currentColor, 0 0 8px rgba\(212, 255, 58, 0\.45\);/);
	assert.match(tty, /:root\[data-theme="tty"\] body\s*\{[^}]*text-shadow:\s*var\(--tty-glow\);/);
	assert.match(tty, /:root\[data-theme="tty"\] pre\s*\{\s*text-shadow:\s*none;/);
	const overlay = tty.match(/:root\[data-theme="tty"\] body::after\s*\{([^}]*)\}/)![1];
	assert.match(overlay, /position:\s*fixed/);
	assert.match(overlay, /pointer-events:\s*none/);
	assert.match(overlay, /background:\s*var\(--tty-scanlines\), var\(--tty-vignette\);/);
	assert.match(nightTokens, /--tty-scanlines:\s*repeating-linear-gradient\(to bottom, rgba\(0, 0, 0, 0\.12\) 0, rgba\(0, 0, 0, 0\.12\) 1px, transparent 1px, transparent 3px\);/);
	assert.match(nightTokens, /--tty-vignette:\s*radial-gradient\(ellipse at center/);
	const more = tty.match(/@media \(prefers-contrast: more\)\s*\{([\s\S]*?)\n\}/)![1];
	assert.match(more, /body\s*\{\s*text-shadow:\s*none;/);
	assert.match(more, /body::after\s*\{\s*content:\s*none;/);
	// Static only: no motion, flicker, curvature or blur, and no glow in day.
	assert.doesNotMatch(tty, /@keyframes|animation:(?!\s*none)|perspective|backdrop-filter|filter:\s*blur|transform:\s*(?:scale|rotate|skew|matrix)/i);
	assert.doesNotMatch(base, /repeating-linear-gradient|drop-shadow\(|text-shadow|box-shadow:(?!\s*(?:none|inset))/i);
	assert.match(tty, /transition:\s*none\s*!important/);
	assert.match(tty, /border-radius:\s*0\s*!important/);
});

test('night typography is self-hosted, with real WOFF2 files and its license', () => {
	assert.match(tty, /font-variant-ligatures:\s*none/);
	const file = '../public/fonts/unifont-18.0.01-latin.woff2';
	assert.equal(readFileSync(new URL(file, import.meta.url)).subarray(0, 4).toString(), 'wOF2');
	assert.ok(tty.includes('/fonts/unifont-18.0.01-latin.woff2'));
	assert.match(read('../public/fonts/unifont-OFL.txt'), /SIL OPEN FONT LICENSE/i);
});

test('day palette is pinned at WCAG AA and keeps the original font stack', () => {
	const root = tokens.match(/:root\s*\{([^}]+)\}/)![1];
	const day = {
		background: '#fff8f2', surface: '#ffeadb', foreground: '#42302a', accent: '#b4410f',
		secondary: '#76605a', emphasized: '#42302a', 'border-color': '#e9c1ae', 'header-top': '#ffe4cc',
	};
	for (const [name, value] of Object.entries(day)) assert.ok(root.includes(`--${name}: ${value};`), name);
	// The border is the accent mixed 30% into the page.
	const mix = (a: string, b: string, weight: number) =>
		'#' + [0, 1, 2].map((i) => {
			const channel = (hex: string) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
			return Math.round(channel(a) * weight + channel(b) * (1 - weight)).toString(16).padStart(2, '0');
		}).join('');
	assert.equal(mix(day.accent, day.background, 0.3), day['border-color']);
	// Code and inline code sit on the surface; the header runs from header-top to the page.
	assert.match(base, /pre\s*\{[^}]*background:\s*var\(--surface\)/);
	assert.match(read('../src/components/Header.astro'), /background:\s*linear-gradient\(to bottom, var\(--header-top\), var\(--background\)\)/);
	assert.doesNotMatch(base, /text-shadow/);
	assert.match(base, /font-family:\s*"Fira Code",\s*"JetBrains Mono"/);
	// Fira Code is self-hosted: no render-blocking third-party font stylesheet.
	assert.doesNotMatch(base, /@import|url\(['"]?https?:/);
	assert.equal(readFileSync(new URL('../public/fonts/fira-code-5.2-latin.woff2', import.meta.url)).subarray(0, 4).toString(), 'wOF2');
	assert.match(read('../public/fonts/fira-code-OFL.txt'), /SIL Open Font License, Version 1\.1/);
	assert.match(read('../src/components/BaseHead.astro'), /import '\.\.\/styles\/tty\.css';/);
});

test('both palettes keep every text colour at 4.5:1 or more on each field it sits on', () => {
	const night = palette;
	const fields = {
		day: { background: '#fff8f2', surface: '#ffeadb', 'header-top': '#ffe4cc' },
		night: { background: night['--background'], surface: night['--surface'], 'control-face': night['--control-face'], 'control-hover': night['--control-hover'] },
	};
	const text = {
		day: { foreground: '#42302a', secondary: '#76605a', accent: '#b4410f' },
		night: { foreground: night['--foreground'], secondary: night['--secondary'], accent: night['--accent'] },
	};
	for (const theme of ['day', 'night'] as const) {
		for (const [role, color] of Object.entries(text[theme])) {
			for (const [field, bg] of Object.entries(fields[theme])) {
				assert.ok(contrast(color, bg) >= 4.5, `${theme} ${role} on ${field}: ${contrast(color, bg).toFixed(2)}`);
			}
		}
	}
});

test('controls share one box, focus ring and states; night only adds a bevel', () => {
	// One focus ring for both themes, keyboard only.
	assert.match(base, /:focus-visible\s*\{\s*outline:\s*var\(--focus-width\) solid var\(--accent\);/);
	const ttyRules = tty.replace(/\/\*[\s\S]*?\*\//g, '');
	assert.doesNotMatch(ttyRules, /focus-visible|outline/);
	for (const state of ['.control:hover', '.control.active', '.control[aria-current]']) assert.ok(base.includes(state), state);
	assert.match(base, /\.control,\s*button\s*\{[^}]*min-height:\s*var\(--control-size\);[^}]*border-radius:\s*0;/);
	// Night: raised and pressed bevels on the same selectors, no new geometry.
	assert.match(tty, /:root\[data-theme="tty"\] \.control,\s*:root\[data-theme="tty"\] button\s*\{[^}]*box-shadow:\s*inset/);
	assert.match(tty, /:root\[data-theme="tty"\] \.control:active/);
	assert.doesNotMatch(ttyRules, /(?:width|height|padding|margin|font-size|line-height):/);
	for (const file of ['HeaderLink', 'LanguageSwitcher', 'ThemeToggle', 'TableOfContents']) {
		assert.match(read(`../src/components/${file}.astro`), /class(?::list)?=[^>]*control/, file);
	}
});
