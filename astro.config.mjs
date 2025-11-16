// @ts-check

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://xzos.net',
  integrations: [mdx(), sitemap()],

  markdown: {
      shikiConfig: {
          theme: 'github-dark',
      },
	},

  image: {
      // Don't optimize images during development
      service: { entrypoint: 'astro/assets/services/sharp' },
	},
});