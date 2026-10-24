#!/usr/bin/env node
// Reproduce the palette from the user-selected B photograph. No camera correction.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const path = process.argv[2];
assert.ok(path, 'Usage: node scripts/derive-tty-reference.mjs /path/to/tek4052.gif');
const original = await readFile(path);
const sha256 = createHash('sha256').update(original).digest('hex');
assert.equal(sha256, '71092ff150ff18f72d72070032d0e819c080b4052da3d51de29b0f00e80c851c', 'Not the approved B source bytes');
const { data, info } = await sharp(original).removeAlpha().raw().toBuffer({ resolveWithObject: true });
assert.equal(info.width, 325);
assert.equal(info.height, 250);
assert.equal(info.channels, 3);
const decode = (n) => n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
const encode = (n) => n <= 0.0031308 ? n * 12.92 : 1.055 * n ** (1 / 2.4) - 0.055;
const hex = (rgb) => '#' + rgb.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const luminance = (rgb) => rgb.map((v) => decode(v / 255)).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
const scale = (rgb, factor) => hex(rgb.map((v) => 255 * encode(factor * decode(v / 255))));
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
function pixels([x0, y0, x1, y1]) {
  const out = [];
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const offset = (y * info.width + x) * 3;
    out.push([...data.subarray(offset, offset + 3)]);
  }
  return out;
}
const backgroundBox = [205, 80, 212, 113];
const emissionBox = [125, 55, 212, 123];
const backgroundCounts = new Map();
for (const pixel of pixels(backgroundBox)) {
  const key = pixel.join(',');
  backgroundCounts.set(key, (backgroundCounts.get(key) || 0) + 1);
}
const [backgroundKey, backgroundCount] = [...backgroundCounts].sort((a, b) => b[1] - a[1])[0];
const background = backgroundKey.split(',').map(Number);
const core = pixels(emissionBox).filter(([r, g, b]) => g >= 235 && g >= 2 * r && g > 1.25 * b);
assert.ok(core.length > 100, 'Insufficient green line-core pixels');
const foreground = core.reduce((best, pixel) => luminance(pixel) > luminance(best) ? pixel : best);
const palette = {
  '--background': hex(background),
  '--surface': scale(background, 0.30),
  '--foreground': hex(foreground),
  '--emphasized': hex(foreground),
  '--accent': hex(foreground),
  '--secondary': hex(foreground),
  '--border-color': scale(foreground, 0.70),
  '--control-face': scale(background, 0.40),
  '--control-hover': scale(background, 0.55),
  '--edge-light': hex(foreground),
  '--edge-dark': scale(background, 0.10),
  '--edge-inner': scale(background, 0.65),
};
const syntax = {
  background: palette['--surface'],
  foreground: palette['--foreground'],
  comment: scale(foreground, 0.70),
  keyword: hex(foreground),
  string: scale(foreground, 0.95),
  function: scale(foreground, 0.90),
  parameter: scale(foreground, 0.85),
};
console.log(JSON.stringify({
  source: {
    label: 'B',
    url: 'https://www.electronixandmore.com/resources/teksystem/tek4052.gif',
    context: 'https://www.electronixandmore.com/resources/teksystem/index.html',
    sha256,
    dimensions: [info.width, info.height],
    calibration: 'Unknown; the user-approved photographic appearance, not physical colorimetry.',
  },
  sampling: {
    coordinates: 'Original image pixels, half-open rectangles; no white-balance/exposure/saturation correction.',
    background: { box: backgroundBox, method: 'Most frequent RGB in an interior unmarked patch', rgb: background, count: backgroundCount },
    foreground: { box: emissionBox, method: 'Highest sRGB-relative luminance among pixels with G>=235, G>=2R, G>1.25B; avoids averaging line edges into the emitted color', rgb: foreground, eligiblePixels: core.length },
  },
  uiDerivation: {
    method: 'Decode sRGB, multiply all linear RGB channels by the same factor, encode and round to 8-bit. No white mixing or alpha blending.',
    backgroundFactors: { surface: 0.30, controlFace: 0.40, controlHover: 0.55, edgeDark: 0.10, edgeInner: 0.65 },
    emissionFactors: { foreground: 1, emphasized: 1, accent: 1, secondary: 1, border: 0.70, edgeLight: 1 },
    note: 'UI relief/syntax shades are functional derivatives, not additional measured CRT states. Text on the main green field is not dimmed; hierarchy uses weight and underlining.',
  },
  palette,
  syntax,
  contrast: {
    foregroundOnBackground: contrast(foreground, background),
    whiteOnBackgroundCeiling: 1.05 / (luminance(background) + 0.05),
    normalTextWcagAA: false,
    note: 'The approved photograph has an illuminated green field. Its exact background cannot support 4.5:1 light text even with pure white; do not claim AA/AAA or quietly replace the field with black.',
  },
}, null, 2));
