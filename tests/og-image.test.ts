import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { OG_PALETTE, renderOgImage, wrapOgText } from '../src/lib/og-image.ts';
import { SITE_TITLE } from '../src/consts.ts';

const posts = fs.globSync('src/content/blog/**/*.md*').map((file) => {
	const source = fs.readFileSync(file, 'utf8');
	const field = (key: string) => {
		const raw = source.match(new RegExp(`^${key}: (.*)$`, 'm'))?.[1] ?? '';
		return raw.startsWith('"') ? JSON.parse(raw) : raw.replace(/^'|'$/g, '');
	};
	return { file, title: field('title'), slug: path.basename(file).replace(/\.mdx?$/, ''), date: field('pubDate').slice(0, 10), category: field('category') };
});
const longest = posts.reduce((a, b) => [...a.title].length >= [...b.title].length ? a : b);
const rootPosts = posts.filter((post) => path.dirname(post.file) === 'src/content/blog');
const longestChinese = rootPosts.filter((post) => /\p{Script=Han}/u.test(post.title))
	.reduce((a, b) => [...a.title].length >= [...b.title].length ? a : b);
const samples = {
	default: { title: SITE_TITLE, postCount: rootPosts.length },
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
			const background = [255, 248, 242];
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
	assert.equal(wrapOgText(longest.title, 46).length, 3);
	assert.equal(wrapOgText('中'.repeat(100), 46).at(-1)?.endsWith('…'), true);
});

test('Latin words wrap at spaces and hyphens unless wider than a line', () => {
	assert.deepEqual(wrapOgText('Managing Context Function Calls', 16), ['Managing Context', 'Function Calls']);
	assert.deepEqual(wrapOgText('one two-three four', 8), ['one two-', 'three', 'four']);
	assert.deepEqual(wrapOgText('abcdefghijk', 4), ['abcd', 'efgh', 'ijk']);
	assert.deepEqual(wrapOgText('one two three four five', 10, 2), ['one two', 'three…']);
	assert.ok(wrapOgText(longest.title, 46).join(' ').includes('Context'));
	assert.ok(wrapOgText(longest.title, 46).join(' ').includes('Calls'));
});

test('CJK closing punctuation stays with the preceding character inside the width', () => {
	for (const punctuation of [...'，。、：；！？）」』', '。」']) {
		const input = `中文測試${punctuation}後文`;
		const lines = wrapOgText(input, 8);
		assert.equal(lines.join(''), input);
		assert.ok(lines.every((line) => !/^[，。、：；！？）」』]/u.test(line)));
		assert.ok(lines.every((line) => [...line].length * 2 <= 8));
	}
	assert.ok(wrapOgText(longestChinese.title, 46).every((line) => !/^[，。、：；！？）」』]/u.test(line)));
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
