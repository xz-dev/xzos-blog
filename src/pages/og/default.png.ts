import { SITE_DESCRIPTION, SITE_TITLE } from '../../consts';
import { renderOgImage } from '../../lib/og-image';

export async function GET() {
	const png = await renderOgImage({
		title: SITE_TITLE,
		brand: 'xzOS / BLOG',
		footer: SITE_DESCRIPTION,
	});

	return new Response(png as unknown as BodyInit, {
		headers: { 'Content-Type': 'image/png' },
	});
}
