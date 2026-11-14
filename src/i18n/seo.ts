/**
 * Language tags, canonical URLs and hreflang alternates.
 *
 * The root locale (`zh`, shown as `src`) holds each post in the language it
 * was written in. Its Chinese text is Simplified script with no regional
 * vocabulary, so root Chinese pages are tagged `zh-Hans`; `/zh-CN/` keeps
 * `zh-CN`, and `/en/` keeps `en`. A root post written in English is `en`.
 *
 * Rule: one URL per language. A locale version that is a verbatim copy of the
 * root original (`is_copy: true`, or a version in the original's own
 * language) is not an alternate; its canonical points at the root original.
 * Every other version is listed with its own tag, and `x-default` points at
 * the root. A page that exists in one locale only lists no alternates.
 */
import { defaultLang, languages, type Lang } from './ui.ts';

/** The language a root post was written in. */
export type SourceLang = 'zh' | 'en';

export const locales = Object.keys(languages) as Lang[];

/** Pages that exist only at the root (no locale prefix). */
const ROOT_ONLY_PAGES = ['/link-exchange/'];

/** The BCP 47 tag of a locale's pages; the root follows the original's language. */
export function getLangTag(lang: Lang, source: SourceLang = 'zh'): string {
	if (lang !== defaultLang) return lang;
	return source === 'en' ? 'en' : 'zh-Hans';
}

/** Appends a trailing slash to a page path; file paths (`/rss.xml`) and fragments stay as they are. */
export function withTrailingSlash(path: string): string {
	const match = /^([^?#]*)(.*)$/.exec(path)!;
	const [, pathname, rest] = match;
	if (pathname.endsWith('/') || /\.[a-z0-9]+$/i.test(pathname)) return path;
	return `${pathname}/${rest}`;
}

/** Splits a pathname into its locale and the locale-free path (with a trailing slash). */
export function splitLocalePath(pathname: string): { lang: Lang; path: string } {
	const [, first] = pathname.split('/');
	if (first && first !== defaultLang && first in languages) {
		return { lang: first as Lang, path: withTrailingSlash(pathname.slice(first.length + 1) || '/') };
	}
	return { lang: defaultLang, path: withTrailingSlash(pathname || '/') };
}

/** The URL path of a locale-free path in a locale. */
export function localizePath(lang: Lang, path: string): string {
	const normalized = withTrailingSlash(path.startsWith('/') ? path : `/${path}`);
	return lang === defaultLang ? normalized : `/${lang}${normalized}`;
}

/** Locales a locale-free path exists in. */
export function getPageLocales(path: string): Lang[] {
	return ROOT_ONLY_PAGES.includes(withTrailingSlash(path)) ? [defaultLang] : locales;
}

/** Frontmatter fields that tell a post's original language. */
export interface PostVersionData {
	title?: string;
	lang?: string;
	is_copy?: boolean;
}

/**
 * The original language of a root post: its own `lang` field, else the locale
 * that holds a verbatim copy (`/en/` copy → English, `/zh-CN/` copy →
 * Chinese), else whether the title has Chinese characters.
 */
export function getPostSourceLang(versions: Partial<Record<Lang, PostVersionData>>): SourceLang {
	const root = versions[defaultLang];
	if (root?.lang) return root.lang.startsWith('en') ? 'en' : 'zh';
	if (versions.en?.is_copy) return 'en';
	if (versions['zh-CN']?.is_copy) return 'zh';
	return /[㐀-鿿]/.test(root?.title ?? '') ? 'zh' : 'en';
}

/** Whether a locale's version repeats the root original instead of translating it. */
export function isCopyOfSource(lang: Lang, source: SourceLang, data: PostVersionData | undefined): boolean {
	if (lang === defaultLang || !data) return false;
	return Boolean(data.is_copy) || getLangTag(lang) === getLangTag(defaultLang, source);
}

export interface PageVersions {
	/** Locales the page exists in; defaults to every locale, or the root only for root-only pages. */
	locales?: Lang[];
	/** The root version's language. */
	source?: SourceLang;
	/** Locales whose version is a copy of the root original. */
	copies?: Lang[];
}

export interface Alternate {
	hreflang: string;
	path: string;
}

/** hreflang alternates of a locale-free path: one URL per language, plus x-default. */
export function getAlternates(path: string, versions: PageVersions = {}): Alternate[] {
	const { locales: pageLocales = getPageLocales(path), source = 'zh', copies = [] } = versions;
	const alternates: Alternate[] = [];
	for (const lang of locales) {
		if (!pageLocales.includes(lang) || copies.includes(lang)) continue;
		const hreflang = getLangTag(lang, source);
		if (alternates.some((alternate) => alternate.hreflang === hreflang)) continue;
		alternates.push({ hreflang, path: localizePath(lang, path) });
	}
	if (alternates.length < 2) return [];
	const root = pageLocales.includes(defaultLang) ? defaultLang : pageLocales[0];
	alternates.push({ hreflang: 'x-default', path: localizePath(root, path) });
	return alternates;
}

/** The canonical path of a locale's page: the root original for a copy, else the page itself. */
export function getCanonicalPath(lang: Lang, path: string, versions: PageVersions = {}): string {
	return localizePath(versions.copies?.includes(lang) ? defaultLang : lang, path);
}
