import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { navItems, ui } from '../src/i18n/ui.ts';

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
	for (const [role, color] of Object.entries(reference.syntax)) {
		if (role !== 'background') assert.ok(contrast(String(color), palette['--surface']) >= 7, role);
	}
});

test('night differs from day through tokens; glow, scanlines and vignette are static and opt out for more contrast', () => {
	const rules = [...tty.matchAll(/([^{}]+)\{[^{}]*\}/g)];
	for (const rule of rules) {
		const selector = rule[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
		for (const part of selector.split(',')) assert.ok(/^:root\[data-theme(?:="tty")?(?:-switching)?\]/.test(part.trim()), part);
	}
	// What night still sets by rule: motion off and Shiki's per-span colours. Everything else is a token.
	assert.doesNotMatch(tty.replace(/\/\*[\s\S]*?\*\//g, ''), /text-shadow|box-shadow|border-color|background|border-radius|::selection|mark|font-family/);
	// The halo is the foreground itself at 45%, not a second copy of its value.
	assert.match(nightTokens, /--tty-glow:\s*0 0 2px currentColor, 0 0 8px color-mix\(in srgb, var\(--foreground\) 45%, transparent\);/);
	assert.match(nightTokens, /--text-glow:\s*var\(--tty-glow\);/);
	assert.match(dayTokens, /--text-glow:\s*none;/);
	assert.match(base, /\nbody\s*\{[^}]*text-shadow:\s*var\(--text-glow\);/);
	assert.match(base, /\npre\s*\{[^}]*text-shadow:\s*none;/);
	const overlay = base.match(/\nbody::after\s*\{([^}]*)\}/)![1];
	assert.match(overlay, /position:\s*fixed/);
	assert.match(overlay, /pointer-events:\s*none/);
	// Behind the content: the overlay darkens the field, never the text.
	assert.match(overlay, /z-index:\s*-1;/);
	assert.match(overlay, /background:\s*var\(--field-overlay\);/);
	assert.match(dayTokens, /--field-overlay:\s*none;/);
	assert.match(nightTokens, /--field-overlay:\s*var\(--tty-scanlines\), var\(--tty-vignette\);/);
	assert.match(nightTokens, /--tty-scanlines:\s*repeating-linear-gradient\(to bottom, rgba\(0, 0, 0, 0\.12\) 0, rgba\(0, 0, 0, 0\.12\) 1px, transparent 1px, transparent 3px\);/);
	assert.match(nightTokens, /--tty-vignette:\s*radial-gradient\(ellipse at center/);
	const more = tokens.match(/@media \(prefers-contrast: more\)\s*\{([\s\S]*?)\n\}/)![1];
	assert.match(more, /:root,\s*:root\[data-theme="tty"\]\s*\{[^}]*--text-glow:\s*none;[^}]*--field-overlay:\s*none;/);
	// Static only: no motion, flicker, curvature or blur. The one exception (README, Night / TTY) is
	// the home page's block cursor: an opacity blink, declared only under no-preference for motion.
	assert.match(tokens, /--cursor-blink:\s*cursor-blink [\d.]+s steps\(1, end\) infinite;/);
	const withoutCursor = (css: string) => css
		.replace(/@keyframes cursor-blink\s*\{\s*50%\s*\{\s*opacity:\s*0;\s*\}\s*\}/, '')
		.replace(/@media \(prefers-reduced-motion: no-preference\)\s*\{\s*[^{}]*\.cursor[^{}]*\{\s*animation:\s*var\(--cursor-blink\)(?:\s*!important)?;\s*\}\s*\}/g, '');
	assert.doesNotMatch(withoutCursor(tty) + withoutCursor(base), /@keyframes|animation:(?!\s*none)|--cursor-blink|perspective|backdrop-filter|filter:\s*blur|transform:\s*(?:scale|rotate|skew|matrix)/i);
	assert.doesNotMatch(base, /drop-shadow\(|text-shadow:(?!\s*(?:none|var\(--text-glow\)))|box-shadow:(?!\s*none)/i);
	assert.match(tty, /transition:\s*none\s*!important/);
	// One radius, a token: no literal radius anywhere else.
	assert.match(dayTokens, /--radius:\s*0;/);
	const styles = ['terminal.css', 'tty.css'].map((f) => read(`../src/styles/${f}`)).join('');
	const components = ['Header', 'Footer', 'PostThumbnail', 'TableOfContents', 'ThemeToggle', 'PageFrame', 'PostMeta'].map((f) => read(`../src/components/${f}.astro`)).join('');
	for (const value of [...(styles + components).matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1])) assert.equal(value, 'var(--radius)');
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
	assert.match(read('../src/components/BaseHead.astro'), /import '\.\.\/styles\/tty\.css';/);
});

test('the header is a tmux-style status line of plain text, shared by both themes', () => {
	const header = read('../src/components/Header.astro');
	const bar = header.match(/\n\theader\s*\{([^}]*)\}/)![1];
	assert.match(bar, /background:\s*var\(--surface\);/);
	assert.match(bar, /border-block-end:\s*var\(--hairline\) solid var\(--border-strong\);/);
	// Logical properties only, as everywhere else in the change.
	assert.doesNotMatch(header.slice(header.indexOf('<style>')), /(?:margin|padding|border)-(?:top|right|bottom|left)\b|margin:\s*0 0 0 /);
	assert.doesNotMatch(header, /gradient/);
	assert.doesNotMatch(tokens, /--header-top|--menu-hover/);
	// Nothing in the bar is themed by rule: no data-theme selector in the bar's
	// components except the toggle's sun/moon swap, and no night token for it.
	for (const file of ['Header', 'HeaderLink', 'LanguageSwitcher']) {
		assert.doesNotMatch(read(`../src/components/${file}.astro`), /data-theme/, file);
	}
	assert.doesNotMatch(nightTokens, /menu|header/i);
	// Entries: plain text, no fill on hover or when current; hover recolours
	// and underlines, the current entry takes the accent and a trailing `*`.
	assert.match(base, /\n\.menu-item,\s*\.control\s*\{[^}]*border:\s*0;[^}]*background:\s*transparent;/);
	assert.match(base, /\n\.menu-item\s*\{[^}]*min-height:\s*var\(--menu-item-height\);/);
	const hover = base.match(/\n\.menu-item:hover,\s*a\.control:hover\s*\{([^}]*)\}/)![1];
	assert.match(hover, /color:\s*var\(--accent\);/);
	assert.match(hover, /text-decoration:\s*underline;/);
	assert.doesNotMatch(hover, /background/);
	const current = base.match(/\n\.menu-item\[aria-current\],\s*\.control\[aria-current\]\s*\{([^}]*)\}/)![1];
	assert.match(current, /^\s*color:\s*var\(--accent\);\s*$/);
	assert.match(base, /\n\.menu-item\[aria-current\]::after\s*\{\s*content:\s*"\*";\s*content:\s*"\*" \/ "";/);
	assert.match(base, /\n\.menu-label\s*\{\s*color:\s*var\(--secondary\);/);
	for (const file of ['HeaderLink', 'LanguageSwitcher', 'ThemeToggle']) {
		assert.match(read(`../src/components/${file}.astro`), /class(?::list)?=[^>]*menu-item/, file);
	}
	assert.doesNotMatch(header, /class="control/);
	// `0:首页 1:文章 …`: the number is the entry's place in navItems, hidden
	// from assistive technology; aria-current stays on the link.
	assert.deepEqual(navItems.map((item) => item.key), ['nav.home', 'nav.blog', 'nav.about', 'nav.links']);
	assert.match(header, /navItems\.map\(\(item, index\) =>[\s\S]*<HeaderLink index=\{index\}/);
	const link = read('../src/components/HeaderLink.astro');
	assert.match(link, /aria-current=\{current\}/);
	assert.match(link, /<span class="menu-label" aria-hidden="true">\{index\}:<\/span><slot \/>/);
	// `lang: zh* en zh-CN`: short codes on screen, the full name first in the
	// accessible name, the prefix from i18n.
	const languages = read('../src/components/LanguageSwitcher.astro');
	assert.match(languages, /<span class="menu-label" aria-hidden="true">\{t\('lang\.prefix'\)\}<\/span>/);
	assert.match(languages, /const name = `\$\{languages\[lang\]\} \(\$\{lang\}\)`;/);
	assert.match(languages, /aria-label=\{name\}/);
	assert.match(languages, /aria-current=\{lang === currentLang \? 'page' : undefined\}/);
	assert.match(languages, />\s*\{lang\}\s*<\/a>/);
	for (const lang of ['zh', 'en', 'zh-CN'] as const) assert.equal(ui[lang]['lang.prefix'], 'lang:');
	// Contrast: entries, dim fields, the current and hovered entry and the
	// focus ring on the bar, and the bar's edge on the page.
	for (const [theme, colors] of Object.entries({ day, night: palette })) {
		const checks: [string, string, string, number][] = [
			['text on bar', colors['--foreground'], colors['--surface'], 4.5],
			['dim field and tagline on bar', colors['--secondary'], colors['--surface'], 4.5],
			['current and hover on bar', colors['--accent'], colors['--surface'], 4.5],
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
		night: { background: night['--background'], surface: night['--surface'] },
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

test('both themes define 16 terminal colours: swatches apart from the page, 1-6 readable as text', () => {
	for (const [theme, colors] of [['day', day], ['night', palette]] as const) {
		for (let index = 0; index < 16; index++) {
			const color = colors[`--ansi-${index}`];
			assert.ok(color, `${theme} --ansi-${index}`);
			const ratio = contrast(color, colors['--background']);
			assert.ok(ratio >= (index >= 1 && index <= 6 ? 4.5 : 1.5), `${theme} --ansi-${index}: ${ratio.toFixed(2)}`);
		}
	}
	// Night is one phosphor ramp, dark to bright.
	for (let index = 1; index < 16; index++) {
		assert.ok(luminance(palette[`--ansi-${index}`]) > luminance(palette[`--ansi-${index - 1}`]), `night --ansi-${index}`);
	}
});

test('controls and menu items share one flat box and one focus ring in both themes', () => {
	// One focus ring for both themes, keyboard only.
	assert.match(base, /:focus-visible\s*\{\s*outline:\s*var\(--focus-width\) solid var\(--accent\);/);
	const ttyRules = tty.replace(/\/\*[\s\S]*?\*\//g, '');
	assert.doesNotMatch(ttyRules, /focus-visible|outline|\.control|button/);
	const box = base.match(/\n\.menu-item,\s*\.control\s*\{([^}]*)\}/)![1];
	assert.match(box, /border-radius:\s*var\(--radius\);/);
	assert.match(box, /background:\s*transparent;/);
	assert.match(base, /\n\.control\s*\{[^}]*min-height:\s*var\(--control-size\);/);
	// No guard for buttons that do not exist: the only button is a menu item.
	assert.doesNotMatch(base, /button:not|\.control:active|\.control-icon/);
	assert.doesNotMatch(ttyRules, /(?:width|height|padding|margin|font-size|line-height):/);
	// The contents summary is a plain text line, not a control.
	const toc = read('../src/components/TableOfContents.astro');
	assert.doesNotMatch(toc, /class(?::list)?=[^>]*control/);
	assert.doesNotMatch(toc.slice(toc.indexOf('<style>')), /background|border|box-shadow/);
});

test('no frame, fill or bevel exists in one theme and not the other', () => {
	// The night block may redefine palette colours and the static effects only.
	const allowed = new Set([
		'--background', '--surface', '--foreground', '--emphasized', '--accent', '--secondary',
		'--border-color', '--border-strong', '--code-foreground', '--code-color',
		'--selection-bg', '--selection-fg', '--text-glow', '--field-overlay',
		'--tty-glow', '--tty-scanlines', '--tty-vignette',
	]);
	for (const [, name] of nightTokens.matchAll(/(--[\w-]+):/g)) assert.ok(allowed.has(name) || /^--ansi-\d+$/.test(name), name);
	assert.doesNotMatch(tokens.replace(/\/\*[\s\S]*?\*\//g, ''), /bevel|--edge-|--control-(?!size)|--field-(?!overlay)/);
	// Every box-shadow, background and border in the shared rules reads a
	// value both themes define the same way, or a palette colour.
	assert.doesNotMatch(base, /box-shadow:(?!\s*none)/);
	for (const [, value] of base.matchAll(/(?:background|border(?:-[a-z-]+)?):\s*([^;]+);/g)) {
		for (const [, name] of value.matchAll(/var\((--[\w-]+)/g)) {
			assert.ok(!nightTokens.includes(`${name}:`) || /^--(?:background|surface|accent|foreground|border-color|border-strong|field-overlay|selection-bg)$/.test(name), `${name} in ${value}`);
		}
	}
	assert.match(base, /\ninput,\s*textarea,\s*select\s*\{[^}]*background:\s*transparent;[^}]*border:\s*var\(--hairline\) solid var\(--foreground\);/);
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
	for (const selector of ['pre', 'kbd', 'td', 'blockquote']) assert.match(borderOf(selector), /border(?:-inline-start)?:[^;]*var\(--border-strong\)/, selector);
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
	const overlay = base.match(/\nbody::after\s*\{([^}]*)\}/)![1];
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
