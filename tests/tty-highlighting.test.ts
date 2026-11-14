import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const config = read('../astro.config.mjs');
const tty = read('../src/styles/tty.css');
const luminance = (hex: string) => hex.match(/[\da-f]{2}/gi)!.reduce((sum, v, i) => {
  const n = parseInt(v, 16) / 255;
  return sum + (n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4) * [0.2126, 0.7152, 0.0722][i];
}, 0);
const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);

test('both syntax themes preserve Solarized scopes and every token reaches AA on its painted field', async () => {
  const { daySyntaxTheme, nightSyntaxTheme } = await import('../src/lib/syntax-day.ts');
  const { default: light } = await import('@shikijs/themes/solarized-light');
  const { default: dark } = await import('@shikijs/themes/solarized-dark');
  const tokens = read('../src/styles/tokens.css');
  const blocks = [tokens.match(/:root\s*\{([^}]+)\}/)![1], tokens.match(/:root\[data-theme="tty"\]\s*\{([^}]+)\}/)![1]];
  for (const [i, theme] of [daySyntaxTheme, nightSyntaxTheme].entries()) {
    const original = [light, dark][i];
    const surface = blocks[i].match(/--surface:\s*(#[\da-f]{6});/i)![1];
    assert.equal(theme.colors['editor.background'], surface);
    assert.deepEqual(theme.tokenColors.map(r => r.scope), original.tokenColors!.map(r => r.scope));
    const used = new Set([theme.colors['editor.foreground']]);
    for (const [index, rule] of theme.tokenColors.entries()) {
      const before = original.tokenColors![index];
      assert.deepEqual({ ...rule.settings, foreground: undefined }, { ...before.settings, foreground: undefined });
      if (rule.settings.foreground) {
        used.add(rule.settings.foreground);
        if (contrast(before.settings.foreground!, surface) >= 4.5) assert.equal(rule.settings.foreground, before.settings.foreground);
      }
    }
    assert.ok(used.size >= 8, 'retain distinct Solarized syntax colours');
    for (const color of used) assert.ok(contrast(color, surface) >= 4.5, `${theme.name} ${color}: ${contrast(color, surface).toFixed(3)}`);
  }
  assert.match(config, /light:\s*daySyntaxTheme/);
  assert.match(config, /dark:\s*nightSyntaxTheme/);
  assert.match(tty, /color:\s*var\(--shiki-dark\)\s*!important/);
  assert.doesNotMatch(tty.replace(/\/\*[\s\S]*?\*\//g, ''), /(?:^|\s)code\s*\{/);
  assert.match(read('../src/styles/terminal.css'), /\ncode,\s*kbd\s*\{[^}]*color:\s*var\(--code-color\);/);
  assert.match(read('../src/styles/terminal.css'), /font-synthesis:\s*none/);
});

test('selection and marked text use readable reverse video in both themes', () => {
  const base = read('../src/styles/terminal.css');
  const tokens = read('../src/styles/tokens.css');
  assert.match(base, /\nmark\s*\{[^}]*background:\s*var\(--accent\);[^}]*color:\s*var\(--background\);/);
  assert.match(base, /\n::selection\s*\{[^}]*background:\s*var\(--selection-bg\);[^}]*color:\s*var\(--selection-fg\);/);
  for (const block of [tokens.match(/:root\s*\{([^}]+)\}/)![1], tokens.match(/:root\[data-theme="tty"\]\s*\{([^}]+)\}/)![1]]) {
    assert.match(block, /--selection-bg:\s*var\(--accent\);/);
    assert.match(block, /--selection-fg:\s*var\(--background\);/);
    const color = (role: string) => block.match(new RegExp(`${role}:\\s*(#[\\da-f]{6});`, 'i'))![1];
    assert.ok(contrast(color('--accent'), color('--background')) >= 4.5);
  }
});

test('Shiki renders representative code with the accessible dual-theme colours', async () => {
  const { codeToTokensWithThemes } = await import('shiki');
  const { daySyntaxTheme, nightSyntaxTheme } = await import('../src/lib/syntax-day.ts');
  const result = await codeToTokensWithThemes('// comment\nconst greeting = "hello";\nfunction greet(name: string) { return greeting + name; }', {
    lang: 'typescript', themes: { light: daySyntaxTheme, dark: nightSyntaxTheme },
  });
  assert.ok(result.flat().length > 10);
  for (const token of result.flat()) {
    for (const [mode, surface] of [['light', '#eee8d5'], ['dark', '#073642']] as const) {
      const color = token.variants[mode].color!;
      assert.ok(contrast(color, surface) >= 4.5, `${mode} ${token.content}: ${color}`);
    }
  }
});
