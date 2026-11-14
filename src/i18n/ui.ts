/**
 * 多语言 UI 字符串配置
 */

export const languages = {
  zh: '源站',
  en: 'English',
  'zh-CN': '简体中文',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'zh';

/**
 * 页眉菜单，按状态栏顺序排列；每项前显示的编号就是它的下标（0:首页 1:文章 …）。
 * localized 为 true 的路径带语言前缀，友链页只有一份。
 */
export const navItems = [
  { key: 'nav.home', path: '/', localized: true },
  { key: 'nav.blog', path: '/blog', localized: true },
  { key: 'nav.about', path: '/about', localized: true },
  { key: 'nav.links', path: '/link-exchange', localized: false },
] as const;

/**
 * UI 字符串翻译
 */
export const ui = {
  zh: {
    // 导航
    'nav.home': '首页',
    'nav.blog': '文章',
    'nav.about': '关于',
    'nav.links': '友链',

    // 站点
    'site.tagline': 'For Coding Life',
    'site.logoAlt': 'xzOS 标志',

    // 博客
    'blog.heading': '文章',
    'blog.continueReading': '继续阅读 →',
    'blog.updatedOn': '更新于',
    'blog.authorLabel': '作者：',
    'blog.categoryLabel': '分类：',
    'blog.toc': '目录',

    // 语言版本提示
    'notice.translatedBefore': '本文由大语言模型译自',
    'notice.translatedLink': '中文原文',
    'notice.translatedAfter': '，可能有误，以原文为准。',
    'notice.alsoIn': '其他语言：',

    // 首页（开机画面）：fastfetch 字段名沿用终端里的英文
    'home.logoAlt': 'xzOS 标志：16 段短线围成的圆环，以字符画绘制并缓慢旋转',
    'home.pause': '暂停',
    'home.pauseLabel': '暂停动画',
    'home.os': 'OS',
    'home.init': 'Init',
    'home.host': 'Host',
    'home.uptime': 'Uptime',
    'home.posts': 'Posts',
    'home.lang': 'Lang',
    'home.links': 'Links',
    'home.recent': '最近文章',
    'home.allPosts': '→ 全部文章',

    // 终端提示符（命令按原样显示，三种语言相同）
    'term.recent': 'ls -t ~/blog | head -{count}',
    'term.cat': 'cat ~/{file}',
    'term.friends': 'ls ~/friends',

    // 分页
    'pagination.label': '分页',
    'pagination.prev': '← 上一页',
    'pagination.next': '下一页 →',
    'pagination.pageTitle': '{title} - 第{page}页',

    // 页眉与页脚
    'lang.switch': '切换语言',
    'lang.prefix': 'lang:',
    'theme.toggle': '夜间模式',
    'social.mastodon': '在 Mastodon 上关注',
    'social.github': '前往 GitHub',
    'social.stackOverflow': 'Stack Overflow 主页',
    'footer.source': '源代码',

    // 正文
    'links.description': 'xzOS 的友情链接页面',
    'table.label': '表格',

    // 错误页面：只有源站一份。静态构建只产出一个 /404.html，
    // 所有语言前缀下的缺失地址都由它应答，因此 error.* 不做翻译。
    'error.pageNotFound': '页面未找到',
    'error.description': '您访问的页面不存在。',
    'error.message': '抱歉，我们找不到您要访问的页面。',
    'error.backHome': '返回首页',
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.blog': 'Posts',
    'nav.about': 'About',
    'nav.links': 'Links',

    // Site
    'site.tagline': 'For Coding Life',
    'site.logoAlt': 'xzOS logo',

    // Blog
    'blog.heading': 'Posts',
    'blog.continueReading': 'Read more →',
    'blog.updatedOn': 'Updated on',
    'blog.authorLabel': 'Author: ',
    'blog.categoryLabel': 'Category: ',
    'blog.toc': 'Table of Contents',

    // Language notices
    'notice.translatedBefore': 'Machine-translated from the ',
    'notice.translatedLink': 'Chinese original',
    'notice.translatedAfter': '; it may contain errors.',
    'notice.alsoIn': 'Also in: ',

    // Home page (boot screen); fastfetch field names stay as in the terminal
    'home.logoAlt': 'The xzOS logo, a ring of 16 dashes, slowly turning in ASCII art',
    'home.pause': 'pause',
    'home.pauseLabel': 'Pause animation',
    'home.os': 'OS',
    'home.init': 'Init',
    'home.host': 'Host',
    'home.uptime': 'Uptime',
    'home.posts': 'Posts',
    'home.lang': 'Lang',
    'home.links': 'Links',
    'home.recent': 'Recent posts',
    'home.allPosts': '→ All posts',

    // Terminal prompts (commands shown verbatim, the same in every locale)
    'term.recent': 'ls -t ~/blog | head -{count}',
    'term.cat': 'cat ~/{file}',
    'term.friends': 'ls ~/friends',

    // Pagination
    'pagination.label': 'Pagination',
    'pagination.prev': '← Previous',
    'pagination.next': 'Next →',
    'pagination.pageTitle': '{title} - Page {page}',

    // Header and footer
    'lang.switch': 'Switch language',
    'lang.prefix': 'lang:',
    'theme.toggle': 'Night mode',
    'social.mastodon': 'Follow on Mastodon',
    'social.github': 'Go to GitHub',
    'social.stackOverflow': 'Stack Overflow Profile',
    'footer.source': 'Source',

    // Content
    'links.description': 'Links to friends of xzOS',
    'table.label': 'Table',
  },
  'zh-CN': {
    // 导航
    'nav.home': '首页',
    'nav.blog': '文章',
    'nav.about': '关于',
    'nav.links': '友链',

    // 站点
    'site.tagline': 'For Coding Life',
    'site.logoAlt': 'xzOS 标志',

    // 博客
    'blog.heading': '文章',
    'blog.continueReading': '继续阅读 →',
    'blog.updatedOn': '更新于',
    'blog.authorLabel': '作者：',
    'blog.categoryLabel': '分类：',
    'blog.toc': '目录',

    // 语言版本提示
    'notice.translatedBefore': '本文由大语言模型译自',
    'notice.translatedLink': '中文原文',
    'notice.translatedAfter': '，可能有误，以原文为准。',
    'notice.alsoIn': '其他语言：',

    // 首页（开机画面）：fastfetch 字段名沿用终端里的英文
    'home.logoAlt': 'xzOS 标志：16 段短线围成的圆环，以字符画绘制并缓慢旋转',
    'home.pause': '暂停',
    'home.pauseLabel': '暂停动画',
    'home.os': 'OS',
    'home.init': 'Init',
    'home.host': 'Host',
    'home.uptime': 'Uptime',
    'home.posts': 'Posts',
    'home.lang': 'Lang',
    'home.links': 'Links',
    'home.recent': '最近文章',
    'home.allPosts': '→ 全部文章',

    // 终端提示符（命令按原样显示，三种语言相同）
    'term.recent': 'ls -t ~/blog | head -{count}',
    'term.cat': 'cat ~/{file}',
    'term.friends': 'ls ~/friends',

    // 分页
    'pagination.label': '分页',
    'pagination.prev': '← 上一页',
    'pagination.next': '下一页 →',
    'pagination.pageTitle': '{title} - 第{page}页',

    // 页眉与页脚
    'lang.switch': '切换语言',
    'lang.prefix': 'lang:',
    'theme.toggle': '夜间模式',
    'social.mastodon': '在 Mastodon 上关注',
    'social.github': '前往 GitHub',
    'social.stackOverflow': 'Stack Overflow 主页',
    'footer.source': '源代码',

    // 正文
    'links.description': 'xzOS 的友情链接页面',
    'table.label': '表格',
  },
} as const;

export type UIKey = keyof typeof ui.zh;
