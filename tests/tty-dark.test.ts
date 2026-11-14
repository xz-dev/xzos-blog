import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const tty = read('../src/styles/tty.css');
const tokens = read('../src/styles/tokens.css');
const nightTokens = tokens.match(/:root\[data-theme="tty"\]\s*\{([^}]+)\}/)![1];
const colors = Object.fromEntries([...nightTokens.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));
const luminance = (hex: string) => hex.match(/[\da-f]{2}/gi)!.map((c) => parseInt(c, 16) / 255).reduce((sum, c, i) => sum + (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

test('the dark field and raised surface preserve Solarized hue and separation', () => {
  assert.equal(colors['--background'], '#002b36');
  assert.equal(colors['--surface'], '#073642');
  assert.ok(luminance(colors['--background']) < luminance(colors['--surface']));
  assert.ok(luminance(colors['--surface']) < 0.04);
  for (const field of ['--background', '--surface']) {
    for (const role of ['--foreground', '--secondary', '--accent']) {
      assert.ok(contrast(colors[role], colors[field]) >= 4.5, `${role} on ${field}`);
    }
  }
});
