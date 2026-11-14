// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = 'xzOS';
export const SITE_FULL_TITLE = 'xzOS - For Coding Life';
export const SITE_DESCRIPTION = "xzOS - xzdev's blog home";

// Home page boot screen (layouts/Home.astro).
export const SITE_HOST = 'xzos.net';
/** The day xzOS went up; the home page reports it as the uptime. */
export const SITE_SINCE = '2025-11-16';

/** Social profiles, linked from the header, the footer and the home page. */
export const SOCIAL_LINKS = {
	mastodon: 'https://fosstodon.org/@xzdev',
	github: 'https://github.com/xz-dev',
	stackOverflow: 'https://stackoverflow.com/users/15715806/inkflaw',
} as const;
