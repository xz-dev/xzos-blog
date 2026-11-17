import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { SITE_AUTHOR, SITE_TITLE, SOCIAL_LINKS } from '../src/consts.ts';
import { getPostLastmods, readPostLastmod, withLastmod } from '../src/lib/sitemap-lastmod.ts';
import { blogPosting, postAuthor, serializeJsonLd, webSite } from '../src/lib/structured-data.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const site = 'https://xzos.net';

const post = {
	title: 'Hello',
	description: 'A post',
	published: new Date('2024-01-02T03:04:05+08:00'),
	lang: 'zh-Hans',
	url: new URL('/blog/hello/', site),
	image: new URL('/og/hello.png', site),
	site,
};

test('a post is a BlogPosting by the site author, published by the site author', () => {
	const data = blogPosting({ ...post, author: SITE_AUTHOR });
	assert.equal(data['@context'], 'https://schema.org');
	assert.equal(data['@type'], 'BlogPosting');
	assert.equal(data.headline, 'Hello');
	assert.equal(data.description, 'A post');
	assert.equal(data.datePublished, '2024-01-01T19:04:05.000Z');
	assert.equal(data.dateModified, data.datePublished);
	assert.equal(data.inLanguage, 'zh-Hans');
	assert.equal(data.url, 'https://xzos.net/blog/hello/');
	assert.deepEqual(data.mainEntityOfPage, { '@type': 'WebPage', '@id': 'https://xzos.net/blog/hello/' });
	assert.equal(data.image, 'https://xzos.net/og/hello.png');
	assert.deepEqual(data.author, {
		'@type': 'Person',
		'@id': 'https://xzos.net/#author',
		name: 'xz-dev',
		url: 'https://xzos.net/about/',
		sameAs: Object.values(SOCIAL_LINKS),
	});
	assert.deepEqual(data.publisher, data.author);
});

test('dateModified is updatedDate when the post has one', () => {
	const data = blogPosting({ ...post, modified: new Date('2025-06-07T00:00:00Z') });
	assert.equal(data.dateModified, '2025-06-07T00:00:00.000Z');
});

test('a guest author is named without the site author\'s profiles; no author means the site author', () => {
	assert.deepEqual(postAuthor('Eries', site), { '@type': 'Person', name: 'Eries' });
	assert.equal(blogPosting({ ...post, author: 'Eries' }).publisher.name, SITE_AUTHOR);
	assert.equal(postAuthor(undefined, site).name, SITE_AUTHOR);
});

test('a home page is a WebSite with the author as a Person', () => {
	const data = webSite({ description: 'Blog', lang: 'en', url: new URL('/en/', site), site });
	const [website, person] = data['@graph'];
	assert.equal(website['@type'], 'WebSite');
	assert.equal(website.name, SITE_TITLE);
	assert.equal(website.url, 'https://xzos.net/en/');
	assert.equal(website.inLanguage, 'en');
	assert.deepEqual(website.author, { '@id': 'https://xzos.net/#author' });
	assert.equal(person['@type'], 'Person');
	assert.equal(person.name, 'xz-dev');
	assert.deepEqual(person.sameAs, Object.values(SOCIAL_LINKS));
});

test('JSON-LD escapes < so a value cannot close the script element', () => {
	const json = serializeJsonLd(blogPosting({ ...post, title: '</script><script>alert(1)</script>' }));
	assert.equal(json.includes('<'), false);
	assert.equal(JSON.parse(json).headline, '</script><script>alert(1)</script>');
});

test('BaseHead emits the JSON-LD on posts and home pages', () => {
	const head = read('../src/components/BaseHead.astro');
	assert.match(head, /<script is:inline type="application\/ld\+json" set:html=\{serializeJsonLd\(structuredData\)\} \/>/);
	assert.match(head, /article\?\.modified && <meta property="article:modified_time"/);
	assert.match(read('../src/layouts/BlogPost.astro'), /article=\{\{ published: pubDate, modified: updatedDate, author \}\}/);
	assert.match(read('../src/layouts/Home.astro'), /<BaseHead [^>]* website \/>/);
});

test('a post\'s lastmod is updatedDate, else pubDate', () => {
	assert.equal(readPostLastmod('---\ntitle: "A"\npubDate: "2024-01-02T03:04+08:00"\n---\nbody')?.toISOString(), '2024-01-01T19:04:00.000Z');
	assert.equal(
		readPostLastmod('---\npubDate: "2024-01-02T03:04:05+08:00"\nupdatedDate: \'2025-01-01T00:00:00Z\'\n---\n')?.toISOString(),
		'2025-01-01T00:00:00.000Z',
	);
	assert.equal(readPostLastmod('---\ntitle: "A"\n---\n'), undefined);
});

test('the sitemap gives post URLs a lastmod and other pages none', () => {
	const dates = new Map([['/en/blog/hello/', new Date('2024-01-01T00:00:00Z')]]);
	assert.deepEqual(withLastmod({ url: 'https://xzos.net/en/blog/hello/' }, dates), {
		url: 'https://xzos.net/en/blog/hello/',
		lastmod: '2024-01-01T00:00:00.000Z',
	});
	assert.deepEqual(withLastmod({ url: 'https://xzos.net/about/' }, dates), { url: 'https://xzos.net/about/' });
	assert.match(read('../astro.config.mjs'), /sitemap\(\{ filter: .*, serialize: addLastmod \}\)/);
});

test('every post in every locale has a lastmod', () => {
	const dates = getPostLastmods(new URL('../src/content/', import.meta.url));
	for (const path of ['/blog/hello-world/', '/en/blog/hello-world/', '/zh-CN/blog/hello-world/']) assert.ok(dates.has(path), path);
	const posts = ['', 'en/', 'zh-CN/']
		.map((dir) => readdirSync(new URL(`../src/content/blog/${dir}`, import.meta.url)).filter((file) => /\.mdx?$/.test(file)).length)
		.reduce((a, b) => a + b);
	assert.equal(dates.size, posts);
});

test('hashed assets and versioned fonts are cached for a year', () => {
	assert.equal(
		read('../public/_headers').replace(/^#.*\n/gm, ''),
		[
			'/_astro/*',
			'  Cache-Control: public, max-age=31536000, immutable',
			'',
			'/fonts/*.woff2',
			'  Cache-Control: public, max-age=31536000, immutable',
			'',
		].join('\n'),
	);
});
