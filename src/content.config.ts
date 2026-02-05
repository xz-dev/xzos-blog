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

export const collections = { 
	blog,
	'blog-en': blogEn,
};
