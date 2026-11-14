import { existsSync } from 'node:fs';
import { rename, rmdir } from 'node:fs/promises';
import type { AstroIntegration } from 'astro';

/**
 * Astro writes only /404 as 404.html; a localized /en/404 becomes
 * /en/404/index.html. Cloudflare Pages looks for the 404.html nearest to a
 * missing address, so move each locale's page to <locale>/404.html.
 */
export default function localized404(locales: readonly string[]): AstroIntegration {
	return {
		name: 'localized-404',
		hooks: {
			'astro:build:done': async ({ dir, logger }) => {
				for (const locale of locales) {
					const folder = new URL(`${locale}/404/`, dir);
					const page = new URL('index.html', folder);
					if (!existsSync(page)) continue;
					await rename(page, new URL(`${locale}/404.html`, dir));
					await rmdir(folder);
					logger.info(`${locale}/404/index.html -> ${locale}/404.html`);
				}
			},
		},
	};
}
