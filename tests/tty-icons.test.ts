import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { ui } from '../src/i18n/ui.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const loadIcons = () => import('../src/lib/pixel-icons.ts');
const terminal = () => read('../src/styles/terminal.css');
const iconComponents = ['Header', 'Footer', 'ThemeToggle', 'LanguageVersionNotice', 'TableOfContents', 'PixelArrowText', 'PixelIcon'];
const expectedNames = [
	'logo', 'mastodon', 'github', 'stack-overflow', 'sun', 'moon',
	'globe', 'translation', 'chevron-right', 'chevron-down', 'arrow-left', 'arrow-right',
];

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

test('PixelIcon is monochrome, crisp, accessible and the same drawing in both themes', () => {
	const component = read('../src/components/PixelIcon.astro');
	assert.match(component, /pixelIconRects\(name\)/);
	assert.match(component, /data-pixel-icon=\{name\}/);
	assert.match(component, /shape-rendering="crispEdges"/);
	assert.match(component, /fill="currentColor"/);
	assert.match(component, /<rect/);
	assert.match(component, /aria-hidden=/);
	assert.match(component, /aria-label=\{label\}/);
	assert.match(component, /focusable="false"/);
	// One icon set: every PixelIcon gets the shared class, with no theme switch.
	assert.match(component, /class:list=\{\['pixel-icon', className\]\}/);
	assert.doesNotMatch(component, /bothThemes|tty-pixel-icon/);
	const shared = terminal().match(/\n\.pixel-icon\s*\{([^}]*)\}/)![1];
	assert.match(shared, /display:\s*inline-block;/);
	assert.match(shared, /width:\s*var\(--pixel-icon-size\);/);
	assert.match(shared, /height:\s*var\(--pixel-icon-size\);/);
	assert.doesNotMatch(shared, /!important|data-theme/);
	// One 16px grid unit (Unifont's), the text size; the header logo is a glyph
	// of the status line at the same unit (Header.astro), not a larger mark.
	const tokens = read('../src/styles/tokens.css');
	assert.match(tokens, /--pixel-icon-size:\s*1rem;/);
	assert.doesNotMatch(tokens, /--logo-size|--icon-size/);
});

test('no UI icon is swapped by theme: no original drawings, no swap stylesheet', () => {
	assert.throws(() => read('../src/styles/tty-pixel-icons.css'), /ENOENT/);
	assert.doesNotMatch(read('../src/components/BaseHead.astro'), /tty-pixel-icons/);
	const sources = [...iconComponents.map((f) => read(`../src/components/${f}.astro`)), read('../src/layouts/BlogList.astro'), terminal(), read('../src/styles/tty.css')].join('');
	assert.doesNotMatch(sources, /tty-(?:original|pixel)-icon|tty-(?:pixel|text)-label|bothThemes|<path\b/);
	assert.doesNotMatch(terminal(), /\.menu-item-icon svg/);
});

test('Header and Footer draw every social mark as a pixel icon and retain accessible link names', () => {
	for (const filename of ['Header', 'Footer']) {
		const component = read(`../src/components/${filename}.astro`);
		for (const name of ['mastodon', 'github', 'stack-overflow']) assert.ok(component.includes(`<PixelIcon name="${name}" />`));
		assert.doesNotMatch(component, /<svg\b/);
		for (const key of ['social.mastodon', 'social.github', 'social.stackOverflow']) assert.ok(component.includes(`<span class="sr-only">{t('${key}')}</span>`));
	}
	// One logo in both themes: the pixel drawing, coloured by the accent; the
	// PNG stays only as the day favicon.
	const header = read('../src/components/Header.astro');
	assert.doesNotMatch(header, /dotted_circle\.png|<img/);
	assert.ok(header.includes("<PixelIcon name=\"logo\" class=\"site-logo\" label={t('site.logoAlt')} />"));
	assert.match(header, /\.site-title :global\(\.site-logo\)\s*\{[^}]*width:\s*var\(--pixel-icon-size\);[^}]*height:\s*var\(--pixel-icon-size\);[^}]*color:\s*var\(--accent\);/);
});

test('the theme button is a plain status-line item: a pixel sun in day and a pixel moon at night', () => {
	const toggle = read('../src/components/ThemeToggle.astro');
	for (const name of ['sun', 'moon']) assert.ok(toggle.includes(`<PixelIcon name="${name}" class="theme-${name}" />`));
	assert.doesNotMatch(toggle, /<circle|<path|position:\s*absolute/);
	assert.match(toggle, /<button id="theme-toggle" class="menu-item" aria-label=\{t\('theme\.toggle'\)\}/);
	assert.match(toggle, /:root\[data-theme="tty"\] #theme-toggle :global\(\.theme-sun\),\s*:root:not\(\[data-theme="tty"\]\) #theme-toggle :global\(\.theme-moon\)\s*\{\s*display:\s*none;/);
});

// aria-pressed must match the theme from first paint: an inline script right
// after the button sets it from the data-theme the head script chose.
for (const theme of ['tty', 'solarized', null] as const) {
	test(`the theme button reports pressed=${theme === 'tty'} at first paint for ${theme ?? 'no'} data-theme`, () => {
		const toggle = read('../src/components/ThemeToggle.astro');
		const button = toggle.indexOf('<button id="theme-toggle"');
		const inline = toggle.match(/<\/button>\s*<script is:inline>([\s\S]*?)<\/script>/);
		assert.ok(inline && toggle.indexOf(inline[0]) > button, 'inline script directly after the button');
		const attributes = new Map<string, string>([['aria-pressed', 'false']]);
		runInNewContext(inline![1], {
			document: {
				documentElement: { getAttribute: (name: string) => (name === 'data-theme' ? theme : null) },
				getElementById: (id: string) => (id === 'theme-toggle' ? { setAttribute: (name: string, value: string) => attributes.set(name, value) } : null),
			},
		});
		assert.equal(attributes.get('aria-pressed'), String(theme === 'tty'));
	});
}

test('language and translation notices get distinct pixel marks in both themes', () => {
	const notice = read('../src/components/LanguageVersionNotice.astro');
	assert.doesNotMatch(notice, /🤖|🌐/);
	for (const name of ['globe', 'translation']) assert.ok(notice.includes(`<PixelIcon name="${name}" class="notice-mark" />`));
	assert.match(notice, /\.version-notices :global\(\.notice-mark\)\s*\{\s*margin-inline-end:\s*var\(--space-2\);/);
	assert.doesNotMatch(notice, /data-theme/);
});

test('TOC draws a pixel chevron for its state in both themes instead of the native marker', () => {
	const toc = read('../src/components/TableOfContents.astro');
	assert.ok(toc.includes('<summary id="xz-toc-label"><PixelIcon name="chevron-right" class="toc-closed" /><PixelIcon name="chevron-down" class="toc-open" />{t(\'blog.toc\')}</summary>'));
	assert.match(toc, /\.toc summary\s*\{[^}]*list-style:\s*none;/);
	assert.match(toc, /\.toc summary::-webkit-details-marker\s*\{\s*display:\s*none;/);
	assert.match(toc, /\.toc details\[open\] :global\(\.toc-closed\),\s*\.toc details:not\(\[open\]\) :global\(\.toc-open\)\s*\{\s*display:\s*none;/);
	assert.doesNotMatch(toc, /data-theme|!important|::marker/);
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
		assert.ok(list.includes(`<PixelArrowText text={t('${key}')} />`));
	}
	for (const key of ['pagination.prev', 'pagination.next']) {
		assert.ok(list.includes(`aria-label={t('${key}')}`));
	}
	// Every read-more link on a page needs its own name: the full label plus the post title.
	assert.ok(list.includes("aria-label={`${t('blog.continueReading')} ${post.data.title}`}"));
	// One rendering in both themes: the label text with each arrow drawn as a pixel icon.
	const helper = read('../src/components/PixelArrowText.astro');
	assert.match(helper, /\{splitPixelArrowText\(text\)\.map\(\(part\) => part\.icon \? <PixelIcon name=\{part\.icon\} \/> : part\.text\)\}/);
	assert.doesNotMatch(helper, /<span/);
});

test('thumbnails are real images only, and article images remain unprocessed', () => {
	const thumbnail = read('../src/components/PostThumbnail.astro');
	assert.ok(thumbnail.includes('<Image width={128} height={128} src={thumbnail.src} alt="" class="thumbnail-image" />'));
	assert.ok(thumbnail.includes('<img width={128} height={128} src={thumbnail.src} alt="" class="thumbnail-image" />'));
	// No generated placeholder: a post without a real image has no thumbnail.
	assert.doesNotMatch(thumbnail, /placeholder|gradient|PixelIcon|box-shadow|transform|transition/);
	assert.doesNotMatch(terminal(), /image-rendering:\s*pixelated/);
});

test('archive thumbnails come from the hero image, else the first body image, and link to the post', async () => {
	const { getPostImage } = await import('../src/lib/post-image.ts');
	const hero = { src: '/hero.png', width: 10, height: 10, format: 'png' } as never;
	assert.deepEqual(getPostImage({ data: { title: 'a', heroImage: hero }, body: '![x](/body.png)' }), { type: 'astro', src: hero });
	assert.deepEqual(getPostImage({ data: { title: 'a' }, body: 'text\n\n![x](/body.png)' }), { type: 'url', src: '/body.png' });
	assert.deepEqual(getPostImage({ data: { title: 'a' }, body: '<p><img alt="" src="/inline.jpg"></p>' }), { type: 'url', src: '/inline.jpg' });
	assert.equal(getPostImage({ data: { title: 'a' }, body: 'no picture here' }), null);
	assert.equal(getPostImage({ data: { title: 'a' } }), null);
	const thumbnail = read('../src/components/PostThumbnail.astro');
	assert.match(thumbnail, /<a class="post-thumbnail" href=\{href\}/);
	assert.match(read('../src/layouts/BlogArchive.astro'), /<PostThumbnail post=\{post\} href=\{`\$\{blogPrefix\}\/\$\{post\.id\}\/`\} \/>/);
});

test('the same-origin static night favicon uses the same hand-drawn logo grid as page UI', async () => {
	const { renderPixelIconSvg } = await loadIcons();
	const { GET, prerender } = await import('../src/pages/favicon-tty.svg.ts');
	assert.equal(prerender, true);
	const response = await GET({} as never);
	assert.equal(response.status, 200);
	assert.match(response.headers.get('Content-Type')!, /^image\/svg\+xml/);
	assert.equal(await response.text(), renderPixelIconSvg('logo', '#d4ff3a'));
	const head = read('../src/components/BaseHead.astro');
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
