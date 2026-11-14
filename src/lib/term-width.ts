/**
 * Terminal cell width of a string, like wcwidth: wide East Asian characters
 * take two cells, everything else one. Unifont draws them at 16px and 8px,
 * so the result in `ch` is the string's rendered width.
 */
const WIDE: [number, number][] = [
	[0x1100, 0x115f],
	[0x2e80, 0x303e],
	[0x3041, 0x33ff],
	[0x3400, 0x4dbf],
	[0x4e00, 0x9fff],
	[0xa000, 0xa4cf],
	[0xac00, 0xd7a3],
	[0xf900, 0xfaff],
	[0xfe30, 0xfe4f],
	[0xff00, 0xff60],
	[0xffe0, 0xffe6],
	[0x20000, 0x3fffd],
];

export function cellWidth(text: string): number {
	let width = 0;
	for (const char of text) {
		const code = char.codePointAt(0)!;
		width += WIDE.some(([from, to]) => code >= from && code <= to) ? 2 : 1;
	}
	return width;
}
