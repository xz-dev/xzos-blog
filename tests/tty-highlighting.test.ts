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
  assert.equal(active.palette['--foreground'], '#d4ff3a', 'ordinary page UI uses the yellow-green phosphor');
  assert.notEqual(active.syntax.foreground, active.palette['--foreground'], 'code has its own foreground');
  assert.match(config, /name:\s*'tty-neon'/);
  assert.match(tty, /color:\s*var\(--shiki-dark,\s*var\(--code-foreground\)\)/);
  assert.equal(active.palette['--code-foreground'], active.syntax.foreground);
  assert.match(read('../src/styles/terminal.css'), /font-synthesis:\s*none/);
});

test('night marked text uses clear reverse video, like text selection', () => {
  const base = read('../src/styles/terminal.css');
  const night = read('../src/styles/tokens.css').match(/:root\[data-theme="tty"\]\s*\{([^}]+)\}/)![1];
  assert.match(base, /\nmark\s*\{[^}]*background:\s*var\(--accent\);[^}]*color:\s*var\(--background\);/);
  assert.match(base, /\n::selection\s*\{[^}]*background:\s*var\(--selection-bg\);[^}]*color:\s*var\(--selection-fg\);/);
  assert.match(night, /--selection-bg:\s*var\(--accent\);/);
  assert.match(night, /--selection-fg:\s*var\(--background\);/);
});

test('day syntax keeps every colour at WCAG AA on the day code surface', async () => {
  const { daySyntax, daySyntaxTheme } = await import('../src/lib/syntax-day.ts');
  const tokens = read('../src/styles/tokens.css');
  const surface = tokens.match(/:root\s*\{[^}]*--surface:\s*(#[\da-f]{6});/i)![1];
  assert.equal(daySyntax.background, surface, 'the theme describes the surface pre actually paints');
  assert.equal(daySyntaxTheme.colors['editor.background'], surface);
  const used = new Set<string>([daySyntaxTheme.colors['editor.foreground']]);
  for (const rule of daySyntaxTheme.tokenColors) if ('foreground' in rule.settings) used.add(rule.settings.foreground!);
  for (const color of used) assert.ok(contrast(color, surface) >= 4.5, `${color} on ${surface}: ${contrast(color, surface).toFixed(2)}`);
  assert.match(config, /light:\s*daySyntaxTheme/);
});
