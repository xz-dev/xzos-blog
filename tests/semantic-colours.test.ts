import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { ui } from '../src/i18n/ui.ts';
import { commandParts, splitName } from '../src/lib/term-command.ts';
import { run, type ShellData } from '../src/lib/xzsh.ts';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const tokens = read('../src/styles/tokens.css');
const terminal = read('../src/styles/terminal.css');
const block = (selector: RegExp) => tokens.match(selector)![1];
const hexTokens = (css: string) => Object.fromEntries(
	[...css.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((m) => [m[1], m[2].toLowerCase()]),
);
const themes = {
	day: hexTokens(block(/:root\s*\{([^}]+)\}/)),
	night: hexTokens(block(/:root\[data-theme="tty"\]\s*\{([^}]+)\}/)),
};

const channels = (hex: string) => hex.match(/[\da-f]{2}/gi)!.map((c) => parseInt(c, 16) / 255);
function luminance(hex: string) {
	const [r, g, b] = channels(hex).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
function contrast(a: string, b: string) {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
function hue(hex: string) {
	const [r, g, b] = channels(hex);
	const max = Math.max(r, g, b);
	const d = max - Math.min(r, g, b);
	const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
	return h * 60;
}

// Each role and the Solarized accent it is drawn from.
const roles = {
	'--term-prompt': '#859900', // green
	'--term-path': '#268bd2', // blue
	'--term-link': '#2aa198', // cyan
	'--term-date': '#b58900', // yellow
	'--term-tag': '#d33682', // magenta
	'--error': '#dc322f', // red
};

test('every semantic colour reads as text on the page and the surface in both themes', () => {
	for (const [theme, colors] of Object.entries(themes)) {
		for (const role of Object.keys(roles)) {
			assert.ok(colors[role], `${theme} defines ${role}`);
			for (const field of ['--background', '--surface']) {
				const ratio = contrast(colors[role], colors[field]);
				assert.ok(ratio >= 4.5, `${theme} ${role} on ${field}: ${ratio.toFixed(2)}`);
			}
		}
	}
});

test('semantic colours keep their Solarized hue; only the lightness moves', () => {
	for (const [theme, colors] of Object.entries(themes)) {
		for (const [role, base] of Object.entries(roles)) {
			const delta = Math.abs(hue(colors[role]) - hue(base));
			assert.ok(Math.min(delta, 360 - delta) <= 2, `${theme} ${role}: hue ${hue(colors[role]).toFixed(1)} vs ${hue(base).toFixed(1)}`);
		}
	}
});

test('terminal output draws each role from its token', () => {
	const rule = (selector: string) => {
		const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return terminal.match(new RegExp(`(?:^|\\n)[^{}]*${escaped}[^{}]*\\{([^}]*)\\}`))?.[1] ?? '';
	};
	assert.match(rule('.term-sign'), /color:\s*var\(--term-prompt\)/);
	assert.match(rule('.term-name'), /color:\s*var\(--term-prompt\)/);
	assert.match(rule('.term-path'), /color:\s*var\(--term-path\)/);
	assert.match(rule('.term-date'), /color:\s*var\(--term-date\)/);
	assert.match(rule('a.term-link'), /color:\s*var\(--term-link\)/);
	assert.match(rule('.term-text a[href^="http"]'), /color:\s*var\(--term-link\)/);

	const prompt = read('../src/components/term/Prompt.astro');
	assert.match(prompt, /<span class="term-sign">\$<\/span>/);
	assert.match(prompt, /commandParts\(command\)[\s\S]*class="term-path"/);
	const shell = read('../src/components/term/Shell.astro');
	assert.match(shell, /class="term-sign"[^>]*>\$<\/span>/);
	assert.match(shell, /node\('span', 'term-sign', '\$'\)/);
	assert.match(shell, /commandParts\(command\)/);
	assert.match(shell, /node\('time', 'term-date'/);
	const list = read('../src/components/term/OutputList.astro');
	assert.match(list, /<a class="term-link"[^>]*target="_blank"/);
	assert.match(list, /<time class="term-date"/);
	const meta = read('../src/components/PostMeta.astro');
	// The post meta line stays dim: semantic colours are for terminal output only.
	assert.doesNotMatch(meta, /--term-date|--term-tag/);
	const home = read('../src/layouts/Home.astro');
	assert.match(home, /\.fetch a\.term-link\s*\{\s*color:\s*var\(--term-link\);/);
	assert.match(home, /<a class="term-link" href=\{link\.href\} target="_blank"/);
});

test('component styles take colours from tokens, never literal hex', () => {
	const dirs = ['../src/components/', '../src/components/term/', '../src/layouts/', '../src/pages/'];
	for (const dir of dirs) {
		for (const name of readdirSync(new URL(dir, import.meta.url)).filter((file) => file.endsWith('.astro'))) {
			const source = read(dir + name);
			const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
			const attributes = [...source.matchAll(/style=(?:"[^"]*"|\{`[^`]*`\})/g)].map((m) => m[0]).join('\n');
			assert.doesNotMatch(styles + attributes, /#[\da-f]{3,8}\b/i, `${dir}${name}`);
		}
	}
});

test('prompt commands split into text and paths that join back unchanged', () => {
	const commands = [
		...new Set(Object.values(ui).flatMap((strings) => Object.entries(strings).filter(([key]) => key.startsWith('term.')).map(([, value]) => value))),
	].map((command) => command.replace('{count}', '5').replace('{file}', 'about.md'));
	assert.ok(commands.length >= 5);
	for (const command of commands) {
		const parts = commandParts(command);
		assert.equal(parts.map((part) => part.text).join(''), command);
		assert.equal(parts.filter((part) => part.path).length, 1, command);
	}
	assert.deepEqual(commandParts('ls -t ~/blog | head -5'), [{ text: 'ls -t ' }, { text: '~/blog', path: true }, { text: ' | head -5' }]);
	assert.deepEqual(commandParts('cd ~'), [{ text: 'cd ' }, { text: '~', path: true }]);
	assert.deepEqual(commandParts('ls blog'), [{ text: 'ls blog' }]);
	assert.deepEqual(commandParts(''), []);
	assert.deepEqual(splitName('ls [-a]'), ['ls', ' [-a]']);
	assert.deepEqual(splitName('help'), ['help', '']);
});

test('help marks command names and plain descriptions; ls dates stay <time> cells', () => {
	const data = {
		lang: 'en',
		homes: { en: '/en/' },
		blog: '/en/blog/',
		about: '/en/about',
		links: '/link-exchange',
		host: 'xzos.net',
		since: '2025-11-16T00:00:00+08:00',
		posts: [{ date: '2026-01-20', datetime: '2026-01-20', title: 'Post', href: '/en/blog/post/' }],
		allPosts: 'All posts',
		help: { help: 'list commands' },
		keys: 'keys',
	} satisfies ShellData;
	const help = run('help', data, { now: 0, theme: 'day' }).lines[0];
	assert.equal(help.type, 'rows');
	for (const row of help.type === 'rows' ? help.rows : []) {
		assert.equal(row.left.role, 'command');
		assert.equal(row.right.role, 'text');
	}
	const ls = run('ls', data, { now: 0, theme: 'day' }).lines[0];
	assert.equal(ls.type === 'rows' && ls.rows[0].left.datetime, '2026-01-20');
});
