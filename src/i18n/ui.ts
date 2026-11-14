/**
 * 多语言 UI 字符串配置
 */

export const languages = {
  zh: '源站',
  en: 'English',
  'zh-CN': '简体中文',
} as const;

/** The code shown in the status line and accepted by the shell. The root
 * locale holds each post in the language it was written in (mostly Chinese,
 * some English), so it is `src`, not `zh`. */
export const langCodes = {
  zh: 'src',
  en: 'en',
  'zh-CN': 'zh-CN',
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
    'blog.comments': '评论',

    // 语言版本提示
    'notice.translatedBefore': '本文由大语言模型译自',
    'notice.translatedLink': '中文原文',
    'notice.translatedAfter': '，可能有误，以原文为准。',
    'notice.alsoIn': '其他语言：',

    // 首页（开机画面）：fastfetch 字段名沿用终端里的英文
    'home.logoAlt': 'xzOS 标志：16 段短线围成的圆环，以字符画绘制并缓慢旋转',
    'home.pause': '暂停',
    'home.pauseLabel': '暂停动画',
    'home.themeCurrent': '（当前）',
    'home.packages': '{count} (文章)',
    'home.recent': '最近文章',
    'home.allPosts': '→ 全部文章',

    // 终端提示符（命令按原样显示，三种语言相同）
    'term.recent': 'ls -t ~/blog | head -{count}',
    'term.cat': 'cat ~/{file}',
    'term.friends': 'ls ~/friends',
    'term.communities': 'ls ~/communities',
    'term.comments': 'tail -f ~/comments',

    // 首页命令行（xzsh）：命令名保留英文
    'shell.label': 'xzOS 命令行',
    'shell.hint': '输入 help 查看命令',
    'shell.keys': 'Tab 补全命令，↑↓ 翻阅历史，Ctrl+L 清屏，Esc 清空本行',
    'shell.help.help': '列出命令',
    'shell.help.ls': '最近文章；-a 列出十篇',
    'shell.help.cat': '打开关于页',
    'shell.help.cd': '前往文章、友链或首页',
    'shell.help.theme': '切换日间或夜间主题',
    'shell.help.lang': '切换语言',
    'shell.help.whoami': '显示当前用户',
    'shell.help.uname': '显示系统信息',
    'shell.help.date': '显示当前日期与时间',
    'shell.help.uptime': '显示运行时长',
    'shell.help.clear': '清屏',

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
    'links.friends': '朋友',
    'links.communities': '社群',
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
    'blog.comments': 'Comments',

    // Language notices
    'notice.translatedBefore': 'Machine-translated from the ',
    'notice.translatedLink': 'Chinese original',
    'notice.translatedAfter': '; it may contain errors.',
    'notice.alsoIn': 'Also in: ',

    // Home page (boot screen); fastfetch field names stay as in the terminal
    'home.logoAlt': 'The xzOS logo, a ring of 16 dashes, slowly turning in ASCII art',
    'home.pause': 'pause',
    'home.pauseLabel': 'Pause animation',
    'home.themeCurrent': '(current)',
    'home.packages': '{count} (posts)',
    'home.recent': 'Recent posts',
    'home.allPosts': '→ All posts',

    // Terminal prompts (commands shown verbatim, the same in every locale)
    'term.recent': 'ls -t ~/blog | head -{count}',
    'term.cat': 'cat ~/{file}',
    'term.friends': 'ls ~/friends',
    'term.communities': 'ls ~/communities',
    'term.comments': 'tail -f ~/comments',

    // Home page shell (xzsh): command names stay English
    'shell.label': 'xzOS shell',
    'shell.hint': 'Type help to list commands',
    'shell.keys': 'Tab completes, ↑↓ browse history, Ctrl+L clears the screen, Esc clears the line',
    'shell.help.help': 'list commands',
    'shell.help.ls': 'latest posts; -a lists ten',
    'shell.help.cat': 'open the about page',
    'shell.help.cd': 'go to posts, links or home',
    'shell.help.theme': 'switch to the day or night theme',
    'shell.help.lang': 'switch language',
    'shell.help.whoami': 'print the user',
    'shell.help.uname': 'print system information',
    'shell.help.date': 'print the date and time',
    'shell.help.uptime': 'print how long xzOS has been up',
    'shell.help.clear': 'clear the screen',

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
    'links.friends': 'Friends',
    'links.communities': 'Communities',
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
    'blog.comments': '评论',

    // 语言版本提示
    'notice.translatedBefore': '本文由大语言模型译自',
    'notice.translatedLink': '中文原文',
    'notice.translatedAfter': '，可能有误，以原文为准。',
    'notice.alsoIn': '其他语言：',

    // 首页（开机画面）：fastfetch 字段名沿用终端里的英文
    'home.logoAlt': 'xzOS 标志：16 段短线围成的圆环，以字符画绘制并缓慢旋转',
    'home.pause': '暂停',
    'home.pauseLabel': '暂停动画',
    'home.themeCurrent': '（当前）',
    'home.packages': '{count} (文章)',
    'home.recent': '最近文章',
    'home.allPosts': '→ 全部文章',

    // 终端提示符（命令按原样显示，三种语言相同）
    'term.recent': 'ls -t ~/blog | head -{count}',
    'term.cat': 'cat ~/{file}',
    'term.friends': 'ls ~/friends',
    'term.communities': 'ls ~/communities',
    'term.comments': 'tail -f ~/comments',

    // 首页命令行（xzsh）：命令名保留英文
    'shell.label': 'xzOS 命令行',
    'shell.hint': '输入 help 查看命令',
    'shell.keys': 'Tab 补全命令，↑↓ 翻阅历史，Ctrl+L 清屏，Esc 清空本行',
    'shell.help.help': '列出命令',
    'shell.help.ls': '最近文章；-a 列出十篇',
    'shell.help.cat': '打开关于页',
    'shell.help.cd': '前往文章、友链或首页',
    'shell.help.theme': '切换日间或夜间主题',
    'shell.help.lang': '切换语言',
    'shell.help.whoami': '显示当前用户',
    'shell.help.uname': '显示系统信息',
    'shell.help.date': '显示当前日期与时间',
    'shell.help.uptime': '显示运行时长',
    'shell.help.clear': '清屏',

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
    'links.friends': '朋友',
    'links.communities': '社群',
    'table.label': '表格',
  },
} as const;

export type UIKey = keyof typeof ui.zh;
