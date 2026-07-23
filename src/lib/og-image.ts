import { Resvg } from '@resvg/resvg-js';
import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export interface OgImageContent {
	title: string;
	brand: string;
	footer: string;
}

let cachedAssets: {
	fontRegular: Buffer;
	fontBold: Buffer;
	fontChinese: Buffer;
	fontFiles: string[];
	logoDataUri: string;
} | undefined;

function loadAssets() {
	if (!cachedAssets) {
		const fontDir = path.join(process.cwd(), 'public/fonts');
		const fontFiles = [
			path.join(fontDir, 'atkinson-regular.woff'),
			path.join(fontDir, 'atkinson-bold.woff'),
			path.join(fontDir, 'NotoSansSC-Bold.ttf'),
		];
		const logo = fs.readFileSync(path.join(process.cwd(), 'public/dotted_circle.png'));

		cachedAssets = {
			fontRegular: fs.readFileSync(fontFiles[0]),
			fontBold: fs.readFileSync(fontFiles[1]),
			fontChinese: fs.readFileSync(fontFiles[2]),
			fontFiles,
			logoDataUri: `data:image/png;base64,${logo.toString('base64')}`,
		};
	}

	return cachedAssets;
}

function getTitleFontSize(title: string): number {
	const visualLength = [...title].reduce((length, character) => {
		return length + (/\p{Script=Han}/u.test(character) ? 1.7 : 1);
	}, 0);

	if (visualLength > 132) return 40;
	if (visualLength > 105) return 46;
	if (visualLength > 78) return 52;
	if (visualLength > 54) return 62;
	return 74;
}

function lineGrid() {
	const children = [];
	for (let x = 72; x <= 1128; x += 48) {
		children.push({
			type: 'div',
			props: {
				style: {
					position: 'absolute',
					left: x,
					top: 0,
					width: 1,
					height: OG_IMAGE_HEIGHT,
					background: 'rgba(92, 184, 255, 0.035)',
				},
			},
		});
	}
	for (let y = 72; y <= 558; y += 48) {
		children.push({
			type: 'div',
			props: {
				style: {
					position: 'absolute',
					left: 0,
					top: y,
					width: OG_IMAGE_WIDTH,
					height: 1,
					background: 'rgba(92, 184, 255, 0.035)',
				},
			},
		});
	}
	return children;
}

export async function renderOgImage({ title, brand, footer }: OgImageContent): Promise<Buffer> {
	const { fontRegular, fontBold, fontChinese, fontFiles, logoDataUri } = loadAssets();
	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					width: '100%',
					height: '100%',
					display: 'flex',
					position: 'relative',
					flexDirection: 'column',
					justifyContent: 'space-between',
					padding: '68px 76px 58px',
					background: '#050b14',
					color: '#f2f7fb',
					fontFamily: 'Atkinson Hyperlegible, Noto Sans SC',
					overflow: 'hidden',
				},
				children: [
					...lineGrid(),
					{
						type: 'div',
						props: {
							style: {
								position: 'absolute',
								left: 0,
								top: 0,
								width: 9,
								height: '100%',
								background: '#138bd2',
							},
						},
					},
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								position: 'relative',
							},
							children: [
								{
									type: 'div',
									props: {
										children: brand,
										style: {
											fontSize: 27,
											fontWeight: 700,
											letterSpacing: 5.5,
											color: '#79c9ff',
										},
									},
								},
								{
									type: 'img',
									props: {
										src: logoDataUri,
										width: 58,
										height: 58,
										style: { opacity: 0.72 },
									},
								},
							],
						},
					},
					{
						type: 'div',
						props: {
							children: title,
							style: {
								display: 'flex',
								position: 'relative',
								maxWidth: 1030,
								maxHeight: 280,
								overflow: 'hidden',
								fontSize: getTitleFontSize(title),
								fontWeight: 700,
								lineHeight: 1.08,
								letterSpacing: -1.1,
								color: '#f4f8fb',
							},
						},
					},
					{
						type: 'div',
						props: {
							style: {
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								position: 'relative',
								paddingTop: 21,
								borderTop: '1px solid rgba(121, 201, 255, 0.28)',
								fontSize: 24,
								letterSpacing: 2.5,
								color: '#9aafbf',
							},
							children: [
								{ type: 'div', props: { children: footer } },
								{
									type: 'div',
									props: {
										children: 'xzos.net',
										style: { color: '#d5e8f4' },
									},
								},
							],
						},
					},
				],
			},
		},
		{
			width: OG_IMAGE_WIDTH,
			height: OG_IMAGE_HEIGHT,
			fonts: [
				{ name: 'Atkinson Hyperlegible', data: fontRegular, weight: 400, style: 'normal' },
				{ name: 'Atkinson Hyperlegible', data: fontBold, weight: 700, style: 'normal' },
				{ name: 'Noto Sans SC', data: fontChinese, weight: 700, style: 'normal' },
			],
		},
	);
	const resvg = new Resvg(svg, {
		font: { loadSystemFonts: false, fontFiles },
	});

	return resvg.render().asPng();
}
