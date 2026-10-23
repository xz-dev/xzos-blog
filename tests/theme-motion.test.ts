import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const tty = read('../src/styles/tty.css');
const toggle = read('../src/components/ThemeToggle.astro').match(/<script>([\s\S]*?)<\/script>/)![1];
const switchAttribute = 'data-theme-switching';

test('TTY disables motion on the root, descendants and their before/after pseudo-elements', () => {
	const rules = [...tty.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
	const reset = rules.find((rule) => /animation:\s*none\s*!important/.test(rule[2]));
	assert.ok(reset, 'Night mode must disable keyframe animations, not just transitions');
	const selectors = reset[1].replace(/\/\*[\s\S]*?\*\//g, '').split(',').map((s) => s.trim());
	for (const root of [':root[data-theme="tty"]', ':root[data-theme-switching]']) {
		for (const suffix of ['', '::before', '::after', ' *', ' *::before', ' *::after']) {
			assert.ok(selectors.includes(root + suffix), `Motion reset missing: ${root + suffix}`);
		}
	}
	assert.match(reset[2], /transition:\s*none\s*!important/);
	assert.match(reset[2], /scroll-behavior:\s*auto\s*!important/);
});

for (const initialTheme of ['tty', 'solarized']) {
	test(`Switching from ${initialTheme} completes before motion is re-enabled`, () => {
		const attributes = new Map([['data-theme', initialTheme]]);
		const events: string[] = [];
		const saved = new Map<string, string>();
		let click: () => void = () => assert.fail('Toggle handler was not installed');
		const root = {
			getAttribute: (name: string) => attributes.get(name) ?? null,
			setAttribute: (name: string, value: string) => {
				attributes.set(name, value);
				events.push(`set:${name}:${value}`);
			},
			removeAttribute: (name: string) => {
				attributes.delete(name);
				events.push(`remove:${name}`);
			},
			get offsetHeight() {
				events.push(`flush:${attributes.get('data-theme')}:${attributes.has(switchAttribute)}`);
				return 1000;
			},
		};
		runInNewContext(toggle, {
			document: {
				documentElement: root,
				getElementById: () => ({ addEventListener: (_: string, handler: () => void) => { click = handler; } }),
			},
			localStorage: { setItem: (key: string, value: string) => saved.set(key, value) },
		});
		click();
		const nextTheme = initialTheme === 'tty' ? 'solarized' : 'tty';
		assert.deepEqual(events, [
			`set:${switchAttribute}:`,
			`set:data-theme:${nextTheme}`,
			`flush:${nextTheme}:true`,
			`remove:${switchAttribute}`,
		]);
		assert.equal(attributes.get('data-theme'), nextTheme);
		assert.equal(saved.get('theme'), nextTheme);
		assert.equal(attributes.has(switchAttribute), false, 'Day mode must not retain the motion guard');
	});
}
