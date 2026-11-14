import assert from 'node:assert/strict';
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
	const { source, versions, alternates } = postHead('hello-world');
	assert.equal(source, 'en');
	assert.deepEqual(versions.copies, ['en']);
	assert.deepEqual(alternates, [
		{ hreflang: 'en', path: '/blog/hello-world/' },
		{ hreflang: 'zh-CN', path: '/zh-CN/blog/hello-world/' },
		{ hreflang: 'x-default', path: '/blog/hello-world/' },
	]);
	assert.equal(getCanonicalPath('en', '/blog/hello-world/', versions), '/blog/hello-world/');
});

test('original languages: five English posts, the rest Chinese', () => {
	const english = rootSlugs.filter((slug) => postHead(slug).source === 'en').sort();
	assert.deepEqual(english, [
		'azure-custom-vision-mi',
		'cut-and-move-runs-via-python-docx',
		'hello-world',
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
	for (const path of ['/zh-CN/blog/new-start/', '/en/blog/hello-world/', '/en/blog/steam-for-linux-no-sound-when-streaming/', '/zh-CN/about/']) {
		assert.ok(copies.has(path), path);
	}
	for (const path of ['/blog/new-start/', '/en/blog/new-start/', '/zh-CN/blog/hello-world/', '/en/about/']) {
		assert.equal(copies.has(path), false, path);
	}
	// 60 zh-CN copies of Chinese originals, 5 en copies of English originals, the zh-CN about page.
	assert.equal(copies.size, 66);
	assert.match(read('../astro.config.mjs'), /copyPaths\.has\(path\)/);
});
