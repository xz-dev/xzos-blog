import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const base = read('../src/styles/terminal.css');
// Keep the night theme isolated: the day stylesheet remains the baseline.
const tty = read('../src/styles/tty.css');
const reference = JSON.parse(read('../docs/theme/tty-dark.json'));
const tokens = read('../src/styles/tokens.css');
const nightTokens = tokens.match(/:root\[data-theme="tty"\]\s*\{([^}]+)\}/)![1];
const hexTokens = (block: string) => Object.fromEntries(
	[...block.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]),
);
const palette = hexTokens(nightTokens);
const dayTokens = tokens.match(/:root\s*\{([^}]+)\}/)![1];
const day = hexTokens(dayTokens);
// Night's --border-strong is var(--border-color); resolve it like the browser.
const nightStrong = nightTokens.match(/--border-strong:\s*var\((--[\w-]+)\)/)?.[1];
if (nightStrong) palette['--border-strong'] = palette[nightStrong];

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
	// The halo is the foreground itself at 45%, not a second copy of its value.
	assert.match(nightTokens, /--tty-glow:\s*0 0 2px currentColor, 0 0 8px color-mix\(in srgb, var\(--foreground\) 45%, transparent\);/);
	assert.match(tty, /:root\[data-theme="tty"\] body\s*\{[^}]*text-shadow:\s*var\(--tty-glow\);/);
	assert.match(tty, /:root\[data-theme="tty"\] pre\s*\{\s*text-shadow:\s*none;/);
	const overlay = tty.match(/:root\[data-theme="tty"\] body::after\s*\{([^}]*)\}/)![1];
	assert.match(overlay, /position:\s*fixed/);
	assert.match(overlay, /pointer-events:\s*none/);
	// Behind the content: the overlay darkens the field, never the text.
	assert.match(overlay, /z-index:\s*-1;/);
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

test('typography is self-hosted for both themes, with real WOFF2 files and its license', () => {
	assert.match(base, /body\s*\{[^}]*font-variant-ligatures:\s*none/);
	const file = '../public/fonts/unifont-18.0.01-latin.woff2';
	assert.equal(readFileSync(new URL(file, import.meta.url)).subarray(0, 4).toString(), 'wOF2');
	assert.ok(read('../src/styles/fonts.css').includes('/fonts/unifont-18.0.01-latin.woff2'));
	assert.match(read('../public/fonts/unifont-OFL.txt'), /SIL OPEN FONT LICENSE/i);
	// No third-party font stylesheet, and no second family left behind.
	assert.doesNotMatch(base, /@import|url\(['"]?https?:/);
	assert.doesNotMatch(base, /@font-face/);
	assert.ok(!existsSync(new URL('../public/fonts/fira-code-5.2-latin.woff2', import.meta.url)));
	assert.ok(!existsSync(new URL('../scripts/build-day-font.py', import.meta.url)));
});

test('day palette keeps the peach hues', () => {
	assert.equal(day['--background'], '#fff8f2');
	assert.equal(day['--surface'], '#ffeadb');
	assert.equal(day['--accent'], '#b4410f');
	// Borders are the accent mixed into the page: 30% decorative, 80% structural.
	const mix = (a: string, b: string, weight: number) =>
		'#' + [0, 1, 2].map((i) => {
			const channel = (hex: string) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
			return Math.round(channel(a) * weight + channel(b) * (1 - weight)).toString(16).padStart(2, '0');
		}).join('');
	assert.equal(mix(day['--accent'], day['--background'], 0.3), day['--border-color']);
	assert.equal(mix(day['--accent'], day['--background'], 0.8), day['--border-strong']);
	// Code and inline code sit on the surface.
	assert.match(base, /pre\s*\{[^}]*background:\s*var\(--surface\)/);
	assert.doesNotMatch(base, /text-shadow/);
	assert.match(read('../src/components/BaseHead.astro'), /import '\.\.\/styles\/tty\.css';/);
});

// --menu-hover is declared once as color-mix(accent 15%, surface); resolve it per palette.
const mixHex = (a: string, b: string, weight: number) =>
	'#' + [0, 1, 2].map((i) => {
		const channel = (hex: string) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16);
		return Math.round(channel(a) * weight + channel(b) * (1 - weight)).toString(16).padStart(2, '0');
	}).join('');
const menuHover = (colors: Record<string, string>) => {
	const [, weight] = dayTokens.match(/--menu-hover:\s*color-mix\(in srgb, var\(--accent\) (\d+)%, var\(--surface\)\);/)!;
	return mixHex(colors['--accent'], colors['--surface'], Number(weight) / 100);
};

test('the header is a flat OS-style menu bar, shared by both themes', () => {
	const header = read('../src/components/Header.astro');
	const bar = header.match(/\n\theader\s*\{([^}]*)\}/)![1];
	assert.match(bar, /background:\s*var\(--surface\);/);
	assert.match(bar, /border-bottom:\s*var\(--hairline\) solid var\(--border-strong\);/);
	assert.doesNotMatch(header, /gradient/);
	assert.doesNotMatch(tokens, /--header-top/);
	assert.doesNotMatch(tty.replace(/\/\*[\s\S]*?\*\//g, ''), /header|menu-bar/i);
	// Menu items: plain text, hover tints the bar, the current page inverts.
	assert.match(base, /\.menu-item\s*\{[^}]*min-height:\s*var\(--menu-item-height\);[^}]*border:\s*0;[^}]*background:\s*transparent;/);
	assert.match(base, /\.menu-item:hover\s*\{\s*background:\s*var\(--menu-hover\);/);
	assert.match(base, /\.menu-item\[aria-current\]\s*\{\s*background:\s*var\(--accent\);\s*color:\s*var\(--background\);/);
	for (const file of ['HeaderLink', 'LanguageSwitcher', 'ThemeToggle']) {
		assert.match(read(`../src/components/${file}.astro`), /class(?::list)?=[^>]*menu-item/, file);
	}
	assert.doesNotMatch(header, /class="control/);
	// Night bevels skip menu items, so both themes share one flat style.
	assert.match(tty, /:root\[data-theme="tty"\] button:not\(\.menu-item\)\s*\{/);
	// Contrast: text on the bar and on the hover tint, the inverted item, icons, and the bar's edge.
	for (const [theme, colors] of Object.entries({ day, night: palette })) {
		const hover = menuHover(colors);
		const checks: [string, string, string, number][] = [
			['text on bar', colors['--foreground'], colors['--surface'], 4.5],
			['tagline on bar', colors['--secondary'], colors['--surface'], 4.5],
			['text on hover', colors['--foreground'], hover, 4.5],
			['inverted item', colors['--background'], colors['--accent'], 4.5],
			['icon on bar', colors['--accent'], colors['--surface'], 3],
			['icon on hover', colors['--accent'], hover, 3],
			['focus ring on bar', colors['--accent'], colors['--surface'], 3],
			['bar edge on page', colors['--border-strong'], colors['--background'], 3],
		];
		for (const [name, fg, bg, floor] of checks) {
			assert.ok(contrast(fg, bg) >= floor, `${theme} ${name}: ${contrast(fg, bg).toFixed(2)}`);
		}
	}
});

test('both palettes keep every text colour at 4.5:1 or more on each field it sits on', () => {
	const night = palette;
	const fields = {
		day: { background: day['--background'], surface: day['--surface'] },
		night: { background: night['--background'], surface: night['--surface'], 'control-face': night['--control-face'], 'control-hover': night['--control-hover'] },
	};
	const text = {
		day: { foreground: day['--foreground'], secondary: day['--secondary'], accent: day['--accent'] },
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
	assert.match(tty, /:root\[data-theme="tty"\] \.control,\s*:root\[data-theme="tty"\] button:not\(\.menu-item\)\s*\{[^}]*box-shadow:\s*inset/);
	assert.match(tty, /:root\[data-theme="tty"\] \.control:active/);
	assert.doesNotMatch(ttyRules, /(?:width|height|padding|margin|font-size|line-height):/);
	for (const file of ['TableOfContents']) {
		assert.match(read(`../src/components/${file}.astro`), /class(?::list)?=[^>]*control/, file);
	}
});

test('structural borders reach 3:1 in both themes; the soft border is decorative only', () => {
	for (const [theme, colors] of Object.entries({ day, night: palette })) {
		for (const field of ['--background', '--surface']) {
			const ratio = contrast(colors['--border-strong'], colors[field]);
			assert.ok(ratio >= 3, `${theme} --border-strong on ${field}: ${ratio.toFixed(2)}`);
		}
	}
	// Tables, code and quotes outline structure; hr, list rules and image frames decorate.
	const rules = [...base.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
	const borderOf = (selector: string) => rules.filter((r) => r[1].split(',').map((x) => x.trim()).includes(selector)).map((r) => r[2]).join('');
	for (const selector of ['pre', 'kbd', 'td', 'blockquote']) assert.match(borderOf(selector), /border(?:-left)?:[^;]*var\(--border-strong\)/, selector);
	for (const selector of ['hr', 'img', '.post-item']) assert.doesNotMatch(borderOf(selector), /--border-strong/, selector);
});

// The night scanlines and vignette are black at the alphas in tokens.css. A
// layer in front of the text multiplies text and field alike; a layer behind
// darkens the field only. Measure every text token and syntax colour at the
// darkest point (vignette edge on a scanline row) against the flat field.
test('night text and syntax keep 4.5:1 at the darkest overlay point', () => {
	const scanAlpha = Number(nightTokens.match(/--tty-scanlines:[^;]*rgba\(0, 0, 0, ([\d.]+)\)/)![1]);
	const vignetteAlpha = Number(nightTokens.match(/--tty-vignette:[^;]*rgba\(0, 0, 0, ([\d.]+)\) 100%/)![1]);
	const factor = (1 - scanAlpha) * (1 - vignetteAlpha);
	const darken = (hex: string, f: number) => '#' + hex.match(/[\da-f]{2}/gi)!
		.map((v) => Math.round(parseInt(v, 16) * f).toString(16).padStart(2, '0')).join('');
	const overlay = tty.match(/:root\[data-theme="tty"\] body::after\s*\{([^}]*)\}/)![1];
	const zIndex = Number(overlay.match(/z-index:\s*(-?\d+)/)![1]);
	const inFront = zIndex >= 0;
	const fields = { background: palette['--background'], surface: palette['--surface'] };
	const text: Record<string, string> = {
		'--foreground': palette['--foreground'], '--secondary': palette['--secondary'], '--accent': palette['--accent'],
	};
	for (const [role, color] of Object.entries(reference.syntax)) if (role !== 'background') text[`syntax ${role}`] = String(color);
	let worst = Infinity;
	for (const [name, color] of Object.entries(text)) {
		for (const [field, bg] of Object.entries(fields)) {
			for (const f of [1, factor]) {
				const ratio = contrast(inFront ? darken(color, f) : color, darken(bg, f));
				worst = Math.min(worst, ratio);
				assert.ok(ratio >= 4.5, `${name} on ${field} at overlay factor ${f.toFixed(3)}: ${ratio.toFixed(2)}`);
			}
		}
	}
	assert.ok(worst >= 4.5);
});
