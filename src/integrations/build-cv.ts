import { copyFile, mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

const root = fileURLToPath(new URL('../..', import.meta.url));
const script = fileURLToPath(new URL('../../scripts/build-cv.mjs', import.meta.url));
const pdfs = ['xiangzhe_cv.pdf', '曾祥哲的简历.pdf'] as const;

function compile(): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script], { cwd: root, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`CV compile exited ${code}`));
    });
  });
}

/**
 * `npm run build` compiles the résumés before Astro. This hook covers a build
 * command that invokes `astro build` directly (Cloudflare Pages can be set
 * either way) and copies the PDFs into the output in case `public/` was
 * already snapshotted.
 */
export default function buildCv(): AstroIntegration {
  return {
    name: 'build-cv',
    hooks: {
      'astro:build:start': async ({ logger }) => {
        logger.info('Compiling résumé PDFs from cv/*.tex');
        await compile();
      },
      'astro:server:start': async ({ logger }) => {
        logger.info('Compiling résumé PDFs from cv/*.tex');
        await compile();
      },
      'astro:build:done': async ({ dir }) => {
        const destination = new URL('cv/', dir);
        await mkdir(destination, { recursive: true });
        for (const name of pdfs) {
          await copyFile(new URL(`../../public/cv/${name}`, import.meta.url), new URL(name, destination));
        }
      },
    },
  };
}
