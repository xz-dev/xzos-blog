// @ts-check

import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { defineConfig } from 'astro/config';
import buildCv from './src/integrations/build-cv';
import localized404 from './src/integrations/localized-404';
import { getCopyPaths } from './src/lib/copy-pages';
import translate from './src/integrations/translate';
import { daySyntaxTheme, nightSyntaxTheme } from './src/lib/syntax-day';
import { tableScroll } from './src/lib/table-scroll';

// Read on first use, in astro:build:done, so the files the translate step
// wrote in astro:build:start are included.
let copyPaths;
const isOutOfSitemap = (path) =>
  /\/(?:page\/1|404)\/$/.test(path) || (copyPaths ??= getCopyPaths(new URL('./src/content/', import.meta.url))).has(path);

// https://astro.build/config
export default defineConfig({
  site: 'https://xzos.net',
  integrations: [
    // Résumé PDFs are compiled from cv/*.tex before the site is emitted.
    buildCv(),
    // 翻译集成：在 build 开始前自动翻译博客文章
    // 通过本机 pi CLI 翻译（无 pi 时跳过）；可选 PI_TRANSLATE_MODEL / PI_TRANSLATE_EXTENSIONS / PI_TRANSLATE_BIN
    translate({
      // force: true,  // 强制重新翻译所有文件
      // enabled: false, // 取消注释可禁用翻译
    }),
    mdx(),
    // The sitemap lists canonical URLs only: /page/1/ redirects to /blog/
    // (public/_redirects), 404 pages are not content, and a locale's copy of
    // a root original points its canonical at the original (src/i18n/seo.ts).
    sitemap({ filter: (page) => !isOutOfSitemap(new URL(page).pathname) }),
    localized404(['en', 'zh-CN']),
  ],

  // 国际化配置
  i18n: {
    locales: ['zh', 'en', 'zh-CN'],
    defaultLocale: 'zh',
    routing: {
      prefixDefaultLocale: false, // 中文不加前缀: /blog/xxx
                                   // 英文加前缀: /en/blog/xxx
                                   // 简中加前缀: /zh-CN/blog/xxx
    },
  },

  markdown: {
    // Default processor plus a wrapper that lets wide tables scroll.
    processor: satteri({ hastPlugins: [tableScroll] }),
    shikiConfig: {
      themes: {
        light: daySyntaxTheme,
        dark: nightSyntaxTheme,
      },
    },
  },

  image: {
    // Don't optimize images during development
    service: { entrypoint: 'astro/assets/services/sharp' },
  },
});