import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { OG_PALETTE, renderOgImage, wrapOgText } from '../src/lib/og-image.ts';
import { cellWidth } from '../src/lib/term-width.ts';

const posts = fs.globSync('src/content/blog/**/*.md*').map((file) => {
	const source = fs.readFileSync(file, 'utf8');
	const field = (key: string) => {
		const raw = source.match(new RegExp(`^${key}: (.*)$`, 'm'))?.[1] ?? '';
		return raw.startsWith('"') ? JSON.parse(raw) : raw.replace(/^'|'$/g, '');
	};
	return { file, title: field('title'), slug: path.basename(file).replace(/\.mdx?$/, ''), date: field('pubDate').slice(0, 10), category: field('category') };
});
const longest = posts.reduce<(typeof posts)[number] | null>(
	(a, b) => a && [...a.title].length >= [...b.title].length ? a : b, null,
);
assert.ok(longest, 'The PNG corpus requires at least one post');
const rootPosts = posts.filter((post) => path.dirname(post.file) === 'src/content/blog');
const longestChinese = rootPosts.filter((post) => /\p{Script=Han}/u.test(post.title))
	.reduce<(typeof posts)[number] | null>(
		(a, b) => a && [...a.title].length >= [...b.title].length ? a : b, null,
	);
assert.ok(longestChinese, 'The PNG corpus requires a Chinese root post');
const wrapFixture = 'Viewing an LLM as an Interpreter: Managing Context Properly — Prompts, Memory, Function Calls, Skills, and Subagents';
const samples = {
	default: { postCount: rootPosts.length },
	long: { ...longest, locale: 'en' as const },
	'long-zh': { ...longestChinese, locale: 'src' as const },
	short: { title: 'Hello, World!', slug: 'hello-world', date: '2017-07-19', locale: 'en' as const },
};

test('default and post cards render deterministically using only Unifont', async (t) => {
	const original = fs.readFileSync;
	const loaded: string[] = [];
	const spy = t.mock.method(fs, 'readFileSync', (...args: Parameters<typeof original>) => {
		if (/\.(otf|ttf|woff2?)$/.test(String(args[0]))) loaded.push(path.basename(String(args[0])));
		return Reflect.apply(original, fs, args);
	});
	for (const [name, content] of Object.entries(samples)) {
		await t.test(name, async () => {
			const png = await renderOgImage(content);
			assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
			assert.equal(png.readUInt32BE(16), 1200);
			assert.equal(png.readUInt32BE(20), 630);
			assert.deepEqual(await renderOgImage(content), png);
			const { data, info } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
			const rgb = (hex: string) => hex.slice(1).match(/../g)!.map((v) => parseInt(v, 16));
			const background = rgb(OG_PALETTE.background);
			const regions = [
				{ name: 'status', top: 24, bottom: 56, field: rgb(OG_PALETTE.surface) },
				{ name: 'title', top: 208, bottom: 384, field: background },
				{ name: 'bottom', top: 550, bottom: 582, field: background },
			];
			for (const region of regions) {
				let ink = 0;
				for (let y = region.top; y < region.bottom; y++) {
					for (let x = 48; x < 1152; x++) {
						const offset = (y * info.width + x) * info.channels;
						if (region.field.some((channel, c) => data[offset + c] !== channel)) ink++;
					}
				}
				assert.ok(ink > 20, `${name}: ${region.name} must contain ink`);
			}
			// The command, title and metadata must leave both 48px side margins empty.
			for (let y = 100; y < 510; y++) {
				for (const [start, end] of [[0, 48], [1152, 1200]]) {
					for (let x = start; x < end; x++) {
						const offset = (y * info.width + x) * info.channels;
						assert.deepEqual([...data.subarray(offset, offset + 3)], background, `${name}: overflow at ${x},${y}`);
					}
				}
			}
		});
	}
	spy.mock.restore();
	assert.deepEqual(loaded, ['unifont-18.0.01.otf']);
	assert.deepEqual(fs.readdirSync('src/assets/og-fonts').filter((file) => /\.(otf|ttf|woff2?)$/.test(file)), ['unifont-18.0.01.otf']);
});

test('mixed CJK and Latin titles wrap on cells with a bounded ellipsis', () => {
	assert.deepEqual(wrapOgText('中文AB中文AB中文AB中文AB', 6), ['中文AB', '中文AB', '中文…']);
	assert.deepEqual(wrapOgText('Hello, World!', 34), ['Hello, World!']);
	assert.equal(wrapOgText(wrapFixture, 46).length, 3);
	assert.equal(wrapOgText('中'.repeat(100), 46).at(-1)?.endsWith('…'), true);
});

test('Latin words wrap at spaces and hyphens unless wider than a line', () => {
	assert.deepEqual(wrapOgText('Managing Context Function Calls', 16), ['Managing Context', 'Function Calls']);
	assert.deepEqual(wrapOgText('one two-three four', 8), ['one two-', 'three', 'four']);
	assert.deepEqual(wrapOgText('abcdefghijk', 4), ['abcd', 'efgh', 'ijk']);
	assert.deepEqual(wrapOgText('one two three four five', 10, 2), ['one two', 'three…']);
	assert.ok(wrapOgText(wrapFixture, 46).join(' ').includes('Context'));
	assert.ok(wrapOgText(wrapFixture, 46).join(' ').includes('Calls'));
});

test('CJK closing punctuation stays with the preceding character inside the width', () => {
	for (const punctuation of [...'，。、：；！？）」』', '。」']) {
		const input = `中文測試${punctuation}後文`;
		const lines = wrapOgText(input, 8);
		assert.equal(lines.join(''), input);
		assert.ok(lines.every((line) => !/^[，。、：；！？）」』]/u.test(line)));
		assert.ok(lines.every((line) => cellWidth(line) <= 8));
	}
	assert.ok(wrapOgText('中文標題：提示詞、記憶、函數呼叫，以及 skill 和 subagent', 16).every((line) => !/^[，。、：；！？）」』]/u.test(line)));
});

test('the fetch card renders the supplied post count', async () => {
	assert.notDeepEqual(
		await renderOgImage(samples.default),
		await renderOgImage({ ...samples.default, postCount: rootPosts.length + 1 }),
	);
});

test('all text colours meet 4.5:1 on both terminal fields', () => {
	const luminance = (hex: string) => {
		const rgb = hex.slice(1).match(/../g)!.map((v) => parseInt(v, 16) / 255)
			.map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
		return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
	};
	for (const field of [OG_PALETTE.background, OG_PALETTE.surface]) {
		for (const text of [OG_PALETTE.foreground, OG_PALETTE.secondary, OG_PALETTE.accent]) {
			assert.ok((luminance(field) + 0.05) / (luminance(text) + 0.05) >= 4.5);
		}
	}
});


test('a post title changes the rendered title band', async () => {
	const region = { left: 48, top: 208, width: 1104, height: 176 };
	const titled = await sharp(await renderOgImage(samples.short)).extract(region).raw().toBuffer();
	const empty = await sharp(await renderOgImage({ ...samples.short, title: '' })).extract(region).raw().toBuffer();
	assert.notDeepEqual(titled, empty);
});

test('the shared cell model matches Unifont punctuation advance widths', () => {
	assert.equal(cellWidth('·’…—│'), 5);
	assert.equal(cellWidth('，。、：；！？）」』'), 20);
	assert.deepEqual(wrapOgText('Eries · one', 11), ['Eries · one']);
	assert.deepEqual(wrapOgText('doesn’t fit', 11), ['doesn’t fit']);
});

test('the committed Unifont has the pinned upstream bytes', () => {
	assert.equal(
		createHash('sha256').update(fs.readFileSync('src/assets/og-fonts/unifont-18.0.01.otf')).digest('hex'),
		'88d0a14d4aa9a96419720b39ba5da921a59560d76d4ec7d523acc06ed85cd3c2',
	);
});

test('social cards use the same fixed day palette as CSS', () => {
  const css = fs.readFileSync('src/styles/tokens.css', 'utf8').match(/:root\s*\{([^}]+)\}/)![1];
  for (const [role, value] of Object.entries(OG_PALETTE)) {
    const token = role === 'borderStrong' ? 'border-strong' : role;
    assert.equal(value, css.match(new RegExp(`--${token}:\\s*(#[\\da-f]{6});`, 'i'))![1], role);
  }
});
