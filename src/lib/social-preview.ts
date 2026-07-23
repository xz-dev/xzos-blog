import { getBlogCollection, nonDefaultLocales } from '../i18n/collections.ts';
import { defaultLang, type Lang } from '../i18n/ui.ts';

export type BlogLang = Lang;
export type BlogCollectionName = 'blog' | 'blog-en' | 'blog-zh-CN';

const localizedCollections = [defaultLang, ...nonDefaultLocales].map((lang) => ({
	lang,
	collection: getBlogCollection(lang) as BlogCollectionName,
	pathPrefix: lang === defaultLang ? '' : `${lang}/`,
}));

export type SocialImageMetadata = {
	src: string;
	width: number;
	height: number;
	format: string;
};

export type KnownSocialImageMetadata = {
	width: number;
	height: number;
	type: string;
};

type SocialPreviewPost<HeroImage = unknown> = {
	id: string;
	data: {
		title?: string;
		category?: string;
		heroImage?: HeroImage;
	};
	body?: string;
};

export function getPostOgImagePath(id: string, lang: BlogLang): string {
	const locale = localizedCollections.find((candidate) => candidate.lang === lang)!;
	return `/og/${locale.pathPrefix}${id}.png`;
}

export function selectPostSocialImage<HeroImage>(
	post: SocialPreviewPost<HeroImage>,
	lang: BlogLang,
): HeroImage | string {
	return post.data.heroImage ?? getPostOgImagePath(post.id, lang);
}

export function getKnownSocialImageMetadata(
	image: SocialImageMetadata | string,
): KnownSocialImageMetadata | undefined {
	if (typeof image !== 'string') {
		const format = image.format === 'jpg' ? 'jpeg' : image.format;
		const type = format === 'svg' ? 'image/svg+xml' : `image/${format}`;
		return { width: image.width, height: image.height, type };
	}

	if (image.startsWith('/og/') && image.endsWith('.png')) {
		return { width: 1200, height: 630, type: 'image/png' };
	}

	return undefined;
}

export async function buildPostOgStaticPaths<Post extends SocialPreviewPost>(
	loadCollection: (collection: BlogCollectionName) => Promise<readonly Post[]>,
) {
	const paths: Array<{
		params: { slug: string };
		props: { post: Post; lang: BlogLang };
	}> = [];

	for (const locale of localizedCollections) {
		const posts = await loadCollection(locale.collection);
		for (const post of posts) {
			paths.push({
				params: { slug: `${locale.pathPrefix}${post.id}` },
				props: { post, lang: locale.lang },
			});
		}
	}

	return paths;
}

export function getOgLocaleLabel(lang: BlogLang): string {
	return lang === 'zh-CN' ? 'ZH-CN' : lang.toUpperCase();
}
