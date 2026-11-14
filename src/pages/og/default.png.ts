import { getCollection } from 'astro:content';
import { renderOgImage } from '../../lib/og-image';

export async function GET() {
	const png = await renderOgImage({
		locale: 'src',
		postCount: (await getCollection('blog')).length,
	});

	return new Response(png as unknown as BodyInit, {
		headers: { 'Content-Type': 'image/png' },
	});
}
