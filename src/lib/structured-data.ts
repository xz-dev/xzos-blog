/**
 * schema.org JSON-LD for the page head (BaseHead.astro): BlogPosting on posts,
 * WebSite and the author's Person on the home pages. Pure builders, so the
 * values can be tested without a build.
 */
import { SITE_AUTHOR, SITE_FULL_TITLE, SITE_TITLE, SOCIAL_LINKS } from '../consts.ts';

export interface Person {
	'@type': 'Person';
	'@id'?: string;
	name: string;
	url?: string;
	sameAs?: string[];
}

/** The site author: the about page and the social profiles of the header and footer. */
export function siteAuthor(site: URL | string): Person {
	return {
		'@type': 'Person',
		'@id': new URL('/#author', site).href,
		name: SITE_AUTHOR,
		url: new URL('/about/', site).href,
		sameAs: Object.values(SOCIAL_LINKS),
	};
}

/** A post's author: the site author, or a guest named in the post's `author` field, who has no profile here. */
export function postAuthor(name: string | undefined, site: URL | string): Person {
	return !name || name === SITE_AUTHOR ? siteAuthor(site) : { '@type': 'Person', name };
}

export interface BlogPostingInput {
	title: string;
	description: string;
	published: Date;
	modified?: Date;
	/** The page's language tag, as its hreflang. */
	lang: string;
	/** The canonical URL. */
	url: URL | string;
	/** The og:image URL. */
	image: URL | string;
	author?: string;
	site: URL | string;
}

export function blogPosting({ title, description, published, modified, lang, url, image, author, site }: BlogPostingInput) {
	const href = String(url);
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: title,
		description,
		datePublished: published.toISOString(),
		dateModified: (modified ?? published).toISOString(),
		inLanguage: lang,
		mainEntityOfPage: { '@type': 'WebPage', '@id': href },
		url: href,
		image: String(image),
		author: postAuthor(author, site),
		publisher: siteAuthor(site),
	};
}

export interface WebSiteInput {
	description: string;
	lang: string;
	/** The home page's canonical URL. */
	url: URL | string;
	site: URL | string;
}

export function webSite({ description, lang, url, site }: WebSiteInput) {
	const author = siteAuthor(site);
	return {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebSite',
				name: SITE_TITLE,
				alternateName: SITE_FULL_TITLE,
				description,
				url: String(url),
				inLanguage: lang,
				author: { '@id': author['@id'] },
				publisher: { '@id': author['@id'] },
			},
			author,
		],
	};
}

/** JSON for a `<script type="application/ld+json">`: `<` is escaped, so no value can close the script. */
export function serializeJsonLd(data: unknown): string {
	return JSON.stringify(data).replace(/</g, '\\u003c');
}
