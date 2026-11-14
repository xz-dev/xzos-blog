// Rewrites the legacy block of public/_redirects from src/lib/legacy-redirects.ts:
// `npm run redirects`. tests/redirects.test.ts fails when the file is stale.
import { readFileSync, writeFileSync } from 'node:fs';
import { legacyBegin, renderLegacyRedirects } from '../src/lib/legacy-redirects.ts';

const file = new URL('../public/_redirects', import.meta.url);
const current = readFileSync(file, 'utf8');
const at = current.indexOf(legacyBegin);
const head = at === -1 ? current.replace(/\n*$/, '\n\n') : current.slice(0, at);
writeFileSync(file, head + renderLegacyRedirects());
