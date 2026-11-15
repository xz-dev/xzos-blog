import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { RING_GRIDS, RING_RAMP, RING_VARIANTS, ringFrame, ringHtml } from '../src/lib/ascii-ring.ts';

const text = (html: string) => html.replace(/<[^>]+>/g, '');
const drawn = (frame: Uint8Array[]) => frame.reduce((sum, row) => sum + row.filter(Boolean).length, 0);

for (const [name, grid] of Object.entries(RING_GRIDS)) {
	test(`${name} ring frames keep a fixed ${grid.cols} x ${grid.rows} grid`, () => {
		for (const t of [0, 0.5, 7.3, 61]) {
			const rows = text(ringHtml(t, grid)).split('\n');
			assert.equal(rows.length, grid.rows);
			for (const row of rows) {
				assert.equal(row.length, grid.cols);
				assert.match(row, new RegExp(`^[${RING_RAMP.replace(/[-\\\]^]/g, '\\$&')}]*$`));
			}
		}
	});
}

test('the build-time frame is the one the script starts from, and frames move', () => {
	const grid = RING_GRIDS.wide;
	assert.equal(ringHtml(0, grid), ringHtml(0, grid));
	assert.notEqual(ringHtml(0, grid), ringHtml(1 / 12, grid));
});

test('the ring is dense and fills its box, so it reads as the logo at every pose', () => {
	// No light marks: every drawn cell is at least `-`.
	assert.doesNotMatch(RING_RAMP, /[.:]/);
	for (const [name, grid] of Object.entries(RING_GRIDS)) {
		for (let t = 0; t < 60; t += 0.5) {
			const frame = ringFrame(t, grid);
			const cells = drawn(frame);
			assert.ok(cells > grid.cols * grid.rows * 0.24, `${name} frame at ${t}s draws only ${cells} cells`);
			const used = frame.flatMap((row, index) => (row.some(Boolean) ? [index] : []));
			assert.ok(used.at(-1)! - used[0] + 1 >= grid.rows - 3, `${name} frame at ${t}s leaves more than 3 rows empty`);
		}
	}
});

test('every frame draws the ring with bright, plain and dim marks', () => {
	for (const t of [0, 3, 9, 30]) {
		const html = ringHtml(t, RING_GRIDS.narrow);
		assert.match(html, /<span class="b">/);
		assert.match(html, /<span class="d">/);
		const cells = drawn(ringFrame(t, RING_GRIDS.narrow));
		assert.ok(cells > 60, `frame at ${t}s draws only ${cells} cells`);
	}
});

test('variants have stable, distinct ids and tumble is the default', () => {
	assert.deepEqual(RING_VARIANTS.map((variant) => variant.id), ['tumble', 'spinner', 'coin', 'boot', 'decode', 'gyro', 'wave', 'slide']);
	for (const t of [0, 2.5]) assert.equal(ringHtml(t, RING_GRIDS.wide), ringHtml(t, RING_GRIDS.wide, 0));
});

// Boot assembles and drops its dashes for about 3 s of its 8 s loop, so a
// third of its frames are legitimately sparse; coin goes edge on twice a
// turn. The rest keep the whole logo on screen.
const FULL_SHARE: Record<string, number> = { boot: 0.6, coin: 0.8 };
const CYCLE: Record<string, number> = { boot: 8, decode: 6 };

for (const [index, variant] of RING_VARIANTS.entries()) {
	for (const [name, grid] of Object.entries(RING_GRIDS)) {
		test(`${variant.id} keeps the ${name} ${grid.cols} x ${grid.rows} grid, moves and reads as the logo`, () => {
			for (const t of [0, 0.5, 3.3, 7.3, 19.9]) {
				const rows = text(ringHtml(t, grid, index)).split('\n');
				assert.equal(rows.length, grid.rows, `${variant.id} at ${t}s`);
				for (const row of rows) {
					assert.equal(row.length, grid.cols, `${variant.id} at ${t}s`);
					assert.match(row, new RegExp(`^[${RING_RAMP.replace(/[-\\\]^]/g, '\\$&')}]*$`));
				}
			}
			const frames = new Set<string>();
			for (let t = 0; t < 2; t += 1 / 12) frames.add(ringHtml(t, grid, index));
			assert.ok(frames.size > 12, `${variant.id} shows only ${frames.size} distinct frames in 2s`);

			const cycle = CYCLE[variant.id] ?? 20;
			let full = 0, samples = 0;
			for (let t = 0; t < cycle; t += 1 / 12, samples++) {
				if (drawn(variant.frame(t, grid)) > grid.cols * grid.rows * 0.15) full++;
			}
			const share = FULL_SHARE[variant.id] ?? 0.95;
			assert.ok(full >= samples * share, `${variant.id} draws 15% of the ${name} grid in only ${full} of ${samples} frames`);
		});
	}
}

test('the home script plays a random variant and switches to a different one', () => {
	const home = readFileSync(new URL('../src/layouts/Home.astro', import.meta.url), 'utf8');
	assert.match(home, /set:html=\{ringHtml\(0, grid\)\}/);
	assert.match(home, /let variant = Math\.floor\(Math\.random\(\) \* RING_VARIANTS\.length\);/);
	assert.match(home, /Math\.floor\(Math\.random\(\) \* \(RING_VARIANTS\.length - 1\)\);\s*return index >= not \? index \+ 1 : index;/);
	assert.match(home, /if \(time >= RING_SWITCH\) \{\s*variant = pick\(variant\);\s*time = 0;\s*\}/);
	assert.match(home, /ringHtml\(time, \{ cols: Number\(art\.dataset\.cols\), rows: Number\(art\.dataset\.rows\) \}, variant\)/);
});
