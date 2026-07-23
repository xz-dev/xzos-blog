import { getCollection } from 'astro:content';
import { renderOgImage } from '../../lib/og-image';
import {
	buildPostOgStaticPaths,
	getOgLocaleLabel,
	type BlogCollectionName,
	type BlogLang,
} from '../../lib/social-preview';

export async function getStaticPaths() {
	return buildPostOgStaticPaths((collection: BlogCollectionName) => getCollection(collection));
}

export async function GET({
	props,
}: {
	props: {
		post: { data: { title: string; category?: string } };
		lang: BlogLang;
	};
}) {
	const { post, lang } = props;
	const png = await renderOgImage({
		title: post.data.title,
		brand: 'xzOS / BLOG',
		footer: `${post.data.category || 'BLOG'} / ${getOgLocaleLabel(lang)}`,
	});

	return new Response(png as unknown as BodyInit, {
		headers: { 'Content-Type': 'image/png' },
	});
}
