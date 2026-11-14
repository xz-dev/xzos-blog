#!/usr/bin/env node
// Active night palette. The B-photo manifest stays unchanged as historical evidence.
import { readFileSync } from 'node:fs';
const photo = JSON.parse(readFileSync(new URL('../docs/theme/tektronix-4052-b.json', import.meta.url), 'utf8'));
const decode = (v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const rgb = (hex) => hex.match(/[\da-f]{2}/gi).map((c) => parseInt(c, 16));
// sRGB channel mix of a over b at weight t, rounded (the same as the CSS tokens).
const mix = (a, b, t) => '#' + rgb(a).map((c, i) => Math.round(c * t + rgb(b)[i] * (1 - t)).toString(16).padStart(2, '0')).join('');
const luminance = (hex) => rgb(hex).reduce((sum, c, i) => sum + decode(c / 255) * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
const anchors = { '--background': '#141a03', '--surface': '#1d2606', '--foreground': '#d4ff3a', '--secondary': '#a8cc2a', '--accent': '#f0ff9a' };
const mixFactors = { '--border-color': 0.45 };
const fixed = { '--emphasized': anchors['--foreground'], '--code-foreground': '#e8fff0', '--error': '#728b1d' };
const palette = {
  ...anchors,
  ...fixed,
  ...Object.fromEntries(Object.entries(mixFactors).map(([role, t]) => [role, mix(anchors['--foreground'], anchors['--background'], t)])),
};
// Explicit exception: multicolour fluorescent code, independent of the phosphor UI.
const syntax = { background: palette['--surface'], foreground: palette['--code-foreground'], comment: '#53d98f', keyword: '#ff8acd', string: '#32eaff', function: '#cc99ff', parameter: '#f3ff57' };
const text = ['--foreground', '--secondary', '--accent'];
const fields = ['--background', '--surface'];
console.log(JSON.stringify({
  intent: 'Yellow-green phosphor on a dark olive field. Chosen anchors, not a measured CRT state; the B photograph stays as historical evidence only.',
  reference: { manifest: 'docs/theme/tektronix-4052-b.json', sourceSha256: photo.source.sha256 },
  derivation: {
    method: 'Five chosen anchors. Every other UI shade mixes the foreground over the background per sRGB channel at the stated weight and rounds; --emphasized repeats the foreground, --code-foreground is the syntax foreground and --error is a dim phosphor level that keeps 4.5:1 on the background.',
    anchors,
    mixFactors,
    syntaxPolicy: 'Code is an explicit multicolour fluorescent exception: independently selected saturated accents, not shades of the phosphor UI.',
  },
  effects: {
    textGlow: '0 0 2px currentColor, 0 0 8px of the foreground at 45% (color-mix of --foreground)',
    overlay: 'Fixed, pointer-events: none, behind the content (z-index -1): a 1px rgba(0, 0, 0, 0.12) line every 3px plus a radial vignette to rgba(0, 0, 0, 0.45) at the edges. It darkens the field only, never text.',
    motion: 'None. No animation, flicker, moving lines or curvature.',
    prefersContrastMore: 'Glow and overlay off.',
  },
  palette,
  syntax,
  contrast: {
    foregroundOnBackground: contrast(palette['--foreground'], palette['--background']),
    secondaryOnBackground: contrast(palette['--secondary'], palette['--background']),
    borderOnBackground: contrast(palette['--border-color'], palette['--background']),
    minimumTextOnField: Math.min(...text.flatMap((t) => fields.map((f) => contrast(palette[t], palette[f])))),
    backgroundRelativeLuminance: luminance(palette['--background']),
    minimumSyntaxOnSurface: Math.min(...Object.entries(syntax).filter(([role]) => role !== 'background').map(([, color]) => contrast(color, palette['--surface']))),
    normalTextWcagAAA: Math.min(...text.flatMap((t) => fields.map((f) => contrast(palette[t], palette[f])))) >= 7,
    note: 'Calculated sRGB contrast of flat colours, before glow and overlay; not measured monitor brightness.',
  },
}, null, 2));
