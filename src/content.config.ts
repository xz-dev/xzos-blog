import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 博客文章 schema
const blogSchema = ({ image }: { image: () => z.ZodType }) =>
	z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: image().optional(),
		author: z.string().optional(),
		category: z.string().optional(),
		tags: z.array(z.string()).optional(),
		// 翻译文件的源文件哈希（用于增量翻译检测）
		source_hash: z.string().optional(),
		// 翻译文件元数据
		source_lang: z.string().optional(),
		target_lang: z.string().optional(),
		is_copy: z.boolean().optional(),
	});

// 静态页面 schema（about 等）
const pageSchema = () =>
	z.object({
		title: z.string(),
		description: z.string(),
		// 翻译文件的源文件哈希（用于增量翻译检测）
		source_hash: z.string().optional(),
		// 翻译文件元数据
		source_lang: z.string().optional(),
		target_lang: z.string().optional(),
		is_copy: z.boolean().optional(),
	});

// 中文博客（默认）
const blog = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '*.{md,mdx}' }),
	schema: blogSchema,
});

// 英文博客
const blogEn = defineCollection({
	loader: glob({ base: './src/content/blog/en', pattern: '*.{md,mdx}' }),
	schema: blogSchema,
});

// 简体中文博客
const blogZhCN = defineCollection({
	loader: glob({ base: './src/content/blog/zh-CN', pattern: '*.{md,mdx}' }),
	schema: blogSchema,
});

// 中文静态页面
const pages = defineCollection({
	loader: glob({ base: './src/content/pages', pattern: '*.{md,mdx}' }),
	schema: pageSchema,
});

// 英文静态页面
const pagesEn = defineCollection({
	loader: glob({ base: './src/content/pages/en', pattern: '*.{md,mdx}' }),
	schema: pageSchema,
});

// 简体中文静态页面
const pagesZhCN = defineCollection({
	loader: glob({ base: './src/content/pages/zh-CN', pattern: '*.{md,mdx}' }),
	schema: pageSchema,
});

export const collections = { 
	blog,
	'blog-en': blogEn,
	'blog-zh-CN': blogZhCN,
	pages,
	'pages-en': pagesEn,
	'pages-zh-CN': pagesZhCN,
};
