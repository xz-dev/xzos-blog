import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { ui } from '../src/i18n/ui.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const loadIcons = () => import('../src/lib/pixel-icons.ts');
const css = () => read('../src/styles/tty-pixel-icons.css');
const expectedNames = [
	'logo', 'mastodon', 'github', 'stack-overflow', 'sun', 'moon',
	'globe', 'translation', 'chevron-right', 'chevron-down', 'arrow-left', 'arrow-right',
];

function cssRules() {
	return [...css().replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
		.map(([, selector, body]) => ({ selector: selector.trim(), body }));
}

function ruleFor(selector: string) {
	const rule = cssRules().find((rule) => rule.selector.split(',').map((s) => s.trim()).includes(selector));
	assert.ok(rule, `Missing rule: ${selector}`);
	return rule.body;
}

test('each first-party icon is an explicit, nonempty hand-authored 16 × 16 dot/hash grid', async () => {
	const { PIXEL_GRID_SIZE, PIXEL_ICONS } = await loadIcons();
	assert.equal(PIXEL_GRID_SIZE, 16);
	assert.deepEqual(Object.keys(PIXEL_ICONS).sort(), expectedNames.toSorted());
	const fingerprints = new Set<string>();
	for (const [name, grid] of Object.entries(PIXEL_ICONS)) {
		assert.equal(grid.length, 16, name);
		for (const row of grid) assert.match(row, /^[.#]{16}$/, `${name}: ${row}`);
		assert.match(grid.join(''), /#/);
		assert.ok(grid.join('').includes('.'));
		assert.ok(!fingerprints.has(grid.join('')), `${name} must have its own recognizable drawing`);
		fingerprints.add(grid.join(''));
	}
	const source = read('../src/lib/pixel-icons.ts');
	assert.doesNotMatch(source, /sharp|canvas|resvg|dotted_circle\.png|fetch\(|readFile/i);
});

test('SVG geometry exactly reconstructs every grid with integer rectangles, without curves or raster tricks', async () => {
	const { PIXEL_ICONS, pixelIconRects, renderPixelIconSvg } = await loadIcons();
	for (const name of Object.keys(PIXEL_ICONS) as (keyof typeof PIXEL_ICONS)[]) {
		const recovered = Array.from({ length: 16 }, () => Array<string>(16).fill('.'));
		const rects = pixelIconRects(name);
		assert.ok(rects.length > 0);
		for (const rect of rects) {
			for (const number of Object.values(rect)) assert.ok(Number.isInteger(number));
			assert.ok(rect.x >= 0 && rect.y >= 0 && rect.width > 0 && rect.height > 0);
			assert.ok(rect.x + rect.width <= 16 && rect.y + rect.height <= 16);
			for (let y = rect.y; y < rect.y + rect.height; y++) {
				for (let x = rect.x; x < rect.x + rect.width; x++) {
					assert.equal(recovered[y][x], '.', 'Do not overlap geometry');
					recovered[y][x] = '#';
				}
			}
		}
		assert.deepEqual(recovered.map((row) => row.join('')), [...PIXEL_ICONS[name]]);
		const svg = renderPixelIconSvg(name);
		assert.match(svg, /viewBox="0 0 16 16"/);
		assert.match(svg, /shape-rendering="crispEdges"/);
		assert.match(svg, /fill="currentColor"/);
		assert.equal((svg.match(/<rect\b/g) ?? []).length, rects.length);
		assert.doesNotMatch(svg, /<(?:path|circle|ellipse|line|polygon|image|filter|animate|style|text)\b/i);
		assert.doesNotMatch(svg, /(?:transform|rx|ry|stroke|opacity)=/);
		assert.ok([...svg.matchAll(/<\/?([\w:-]+)/g)].every(([, tag]) => ['svg', 'rect'].includes(tag)));
	}
	assert.throws(() => renderPixelIconSvg('logo', 'red\" onload=\"alert(1)'), /color/i);
});

test('the brand keeps a broken ring and an empty centre, not a filled disc or unrelated emblem', async () => {
	const { PIXEL_ICONS } = await loadIcons();
	const grid = PIXEL_ICONS.logo;
	for (let y = 5; y <= 10; y++) {
		assert.equal(grid[y].slice(5, 11), '......', 'The ring centre must remain empty');
	}
	const remaining = new Set<string>();
	grid.forEach((row, y) => [...row].forEach((pixel, x) => { if (pixel === '#') remaining.add(`${x},${y}`); }));
	let components = 0;
	while (remaining.size) {
		components++;
		const queue = [[...remaining][0]];
		remaining.delete(queue[0]);
		while (queue.length) {
			const [x, y] = queue.pop()!.split(',').map(Number);
			for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
				const neighbour = `${x + dx},${y + dy}`;
				if (remaining.delete(neighbour)) queue.push(neighbour);
			}
		}
	}
	assert.ok(components >= 8 && components <= 20, `Expected separated ring dashes, got ${components}`);
});

test('PixelIcon is monochrome, crisp, accessible and hidden by default rather than replacing the day drawing', () => {
	const component = read('../src/components/PixelIcon.astro');
	assert.match(component, /pixelIconRects\(name\)/);
	assert.match(component, /data-pixel-icon=\{name\}/);
	assert.match(component, /shape-rendering="crispEdges"/);
	assert.match(component, /fill="currentColor"/);
	assert.match(component, /<rect/);
	assert.match(component, /aria-hidden=/);
	assert.match(component, /aria-label=\{label\}/);
	assert.match(component, /focusable="false"/);
	assert.match(ruleFor('.tty-pixel-icon'), /display:\s*none\s*!important/);
	assert.match(ruleFor(':root[data-theme="tty"] .tty-pixel-icon'), /display:\s*inline-block\s*!important/);
	assert.match(ruleFor(':root[data-theme="tty"] .tty-original-icon'), /display:\s*none\s*!important/);
});

test('Header and Footer cover all social marks, preserve original SVGs and retain accessible link names', () => {
	for (const filename of ['Header', 'Footer']) {
		const component = read(`../src/components/${filename}.astro`);
		for (const name of ['mastodon', 'github', 'stack-overflow']) assert.ok(component.includes(`<PixelIcon name="${name}"`));
		assert.equal((component.match(/<svg class="tty-original-icon"/g) ?? []).length, 3);
		assert.equal((component.match(/<path\s+fill="currentColor"\s+d=/g) ?? []).length, 3);
		for (const label of ['Follow on Mastodon', 'Go to GitHub', 'Stack Overflow Profile']) assert.ok(component.includes(`<span class="sr-only">${label}</span>`));
	}
	const header = read('../src/components/Header.astro');
	assert.ok(header.includes('<img src="/dotted_circle.png" alt="xzOS logo" class="site-logo tty-original-icon" />'));
	assert.ok(header.includes('<PixelIcon name="logo" class="tty-site-logo" label="xzOS logo" />'));
});

test('the theme button retains its original sun/moon, while TTY selects only the hand-drawn moon', () => {
	const toggle = read('../src/components/ThemeToggle.astro');
	for (const name of ['sun', 'moon']) {
		assert.ok(toggle.includes(`class="${name}-icon tty-original-icon"`));
		assert.ok(toggle.includes(`<PixelIcon name="${name}" class="tty-theme-${name}" />`));
	}
	assert.match(toggle, /<circle cx="10" cy="10" r="4"/);
	assert.match(toggle, /<path d="M17 10\.5C/);
	assert.match(toggle, /aria-label="Toggle theme"/);
	assert.match(ruleFor(':root[data-theme="tty"] #theme-toggle .tty-theme-sun'), /display:\s*none\s*!important/);
	assert.match(ruleFor(':root[data-theme="tty"] #theme-toggle .tty-theme-moon'), /display:\s*inline-block\s*!important/);
	const positioning = ruleFor(':root[data-theme="tty"] #theme-toggle .tty-pixel-icon');
	assert.match(positioning, /position:\s*absolute/);
	assert.match(positioning, /transform:\s*translate\(-50%, -50%\)/);
});

test('language and translation notices get distinct pixel marks without hiding the new marks with notice-icon', () => {
	const notice = read('../src/components/LanguageVersionNotice.astro');
	assert.ok(notice.includes('<span class="notice-icon tty-original-icon">🤖</span>'));
	assert.ok(notice.includes('<span class="notice-icon tty-original-icon">🌐</span>'));
	for (const name of ['globe', 'translation']) assert.ok(notice.includes(`<PixelIcon name="${name}" class="tty-notice-icon" />`));
	assert.doesNotMatch(notice, /<PixelIcon[^>]*class="notice-icon/);
	assert.match(ruleFor(':root[data-theme="tty"] .tty-notice-icon'), /margin-inline-end:\s*8px/);
});

test('TOC replaces only the night native marker and preserves the day label without additional whitespace', () => {
	const toc = read('../src/components/TableOfContents.astro');
	assert.ok(toc.includes('<summary><PixelIcon name="chevron-right" class="tty-toc-closed" /><PixelIcon name="chevron-down" class="tty-toc-open" />目录</summary>'));
	assert.match(ruleFor(':root[data-theme="tty"] .toc summary'), /list-style:\s*none/);
	assert.match(ruleFor(':root[data-theme="tty"] .toc summary::marker'), /content:\s*''/);
	assert.match(ruleFor(':root[data-theme="tty"] .toc summary::-webkit-details-marker'), /display:\s*none/);
	assert.match(ruleFor(':root[data-theme="tty"] .toc details[open] .tty-toc-closed'), /display:\s*none\s*!important/);
	assert.match(ruleFor(':root[data-theme="tty"] .toc details:not([open]) .tty-toc-open'), /display:\s*none\s*!important/);
});

test('pagination and read-more replace only arrows, retaining all original languages, whitespace and accessible names', async () => {
	const { splitPixelArrowText } = await loadIcons();
	for (const strings of Object.values(ui)) {
		for (const key of ['pagination.prev', 'pagination.next', 'blog.continueReading'] as const) {
			const text = strings[key];
			const parts = splitPixelArrowText(text);
			assert.equal(parts.map((part) => part.text).join(''), text);
			assert.equal(parts.filter((part) => part.icon).length, 1);
			assert.equal(parts.find((part) => part.icon)!.icon, key === 'pagination.prev' ? 'arrow-left' : 'arrow-right');
		}
	}
	const list = read('../src/layouts/BlogList.astro');
	for (const key of ['pagination.prev', 'pagination.next', 'blog.continueReading']) {
		assert.ok(list.includes(`aria-label={t('${key}')}`));
		assert.ok(list.includes(`<PixelArrowText text={t('${key}')} />`));
	}
	const helper = read('../src/components/PixelArrowText.astro');
	assert.match(helper, /splitPixelArrowText\(text\)/);
	assert.match(helper, /<span class="tty-original-icon tty-text-label">\{text\}<\/span>/);
	assert.match(helper, /<span class="tty-pixel-label" aria-hidden="true">/);
	// Keep the full day label in one text run: splitting even a boxless arrow
	// changes fractional font advance and produced a real 14-pixel regression.
	assert.match(ruleFor('.tty-original-icon.tty-text-label'), /display:\s*contents\s*!important/);
	assert.match(ruleFor('.tty-original-icon.tty-text-label'), /color:\s*inherit\s*!important/);
	assert.match(ruleFor('.tty-original-icon.tty-text-label'), /transition:\s*none\s*!important/);
	assert.match(ruleFor('.tty-pixel-label'), /display:\s*none\s*!important/);
	assert.match(ruleFor(':root[data-theme="tty"] .tty-pixel-label'), /display:\s*contents\s*!important/);
});

test('only the generated thumbnail mark changes; real hero/body thumbnails and article images remain unprocessed', () => {
	const thumbnail = read('../src/components/PostThumbnail.astro');
	assert.ok(thumbnail.includes('<Image width={720} height={360} src={thumbnail.src} alt="" class="thumbnail-image" />'));
	assert.ok(thumbnail.includes('<img width={720} height={360} src={thumbnail.src} alt="" class="thumbnail-image" />'));
	assert.ok(thumbnail.includes('<img src="/dotted_circle.png" class="placeholder-logo tty-original-icon" alt="" />'));
	assert.ok(thumbnail.includes('<PixelIcon name="logo" class="tty-placeholder-logo" />'));
	assert.ok(thumbnail.indexOf('<PixelIcon name="logo"') > thumbnail.indexOf('<div class="placeholder-card"'));
	const newCSS = css();
	assert.doesNotMatch(newCSS, /image-rendering|url\(|backdrop-filter|(?:blur|drop-shadow)\(/);
	for (const [, value] of newCSS.matchAll(/\bfilter:\s*([^;]+);/g)) assert.match(value, /^none\s*!important$/);
	for (const { selector, body } of cssRules()) {
		if (/\bimg\b|\.thumbnail-image|\.prose\b|\.post-excerpt\b/.test(selector)) {
			assert.doesNotMatch(body, /image-rendering|filter|mask|opacity|transform/);
		}
	}
});

test('all visible night marks use integer-size grid scaling, currentColor and zero motion or decorative effects', () => {
	for (const { selector } of cssRules()) {
		for (const part of selector.split(',')) {
			assert.ok(part.trim().startsWith(':root[data-theme="tty"]') || ['.tty-pixel-icon', '.tty-pixel-label', '.tty-original-icon.tty-text-label'].includes(part.trim()), `Unscoped day-changing rule: ${part}`);
		}
	}
	const base = ruleFor(':root[data-theme="tty"] .tty-pixel-icon');
	assert.match(base, /width:\s*16px\s*!important/);
	assert.match(base, /height:\s*16px\s*!important/);
	assert.match(base, /fill:\s*currentColor/);
	for (const property of ['animation', 'transition', 'filter', 'box-shadow', 'text-shadow']) assert.match(base, new RegExp(`${property}:\\s*none\\s*!important`));
	assert.match(ruleFor(':root[data-theme="tty"] .tty-pixel-icon.tty-site-logo'), /width:\s*48px\s*!important/);
	assert.match(ruleFor(':root[data-theme="tty"] .tty-pixel-icon.tty-placeholder-logo'), /width:\s*80px\s*!important/);
});

test('the same-origin static night favicon uses the same hand-drawn logo grid as page UI', async () => {
	const { renderPixelIconSvg } = await loadIcons();
	const { GET, prerender } = await import('../src/pages/favicon-tty.svg.ts');
	assert.equal(prerender, true);
	const response = await GET({} as never);
	assert.equal(response.status, 200);
	assert.match(response.headers.get('Content-Type')!, /^image\/svg\+xml/);
	assert.equal(await response.text(), renderPixelIconSvg('logo', '#31fea8'));
	const head = read('../src/components/BaseHead.astro');
	assert.ok(head.includes("import '../styles/tty-pixel-icons.css'"));
	assert.match(head, /<link id="site-favicon" rel="icon" type="image\/png" href="\/dotted_circle.png" sizes="192x192"/);
	assert.match(head, /<link rel="apple-touch-icon" href="\/dotted_circle.png"/);
});

for (const [stored, systemDark, expected] of [
	['tty', false, 'tty'], ['solarized', true, 'solarized'], [null, true, 'tty'], [null, false, 'solarized'],
] as const) {
	test(`favicon follows initial ${stored ?? 'system'} preference and subsequent theme/system mutations`, () => {
		const script = read('../src/components/BaseHead.astro').match(/<script is:inline>([\s\S]*?)<\/script>/)![1];
		const attributes = new Map<string, string>();
		const favicon = new Map<string, string>();
		let notify: () => void = () => {};
		let systemChange: (event: { matches: boolean }) => void = () => {};
		let observing = false;
		const root = {
			getAttribute: (name: string) => attributes.get(name) ?? null,
			setAttribute: (name: string, value: string) => { attributes.set(name, value); if (observing) notify(); },
		};
		runInNewContext(script, {
			document: { documentElement: root, getElementById: (id: string) => id === 'site-favicon' ? { setAttribute: (name: string, value: string) => favicon.set(name, value) } : null },
			localStorage: { getItem: () => stored },
			window: { matchMedia: () => ({ matches: systemDark, addEventListener: (_: string, callback: typeof systemChange) => { systemChange = callback; } }) },
			MutationObserver: class {
				constructor(callback: () => void) { notify = callback; }
				observe(target: unknown, options: { attributes: boolean; attributeFilter: string[] }) {
					assert.equal(target, root);
					assert.equal(options.attributes, true);
					assert.deepEqual(Array.from(options.attributeFilter), ['data-theme']);
					observing = true;
				}
			},
		});
		const check = (theme: string) => {
			assert.equal(attributes.get('data-theme'), theme);
			assert.equal(favicon.get('href'), theme === 'tty' ? '/favicon-tty.svg' : '/dotted_circle.png');
			assert.equal(favicon.get('type'), theme === 'tty' ? 'image/svg+xml' : 'image/png');
			assert.equal(favicon.get('sizes'), theme === 'tty' ? 'any' : '192x192');
		};
		check(expected);
		root.setAttribute('data-theme', 'tty'); check('tty');
		root.setAttribute('data-theme', 'solarized'); check('solarized');
		systemChange({ matches: true }); check(stored === null ? 'tty' : 'solarized');
		systemChange({ matches: false }); check('solarized');
		assert.equal(observing, true);
	});
}

test('the coverage document lists every first-party surface and explicitly excludes article media and cross-origin comments', () => {
	const documentation = read('../docs/theme/tty-icons.md');
	for (const name of ['Header.astro', 'Footer.astro', 'ThemeToggle.astro', 'LanguageVersionNotice.astro', 'TableOfContents.astro', 'BlogList.astro', 'PostThumbnail.astro', 'BaseHead.astro', 'favicon-tty.svg.ts', 'Remark42']) assert.ok(documentation.includes(name), name);
	assert.match(documentation, /16[ ×x]+16/);
	assert.match(documentation, /currentColor/);
	assert.match(documentation, /跨域|cross-origin/i);
	assert.match(documentation, /文章图片|article images/i);
	assert.match(documentation, /日间|day mode/i);
});
