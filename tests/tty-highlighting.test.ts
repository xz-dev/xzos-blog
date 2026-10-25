import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const active = JSON.parse(read('../docs/theme/tty-dark.json'));
const config = read('../astro.config.mjs');
const tty = read('../src/styles/tty.css');
const luminance = (hex: string) => hex.match(/[\da-f]{2}/gi)!.reduce((sum, v, i) => {
  const n = parseInt(v, 16) / 255;
  return sum + (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
}, 0);
const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

test('night syntax retains useful hierarchy and readable fluorescent accents', () => {
  const s = active.syntax;
  // These inter-token ratios are regression guards, not WCAG requirements.
  assert.ok(contrast(s.keyword, s.foreground) >= 1.35, 'keywords must differ from plain identifiers');
  assert.ok(contrast(s.string, s.foreground) >= 1.35, 'strings must differ from plain identifiers');
  assert.ok(contrast(s.foreground, s.comment) >= 1.3, 'comments must sit below plain code');
  // Aliasing these can coalesce dual-theme tokens and reshape unchanged day text.
  assert.notEqual(s.parameter, s.foreground, 'preserve parameter token boundaries');
  for (const [role, color] of Object.entries(s)) {
    if (role !== 'background') assert.ok(contrast(String(color), s.background) >= 7, `${role}: AAA text contrast`);
  }
});

test('code is a multi-hue fluorescent exception, not green-only syntax', () => {
  const accents = ['keyword', 'string', 'function', 'parameter'].map(role => {
    const [r, g, b] = active.syntax[role].match(/[\da-f]{2}/gi).map((v: string) => parseInt(v, 16) / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
    const hue = delta === 0 ? 0 : 60 * (max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4);
    return { hue: (hue + 360) % 360, saturation: delta === 0 ? 0 : delta / (1 - Math.abs(max + min - 1)) };
  });
  assert.equal(new Set(accents.map(c => Math.floor(c.hue / 45))).size, 4, 'four genuinely different accent hue families');
  assert.ok(accents.every(c => c.saturation >= 0.8), 'bright saturated neon-style accents, not muted pastels');
  assert.equal(active.palette['--foreground'], '#31fea8', 'ordinary page UI retains the selected green');
  assert.notEqual(active.syntax.foreground, active.palette['--foreground'], 'code has its own foreground');
  assert.match(config, /name:\s*'tty-neon'/);
  assert.match(tty, new RegExp(`color:\\s*var\\(--shiki-dark,\\s*${active.syntax.foreground}\\)`));
  assert.match(tty, /font-synthesis:\s*none/);
});

test('night marked text uses clear reverse video, like text selection', () => {
  assert.match(tty, /:root\[data-theme="tty"\] mark\s*\{[^}]*background:\s*var\(--accent\);[^}]*color:\s*var\(--background\);/);
  assert.match(tty, /:root\[data-theme="tty"\] ::selection\s*\{[^}]*background:\s*var\(--accent\);[^}]*color:\s*var\(--background\);/);
});
