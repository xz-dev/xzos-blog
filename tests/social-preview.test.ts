import assert from 'node:assert/strict';
import test from 'node:test';
import {
	buildPostOgStaticPaths,
	getKnownSocialImageMetadata,
	getPostOgImagePath,
	selectPostSocialImage,
} from '../src/lib/social-preview.ts';
import { OG_PALETTE, renderOgImage } from '../src/lib/og-image.ts';
import sharp from 'sharp';

test('localized posts receive distinct generated social image paths', () => {
	const id = 'same-post';

	assert.deepEqual(
		(['zh', 'en', 'zh-CN'] as const).map((lang) => getPostOgImagePath(id, lang)),
		['/og/same-post.png', '/og/en/same-post.png', '/og/zh-CN/same-post.png'],
	);
});

test('localized OG static paths retain the entry from each corresponding collection', async () => {
	const entries = {
		blog: [{ id: 'same-post', data: { title: '源站标题', category: '技术' } }],
		'blog-en': [{ id: 'same-post', data: { title: 'English title', category: 'Technology' } }],
		'blog-zh-CN': [{ id: 'same-post', data: { title: '简体标题', category: '技术' } }],
	};

	const paths = await buildPostOgStaticPaths(async (collection) => entries[collection]);

	assert.deepEqual(
		paths.map(({ params, props }) => ({
			slug: params.slug,
			lang: props.lang,
			title: props.post.data.title,
		})),
		[
			{ slug: 'same-post', lang: 'zh', title: '源站标题' },
			{ slug: 'en/same-post', lang: 'en', title: 'English title' },
			{ slug: 'zh-CN/same-post', lang: 'zh-CN', title: '简体标题' },
		],
	);
});

test('an explicit hero image remains the social image', () => {
	const heroImage = { src: '/images/hero.png', width: 1600, height: 900, format: 'png' };
	const post = {
		id: 'with-hero',
		body: '![inline](/images/inline.png)',
		data: { heroImage },
	};

	assert.strictEqual(selectPostSocialImage(post, 'en'), heroImage);
});

test('an inline body image is ignored when no hero image is configured', () => {
	const post = {
		id: 'without-hero',
		body: '![inline](/images/inline.png)\n<img src="/images/other.png">',
		data: {},
	};

	assert.equal(selectPostSocialImage(post, 'zh-CN'), '/og/zh-CN/without-hero.png');
});

test('social image dimensions and MIME type are emitted only when they are known', () => {
	assert.deepEqual(getKnownSocialImageMetadata('/og/en/post.png'), {
		width: 1200,
		height: 630,
		type: 'image/png',
	});
	assert.deepEqual(
		getKnownSocialImageMetadata({ src: '/images/hero.jpg', width: 1600, height: 900, format: 'jpg' }),
		{ width: 1600, height: 900, type: 'image/jpeg' },
	);
	assert.deepEqual(
		getKnownSocialImageMetadata({ src: '/images/hero.svg', width: 1600, height: 900, format: 'svg' }),
		{ width: 1600, height: 900, type: 'image/svg+xml' },
	);
	assert.equal(getKnownSocialImageMetadata('https://images.example/social'), undefined);
});

test('the shared renderer returns a valid 1200 by 630 PNG', async () => {
	const png = await renderOgImage({
		title: 'Viewing an LLM as an Interpreter：把上下文交还给解释器',
		slug: 'example-post',
		date: '2026-07-23',
		category: 'AI',
		locale: 'en',
	});

	assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
	assert.equal(png.readUInt32BE(16), 1200);
	assert.equal(png.readUInt32BE(20), 630);
});

test('the social card draws metadata, cursor and site URL inside the fixed canvas', async () => {
	const png = await renderOgImage({
		title: 'AI 时代的脑腐症 / Brain Rot in the AI Era',
		slug: 'example-post',
		date: '2026-07-23',
		category: 'AI',
		locale: 'en',
	});
	const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
	const background = OG_PALETTE.background.slice(1).match(/../g)!.map((v) => parseInt(v, 16));
	const regions = {
		metadata: { left: 48, top: 448, width: 800, height: 32 },
		cursor: { left: 80, top: 550, width: 16, height: 32 },
		siteUrl: { left: 1024, top: 550, width: 128, height: 32 },
	};
	const visible: Record<string, boolean> = {};
	for (const [name, region] of Object.entries(regions)) {
		let count = 0;
		for (let y = region.top; y < region.top + region.height; y++) {
			for (let x = region.left; x < region.left + region.width; x++) {
				const i = (y * info.width + x) * info.channels;
				if (background.some((channel, c) => data[i + c] !== channel)) count++;
			}
		}
		visible[name] = count > 20;
	}
	assert.deepEqual(visible, { metadata: true, cursor: true, siteUrl: true });
});
