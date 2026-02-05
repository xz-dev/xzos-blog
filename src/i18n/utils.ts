/**
 * i18n 工具函数
 */
import { ui, defaultLang, type Lang, type UIKey } from './ui';

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
    let text: string = ui[lang][key] ?? ui[defaultLang][key];
    
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
 * 获取翻译后的路径
 * 中文（默认语言）不加前缀，其他语言加前缀
 */
export function useTranslatedPath(lang: Lang) {
  return function translatePath(path: string, targetLang: Lang = lang): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    if (targetLang === defaultLang) {
      // 默认语言不加前缀
      return normalizedPath;
    }
    
    // 其他语言加前缀
    return `/${targetLang}${normalizedPath}`;
  };
}

/**
 * 不支持多语言的页面路径（这些页面只有中文版）
 * 切换语言时，这些页面会跳转到对应语言的首页
 */
const SHARED_PAGES = ['/link-exchange'];

/**
 * 检查路径是否为共享页面（不支持翻译的页面）
 */
function isSharedPage(path: string): boolean {
  // 移除尾部斜杠进行比较
  const normalizedPath = path.replace(/\/$/, '') || '/';
  return SHARED_PAGES.some(p => normalizedPath === p || normalizedPath === `/en${p}`);
}

/**
 * 获取当前页面的其他语言版本路径
 */
export function getAlternateLanguagePath(url: URL, targetLang: Lang): string {
  const currentLang = getLangFromUrl(url);
  let path = url.pathname;
  
  // 移除当前语言前缀（如果有）
  if (currentLang !== defaultLang) {
    path = path.replace(`/${currentLang}`, '') || '/';
  }
  
  // 对于共享页面，切换语言时跳转到对应语言的首页
  if (isSharedPage(path)) {
    return targetLang === defaultLang ? '/' : `/${targetLang}/`;
  }
  
  // 添加目标语言前缀（如果不是默认语言）
  if (targetLang !== defaultLang) {
    return `/${targetLang}${path}`;
  }
  
  return path;
}

/**
 * 获取博客文章的语言版本
 */
export function getBlogPostPath(slug: string, lang: Lang): string {
  const basePath = `/blog/${slug}`;
  
  if (lang === defaultLang) {
    return basePath;
  }
  
  return `/${lang}${basePath}`;
}
