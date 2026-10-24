import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const reference = JSON.parse(read('../docs/theme/tektronix-4052-b.json'));
const tty = read('../src/styles/tty.css');
const config = read('../astro.config.mjs');
const palette = Object.fromEntries(
  [...tty.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]),
);
const hex = (rgb: number[]) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
const decode = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const encode = (v: number) => v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
const scaled = (color: string, factor: number) => hex(color.match(/[\da-f]{2}/gi)!.map((v) =>
  Math.round(255 * encode(decode(parseInt(v, 16) / 255) * factor)),
));

test('B is the pinned photographic target, not a generic P1/P31 claim', () => {
  assert.equal(reference.source.label, 'B');
  assert.equal(reference.source.url, 'https://www.electronixandmore.com/resources/teksystem/tek4052.gif');
  assert.equal(reference.source.sha256, '71092ff150ff18f72d72070032d0e819c080b4052da3d51de29b0f00e80c851c');
  assert.deepEqual(reference.source.dimensions, [325, 250]);
  assert.match(reference.source.calibration, /not physical colorimetry/);
});

test('both the green screen field and emitted line core match the approved photograph', () => {
  assert.equal(palette['--background'], '#248d54');
  assert.equal(palette['--foreground'], '#31fea8');
  assert.equal(palette['--background'], hex(reference.sampling.background.rgb));
  assert.equal(palette['--foreground'], hex(reference.sampling.foreground.rgb));
  assert.deepEqual(palette, reference.palette);
  assert.deepEqual(reference.sampling.background.box, [205, 80, 212, 113]);
  assert.deepEqual(reference.sampling.foreground.box, [125, 55, 212, 123]);
  assert.match(tty, /:root\[data-theme="tty"\] \.prose small\s*\{\s*opacity:\s*1\s*!important;/);
});

test('UI relief and syntax shades scale linear light rather than adding white', () => {
  const background = palette['--background'];
  const foreground = palette['--foreground'];
  for (const [name, factor] of Object.entries({
    '--surface': 0.30, '--control-face': 0.40, '--control-hover': 0.55,
    '--edge-dark': 0.10, '--edge-inner': 0.65,
  })) assert.equal(palette[name], scaled(background, factor), name);
  for (const name of ['--emphasized', '--accent', '--secondary', '--edge-light']) {
    assert.equal(palette[name], foreground, `${name}: do not wash out or dim field text`);
  }
  assert.equal(palette['--border-color'], scaled(foreground, 0.70));
  for (const [role, factor] of Object.entries({ comment: 0.70, keyword: 1, string: 0.95, function: 0.90, parameter: 0.85 })) {
    assert.equal(reference.syntax[role], scaled(foreground, factor), role);
  }
});

test('code highlighting uses the same photo-derived palette and leaves the day theme alone', () => {
  assert.match(config, /light:\s*'github-light'/);
  for (const color of Object.values(reference.syntax)) assert.ok(config.includes(String(color)), `missing syntax color ${color}`);
  assert.match(config, /'editor\.background':\s*'#10502d'/);
  assert.match(config, /'editor\.foreground':\s*'#31fea8'/);
  assert.doesNotMatch(config, /#9ad6a3|#c0f7c7|#b0e8b7|#a0cba8/i);
});

test('legacy RGB aliases follow B rather than reintroducing the old gray/mint colors', () => {
  for (const [alias, role] of Object.entries({
    '--gray': '--secondary', '--gray-dark': '--foreground',
    '--gray-light': '--border-color', '--black': '--emphasized',
  })) {
    const rgb = palette[role].match(/[\da-f]{2}/gi)!.map((v) => parseInt(v, 16)).join(', ');
    assert.ok(tty.includes(`${alias}: ${rgb};`), alias);
  }
});
