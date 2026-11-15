/**
 * The site logo (src/lib/pixel-icons.ts `logo`: 16 separated dashes round a
 * hollow centre) as a 3D ring of dashes drawn in characters, donut.c style:
 * sample the tube's surface, rotate it, project it with perspective, keep the
 * nearest point per cell (z-buffer) and pick a character from a luminance
 * ramp. RING_VARIANTS animate it in eight ways; the home page renders the
 * first variant's frame 0 at build time and its script plays them in turn.
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
const DASH_SHARE = 0.42;  // part of each 1/16 arc that is dash; the rest is gap
const RADIUS = 1;         // ring radius
const RADIAL = 0.17;      // half-width of the band across the ring
const AXIAL = 0.08;       // half-thickness of the band along the ring's axis
const DISTANCE = 5;       // camera to ring centre
const TAU = Math.PI * 2;
const MAX_LEVEL = RING_RAMP.length - 1;

export interface RingGrid {
	cols: number;
	rows: number;
}

/**
 * Character grids. Rows share the body line height (--line-height, 24px), so
 * the wide grid's 15 rows sit beside the 15 lines of the home page's fetch
 * block; narrow is for phones (30 × 8px = 240px fits 320px).
 */
export const RING_GRIDS = {
	wide: { cols: 45, rows: 15 },
	narrow: { cols: 30, rows: 10 },
} as const satisfies Record<string, RingGrid>;

/**
 * A cell's height over its width: Unifont's 8px half-width glyph on a 24px
 * line. x is scaled by this, so the ring stays round (cols = ASPECT × rows).
 */
export const RING_ASPECT = 3;

/** Animation frame rate. */
export const RING_FPS = 12;

/** One ring of the scene; every field is optional. */
export interface Ring {
	/** Turn of the dashes round the ring, radians. */
	spin?: number;
	/** Lean about the x, y and z axes, radians; z turns first, then x, then y. */
	tiltX?: number;
	tiltY?: number;
	tiltZ?: number;
	/** Ring radius and the band's half-width across and along its axis. */
	radius?: number;
	radial?: number;
	axial?: number;
	/** A plain band instead of 16 dashes. */
	solid?: boolean;
	/** Per dash (0-15, counted from 3 o'clock before spin): drawn or not, radius factor, ramp index. */
	visible?: (dash: number) => boolean;
	radiusOf?: (dash: number) => number;
	levelOf?: (dash: number, level: number) => number;
}

/**
 * Rings as rows of ramp indexes (0 = empty), z-buffered together. `extent`
 * is the farthest a surface point reaches from the centre; it fixes the
 * scale, so a variant that pushes dashes outwards passes a larger one.
 * Cells are 1:RING_ASPECT, so x is scaled RING_ASPECT times as wide as y.
 */
export function renderRings(rings: readonly Ring[], { cols, rows }: RingGrid, extent = RADIUS + RADIAL): Uint8Array[] {
	// The farthest a surface point can project from the centre is
	// extent / sqrt(DISTANCE² - extent²); map that to half a row short of the edge.
	const scale = ((rows / 2 - 0.5) * Math.sqrt(DISTANCE * DISTANCE - extent * extent)) / extent;
	const depth = Array.from({ length: rows }, () => new Float32Array(cols));
	const out = Array.from({ length: rows }, () => new Uint8Array(cols));
	// Light from the upper left, in front of the ring.
	const [lx, ly, lz] = [-0.4, -0.55, -0.73];
	for (const ring of rings) {
		const { spin = 0, tiltX = 0, tiltY = 0, tiltZ = 0, radius = RADIUS, radial = RADIAL, axial = AXIAL } = ring;
		const [sa, ca, sb, cb] = [Math.sin(tiltX), Math.cos(tiltX), Math.sin(tiltY), Math.cos(tiltY)];
		const [sc, cc] = [Math.sin(tiltZ), Math.cos(tiltZ)];
		const thetaStep = 1.6 / (scale * radius * 2 * RING_ASPECT);
		for (let theta = 0; theta < TAU; theta += thetaStep) {
			// Dashes are centred on multiples of 1/16 turn, as in the pixel logo.
			const arc = (theta / TAU) * DASHES;
			const dash = Math.round(arc) % DASHES;
			if (!ring.solid && Math.abs(arc - Math.round(arc)) > DASH_SHARE / 2) continue;
			if (ring.visible && !ring.visible(dash)) continue;
			const rr = radius * (ring.radiusOf ? ring.radiusOf(dash) : 1);
			const angle = theta + spin;
			const [st, ct] = [Math.sin(angle), Math.cos(angle)];
			for (let phi = 0; phi < TAU; phi += 0.06) {
				const [sp, cp] = [Math.sin(phi), Math.cos(phi)];
				// The band's cross-section is an ellipse, wider across the ring than
				// along its axis, so the dashes read as flat strokes like the pixel logo.
				// Point and normal in the ring's frame (ring in the xy plane).
				const across = cp / radial, along = sp / axial, norm = Math.hypot(across, along);
				let nx = (across / norm) * ct, ny = (across / norm) * st, nz = along / norm;
				const r = rr + radial * cp;
				let x = r * ct, y = r * st, z = axial * sp;
				[x, y] = [x * cc - y * sc, x * sc + y * cc];
				[nx, ny] = [nx * cc - ny * sc, nx * sc + ny * cc];
				// Tilt about x, then about y. With a positive tiltX the top leans towards
				// the camera, so it projects larger; the centre sits a little below the middle row.
				[y, z] = [y * ca - z * sa, y * sa + z * ca];
				[ny, nz] = [ny * ca - nz * sa, ny * sa + nz * ca];
				[x, z] = [x * cb + z * sb, -x * sb + z * cb];
				[nx, nz] = [nx * cb + nz * sb, -nx * sb + nz * cb];
				// Skip faces turned away from the camera (at z = -DISTANCE): through a
				// dash's open end they would fill the gap with the band's inside.
				if (nx * x + ny * y + nz * (z + DISTANCE) >= 0) continue;
				const inv = 1 / (z + DISTANCE);
				const col = Math.floor(cols / 2 + RING_ASPECT * scale * x * inv);
				const row = Math.floor(rows * 0.52 + scale * y * inv);
				if (col < 0 || col >= cols || row < 0 || row >= rows || inv <= depth[row][col]) continue;
				depth[row][col] = inv;
				// A square-root curve lifts the mid tones towards the dense marks; faces
				// turned from the light keep the dimmest mark, so dashes keep their shape.
				const light = Math.sqrt(Math.max(0, nx * lx + ny * ly + nz * lz));
				const level = Math.max(1, Math.min(MAX_LEVEL, Math.round(light * MAX_LEVEL)));
				out[row][col] = ring.levelOf ? ring.levelOf(dash, level) : level;
			}
		}
	}
	return out;
}

/** A hash of an integer to [0, 1): the same cell and tick always draw the same noise. */
function hash(n: number): number {
	n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
	n ^= n >>> 13;
	n = Math.imul(n, 0xc2b2ae35);
	return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

const mod = (a: number, n: number) => ((a % n) + n) % n;

export interface RingVariant {
	id: string;
	frame: (t: number, grid: RingGrid) => Uint8Array[];
}

/**
 * The logo's animations, each a function of time t (seconds) from 0. The home
 * page plays one at random and moves to another every so often; the build
 * renders tumble at t = 0. Every variant keeps the 16 dashes round a hollow
 * centre for most of its run, so the logo still reads; the ones that loop
 * (boot, decode) start from their first step at t = 0.
 */
export const RING_VARIANTS: readonly RingVariant[] = [
	{
		// The dashes run round the ring while the ring leans back 14° to 26° and
		// swings up to 26° left and right. The swing is about the vertical axis,
		// where the grid has three times the cells, so the drawing keeps all but
		// one or two rows.
		id: 'tumble',
		frame: (t, grid) => renderRings([{ spin: t * 0.6, tiltX: 0.35 + 0.1 * Math.sin(t * 0.5), tiltY: 0.45 * Math.sin(t * 0.33) }], grid),
	},
	{
		// A terminal spinner: face on, a bright head steps round the 16 dashes with
		// a tail that fades over six dashes.
		id: 'spinner',
		frame: (t, grid) => {
			const head = Math.floor(t * 10) % DASHES;
			return renderRings([{ tiltX: 0.25, levelOf: (dash) => {
				const age = mod(head - dash, DASHES);
				return age < MAX_LEVEL ? MAX_LEVEL - age : 1;
			} }], grid);
		},
	},
	{
		// A coin flip: a fixed lean and a full turn about the vertical axis, edge
		// on (a thin line) twice a turn.
		id: 'coin',
		frame: (t, grid) => renderRings([{ tiltX: 0.3, tiltY: t * 1.1 }], grid),
	},
	{
		// Boot: over 3 s the dashes fly in one by one from outside the box and
		// assemble the logo, which turns for 3 s, then drops them in order over
		// 2 s; an 8 s loop.
		id: 'boot',
		frame: (t, grid) => {
			const c = t % 8;
			return renderRings([{
				spin: c * 0.4, tiltX: 0.35, tiltY: 0.25,
				visible: (dash) => (c < 3 ? dash < (c / 3) * 17 : c < 6 ? true : dash >= ((c - 6) / 2) * 17),
				radiusOf: (dash) => {
					if (c >= 3) return 1;
					const born = (dash / 17) * 3;
					return 1 + 1.2 * Math.max(0, 1 - (c - born) / 0.4);
				},
			}], grid);
		},
	},
	{
		// Decode: noise settles cell by cell into a still logo, which holds for
		// about 2 s and scrambles again; a 6 s loop. The noise is a hash of cell
		// and tick, so a frame depends on t alone.
		id: 'decode',
		frame: (t, grid) => {
			const c = t % 6, tick = Math.floor(t * RING_FPS);
			return renderRings([{ tiltX: 0.35, tiltY: -0.3 }], grid).map((row, r) => row.map((level, col) => {
				const id = r * grid.cols + col, settle = 0.3 + 2.5 * hash(id);
				if (c < 4.5 && c >= settle) return level;
				if (c >= 4.5 && (c - 4.5) / 1.5 <= hash(id + 7)) return level;
				return level || hash(id * 31 + tick) < 0.15 ? 1 + Math.floor(hash(id * 17 + tick) * MAX_LEVEL) : 0;
			}));
		},
	},
	{
		// A gyroscope: the logo's ring outside, and inside a thin plain ring that
		// turns about another axis, kept below the bright marks so the logo leads.
		id: 'gyro',
		frame: (t, grid) => renderRings([
			{ spin: t * 0.5, tiltX: 0.4, tiltY: 0.3 * Math.sin(t * 0.4) },
			{ solid: true, radius: 0.55, radial: 0.06, axial: 0.06, tiltX: Math.PI / 2 + 0.4, tiltY: t * 0.9, levelOf: (_, level) => Math.min(level, 5) },
		], grid),
	},
	{
		// Breathing: a wave runs round the ring and pushes the dashes it passes
		// outwards and brighter. The larger extent leaves room for the push.
		id: 'wave',
		frame: (t, grid) => {
			const wave = (dash: number) => Math.max(0, Math.cos((TAU * dash) / DASHES - t * 3)) ** 4;
			return renderRings([{
				tiltX: 0.3, tiltY: -0.2,
				radiusOf: (dash) => 1 + 0.12 * wave(dash),
				levelOf: (dash, level) => Math.max(level, Math.round(1 + 6 * wave(dash))),
			}], grid, 1.3);
		},
	},
	{
		// The quietest: a fixed lean, only the dashes sliding slowly round.
		id: 'slide',
		frame: (t, grid) => renderRings([{ spin: t * 0.25, tiltX: 0.55, tiltY: 0.35 }], grid),
	},
];

/** One frame of a variant (index into RING_VARIANTS; 0, tumble, by default). */
export function ringFrame(t: number, grid: RingGrid, variant = 0): Uint8Array[] {
	return RING_VARIANTS[variant].frame(t, grid);
}

/**
 * One frame as HTML for a <pre>: bright runs in <span class="b">, dim runs in
 * <span class="d">, rows joined by newlines. Every row is `cols` characters,
 * so the box never moves. The ramp holds no markup characters.
 */
export function ringHtml(t: number, grid: RingGrid, variant = 0): string {
	return ringFrame(t, grid, variant).map((row) => {
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
