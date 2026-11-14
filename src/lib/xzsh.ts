/**
 * xzsh: the home page's mini shell. Pure functions only: `run` turns one
 * input line into output lines and at most one action, which the page
 * (term/Shell.astro) draws and performs. No network, no eval.
 */
import { formatUptime } from './uptime.ts';

/** One cell of a two-column output list (term/OutputList.astro and the shell's `draw`). */
export interface Cell {
	text: string;
	href?: string;
	/** An external link, opened in a new tab. */
	external?: boolean;
	/** Rendered as <time datetime>. */
	datetime?: string;
}

export type Line =
	| { type: 'text'; text: string; /** Drawn in the error colour (--error). */ error?: true }
	| { type: 'rows'; rows: { left: Cell; right: Cell }[] }
	| { type: 'link'; text: string; href: string };

export type Theme = 'day' | 'night';

export type Action = { type: 'navigate'; href: string } | { type: 'theme'; theme: Theme } | { type: 'clear' };

export interface Result {
	lines: Line[];
	action?: Action;
}

/** Built into the page by the server; every string is already localised. */
export interface ShellData {
	lang: string;
	/** Locale → home path, in the order the home page lists them. */
	homes: Record<string, string>;
	blog: string;
	about: string;
	links: string;
	host: string;
	since: string;
	/** Newest first, at most LS_ALL. */
	posts: { date: string; datetime: string; title: string; href: string }[];
	allPosts: string;
	/** Command name → description, for `help`. */
	help: Record<string, string>;
	/** One line on the editing keys, printed under `help`. */
	keys: string;
}

export interface Env {
	now: number;
	theme: Theme;
}

export const LS = 5;
export const LS_ALL = 10;

export const COMMANDS = ['cat', 'cd', 'clear', 'date', 'help', 'lang', 'ls', 'theme', 'uname', 'uptime', 'whoami'] as const;

const text = (value: string): Line => ({ type: 'text', text: value });
const out = (...values: string[]): Result => ({ lines: values.map(text) });
const fail = (value: string): Result => ({ lines: [{ type: 'text', text: value, error: true }] });
const go = (href: string): Result => ({ lines: [], action: { type: 'navigate', href } });

/** `~/blog/`, `blog` and `./blog` name the same place; `~` and `/` are home. */
const place = (arg = '~') =>
	arg
		.replace(/^(?:~|\.)?\/?/, '')
		.replace(/\/+$/, '')
		.replace(/\.md$/, '') || '~';

function help(data: ShellData): Result {
	const usage: Record<string, string> = {
		help: 'help',
		ls: 'ls [-a]',
		cat: 'cat about',
		cd: 'cd blog|links|~',
		theme: 'theme [day|night]',
		lang: `lang ${Object.keys(data.homes).join('|')}`,
		whoami: 'whoami',
		uname: 'uname -a',
		date: 'date',
		uptime: 'uptime',
		clear: 'clear',
	};
	const rows = Object.entries(usage).map(([name, synopsis]) => ({ left: { text: synopsis }, right: { text: data.help[name] ?? '' } }));
	return { lines: [{ type: 'rows', rows }, text(data.keys)] };
}

function ls(args: string[], data: ShellData): Result {
	const paths = args.filter((arg) => !arg.startsWith('-'));
	for (const path of paths) {
		if (!['~', 'blog'].includes(place(path))) return out(`ls: cannot access '${path}': No such file or directory`);
	}
	const all = args.some((arg) => /^-[a-z]*a/.test(arg)) || paths.some((path) => place(path) === 'blog');
	const rows = data.posts.slice(0, all ? LS_ALL : LS).map((post) => ({
		left: { text: post.date, datetime: post.datetime },
		right: { text: post.title, href: post.href },
	}));
	const lines: Line[] = [{ type: 'rows', rows }];
	if (all) lines.push({ type: 'link', text: data.allPosts, href: data.blog });
	return { lines };
}

function cd(arg: string | undefined, data: ShellData): Result {
	const target = place(arg);
	if (target === '~') return go(data.homes[data.lang]);
	if (target === 'blog') return go(data.blog);
	if (target === 'about') return go(data.about);
	if (['links', 'friends', 'link-exchange'].includes(target)) return go(data.links);
	return out(`cd: no such file or directory: ${arg}`);
}

/** Like `date`: the local time without the browser's zone name. */
export function formatDate(now: number): string {
	return new Date(now).toString().replace(/\s*\(.*\)$/, '');
}

export function parse(input: string): string[] {
	return input.trim().split(/\s+/).filter(Boolean);
}

export function run(input: string, data: ShellData, env: Env): Result {
	const [name, ...args] = parse(input);
	switch (name) {
		case undefined:
			return { lines: [] };
		case 'help':
			return help(data);
		case 'ls':
			return ls(args, data);
		case 'cat':
			if (!args.length) return out('usage: cat about');
			return place(args[0]) === 'about' ? go(data.about) : out(`cat: ${args[0]}: No such file or directory`);
		case 'cd':
			return cd(args[0], data);
		case 'theme': {
			const [arg] = args;
			if (arg && arg !== 'day' && arg !== 'night') return out('usage: theme [day|night]');
			const theme: Theme = (arg as Theme | undefined) ?? (env.theme === 'day' ? 'night' : 'day');
			return { lines: [text(`theme: ${theme}`)], action: { type: 'theme', theme } };
		}
		case 'lang': {
			const locales = Object.keys(data.homes);
			if (!args.length) return out(`usage: lang ${locales.join('|')}`);
			const locale = locales.find((key) => key.toLowerCase() === args[0].toLowerCase());
			return locale ? go(data.homes[locale]) : out(`lang: unknown language: ${args[0]}`);
		}
		case 'whoami':
			return out('xz');
		case 'uname':
			return out(args.includes('-a') ? `xzOS xzos OpenRC ${data.host}` : 'xzOS');
		case 'date':
			return out(formatDate(env.now));
		case 'uptime':
			return out(`up ${formatUptime(data.since, env.now)}`);
		case 'clear':
			return { lines: [], action: { type: 'clear' } };
		default:
			return fail(`xzsh: command not found: ${name}`);
	}
}

/**
 * Tab completion of the command name. Null when there is nothing to complete
 * (empty input, an argument, no match), so the page lets Tab move focus.
 * A unique match is completed with a trailing space; several matches extend
 * to their common prefix, or are listed when the prefix is already typed.
 */
export function complete(input: string): { value: string; options: string[] } | null {
	const word = input.trimStart();
	if (!word || /\s/.test(word)) return null;
	const matches = COMMANDS.filter((command) => command.startsWith(word));
	if (!matches.length) return null;
	if (matches.length === 1) return { value: `${matches[0]} `, options: [] };
	let prefix = word;
	while (matches.every((command) => command.startsWith(matches[0].slice(0, prefix.length + 1))) && prefix.length < matches[0].length) {
		prefix = matches[0].slice(0, prefix.length + 1);
	}
	return { value: prefix, options: prefix === word ? matches : [] };
}
