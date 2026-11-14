import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const tty = read('../src/styles/tty.css');
const base = read('../src/styles/terminal.css');
// The @font-face subsets, loaded in both themes.
const fonts = read('../src/styles/fonts.css');

test('every element in both themes uses one CJK-capable pixel family, set once', () => {
	const tokens = read('../src/styles/tokens.css');
	const day = tokens.match(/:root\s*\{([^}]+)\}/)![1];
	assert.match(day, /--font-ui:\s*"Unifont",\s*"Unifont Upper",\s*monospace;/);
	assert.doesNotMatch(tokens, /--tty-font/);
	assert.match(base, /body\s*\{[^}]*font-family:\s*var\(--font-ui\);/);
	// Elements the UA gives another family take the page's instead; nothing else sets one.
	const families = [...base.matchAll(/font-family:\s*([^;]+);/g)].map((m) => m[1].trim());
	assert.deepEqual([...new Set(families)].sort(), ['inherit', 'var(--font-ui)']);
	// Form controls and the status-line button take the family through the
	// font shorthand, which the family scan above cannot see.
	const rules = [...base.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)];
	for (const selector of ['input', 'textarea', 'select', '.menu-item']) {
		const body = rules.filter((r) => r[1].split(',').map((x) => x.trim()).includes(selector)).map((r) => r[2]).join('');
		assert.match(body, /\bfont:\s*inherit;/, selector);
	}
	assert.doesNotMatch(tty, /font-family|font-synthesis/);
	for (const file of ['tty-pixel-icons.css', 'tokens.css']) assert.doesNotMatch(read(`../src/styles/${file}`).replace(/--font-ui:[^;]+;/, ''), /font-family/, file);
	for (const file of ['Header', 'HeaderLink', 'LanguageSwitcher', 'ThemeToggle', 'Footer', 'TableOfContents', 'PostMeta']) {
		assert.doesNotMatch(read(`../src/components/${file}.astro`), /font-family/, file);
	}
	assert.doesNotMatch(tty + base + fonts, /Fira Code|IBM Plex Mono|Microsoft YaHei|PingFang SC|Noto Sans/);
	// fonts.css loads before the element styles and in both themes.
	const head = read('../src/components/BaseHead.astro');
	assert.ok(head.indexOf("import '../styles/fonts.css';") > 0);
	assert.ok(head.indexOf("import '../styles/fonts.css';") < head.indexOf("import '../styles/terminal.css';"));
	assert.doesNotMatch(head, /fira/i);
	// Both themes paint in Unifont first: the Latin subset is preloaded on every
	// page and the common CJK subset on the Chinese ones, and nothing else.
	const preloads = [...head.matchAll(/<link rel="preload" href="([^"]+)" as="font" type="font\/woff2" crossorigin \/>/g)].map((m) => m[1]);
	assert.deepEqual(preloads, ['/fonts/unifont-18.0.01-latin.woff2', '/fonts/unifont-18.0.01-cjk-common.woff2']);
	assert.match(head, /\{currentLang !== 'en' && <link rel="preload" href="\/fonts\/unifont-18\.0\.01-cjk-common\.woff2"/);
	for (const file of preloads) assert.ok(fonts.includes(`url('${file}')`), file);
	assert.doesNotMatch(fonts, /data-theme/);
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
	// Unicode-block subsets of the one family; together they keep every code point.
	assert.equal(manifest.assets.reduce((sum: number, asset: { codepoints: number }) => sum + asset.codepoints, 0), manifest.unicodeCodepoints);
	for (const asset of manifest.assets) {
		const bytes = readFileSync(new URL('../public' + asset.url, import.meta.url));
		assert.equal(bytes.subarray(0, 4).toString(), 'wOF2');
		assert.equal(bytes.length, asset.bytes);
		assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256);
		assert.ok(fonts.includes(`src: url('${asset.url}') format('woff2');\n  unicode-range: ${asset.unicodeRange};`), asset.url);
	}
	assert.ok(manifest.assets[0].bytes < 20_000, 'Latin subset stays small');
	// The common-character face overlaps the ideograph chunks; the last-defined overlapping face is
	// checked first, so it must follow every chunk for chunks to load only for rarer characters.
	const common = manifest.assets.find((asset: { name: string }) => asset.name === 'cjk-common');
	assert.equal(manifest.commonCharacters.count, 3500);
	assert.equal(createHash('sha256').update(readFileSync(new URL('../scripts/tgscc-level-1.txt', import.meta.url))).digest('hex'), manifest.commonCharacters.sha256);
	for (const asset of manifest.assets) if (asset !== common) assert.ok(fonts.indexOf(common.url) > fonts.indexOf(asset.url), asset.url);
	const license = read('../public/fonts/unifont-OFL.txt');
	assert.match(license, /Copyright © 1998-2026 Roman Czyborra/);
	assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
});

test('single-weight bitmap outlines are not faked; bold is bright, emphasis is dim, only links are underlined', () => {
	assert.match(base, /body\s*\{[^}]*font-synthesis:\s*none;/);
	const strong = base.match(/\nstrong,\s*b\s*\{([^}]*)\}/)![1];
	const em = base.match(/\nem,\s*i\s*\{([^}]*)\}/)![1];
	assert.match(strong, /color:\s*var\(--accent\);/);
	assert.match(em, /color:\s*var\(--secondary\);/);
	for (const body of [strong, em]) assert.match(body, /text-decoration:\s*none;/);
	// The underline is the link's alone.
	assert.match(base, /\na\s*\{[^}]*text-decoration:\s*underline;/);
	assert.match(base, /\na :is\(strong, b, em, i\)\s*\{\s*color:\s*inherit;/);
	// Both colours read as text (4.5:1) on the page and the code surface, in both themes.
	const tokens = read('../src/styles/tokens.css');
	const block = (re: RegExp) => Object.fromEntries([...tokens.match(re)![1].matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));
	const lum = (hex: string) => hex.match(/[\da-f]{2}/gi)!.map((c) => parseInt(c, 16) / 255)
		.reduce((sum, c, i) => sum + (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i], 0);
	const contrast = (a: string, b: string) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
	for (const [theme, colors] of Object.entries({ day: block(/:root\s*\{([^}]+)\}/), night: block(/:root\[data-theme="tty"\]\s*\{([^}]+)\}/) })) {
		for (const role of ['--accent', '--secondary']) {
			for (const field of ['--background', '--surface']) {
				const ratio = contrast(colors[role], colors[field]);
				assert.ok(ratio >= 4.5, `${theme} ${role} on ${field}: ${ratio.toFixed(2)}`);
			}
		}
	}
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
	assert.ok(fonts.includes(`url('${symbols.asset.url}') format('woff2')`));
});

test('the font documentation distinguishes CJK adaptation from the ASCII-only 4052', () => {
	const readme = read('../README.md');
	assert.match(readme, /GNU Unifont/);
	assert.match(readme, /5.?×.?8|5.?x.?8/);
	assert.match(readme, /not.*4052.*(?:font|character)/i);
});
