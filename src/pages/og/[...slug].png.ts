import { getCollection } from 'astro:content';
import fs from 'fs';
import path from 'path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const gradients = [
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
    'linear-gradient(120deg, #e0c3fc 0%, #8ec5fc 100%)',
    'linear-gradient(120deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(to right, #6a11cb 0%, #2575fc 100%)',
    'linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)',
    'linear-gradient(to top, #fff1eb 0%, #ace0f9 100%)',
    'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)',
    'linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%)',
];

function getGradientForTitle(title: string) {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
}

// 模块级缓存：字体和 logo 只读取一次，被所有缩略图生成任务复用
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
        
        // 字体文件路径供 Resvg 使用
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

export async function getStaticPaths() {
    const posts = await getCollection('blog');
    return posts.map((post) => ({
        params: { slug: post.id },
        props: post,
    }));
}

export async function GET({ props }: { props: any }) {
    const post = props;
    const gradient = getGradientForTitle(post.data.title);
    
    // 使用缓存的资源
    const { fontRegular, fontBold, fontChinese, logoBase64 } = loadAssets();
    const svg = await satori(
        {
            type: 'div',
            props: {
                style: {
                    height: '100%',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundImage: gradient,
                    position: 'relative',
                },
                children: [
                    // Background Logo (Watermark style)
                    {
                        type: 'img',
                        props: {
                            src: logoBase64,
                            width: 300,
                            height: 300,
                            style: {
                                position: 'absolute',
                                opacity: 0.15,
                                filter: 'invert(1)',
                            }
                        }
                    },
                    // Main Logo
                    {
                        type: 'img',
                        props: {
                            src: logoBase64,
                            width: 120,
                            height: 120,
                            style: {
                                marginBottom: 40,
                                opacity: 0.9,
                                filter: 'invert(1) drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                            }
                        }
                    },
                    // Title
                    {
                        type: 'div',
                        props: {
                            children: post.data.title,
                            style: {
                                fontSize: 60,
                                fontWeight: 'bold',
                                fontFamily: 'Atkinson Hyperlegible, Noto Sans SC',
                                color: 'white',
                                textAlign: 'center',
                                padding: '0 40px',
                                lineHeight: 1.2,
                                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }
                        }
                    },
                    // Site Name / Footer
                    {
                        type: 'div',
                        props: {
                            children: 'xzOS.net',
                            style: {
                                position: 'absolute',
                                bottom: 40,
                                fontSize: 24,
                                color: 'rgba(255,255,255,0.8)',
                                letterSpacing: 2,
                            }
                        }
                    }
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
        }
    );

    // 使用优化配置的 Resvg：禁用系统字体扫描，只加载必要的字体
    const resvg = new Resvg(svg, {
        font: {
            loadSystemFonts: false,  // 关键优化：不扫描系统字体（默认 true 会很慢）
            fontFiles: cachedAssets.fontFiles,  // 只加载我们需要的字体
        },
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    return new Response(pngBuffer as unknown as BodyInit, {
        headers: {
            'Content-Type': 'image/png',
        },
    });
}
