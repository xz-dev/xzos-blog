/**
 * Build-time list of the locale pages that are copies of a root original, so
 * the sitemap lists only canonical URLs. It reads the same frontmatter fields
 * and applies the same rule (i18n/seo.ts) as BlogPost.astro and Page.astro.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { getPostSourceLang, isCopyOfSource, localizePath, locales, type PostVersionData } from '../i18n/seo.ts';
import { defaultLang, type Lang } from '../i18n/ui.ts';

const localeDir = (lang: Lang) => (lang === defaultLang ? '' : `${lang}/`);

/** The frontmatter fields seo.ts reads; undefined when the file does not exist. */
export function readVersionData(file: URL): PostVersionData | undefined {
	if (!existsSync(file)) return undefined;
	const head = readFileSync(file, 'utf8').split(/^---\s*$/m)[1] ?? '';
	const field = (name: string) => {
		const value = new RegExp(`^${name}:\\s*(.*?)\\s*$`, 'm').exec(head)?.[1];
		return value?.replace(/^(["'])(.*)\1$/, '$2') || undefined;
	};
	return { title: field('title'), lang: field('lang'), is_copy: field('is_copy') === 'true' };
}

/** Every locale's frontmatter of one entry in a collection directory (src/content/blog/ or pages/). */
export function readVersions(dir: URL, slug: string): Partial<Record<Lang, PostVersionData>> {
	const versions: Partial<Record<Lang, PostVersionData>> = {};
	for (const lang of locales) {
		const data = readVersionData(new URL(`${localeDir(lang)}${slug}.md`, dir))
			?? readVersionData(new URL(`${localeDir(lang)}${slug}.mdx`, dir));
		if (data) versions[lang] = data;
	}
	return versions;
}

const slugs = (dir: URL) => readdirSync(dir).filter((file) => /\.mdx?$/.test(file)).map((file) => file.replace(/\.mdx?$/, ''));

/** URL paths (with trailing slash) of copies, given src/content/. */
export function getCopyPaths(content: URL): Set<string> {
	const paths = new Set<string>();
	const blog = new URL('blog/', content);
	for (const slug of slugs(blog)) {
		const versions = readVersions(blog, slug);
		const source = getPostSourceLang(versions);
		for (const lang of locales) {
			if (isCopyOfSource(lang, source, versions[lang])) paths.add(localizePath(lang, `/blog/${slug}/`));
		}
	}
	const pages = new URL('pages/', content);
	for (const slug of slugs(pages)) {
		const versions = readVersions(pages, slug);
		for (const lang of locales) {
			if (lang !== defaultLang && versions[lang]?.is_copy) paths.add(localizePath(lang, `/${slug}/`));
		}
	}
	return paths;
}
