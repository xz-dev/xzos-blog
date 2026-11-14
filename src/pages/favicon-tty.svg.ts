import type { APIRoute } from 'astro';
import { renderPixelIconSvg } from '../lib/pixel-icons.ts';
import tty from '../../docs/theme/tty-dark.json' with { type: 'json' };

export const prerender = true;

// A favicon has no parent text color; give the same currentColor grid the
// theme's emitted-line color from the night palette record (tokens.css holds
// the same value; tests keep the two equal). No background, filters or
// separate raster asset.
export const GET: APIRoute = () => new Response(renderPixelIconSvg('logo', tty.palette['--foreground']), {
	headers: {
		'Content-Type': 'image/svg+xml; charset=utf-8',
		'Cache-Control': 'public, max-age=86400',
	},
});
