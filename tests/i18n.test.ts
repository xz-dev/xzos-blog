import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { getExcerptHtml } from '../src/lib/excerpt.ts';
import { defaultLang, ui } from '../src/i18n/ui.ts';
import { getAlternateLanguagePath, getNavCurrent, isMachineTranslation } from '../src/i18n/utils.ts';

const blog = new URL('../src/content/blog/', import.meta.url);
const posts = (dir: string) => readdirSync(new URL(dir, blog)).filter((file) => /\.mdx?$/.test(file)).map((file) => ({
	file: `${dir}${file}`,
	text: readFileSync(new URL(`${dir}${file}`, blog), 'utf8'),
}));

test('each locale names other versions in its own language', () => {
	assert.equal(ui.zh['notice.alsoIn'], '其他语言：');
	assert.equal(ui['zh-CN']['notice.alsoIn'], '其他语言：');
	assert.equal(ui.en['notice.alsoIn'], 'Also in: ');
	// No English string carries Chinese text.
	for (const [key, value] of Object.entries(ui.en)) assert.doesNotMatch(value, /[\u3000-\u9fff\uff00-\uffef]/, key);
});

test('every locale has the same keys', () => {
	const keys = Object.keys(ui[defaultLang]).sort();
	for (const lang of ['en', 'zh-CN'] as const) {
		assert.deepEqual(Object.keys(ui[lang]).sort(), keys, lang);
	}
});

test('only machine translations carry the translation notice', () => {
	assert.equal(isMachineTranslation('zh', {}), false);
	assert.equal(isMachineTranslation('en', {}), true);
	assert.equal(isMachineTranslation('en', { is_copy: true }), false);
	assert.equal(isMachineTranslation('zh-CN', { is_copy: true }), false);
	assert.equal(isMachineTranslation('zh-CN', undefined), false);
	// The real zh-CN copy of a Chinese post is marked as a copy.
	const copy = posts('zh-CN/').find((post) => post.file === 'zh-CN/new-start.md')!;
	assert.match(copy.text, /^is_copy: true$/m);
});

test('header links mark their section under every locale prefix and on list pages', () => {
	const cases: [string, string, 'page' | 'true' | undefined][] = [
		['/', '/', 'page'],
		['/blog/', '/blog', 'page'],
		['/blog/new-start/', '/blog', 'true'],
		['/en/blog/', '/en/blog', 'page'],
		['/en/about/', '/en/about', 'page'],
		['/zh-CN/blog/new-start/', '/zh-CN/blog', 'true'],
		['/page/2/', '/', 'true'],
		['/en/page/3/', '/en/', 'true'],
		['/link-exchange/', '/link-exchange', 'page'],
		['/blog/', '/', undefined],
		['/en/', '/en/blog', undefined],
		['/zh-CN/about/', '/zh-CN/blog', undefined],
	];
	for (const [pathname, href, expected] of cases) assert.equal(getNavCurrent(pathname, href), expected, `${pathname} vs ${href}`);
});

test('on a shared page the current language links to the page itself', () => {
	const url = new URL('https://xzos.net/link-exchange/');
	assert.equal(getAlternateLanguagePath(url, 'zh'), '/link-exchange/');
	assert.equal(getAlternateLanguagePath(url, 'en'), '/en/');
	assert.equal(getAlternateLanguagePath(url, 'zh-CN'), '/zh-CN/');
	assert.equal(getAlternateLanguagePath(new URL('https://xzos.net/en/blog/new-start/'), 'zh'), '/blog/new-start/');
});

test('a page has one h1: post bodies start at h2 and list excerpts at h3', () => {
	for (const { file, text } of [...posts(''), ...posts('en/'), ...posts('zh-CN/')]) {
		const body = text.replace(/^---[\s\S]*?\n---/, '').replace(/^(```|~~~)[\s\S]*?^\1/gm, '');
		assert.doesNotMatch(body, /^#[ \t]/m, `${file}: a level-1 heading would be a second h1`);
		assert.doesNotMatch(body, /<h1[\s>]/i, file);
	}
	const excerpt = getExcerptHtml('# Title\n\ntext\n\n## Section');
	assert.doesNotMatch(excerpt.html, /<h[12][\s>]/);
	assert.match(excerpt.html, /<h3>Title<\/h3>/);
	assert.match(excerpt.html, /<h4>Section<\/h4>/);
});
