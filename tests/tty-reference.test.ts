import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const photo = JSON.parse(read('../docs/theme/tektronix-4052-b.json'));
const active = JSON.parse(read('../docs/theme/tty-dark.json'));
const tty = read('../src/styles/tty.css');
const config = read('../astro.config.mjs');
const palette = Object.fromEntries([...tty.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));
const hex = (rgb: number[]) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
const decode = (v: number) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const encode = (v: number) => v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
const scaled = (color: string, factor: number) => hex(color.match(/[\da-f]{2}/gi)!.map((v) => Math.round(255 * encode(decode(parseInt(v, 16) / 255) * factor))));

test('B remains the pinned historical photograph, not a generic phosphor or active dark-field measurement', () => {
  assert.equal(photo.source.label, 'B');
  assert.equal(photo.source.url, 'https://www.electronixandmore.com/resources/teksystem/tek4052.gif');
  assert.equal(photo.source.sha256, '71092ff150ff18f72d72070032d0e819c080b4052da3d51de29b0f00e80c851c');
  assert.deepEqual(photo.source.dimensions, [325, 250]);
  assert.match(photo.source.calibration, /not physical colorimetry/);
  assert.equal(photo.palette['--background'], hex(photo.sampling.background.rgb));
  assert.equal(photo.palette['--background'], '#248d54');
  assert.equal(photo.palette['--foreground'], '#31fea8');
  assert.deepEqual(photo.sampling.background.box, [205, 80, 212, 113]);
  assert.deepEqual(photo.sampling.foreground.box, [125, 55, 212, 123]);
});

test('the active dark adaptation keeps the emitted green but explicitly replaces the photographed field', () => {
  assert.deepEqual(palette, active.palette);
  assert.equal(palette['--foreground'], photo.palette['--foreground']);
  assert.notEqual(palette['--background'], photo.palette['--background']);
  assert.equal(active.reference.sourceSha256, photo.source.sha256);
  assert.match(active.intent, /not a new measured CRT state/);
  assert.match(tty, /:root\[data-theme="tty"\] \.prose small\s*\{\s*opacity:\s*1\s*!important;/);
});

test('active surfaces and emission shades use explicit linear-light factors without white mixing', () => {
  for (const [name, factor] of Object.entries(active.derivation.fieldFactors)) {
    assert.equal(palette[name], scaled(photo.palette['--background'], Number(factor)), name);
  }
  for (const [name, factor] of Object.entries(active.derivation.emissionFactors)) {
    assert.equal(palette[name], scaled(photo.palette['--foreground'], Number(factor)), name);
  }
  assert.match(active.derivation.syntaxPolicy, /multicolour fluorescent exception/);
  assert.equal(active.derivation.syntaxFactors, undefined, 'code must not be forced onto the green emission axis');
});

test('the active manifest can be regenerated exactly without modifying the historical photo evidence', () => {
  const generated = execFileSync(process.execPath, [new URL('../scripts/derive-tty-dark.mjs', import.meta.url).pathname], { encoding: 'utf8' });
  assert.deepEqual(JSON.parse(generated), active);
});

test('code highlighting uses the active dark surface and leaves daytime syntax untouched', () => {
  assert.match(config, /light:\s*'github-light'/);
  for (const color of Object.values(active.syntax)) assert.ok(config.includes(String(color)), `missing syntax color ${color}`);
  assert.match(config, /'editor\.background':\s*'#031e0e'/);
  assert.ok(config.includes(`'editor.foreground': '${active.syntax.foreground}'`));
  assert.doesNotMatch(config, /#9ad6a3|#c0f7c7|#b0e8b7|#a0cba8/i);
});

test('legacy RGB aliases track the active palette, not the old bright field or mint colors', () => {
  for (const [alias, role] of Object.entries({ '--gray': '--secondary', '--gray-dark': '--foreground', '--gray-light': '--border-color', '--black': '--emphasized' })) {
    const rgb = palette[role].match(/[\da-f]{2}/gi)!.map((v) => parseInt(v, 16)).join(', ');
    assert.ok(tty.includes(`${alias}: ${rgb};`), alias);
  }
});
