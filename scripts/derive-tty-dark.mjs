#!/usr/bin/env node
// Active dark adaptation. The original B-photo manifest stays unchanged as evidence.
import { readFileSync } from 'node:fs';
const photo = JSON.parse(readFileSync(new URL('../docs/theme/tektronix-4052-b.json', import.meta.url), 'utf8'));
const decode = (v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const encode = (v) => v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
const rgb = (hex) => hex.match(/[\da-f]{2}/gi).map((c) => parseInt(c, 16));
const scale = (hex, factor) => '#' + rgb(hex).map((c) => Math.round(255 * encode(decode(c / 255) * factor)).toString(16).padStart(2, '0')).join('');
const luminance = (hex) => rgb(hex).reduce((sum, c, i) => sum + decode(c / 255) * [0.2126, 0.7152, 0.0722][i], 0);
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
const field = photo.palette['--background'];
const emission = photo.palette['--foreground'];
const fieldFactors = { '--background': 0.025, '--surface': 0.05, '--control-face': 0.08, '--control-hover': 0.12, '--edge-dark': 0.005 };
const emissionFactors = { '--foreground': 1, '--emphasized': 1, '--accent': 1, '--secondary': 0.70, '--border-color': 0.18, '--edge-light': 0.40, '--edge-inner': 0.18 };
const palette = Object.fromEntries([
  ...Object.entries(fieldFactors).map(([role, factor]) => [role, scale(field, factor)]),
  ...Object.entries(emissionFactors).map(([role, factor]) => [role, scale(emission, factor)]),
]);
const syntax = { ...photo.syntax, background: palette['--surface'] };
console.log(JSON.stringify({
  intent: 'Dark-green field with brighter green emission. Explicitly replaces the earlier illuminated photographic background, not a new measured CRT state.',
  reference: { manifest: 'docs/theme/tektronix-4052-b.json', sourceSha256: photo.source.sha256, retainedEmission: emission, originalPhotographicField: field },
  derivation: { method: 'Decode sRGB, multiply every linear channel by the stated factor, re-encode and round. No white mixing or gray/mint substitution.', fieldFactors, emissionFactors },
  palette,
  syntax,
  contrast: {
    foregroundOnBackground: contrast(palette['--foreground'], palette['--background']),
    secondaryOnBackground: contrast(palette['--secondary'], palette['--background']),
    secondaryOnControlHover: contrast(palette['--secondary'], palette['--control-hover']),
    borderOnBackground: contrast(palette['--border-color'], palette['--background']),
    backgroundRelativeLuminance: luminance(palette['--background']),
    originalFieldRelativeLuminance: luminance(field),
    minimumSyntaxOnSurface: Math.min(...Object.entries(syntax).filter(([role]) => role !== 'background').map(([, color]) => contrast(color, palette['--surface']))),
    normalTextWcagAAA: contrast(palette['--secondary'], palette['--control-hover']) >= 7,
    note: 'Calculated sRGB contrast, not measured monitor brightness or physical CRT colorimetry.',
  },
}, null, 2));
