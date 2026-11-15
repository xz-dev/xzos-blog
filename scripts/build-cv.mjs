/**
 * Compile cv/*.tex to public/cv/*.pdf with a pinned static Tectonic binary.
 *
 * Cloudflare Pages builds this site with `npm run build` (Ubuntu, no TeX Live,
 * and no guarantee the shared libraries a glibc Tectonic needs are installed).
 * The musl build of Tectonic 0.17.0 is fully static, so the same command works
 * locally, in PR previews, and in production. Noto Sans and LXGW WenKai are
 * downloaded next to it and exposed through a private fontconfig file, because
 * the sources select those families by name.
 */
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createWriteStream, existsSync } from 'node:fs';
import { chmod, mkdir, readFile, rename, rm, stat, writeFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const cacheDir = path.join(root, '.cache', 'cv');
const fontDir = path.join(cacheDir, 'fonts');
const outDir = path.join(root, 'public', 'cv');

const sources = [
  { tex: '曾祥哲的简历.tex', pdf: '曾祥哲的简历.pdf' },
  { tex: 'xiangzhe_cv.tex', pdf: 'xiangzhe_cv.pdf' },
];

const tectonicVersion = '0.17.0';
const tectonicAssets = {
  'linux-x64': {
    file: 'tectonic-0.17.0-x86_64-unknown-linux-musl.tar.gz',
    sha256: '8533d07f9ccbd7a65824b9e0459041bca34af1eb33daba48f59215593753a3b7',
  },
  'linux-arm64': {
    file: 'tectonic-0.17.0-aarch64-unknown-linux-musl.tar.gz',
    sha256: 'b10954a95404f3ab2328d2fa59a5ebab8e657f893fab096f98be8db7c0c979b8',
  },
  'darwin-x64': {
    file: 'tectonic-0.17.0-x86_64-apple-darwin.tar.gz',
    sha256: '7c90ef5b6ddb1eb1937e4337add5237b79338e4b9676459fa91187d24d6cdf80',
  },
  'darwin-arm64': {
    file: 'tectonic-0.17.0-aarch64-apple-darwin.tar.gz',
    sha256: 'a3f1cac7c5678f01661a92212f58480ae3b0634115d880dbc59e2953ded45667',
  },
};

const notoCommit = 'c971829a87e7920f960e7277c3dafd9bedd3c601';
const fonts = [
  font(
    'NotoSans-Regular.ttf',
    `https://raw.githubusercontent.com/notofonts/noto-fonts/${notoCommit}/hinted/ttf/NotoSans/NotoSans-Regular.ttf`,
    'b85c38ecea8a7cfb39c24e395a4007474fa5a4fc864f6ee33309eb4948d232d5',
  ),
  font(
    'NotoSans-Bold.ttf',
    `https://raw.githubusercontent.com/notofonts/noto-fonts/${notoCommit}/hinted/ttf/NotoSans/NotoSans-Bold.ttf`,
    'c976e4b1b99edc88775377fcc21692ca4bfa46b6d6ca6522bfda505b28ff9d6a',
  ),
  font(
    'NotoSans-Italic.ttf',
    `https://raw.githubusercontent.com/notofonts/noto-fonts/${notoCommit}/hinted/ttf/NotoSans/NotoSans-Italic.ttf`,
    '36cff144df01309dab648bea71baff9bb074026914afe63aeacc8bc90b67a28b',
  ),
  font(
    'NotoSans-BoldItalic.ttf',
    `https://raw.githubusercontent.com/notofonts/noto-fonts/${notoCommit}/hinted/ttf/NotoSans/NotoSans-BoldItalic.ttf`,
    '6edf4227ef0fa846aca70e86a307804ca4401741830f5b3af0f2554abe2b8466',
  ),
  font(
    'LXGWWenKai-Regular.ttf',
    'https://github.com/lxgw/LxgwWenKai/releases/download/v1.530/LXGWWenKai-Regular.ttf',
    '2d73eea94ad808999d90c0000c239a84a33b09d4bc6ab6c5b8bbf1eda8a7fc8b',
  ),
  font(
    'LXGWWenKai-Medium.ttf',
    'https://github.com/lxgw/LxgwWenKai/releases/download/v1.530/LXGWWenKai-Medium.ttf',
    'f4b8a34d1f838fe411540cb7c97b1c384ac9738a876c4104500bc42508b2312a',
  ),
];

function font(name, url, sha256) {
  return { name, url, sha256 };
}

function targetKey() {
  const arch = process.arch === 'x64' ? 'x64' : process.arch === 'arm64' ? 'arm64' : null;
  const platform = process.platform === 'linux' || process.platform === 'darwin' ? process.platform : null;
  if (!arch || !platform) {
    throw new Error(`No pinned Tectonic binary for ${process.platform}/${process.arch}. Use Linux or macOS (x64 or arm64).`);
  }
  return `${platform}-${arch}`;
}

async function sha256(file) {
  const hash = createHash('sha256');
  hash.update(await readFile(file));
  return hash.digest('hex');
}

async function download(url, dest, expected) {
  if (existsSync(dest) && (await sha256(dest)) === expected) return;
  await mkdir(path.dirname(dest), { recursive: true });
  const partial = `${dest}.partial`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { headers: { 'user-agent': 'xzos-blog-cv-build' }, redirect: 'follow' });
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status} for ${url}`);
      }
      await pipeline(Readable.fromWeb(response.body), createWriteStream(partial));
      const actual = await sha256(partial);
      if (actual !== expected) {
        throw new Error(`checksum mismatch for ${path.basename(dest)}: ${actual}`);
      }
      await rm(dest, { force: true });
      await rename(partial, dest);
      return;
    } catch (error) {
      lastError = error;
      await rm(partial, { force: true });
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw new Error(`failed to download ${url}: ${lastError instanceof Error ? lastError.message : lastError}`);
}

function run(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...options });
    child.on('error', reject);
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${path.basename(cmd)} exited ${code}`))));
  });
}

async function tectonicBin() {
  const asset = tectonicAssets[targetKey()];
  const dir = path.join(cacheDir, 'tectonic', tectonicVersion, targetKey());
  const archive = path.join(dir, asset.file);
  const bin = path.join(dir, 'tectonic');
  if (!existsSync(bin)) {
    console.log(`Downloading Tectonic ${tectonicVersion} (${asset.file})`);
    await download(
      `https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40${tectonicVersion}/${asset.file}`,
      archive,
      asset.sha256,
    );
    await run('tar', ['-xzf', archive, '-C', dir]);
    await chmod(bin, 0o755);
  }
  return bin;
}

async function installFonts() {
  await mkdir(fontDir, { recursive: true });
  for (const item of fonts) {
    const dest = path.join(fontDir, item.name);
    if (existsSync(dest) && (await sha256(dest)) === item.sha256) continue;
    console.log(`Downloading ${item.name}`);
    await download(item.url, dest, item.sha256);
  }
  const conf = path.join(cacheDir, 'fonts.conf');
  const xml = `<?xml version="1.0"?>
<fontconfig>
  <dir>${fontDir}</dir>
  <cachedir>${path.join(cacheDir, 'fontconfig')}</cachedir>
</fontconfig>
`;
  await mkdir(path.join(cacheDir, 'fontconfig'), { recursive: true });
  await writeFile(conf, xml);
  return conf;
}

async function outputsAreFresh() {
  if (process.env.CV_FORCE === '1') return false;
  const scriptTime = (await stat(fileURLToPath(import.meta.url))).mtimeMs;
  let oldestPdf = Infinity;
  for (const source of sources) {
    const pdf = path.join(outDir, source.pdf);
    if (!existsSync(pdf)) return false;
    const info = await stat(pdf);
    if (info.size < 1000) return false;
    oldestPdf = Math.min(oldestPdf, info.mtimeMs);
  }
  if (scriptTime > oldestPdf) return false;
  for (const source of sources) {
    const texTime = (await stat(path.join(root, 'cv', source.tex))).mtimeMs;
    if (texTime > oldestPdf) return false;
  }
  return true;
}

async function main() {
  if (await outputsAreFresh()) {
    console.log('Résumé PDFs are up to date');
    return;
  }
  const [bin, fontconfig] = await Promise.all([tectonicBin(), installFonts()]);
  await mkdir(outDir, { recursive: true });
  const env = {
    ...process.env,
    FONTCONFIG_FILE: fontconfig,
    XDG_CACHE_HOME: path.join(root, '.cache'),
  };
  for (const source of sources) {
    console.log(`Compiling ${source.tex}`);
    await run(bin, ['--outdir', outDir, source.tex], {
      cwd: path.join(root, 'cv'),
      env,
    });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
