import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import { SITE_TITLE, SITE_HOST } from '../consts.ts';
import { cellWidth } from './term-width.ts';
import { defaultLang, langCodes, ui } from '../i18n/ui.ts';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
// The night palette (tokens.css :root[data-theme="tty"]): a dark card reads
// as a terminal screen in every feed. Titles take the emphasized colour, as
// on the site.
export const OG_PALETTE = {
	background: '#15141b',
	surface: '#1f1d27',
	foreground: '#edecee',
	emphasized: '#ffffff',
	secondary: '#a19fad',
	accent: '#a277ff',
	borderStrong: '#6a677b',
} as const;

export interface OgImageContent {
	title?: string;
	slug?: string;
	date?: string;
	category?: string;
	postCount?: number;
	locale?: 'src' | 'en' | 'zh-CN';
}

let font: Buffer | undefined;
function loadFont(): Buffer {
	return font ??= fs.readFileSync(path.join(process.cwd(), 'src/assets/og-fonts/unifont-18.0.01.otf'));
}

const closing = /[，。、：；！？）」』]/u;
const cjk = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

/** Wrap words and CJK character groups within the cell budget, then ellipsize. */
export function wrapOgText(text: string, columns: number, maxLines = 3): string[] {
	if (!Number.isInteger(columns) || columns < 4 || !Number.isInteger(maxLines) || maxLines < 1) {
		throw new RangeError('Wrapping requires at least four columns and one line');
	}
	const chars = [...text.replace(/\s+/gu, ' ').trim()];
	const lines: string[] = [];
	let start = 0;
	while (start < chars.length && lines.length < maxLines) {
		const truncated = lines.length === maxLines - 1 && cellWidth(chars.slice(start).join('')) > columns;
		const budget = columns - (truncated ? cellWidth('…') : 0);
		let end = start;
		let width = 0;
		let boundary = start;
		while (end < chars.length && width + cellWidth(chars[end]) <= budget) {
			width += cellWidth(chars[end++]);
			const previous = chars[end - 1];
			const next = chars[end];
			if (!next || (!closing.test(next) && (
				/[ -]/u.test(previous) || next === ' ' || cjk.test(previous) || cjk.test(next) || closing.test(previous)
			))) boundary = end;
		}
		if (end < chars.length && boundary > start) end = boundary;
		// An oversized word may split, but its closing punctuation stays attached.
		while (end > start + 1 && end < chars.length && closing.test(chars[end])) end--;
		lines.push(chars.slice(start, end).join('').trim() + (truncated ? '…' : ''));
		if (truncated) break;
		start = end;
		while (chars[start] === ' ') start++;
	}
	return lines;
}

export async function renderOgImage(content: OgImageContent): Promise<Buffer> {
	const { title = '', slug, date, category, postCount, locale = 'src' } = content;
	const isPost = slug !== undefined;
	const fontSize = cellWidth(title) <= 34 ? 64 : 48;
	const titleLines = wrapOgText(title, Math.floor(1104 / (fontSize / 2)));
	const clip = (text: string, columns: number) => wrapOgText(text, columns, 1)[0] ?? '';
	const command = isPost ? `cat ~/blog/${clip(slug, 53)}.md` : 'fastfetch';
	const meta = [date, category && clip(category, 40), locale].filter(Boolean).join('  │  ');
	const labels = ui[locale === 'src' ? defaultLang : locale];
	const nav = [labels['nav.home'], labels['nav.blog']];
	const text = (value: string, left: number, top: number, size = 32, color: string = OG_PALETTE.foreground) => ({
		type: 'div',
		props: { children: value, style: { position: 'absolute', left, top, fontSize: size, color, whiteSpace: 'pre', lineHeight: 1 } },
	});
	const output = isPost ? [
		...titleLines.map((line, index) => text(line, 48, 208 + index * 64, fontSize, OG_PALETTE.emphasized)),
		text(meta, 48, 448, 32, OG_PALETTE.secondary),
	] : [
		text('xz@xzos', 48, 208, 48, OG_PALETTE.accent),
		text('-------', 48, 264),
		...[
			['OS', SITE_TITLE],
			['Shell', 'xzsh'],
			['Packages', `${postCount ?? '?'} (posts)`],
			['Locale', Object.values(langCodes).join(' · ')],
		].flatMap(([key, value], index) => [
			text(key, 48, 312 + index * 40, 32, OG_PALETTE.accent),
			text(`: ${value}`, 48 + key.length * 16, 312 + index * 40),
		]),
	];
	const svg = await satori({
		type: 'div',
		props: {
			style: {
				display: 'flex', width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT,
				position: 'relative', background: OG_PALETTE.background,
				fontFamily: 'Unifont', fontWeight: 400, fontStyle: 'normal',
			},
			children: [
				{ type: 'div', props: { style: {
					position: 'absolute', top: 0, left: 0, width: OG_IMAGE_WIDTH, height: 80,
					background: OG_PALETTE.surface, borderBottom: `1px solid ${OG_PALETTE.borderStrong}`,
				} } },
				text(`${SITE_TITLE} │ 0:${nav[0]}  1:${nav[1]}${isPost ? '*' : ''}`, 48, 24),
				text(`lang: ${locale}`, 944, 24, 32, OG_PALETTE.secondary),
				text('$', 48, 128, 32, OG_PALETTE.accent),
				text(command, 80, 128),
				...output,
				text('$', 48, 550, 32, OG_PALETTE.accent),
				text('█', 80, 550, 32, OG_PALETTE.accent),
				text(SITE_HOST, OG_IMAGE_WIDTH - 48 - cellWidth(SITE_HOST) * 16, 550),
			],
		},
	}, {
		width: OG_IMAGE_WIDTH, height: OG_IMAGE_HEIGHT,
		fonts: [{ name: 'Unifont', data: loadFont(), weight: 400, style: 'normal' }],
	});
	return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
}
