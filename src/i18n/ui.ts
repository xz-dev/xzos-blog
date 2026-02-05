/**
 * 多语言 UI 字符串配置
 */

export const languages = {
  zh: '中文',
  en: 'English',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'zh';

/**
 * UI 字符串翻译
 */
export const ui = {
  zh: {
    // 导航
    'nav.home': '首页',
    'nav.blog': '博客',
    'nav.about': '关于',
    'nav.links': '友链',
    
    // 站点信息
    'site.title': 'xzOS',
    'site.description': "xzOS - xzdev's blog",
    
    // 博客
    'blog.readMore': '阅读全文',
    'blog.publishedOn': '发布于',
    'blog.updatedOn': '更新于',
    'blog.author': '作者',
    'blog.toc': '目录',
    'blog.backToBlog': '返回博客',
    
    // 分页
    'pagination.prev': '上一页',
    'pagination.next': '下一页',
    'pagination.page': '第 {page} 页',
    
    // 页脚
    'footer.copyright': '版权所有',
    
    // 语言切换
    'lang.switch': '切换语言',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.blog': 'Blog',
    'nav.about': 'About',
    'nav.links': 'Links',
    
    // Site info
    'site.title': 'xzOS',
    'site.description': "xzOS - xzdev's blog",
    
    // Blog
    'blog.readMore': 'Read more',
    'blog.publishedOn': 'Published on',
    'blog.updatedOn': 'Updated on',
    'blog.author': 'Author',
    'blog.toc': 'Table of Contents',
    'blog.backToBlog': 'Back to Blog',
    
    // Pagination
    'pagination.prev': 'Previous',
    'pagination.next': 'Next',
    'pagination.page': 'Page {page}',
    
    // Footer
    'footer.copyright': 'All rights reserved',
    
    // Language switch
    'lang.switch': 'Switch language',
  },
} as const;

export type UIKey = keyof typeof ui.zh;
