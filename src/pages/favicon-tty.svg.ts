import type { APIRoute } from 'astro';
import { renderPixelIconSvg } from '../lib/pixel-icons.ts';

export const prerender = true;

// A favicon has no parent text color; give the same currentColor grid the
// theme's emitted-line color. No background, filters or separate raster asset.
export const GET: APIRoute = () => new Response(renderPixelIconSvg('logo', '#31fea8'), {
	headers: {
		'Content-Type': 'image/svg+xml; charset=utf-8',
		'Cache-Control': 'public, max-age=86400',
	},
});
