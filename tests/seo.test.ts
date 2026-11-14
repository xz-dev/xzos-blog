import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import localized404 from '../src/integrations/localized-404.ts';
import { getCopyPaths, readVersions } from '../src/lib/copy-pages.ts';
import {
	getAlternates,
	getCanonicalPath,
	getLangTag,
	getPostSourceLang,
	isCopyOfSource,
	locales,
	withTrailingSlash,
} from '../src/i18n/seo.ts';
import { navItems, ui } from '../src/i18n/ui.ts';
import { getAlternateLanguagePath, getBlogPostPath } from '../src/i18n/utils.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const blog = new URL('../src/content/blog/', import.meta.url);

const postVersions = (slug: string) => readVersions(blog, slug);

function postHead(slug: string) {
	const data = postVersions(slug);
	const source = getPostSourceLang(data);
	const versions = {
		locales: locales.filter((lang) => data[lang]),
		source,
		copies: locales.filter((lang) => isCopyOfSource(lang, source, data[lang])),
	};
	return { source, versions, alternates: getAlternates(`/blog/${slug}/`, versions) };
}

const rootSlugs = readdirSync(blog).filter((file) => file.endsWith('.md')).map((file) => file.slice(0, -3));

test('root Chinese pages are zh-Hans, distinct from the zh-CN locale', () => {
	assert.equal(getLangTag('zh'), 'zh-Hans');
	assert.equal(getLangTag('zh', 'en'), 'en');
	assert.equal(getLangTag('en'), 'en');
	assert.equal(getLangTag('zh-CN'), 'zh-CN');
});

test('site pages list one URL per language plus x-default', () => {
	assert.deepEqual(getAlternates('/'), [
		{ hreflang: 'zh-Hans', path: '/' },
		{ hreflang: 'en', path: '/en/' },
		{ hreflang: 'zh-CN', path: '/zh-CN/' },
		{ hreflang: 'x-default', path: '/' },
	]);
	assert.deepEqual(getAlternates('/blog/').map((alternate) => alternate.path), ['/blog/', '/en/blog/', '/zh-CN/blog/', '/blog/']);
	assert.equal(getCanonicalPath('en', '/blog/'), '/en/blog/');
});

test('a root-only page lists no alternates', () => {
	assert.deepEqual(getAlternates('/link-exchange/'), []);
	assert.equal(getCanonicalPath('zh', '/link-exchange/'), '/link-exchange/');
});

test('a Chinese original lists its English translation; the zh-CN copy points its canonical at the original', () => {
	const { source, versions, alternates } = postHead('new-start');
	assert.equal(source, 'zh');
	assert.deepEqual(versions.copies, ['zh-CN']);
	assert.deepEqual(alternates, [
		{ hreflang: 'zh-Hans', path: '/blog/new-start/' },
		{ hreflang: 'en', path: '/en/blog/new-start/' },
		{ hreflang: 'x-default', path: '/blog/new-start/' },
	]);
	assert.equal(getCanonicalPath('zh-CN', '/blog/new-start/', versions), '/blog/new-start/');
	assert.equal(getCanonicalPath('en', '/blog/new-start/', versions), '/en/blog/new-start/');
});

test('an English original is en at the root; its /en/ copy is not a second en alternate', () => {
	const slug = 'azure-custom-vision-mi';
	const { source, versions, alternates } = postHead(slug);
	assert.equal(source, 'en');
	assert.deepEqual(versions.copies, ['en']);
	assert.deepEqual(alternates, [
		{ hreflang: 'en', path: `/blog/${slug}/` },
		{ hreflang: 'zh-CN', path: `/zh-CN/blog/${slug}/` },
		{ hreflang: 'x-default', path: `/blog/${slug}/` },
	]);
	assert.equal(getCanonicalPath('en', `/blog/${slug}/`, versions), `/blog/${slug}/`);
});

test('hello-world is a Chinese original with an English translation', () => {
	const { source, versions, alternates } = postHead('hello-world');
	assert.equal(source, 'zh');
	assert.deepEqual(versions.copies, ['zh-CN']);
	assert.deepEqual(alternates.map((alternate) => alternate.hreflang), ['zh-Hans', 'en', 'x-default']);
	// The /en/ file is a translation the translate step keeps: its source_hash is the root file's.
	const root = readFileSync(new URL('hello-world.md', blog), 'utf8');
	const hash = createHash('md5').update(root).digest('hex').slice(0, 8);
	for (const dir of ['en/', 'zh-CN/']) {
		const text = readFileSync(new URL(`${dir}hello-world.md`, blog), 'utf8');
		assert.match(text, new RegExp(`^source_hash: "${hash}"$`, 'm'), dir);
		assert.match(text, /^source_lang: "zh"$/m, dir);
	}
	assert.match(root, /^lang: "zh"$/m);
	assert.match(readFileSync(new URL('en/hello-world.md', blog), 'utf8'), /^title: "Hello, World!"$/m);
});

test('original languages: four English posts, the rest Chinese', () => {
	const english = rootSlugs.filter((slug) => postHead(slug).source === 'en').sort();
	assert.deepEqual(english, [
		'azure-custom-vision-mi',
		'cut-and-move-runs-via-python-docx',
		// No lang field and an English /en/ version not marked as a copy: the English title decides.
		'steam-for-linux-no-sound-when-streaming',
		'webm-webp-to-gif-with-semi-transparency',
	]);
	// A Chinese post quoting an English poem stays Chinese.
	assert.equal(postHead('our-dreams-are-bound').source, 'zh');
});

test('no post page lists a language or a URL twice', () => {
	for (const slug of rootSlugs) {
		const { alternates } = postHead(slug);
		const tags = alternates.map((alternate) => alternate.hreflang);
		assert.equal(new Set(tags).size, tags.length, slug);
		const urls = alternates.filter((alternate) => alternate.hreflang !== 'x-default').map((alternate) => alternate.path);
		assert.equal(new Set(urls).size, urls.length, slug);
	}
});

test('every locale has a localized title and description for the home and list pages', () => {
	for (const lang of locales) {
		for (const key of ['meta.homeTitle', 'meta.homeDescription', 'meta.blogDescription', 'error.pageNotFound', 'error.backHome'] as const) {
			assert.ok(ui[lang][key], `${lang} ${key}`);
		}
	}
	for (const lang of ['zh', 'zh-CN'] as const) {
		assert.match(ui[lang]['meta.homeDescription'], /[一-鿿]/, lang);
		assert.equal(ui[lang]['blog.heading'], '文章');
	}
	assert.match(read('../src/layouts/Home.astro'), /<BaseHead title=\{t\('meta\.homeTitle'\)\} description=\{t\('meta\.homeDescription'\)\}/);
	assert.match(read('../src/layouts/BlogArchive.astro'), /<BaseHead title=\{`\$\{t\('blog\.heading'\)\} - \$\{SITE_TITLE\}`\} description=\{t\('meta\.blogDescription'\)\}/);
	assert.match(read('../src/layouts/BlogList.astro'), /description=\{t\('meta\.blogDescription'\)\}/);
	// The about page's <title> uses the menu label, not the shared English frontmatter title.
	assert.match(read('../src/layouts/Page.astro'), /navItem \? t\(navItem\.key\)/);
	for (const layout of ['Home', 'BlogArchive', 'BlogList']) {
		assert.doesNotMatch(read(`../src/layouts/${layout}.astro`), /SITE_DESCRIPTION/, layout);
	}
});

test('generated navigation links end with a slash', () => {
	for (const item of navItems) assert.match(item.path, /\/$/, item.key);
	for (const lang of locales) {
		for (const path of ['/about', '/blog/new-start', '/en/blog/new-start', '/zh-CN/', '/link-exchange']) {
			assert.match(getAlternateLanguagePath(new URL(path, 'https://xzos.net'), lang), /\/$/, `${path} -> ${lang}`);
		}
		assert.match(getBlogPostPath('new-start', lang), /\/$/);
	}
	// The 404 page's language links go to each locale's home.
	assert.equal(getAlternateLanguagePath(new URL('https://xzos.net/en/404'), 'zh'), '/');
	assert.equal(getAlternateLanguagePath(new URL('https://xzos.net/404'), 'en'), '/en/');
	assert.equal(withTrailingSlash('/about'), '/about/');
	assert.equal(withTrailingSlash('/rss.xml'), '/rss.xml');
	const shell = read('../src/components/term/Shell.astro');
	assert.match(shell, /about: `\$\{base\}\/about\/`/);
	assert.match(shell, /links: '\/link-exchange\/'/);
	assert.doesNotMatch(read('../src/components/LanguageVersionNotice.astro'), /\$\{slug\}`/);
});

test('each locale has a 404 page, written as <locale>/404.html', async () => {
	assert.match(read('../src/pages/404.astro'), /<NotFound lang=\{defaultLang\} \/>/);
	assert.match(read('../src/pages/[lang]/404.astro'), /nonDefaultLocales\.map/);
	const notFound = read('../src/layouts/NotFound.astro');
	assert.match(notFound, /<html lang=\{getHtmlLang\(lang\)\}>/);
	assert.match(notFound, /noindex/);
	assert.match(read('../astro.config.mjs'), /localized404\(\['en', 'zh-CN'\]\)/);

	const dist = mkdtempSync(join(tmpdir(), 'xzos-404-'));
	try {
		for (const lang of ['en', 'zh-CN']) {
			mkdirSync(join(dist, lang, '404'), { recursive: true });
			writeFileSync(join(dist, lang, '404', 'index.html'), lang);
		}
		const hook = localized404(['en', 'zh-CN']).hooks['astro:build:done']!;
		await (hook as any)({ dir: pathToFileURL(`${dist}/`), logger: { info() {} } });
		for (const lang of ['en', 'zh-CN']) {
			assert.equal(readFileSync(join(dist, lang, '404.html'), 'utf8'), lang);
			assert.equal(existsSync(join(dist, lang, '404')), false);
		}
	} finally {
		rmSync(dist, { recursive: true, force: true });
	}
});

test('robots.txt allows all and names the sitemap; /page/1/ redirects to the post list', () => {
	const robots = read('../public/robots.txt');
	assert.match(robots, /^User-agent: \*$/m);
	assert.match(robots, /^Sitemap: https:\/\/xzos\.net\/sitemap-index\.xml$/m);
	const redirects = read('../public/_redirects');
	for (const prefix of ['', '/en', '/zh-CN']) {
		assert.match(redirects, new RegExp(`^${prefix}/page/1/ ${prefix}/blog/ 301$`, 'm'));
	}
	assert.match(read('../astro.config.mjs'), /sitemap\(\{ filter: /);
});

test('the sitemap leaves out copies, whose canonical is the root original', () => {
	const copies = getCopyPaths(new URL('../src/content/', import.meta.url));
	for (const path of ['/zh-CN/blog/new-start/', '/zh-CN/blog/hello-world/', '/en/blog/azure-custom-vision-mi/', '/en/blog/steam-for-linux-no-sound-when-streaming/', '/zh-CN/about/']) {
		assert.ok(copies.has(path), path);
	}
	for (const path of ['/blog/new-start/', '/en/blog/new-start/', '/en/blog/hello-world/', '/zh-CN/blog/azure-custom-vision-mi/', '/en/about/']) {
		assert.equal(copies.has(path), false, path);
	}
	// 61 zh-CN copies of Chinese originals, 4 en copies of English originals, the zh-CN about page.
	assert.equal(copies.size, 66);
	// Read lazily, after the translate step has written its files.
	assert.match(read('../astro.config.mjs'), /\(copyPaths \?\?= getCopyPaths\(/);
});

test('a root English original keeps the zh-Hans chrome and marks its title and body en', () => {
	const post = read('../src/layouts/BlogPost.astro');
	assert.match(post, /const htmlLang = getLangTag\(lang\);/);
	assert.match(post, /const contentLang = lang === defaultLang && source === 'en' \? 'en' : undefined;/);
	assert.match(post, /<PageFrame title=\{title\} pattern="article" contentLang=\{contentLang\}>/);
	const frame = read('../src/components/PageFrame.astro');
	assert.match(frame, /<h1 class="page-title" lang=\{contentLang\}>/);
	assert.match(frame, /<div class="article-body" lang=\{contentLang\}>/);
});

test('the translation notice names the original language', () => {
	for (const lang of locales) assert.ok(ui[lang]['notice.translatedLinkEn'], lang);
	assert.equal(ui['zh-CN']['notice.translatedLinkEn'], '英文原文');
	assert.equal(ui.en['notice.translatedLinkEn'], 'English original');
	const notice = read('../src/components/LanguageVersionNotice.astro');
	assert.match(notice, /hreflang=\{getLangTag\(defaultLang, source\)\}>\{t\(source === 'en' \? 'notice\.translatedLinkEn' : 'notice\.translatedLink'\)\}/);
	assert.match(notice, /!isCopyOfSource\(lang, source, data\)/);
	assert.match(read('../src/layouts/BlogPost.astro'), /<LanguageVersionNotice [^>]*source=\{source\}/);
});

test('page 1 of the paged list links to the post list, not the home page', () => {
	assert.match(read('../src/layouts/BlogList.astro'), /page === 1 \? `\$\{blogPrefix\}\/`/);
});
