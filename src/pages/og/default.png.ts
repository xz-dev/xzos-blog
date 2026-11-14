import { getCollection } from 'astro:content';
import { SITE_TITLE } from '../../consts';
import { renderOgImage } from '../../lib/og-image';

export async function GET() {
	const png = await renderOgImage({
		title: SITE_TITLE,
		locale: 'src',
		postCount: (await getCollection('blog')).length,
	});

	return new Response(png as unknown as BodyInit, {
		headers: { 'Content-Type': 'image/png' },
	});
}
