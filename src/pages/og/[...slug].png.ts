import { getCollection } from 'astro:content';
import { formatPostDate } from '../../lib/post-date';
import { renderOgImage } from '../../lib/og-image';
import {
	buildPostOgStaticPaths,
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
		post: { id: string; data: { title: string; category?: string; pubDate: Date; pubDateSource?: string } };
		lang: BlogLang;
	};
}) {
	const { post, lang } = props;
	const png = await renderOgImage({
		title: post.data.title,
		slug: post.id,
		date: formatPostDate(post.data.pubDate, post.data.pubDateSource).text.split(' ')[0],
		category: post.data.category,
		locale: lang === 'zh' ? 'src' : lang,
	});

	return new Response(png as unknown as BodyInit, {
		headers: { 'Content-Type': 'image/png' },
	});
}
