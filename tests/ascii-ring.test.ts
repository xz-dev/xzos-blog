import assert from 'node:assert/strict';
import test from 'node:test';
import { RING_GRIDS, RING_RAMP, ringFrame, ringHtml } from '../src/lib/ascii-ring.ts';

const text = (html: string) => html.replace(/<[^>]+>/g, '');

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
			const cells = frame.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
			assert.ok(cells > grid.cols * grid.rows * 0.24, `${name} frame at ${t}s draws only ${cells} cells`);
			const drawn = frame.flatMap((row, index) => (row.some(Boolean) ? [index] : []));
			assert.ok(drawn.at(-1)! - drawn[0] + 1 >= grid.rows - 3, `${name} frame at ${t}s leaves more than 3 rows empty`);
		}
	}
});

test('every frame draws the ring with bright, plain and dim marks', () => {
	for (const t of [0, 3, 9, 30]) {
		const html = ringHtml(t, RING_GRIDS.narrow);
		assert.match(html, /<span class="b">/);
		assert.match(html, /<span class="d">/);
		const cells = ringFrame(t, RING_GRIDS.narrow).reduce((sum, row) => sum + row.filter(Boolean).length, 0);
		assert.ok(cells > 60, `frame at ${t}s draws only ${cells} cells`);
	}
});
