/**
 * 语言到 content collection 名称的映射
 */
import { defaultLang, type Lang } from './ui';

/** 非默认语言列表 — [lang] 动态路由的单一来源 */
export const nonDefaultLocales: Lang[] = ['en', 'zh-CN'];

/** 获取博客 collection 名称 */
export function getBlogCollection(lang: Lang): string {
	if (lang === defaultLang) return 'blog';
	return `blog-${lang}`;
}

/** 获取页面 collection 名称 */
export function getPagesCollection(lang: Lang): string {
	if (lang === defaultLang) return 'pages';
	return `pages-${lang}`;
}

/** 获取 HTML lang 属性值 */
export function getHtmlLang(lang: Lang): string {
	// 'zh' 在 HTML 中应使用 'zh-CN'
	if (lang === 'zh') return 'zh-CN';
	return lang;
}

/** 获取博客文章链接前缀 */
export function getBlogPrefix(lang: Lang): string {
	if (lang === defaultLang) return '/blog';
	return `/${lang}/blog`;
}

/** 获取分页链接前缀 */
export function getPagePrefix(lang: Lang): string {
	if (lang === defaultLang) return '/page';
	return `/${lang}/page`;
}

/** 获取首页路径 */
export function getHomePath(lang: Lang): string {
	if (lang === defaultLang) return '/';
	return `/${lang}/`;
}
