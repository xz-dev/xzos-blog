import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { captureDateSources, formatPostDate } from '../src/lib/post-date.ts';

const format = (source: string) => formatPostDate(new Date(source), source);
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('capture original date strings before coercion without mutating author metadata', () => {
  const input = { pubDate: '2026-10-25T01:00+08:00', updatedDate: '2026-10-26T13:04:05-08:00', author: 'Eries' };
  assert.deepEqual(captureDateSources(input), { ...input, pubDateSource: input.pubDate, updatedDateSource: input.updatedDate });
  assert.deepEqual(Object.keys(input), ['pubDate', 'updatedDate', 'author']);
});

test('Date-only input stays date-only and no time or timezone is invented', () => {
  assert.deepEqual(format('2024-03-19'), { datetime: '2024-03-19', text: '2024-03-19' });
});

test('the repost keeps its Shanghai wall clock, offset and minute precision', () => {
  assert.deepEqual(format('2026-10-25T01:00+08:00'), { datetime: '2026-10-25T01:00+08:00', text: '2026-10-25 01:00 UTC+08:00' });
});

test('western timezones keep their original calendar date instead of converting to Shanghai', () => {
  assert.deepEqual(format('2026-10-25T23:45:12-08:00'), { datetime: '2026-10-25T23:45:12-08:00', text: '2026-10-25 23:45:12 UTC-08:00' });
});

test('recorded daylight-saving offsets are not recalculated from a current location', () => {
  assert.equal(format('2026-07-01T09:15-07:00').text, '2026-07-01 09:15 UTC-07:00');
  assert.equal(format('2026-12-01T09:15-08:00').text, '2026-12-01 09:15 UTC-08:00');
});

test('non-whole-hour offsets and fractional-second precision are preserved', () => {
  assert.equal(format('2026-10-25T01:00:12.125+05:45').text, '2026-10-25 01:00:12.125 UTC+05:45');
  assert.equal(format('2026-10-25T01:00:12-03:30').text, '2026-10-25 01:00:12 UTC-03:30');
});

test('Z remains a UTC instant with an explicit numeric UTC label', () => {
  assert.deepEqual(format('2026-10-25T01:00:12Z'), { datetime: '2026-10-25T01:00:12Z', text: '2026-10-25 01:00:12 UTC+00:00' });
});

test('Date object fallback uses its known UTC instant rather than inventing an original offset', () => {
  const date = new Date('2026-10-25T01:00:12Z');
  const captured = captureDateSources({ pubDate: date }) as Record<string, unknown>;
  assert.equal(captured.pubDate, date);
  assert.equal(captured.pubDateSource, date.toISOString());
  assert.equal(formatPostDate(date).text, '2026-10-25 01:00:12.000 UTC+00:00');
});

test('missing optional dates are not stringified and invalid outer data is left to schema validation', () => {
  assert.deepEqual(captureDateSources({ title: 'legacy' }), { title: 'legacy', pubDateSource: undefined, updatedDateSource: undefined });
  assert.equal(captureDateSources(null), null);
});

test('ambiguous, invalid, or contradictory timestamps cannot silently acquire a timezone', () => {
  assert.throws(() => formatPostDate(new Date('invalid')));
  assert.throws(() => formatPostDate(new Date('2026-10-25T01:00Z'), '2026-10-25T01:00'));
  assert.throws(() => formatPostDate(new Date('2026-10-25T01:00Z'), '2026-10-25T01:00+08:00'));
  assert.throws(() => format('2026-02-30T01:00+08:00'));
});

test('formatting is independent of server and reader timezone', () => {
  const url = new URL('../src/lib/post-date.ts', import.meta.url).href;
  const code = `import {formatPostDate} from ${JSON.stringify(url)}; const s='2026-10-25T23:45-08:00'; console.log(JSON.stringify(formatPostDate(new Date(s),s)));`;
  const results = ['UTC', 'Asia/Shanghai', 'America/Los_Angeles'].map(TZ => execFileSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8', env: { ...process.env, TZ } }));
  assert.ok(results.every(r => r === results[0]));
  assert.equal(JSON.parse(results[0]).text, '2026-10-25 23:45 UTC-08:00');
});

test('all existing publication and update timestamps retain their recorded local date and precision', () => {
  const walk = (dir: URL): URL[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(new URL(e.name + '/', dir)) : /\.mdx?$/.test(e.name) ? [new URL(e.name, dir)] : []);
  let checked = 0;
  for (const path of walk(new URL('../src/content/', import.meta.url))) {
    const content = readFileSync(path, 'utf8');
    const fm = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fm) continue;
    for (const field of ['pubDate', 'updatedDate']) {
      const raw = fm[1].match(new RegExp('^' + field + ':\\s*(.+)$', 'm'))?.[1].trim().replace(/^['"]|['"]$/g, '');
      if (!raw) continue;
      const result = format(raw);
      assert.equal(result.datetime, raw, `${path.pathname}:${field}`);
      assert.ok(result.text.startsWith(raw.slice(0, 10)), `${path.pathname}:${field}: original local calendar date`);
      checked++;
    }
  }
  assert.ok(checked > 0);
});

test('all three blog collections capture original sources and every date entry point forwards them', () => {
  const schema = read('../src/content.config.ts');
  assert.match(schema, /z\.preprocess\(captureDateSources/);
  assert.match(schema, /pubDateSource:\s*z\.string\(\)\.optional\(\)/);
  assert.match(schema, /updatedDateSource:\s*z\.string\(\)\.optional\(\)/);
  for (const path of ['BlogList.astro', 'BlogArchive.astro']) assert.match(read('../src/layouts/' + path), /<FormattedDate date=\{post\.data\.pubDate\} source=\{post\.data\.pubDateSource\}/);
  const post = read('../src/layouts/BlogPost.astro');
  assert.match(post, /<FormattedDate date=\{pubDate\} source=\{pubDateSource\}/);
  assert.match(post, /<FormattedDate date=\{updatedDate\} source=\{updatedDateSource\}/);
  assert.doesNotMatch(read('../src/layouts/BlogList.astro'), /<time>\s*<FormattedDate/);
});
