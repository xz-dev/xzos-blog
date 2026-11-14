import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const photo = JSON.parse(read('../docs/theme/tektronix-4052-b.json'));
const active = JSON.parse(read('../docs/theme/tty-dark.json'));
const tty = read('../src/styles/tty.css');
const config = read('../astro.config.mjs');
const tokens = read('../src/styles/tokens.css');
const nightTokens = tokens.match(/:root\[data-theme="tty"\]\s*\{([^}]+)\}/)![1];
const palette = Object.fromEntries([...nightTokens.matchAll(/(--[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map((m) => [m[1], m[2]]));
const hex = (rgb: number[]) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');

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

test('the active night palette replaces the photographed colours and keeps the photo only as evidence', () => {
  assert.deepEqual(palette, active.palette);
  assert.notEqual(palette['--foreground'], photo.palette['--foreground']);
  assert.notEqual(palette['--background'], photo.palette['--background']);
  assert.equal(active.reference.sourceSha256, photo.source.sha256);
  assert.match(active.intent, /not a measured CRT state/);
  // Editorial opacity is cancelled in both themes, so it never lowers verified contrast.
  assert.match(read('../src/styles/terminal.css'), /\.prose small\s*\{\s*opacity:\s*1\s*!important;/);
});

test('derived shades mix the foreground over the background at the recorded weights', () => {
  const mix = (a: string, b: string, t: number) => {
    const [x, y] = [a, b].map((c) => c.match(/[\da-f]{2}/gi)!.map((v) => parseInt(v, 16)));
    return hex(x.map((v, i) => Math.round(v * t + y[i] * (1 - t))));
  };
  for (const [name, color] of Object.entries(active.derivation.anchors)) assert.equal(palette[name], color, name);
  for (const [name, factor] of Object.entries(active.derivation.mixFactors)) {
    assert.equal(palette[name], mix(palette['--foreground'], palette['--background'], Number(factor)), name);
  }
  assert.equal(palette['--emphasized'], palette['--foreground']);
  assert.match(active.derivation.syntaxPolicy, /multicolour fluorescent exception/);
  assert.equal(active.derivation.syntaxFactors, undefined, 'code must not be forced onto the phosphor axis');
});

test('the active manifest can be regenerated exactly without modifying the historical photo evidence', () => {
  const generated = execFileSync(process.execPath, [new URL('../scripts/derive-tty-dark.mjs', import.meta.url).pathname], { encoding: 'utf8' });
  assert.deepEqual(JSON.parse(generated), active);
});

test('code highlighting uses the active dark surface and the AA day theme', () => {
  assert.match(config, /light:\s*daySyntaxTheme/);
  for (const color of Object.values(active.syntax)) assert.ok(config.includes(String(color)), `missing syntax color ${color}`);
  assert.match(config, new RegExp(`'editor\\.background':\\s*'${active.syntax.background}'`));
  assert.equal(active.syntax.background, palette['--surface']);
  assert.ok(config.includes(`'editor.foreground': '${active.syntax.foreground}'`));
  assert.doesNotMatch(config, /#9ad6a3|#c0f7c7|#b0e8b7|#a0cba8|#031e0e|#ff79c6|#c58cff/i);
});
