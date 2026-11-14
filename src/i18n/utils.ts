/**
 * i18n 工具函数
 */
import { ui, defaultLang, type Lang, type UIKey } from './ui.ts';
import { getPageLocales, localizePath, splitLocalePath } from './seo.ts';

/**
 * 从 URL 获取当前语言
 */
export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) {
    return lang as Lang;
  }
  return defaultLang;
}

/**
 * 获取翻译函数
 */
export function useTranslations(lang: Lang) {
  return function t(key: UIKey, params?: Record<string, string | number>): string {
    // A locale's table is read as partial and falls back to the default.
    const strings: Partial<Record<UIKey, string>> = ui[lang];
    let text: string = strings[key] ?? ui[defaultLang][key];
    
    // 替换参数 {param}
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    
    return text;
  };
}

/**
 * 是否为机器翻译：非默认语言且不是原文副本（is_copy）。
 * zh-CN 的中文副本与 en 下的英文原文副本都不是译文。
 */
export function isMachineTranslation(lang: Lang, data: { is_copy?: boolean } | undefined): boolean {
  return lang !== defaultLang && Boolean(data) && !data!.is_copy;
}

/**
 * 导航所属栏目：去掉语言前缀与尾部斜杠后的第一段路径。
 * 首页列表的分页（/page/N）属于首页。
 */
export function getNavSection(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  if (segments[0] && segments[0] !== defaultLang && segments[0] in ui) segments.shift();
  const first = segments[0] ?? '';
  return first === 'page' ? '/' : `/${first}`;
}

/**
 * 导航链接的当前状态：同一地址为 page，同一栏目为 true（如文章页的“文章”）。
 */
export function getNavCurrent(pathname: string, href: string): 'page' | 'true' | undefined {
  const trim = (path: string) => path.replace(/\/+$/, '') || '/';
  if (trim(pathname) === trim(href)) return 'page';
  return getNavSection(pathname) === getNavSection(href) ? 'true' : undefined;
}

/**
 * 获取翻译后的路径（带尾部斜杠）
 * 中文（默认语言）不加前缀，其他语言加前缀
 */
export function useTranslatedPath(lang: Lang) {
  return function translatePath(path: string, targetLang: Lang = lang): string {
    return localizePath(targetLang, path);
  };
}

/**
 * 获取当前页面的其他语言版本路径（带尾部斜杠）。
 * 只有源站一份的页面（友链）和 404 页切换到其他语言时跳转到该语言的首页。
 */
export function getAlternateLanguagePath(url: URL, targetLang: Lang): string {
  const { path } = splitLocalePath(url.pathname);
  const exists = path !== '/404/' && getPageLocales(path).includes(targetLang);
  return localizePath(targetLang, exists ? path : '/');
}

/**
 * 获取博客文章的语言版本
 */
export function getBlogPostPath(slug: string, lang: Lang): string {
  return localizePath(lang, `/blog/${slug}/`);
}
