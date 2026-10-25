import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const photo = JSON.parse(read('../docs/theme/tektronix-4052-b.json'));
const tty = read('../src/styles/tty.css');
const colors = Object.fromEntries([...tty.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));
const luminance = (hex: string) => hex.match(/[\da-f]{2}/gi)!.map((c) => parseInt(c, 16) / 255).reduce((sum, c, i) => sum + (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

test('the active night background is dark, not the earlier illuminated photo field', () => {
  assert.notEqual(colors['--background'], photo.palette['--background']);
  assert.ok(luminance(colors['--background']) <= 0.01, 'dark-green field must have relative luminance <= 0.01');
  assert.equal(colors['--foreground'], photo.palette['--foreground'], 'retain the selected green emission anchor');
  for (const role of ['--foreground', '--secondary', '--accent']) {
    assert.ok(contrast(colors[role], colors['--background']) >= 7, `${role}: 7:1 normal text floor`);
  }
});

test('controls, focus and code keep usable contrast without bright green panels', () => {
  for (const surface of ['--surface', '--control-face', '--control-hover']) {
    assert.ok(luminance(colors[surface]) < 0.03, `${surface}: avoid large bright panels`);
    for (const role of ['--foreground', '--secondary']) assert.ok(contrast(colors[role], colors[surface]) >= 7, `${role} on ${surface}`);
  }
  assert.ok(contrast(colors['--border-color'], colors['--background']) >= 3);
});
