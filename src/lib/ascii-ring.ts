/**
 * The site logo (src/lib/pixel-icons.ts `logo`: 16 separated dashes round a
 * hollow centre) as a 3D ring of dashes drawn in characters, donut.c style:
 * sample the tube's surface, rotate it, project it with perspective, keep the
 * nearest point per cell (z-buffer) and pick a character from a luminance
 * ramp. The home page renders frame 0 at build time and its script animates
 * the same function, so the first paint and the animation match.
 */

/**
 * Dark to bright. Index 0 is an empty cell. The ramp has no light marks
 * (`.` or `:`), so every drawn cell is solid enough to keep a dash's shape.
 */
export const RING_RAMP = ' -=+*#%@';
/** Ramp indexes at or above this are drawn in the accent colour. */
export const RING_BRIGHT = 6;
/** Ramp indexes at or below this are drawn in the secondary colour. */
export const RING_DIM = 1;

const DASHES = 16;
const DASH_SHARE = 0.5;   // part of each 1/16 arc that is dash; the rest is gap
const RADIUS = 1;         // ring radius
const RADIAL = 0.17;      // half-width of the band across the ring
const AXIAL = 0.11;       // half-thickness of the band along the ring's axis
const DISTANCE = 5;       // camera to ring centre
const TAU = Math.PI * 2;

export interface RingGrid {
	cols: number;
	rows: number;
}

/** Character grids: wide from 420px up, narrow on phones (32 × 8px = 256px fits 320px). */
export const RING_GRIDS = {
	wide: { cols: 44, rows: 22 },
	narrow: { cols: 32, rows: 16 },
} as const satisfies Record<string, RingGrid>;

/** Animation frame rate. */
export const RING_FPS = 12;

/**
 * Ring pose at time t (seconds): the dashes run round the ring while the ring
 * leans back 14° to 26° and swings up to 26° left and right, so it always
 * reads as the logo. The swing is about the vertical axis, where the grid has
 * twice the cells, so the drawing keeps 19 to 21 of the 22 rows.
 */
function pose(t: number) {
	return { spin: t * 0.6, tiltX: 0.35 + 0.1 * Math.sin(t * 0.5), tiltY: 0.45 * Math.sin(t * 0.33) };
}

/**
 * One frame as rows of ramp indexes (0 = empty). Cells are 1:2 (Unifont's
 * 8 × 16 half-width glyph at a 16px line), so x is scaled twice as wide as y.
 */
export function ringFrame(t: number, { cols, rows }: RingGrid): Uint8Array[] {
	const { spin, tiltX, tiltY } = pose(t);
	const [sa, ca, sb, cb] = [Math.sin(tiltX), Math.cos(tiltX), Math.sin(tiltY), Math.cos(tiltY)];
	// The farthest a surface point can project from the centre is
	// (RADIUS + RADIAL) / sqrt(DISTANCE² - (RADIUS + RADIAL)²); map that to half a row short of the edge.
	const reach = RADIUS + RADIAL;
	const scale = ((rows / 2 - 0.5) * Math.sqrt(DISTANCE * DISTANCE - reach * reach)) / reach;
	const depth = Array.from({ length: rows }, () => new Float32Array(cols));
	const out = Array.from({ length: rows }, () => new Uint8Array(cols));
	// Light from the upper left, in front of the ring.
	const [lx, ly, lz] = [-0.4, -0.55, -0.73];
	const thetaStep = 1.6 / (scale * RADIUS * 4);
	for (let theta = 0; theta < TAU; theta += thetaStep) {
		// Dashes are centred on multiples of 1/16 turn, as in the pixel logo.
		const arc = (theta / TAU) * DASHES;
		if (Math.abs(arc - Math.round(arc)) > DASH_SHARE / 2) continue;
		const angle = theta + spin;
		const [st, ct] = [Math.sin(angle), Math.cos(angle)];
		for (let phi = 0; phi < TAU; phi += 0.06) {
			const [sp, cp] = [Math.sin(phi), Math.cos(phi)];
			// The band's cross-section is an ellipse, wider across the ring than
			// along its axis, so the dashes read as flat strokes like the pixel logo.
			// Point and normal in the ring's frame (ring in the xy plane).
			const across = cp / RADIAL, along = sp / AXIAL, norm = Math.hypot(across, along);
			let nx = (across / norm) * ct, ny = (across / norm) * st, nz = along / norm;
			const r = RADIUS + RADIAL * cp;
			let x = r * ct, y = r * st, z = AXIAL * sp;
			// Tilt about x, then about y. The top always leans towards the camera,
			// so it projects larger; the centre sits a little below the middle row.
			[y, z] = [y * ca - z * sa, y * sa + z * ca];
			[ny, nz] = [ny * ca - nz * sa, ny * sa + nz * ca];
			[x, z] = [x * cb + z * sb, -x * sb + z * cb];
			[nx, nz] = [nx * cb + nz * sb, -nx * sb + nz * cb];
			// Skip faces turned away from the camera (at z = -DISTANCE): through a
			// dash's open end they would fill the gap with the band's inside.
			if (nx * x + ny * y + nz * (z + DISTANCE) >= 0) continue;
			const inv = 1 / (z + DISTANCE);
			const col = Math.floor(cols / 2 + 2 * scale * x * inv);
			const row = Math.floor(rows * 0.52 + scale * y * inv);
			if (col < 0 || col >= cols || row < 0 || row >= rows || inv <= depth[row][col]) continue;
			depth[row][col] = inv;
			// A square-root curve lifts the mid tones towards the dense marks; faces
			// turned from the light keep the dimmest mark, so dashes keep their shape.
			const light = Math.sqrt(Math.max(0, nx * lx + ny * ly + nz * lz));
			out[row][col] = Math.max(1, Math.min(RING_RAMP.length - 1, Math.round(light * (RING_RAMP.length - 1))));
		}
	}
	return out;
}

/**
 * One frame as HTML for a <pre>: bright runs in <span class="b">, dim runs in
 * <span class="d">, rows joined by newlines. Every row is `cols` characters,
 * so the box never moves. The ramp holds no markup characters.
 */
export function ringHtml(t: number, grid: RingGrid): string {
	return ringFrame(t, grid).map((row) => {
		let html = '';
		let open = '';
		for (const level of row) {
			const tone = level >= RING_BRIGHT ? 'b' : level > 0 && level <= RING_DIM ? 'd' : '';
			if (tone !== open) {
				if (open) html += '</span>';
				if (tone) html += `<span class="${tone}">`;
				open = tone;
			}
			html += RING_RAMP[level];
		}
		return open ? `${html}</span>` : html;
	}).join('\n');
}
