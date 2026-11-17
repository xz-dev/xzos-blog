/**
 * Build-time `lastmod` for the sitemap's post URLs: updatedDate, else pubDate,
 * read from each locale's frontmatter the way the content schema
 * (content.config.ts) coerces them. astro.config.mjs cannot use astro:content.
 * Other pages get no lastmod: the build time is not a modification date.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { localizePath, locales } from '../i18n/seo.ts';
import { defaultLang } from '../i18n/ui.ts';

/** A post's last modification: updatedDate, else pubDate; undefined when neither parses. */
export function readPostLastmod(source: string): Date | undefined {
	const head = source.split(/^---\s*$/m)[1] ?? '';
	const field = (name: string) => {
		const value = new RegExp(`^${name}:\\s*(.*?)\\s*$`, 'm').exec(head)?.[1];
		return value?.replace(/^(["'])(.*)\1$/, '$2') || undefined;
	};
	for (const value of [field('updatedDate'), field('pubDate')]) {
		const date = value === undefined ? undefined : new Date(value);
		if (date && Number.isFinite(date.getTime())) return date;
	}
	return undefined;
}

/** Post URL path (`/blog/<slug>/`, `/en/blog/<slug>/`, …) to its last modification, given src/content/. */
export function getPostLastmods(content: URL): Map<string, Date> {
	const dates = new Map<string, Date>();
	for (const lang of locales) {
		const dir = new URL(lang === defaultLang ? 'blog/' : `blog/${lang}/`, content);
		for (const file of readdirSync(dir).filter((name) => /\.mdx?$/.test(name))) {
			const date = readPostLastmod(readFileSync(new URL(file, dir), 'utf8'));
			if (date) dates.set(localizePath(lang, `/blog/${file.replace(/\.mdx?$/, '')}/`), date);
		}
	}
	return dates;
}

/** The sitemap integration's serialize hook: adds lastmod to post URLs. */
export function withLastmod<T extends { url: string; lastmod?: string }>(item: T, dates: Map<string, Date>): T {
	const date = dates.get(new URL(item.url).pathname);
	return date ? { ...item, lastmod: date.toISOString() } : item;
}
