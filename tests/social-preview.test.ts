import assert from 'node:assert/strict';
import test from 'node:test';
import {
	buildPostOgStaticPaths,
	getKnownSocialImageMetadata,
	getPostOgImagePath,
	selectPostSocialImage,
} from '../src/lib/social-preview.ts';
import { renderOgImage } from '../src/lib/og-image.ts';

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
		brand: 'xzOS / BLOG',
		footer: 'AI / EN',
	});

	assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
	assert.equal(png.readUInt32BE(16), 1200);
	assert.equal(png.readUInt32BE(20), 630);
});
