import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { SITE_DESCRIPTION, SITE_TITLE } from '../../consts';

let cachedAssets: {
	fontRegular?: Buffer;
	fontBold?: Buffer;
	fontChinese?: Buffer;
	logoBase64?: string;
	fontFiles?: string[];
} = {};

function loadAssets() {
	if (!cachedAssets.fontRegular) {
		const fontDir = path.join(process.cwd(), 'public/fonts');
		cachedAssets.fontRegular = fs.readFileSync(path.join(fontDir, 'atkinson-regular.woff'));
		cachedAssets.fontBold = fs.readFileSync(path.join(fontDir, 'atkinson-bold.woff'));
		cachedAssets.fontChinese = fs.readFileSync(path.join(fontDir, 'NotoSansSC-Bold.ttf'));
		cachedAssets.fontFiles = [
			path.join(fontDir, 'atkinson-regular.woff'),
			path.join(fontDir, 'atkinson-bold.woff'),
			path.join(fontDir, 'NotoSansSC-Bold.ttf'),
		];

		const logoBuffer = fs.readFileSync(path.join(process.cwd(), 'public/dotted_circle.png'));
		cachedAssets.logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
	}

	return cachedAssets;
}

export async function GET() {
	const { fontRegular, fontBold, fontChinese, logoBase64 } = loadAssets();
	const svg = await satori(
		{
			type: 'div',
			props: {
				style: {
					width: '100%',
					height: '100%',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					position: 'relative',
					backgroundImage: 'linear-gradient(135deg, #07111f 0%, #102b46 48%, #0c6fae 100%)',
					fontFamily: 'Atkinson Hyperlegible, Noto Sans SC',
					overflow: 'hidden',
				},
				children: [
					{
						type: 'div',
						props: {
							style: {
								position: 'absolute',
								width: 780,
								height: 780,
								borderRadius: 390,
								border: '2px solid rgba(37, 165, 255, 0.18)',
								top: -220,
								right: -120,
							},
						},
					},
					{
						type: 'div',
						props: {
							style: {
								position: 'absolute',
								width: 420,
								height: 420,
								borderRadius: 210,
								background: 'rgba(37, 165, 255, 0.12)',
								bottom: -180,
								left: -80,
							},
						},
					},
					{
						type: 'img',
						props: {
							src: logoBase64,
							width: 360,
							height: 360,
							style: {
								position: 'absolute',
								right: 88,
								bottom: 62,
								opacity: 0.14,
							},
						},
					},
					{
						type: 'div',
						props: {
							style: {
								width: 1020,
								height: 450,
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								position: 'relative',
								padding: '54px 66px',
								border: '1px solid rgba(159, 216, 255, 0.28)',
								background: 'rgba(3, 14, 26, 0.52)',
							},
							children: [
								{
									type: 'div',
									props: {
										children: 'https://xzos.net',
										style: {
											fontSize: 26,
											letterSpacing: 5,
											textTransform: 'uppercase',
											color: 'rgba(166, 220, 255, 0.9)',
											marginBottom: 26,
										},
									},
								},
								{
									type: 'div',
									props: {
										children: SITE_TITLE,
										style: {
											fontSize: 132,
											fontWeight: 700,
											lineHeight: 1,
											letterSpacing: -4,
											color: '#f8fcff',
										},
									},
								},
								{
									type: 'div',
									props: {
										children: SITE_DESCRIPTION,
										style: {
											fontSize: 34,
											lineHeight: 1.35,
											color: 'rgba(232, 247, 255, 0.86)',
											marginTop: 20,
										},
									},
								},
							],
						},
					},
				],
			},
		},
		{
			width: 1200,
			height: 630,
			fonts: [
				{
					name: 'Atkinson Hyperlegible',
					data: fontRegular!,
					weight: 400,
					style: 'normal',
				},
				{
					name: 'Atkinson Hyperlegible',
					data: fontBold!,
					weight: 700,
					style: 'normal',
				},
				{
					name: 'Noto Sans SC',
					data: fontChinese!,
					weight: 700,
					style: 'normal',
				},
			],
		},
	);

	const resvg = new Resvg(svg, {
		font: {
			loadSystemFonts: false,
			fontFiles: cachedAssets.fontFiles,
		},
	});
	const pngBuffer = resvg.render().asPng();

	return new Response(pngBuffer as unknown as BodyInit, {
		headers: {
			'Content-Type': 'image/png',
		},
	});
}
