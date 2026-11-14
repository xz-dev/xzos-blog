import assert from 'node:assert/strict';
import test from 'node:test';
import { complete, run, type ShellData } from '../src/lib/xzsh.ts';

const posts = Array.from({ length: 12 }, (_, i) => ({
	date: `2026-01-${String(20 - i).padStart(2, '0')}`,
	datetime: `2026-01-${String(20 - i).padStart(2, '0')}`,
	title: `Post ${i}`,
	href: `/en/blog/post-${i}/`,
}));
const data: ShellData = {
	lang: 'en',
	homes: { src: '/', en: '/en/', 'zh-CN': '/zh-CN/' },
	blog: '/en/blog/',
	about: '/en/about',
	links: '/link-exchange',
	host: 'xzos.net',
	since: '2025-11-16T00:00:00+08:00',
	posts: posts.slice(0, 10),
	allPosts: 'All posts',
	help: { help: 'list commands', ls: 'recent posts' },
	keys: 'Tab completes',
};
const env = { now: Date.parse('2026-11-15T04:12:00+08:00'), theme: 'day' as const };
const texts = (input: string) => run(input, data, env).lines.map((line) => (line.type === 'rows' ? null : line.text));

test('help lists every command with its description, then the keys', () => {
	const [rows, keys] = run('help', data, env).lines;
	assert.equal(rows.type, 'rows');
	const left = rows.type === 'rows' ? rows.rows.map((row) => row.left.text) : [];
	assert.deepEqual(left.map((synopsis) => synopsis.split(' ')[0]), ['help', 'ls', 'cat', 'cd', 'theme', 'lang', 'whoami', 'uname', 'date', 'uptime', 'clear']);
	assert.ok(left.includes('lang src|en|zh-CN'));
	assert.equal(rows.type === 'rows' && rows.rows[1].right.text, 'recent posts');
	assert.deepEqual(keys, { type: 'text', text: 'Tab completes' });
});

test('an unknown command is reported like a shell', () => {
	assert.deepEqual(run('rm -rf /', data, env).lines, [{ type: 'text', text: 'xzsh: command not found: rm', error: true }]);
	assert.deepEqual(run('   ', data, env), { lines: [] });
});

test('ls prints the latest five posts; -a and ~/blog print ten and link the rest', () => {
	const [rows, ...rest] = run('ls', data, env).lines;
	assert.equal(rows.type === 'rows' && rows.rows.length, 5);
	assert.deepEqual(rows.type === 'rows' && rows.rows[0], {
		left: { text: '2026-01-20', datetime: '2026-01-20' },
		right: { text: 'Post 0', href: '/en/blog/post-0/' },
	});
	assert.deepEqual(rest, []);
	for (const input of ['ls -a', 'ls -la', 'ls ~/blog', 'ls blog/']) {
		const [all, link] = run(input, data, env).lines;
		assert.equal(all.type === 'rows' && all.rows.length, 10, input);
		assert.deepEqual(link, { type: 'link', text: 'All posts', href: '/en/blog/' }, input);
	}
	assert.deepEqual(texts('ls /etc'), ["ls: cannot access '/etc': No such file or directory"]);
});

test('theme toggles without an argument and sets day or night with one', () => {
	assert.deepEqual(run('theme', data, env), { lines: [{ type: 'text', text: 'theme: night' }], action: { type: 'theme', theme: 'night' } });
	assert.deepEqual(run('theme', data, { ...env, theme: 'night' }).action, { type: 'theme', theme: 'day' });
	assert.deepEqual(run('theme day', data, env).action, { type: 'theme', theme: 'day' });
	assert.deepEqual(run('theme blue', data, env), { lines: [{ type: 'text', text: 'usage: theme [day|night]' }] });
});

test('lang, cd and cat navigate; bad targets print an error', () => {
	assert.deepEqual(run('lang zh-cn', data, env).action, { type: 'navigate', href: '/zh-CN/' });
	assert.deepEqual(run('lang src', data, env).action, { type: 'navigate', href: '/' });
	assert.deepEqual(texts('lang fr'), ['lang: unknown language: fr']);
	assert.deepEqual(texts('lang'), ['usage: lang src|en|zh-CN']);
	assert.deepEqual(run('cd ~', data, env).action, { type: 'navigate', href: '/en/' });
	assert.deepEqual(run('cd blog', data, env).action, { type: 'navigate', href: '/en/blog/' });
	assert.deepEqual(run('cd links', data, env).action, { type: 'navigate', href: '/link-exchange' });
	assert.deepEqual(run('cat ~/about.md', data, env).action, { type: 'navigate', href: '/en/about' });
	assert.deepEqual(texts('cd /etc'), ['cd: no such file or directory: /etc']);
	assert.deepEqual(texts('cat passwd'), ['cat: passwd: No such file or directory']);
});

test('uname, whoami, uptime and clear', () => {
	assert.deepEqual(texts('uname -a'), ['xzOS xzos OpenRC xzos.net']);
	assert.deepEqual(texts('whoami'), ['xz']);
	assert.deepEqual(texts('uptime'), ['up 364 days, 4 hours, 12 mins']);
	assert.deepEqual(run('clear', data, env), { lines: [], action: { type: 'clear' } });
});

test('tab completes command names only', () => {
	assert.deepEqual(complete('he'), { value: 'help ', options: [] });
	assert.deepEqual(complete('u'), { value: 'u', options: ['uname', 'uptime'] });
	assert.deepEqual(complete('c'), { value: 'c', options: ['cat', 'cd', 'clear'] });
	assert.deepEqual(complete('upt'), { value: 'uptime ', options: [] });
	assert.equal(complete(''), null);
	assert.equal(complete('ls -'), null);
	assert.equal(complete('zz'), null);
});
