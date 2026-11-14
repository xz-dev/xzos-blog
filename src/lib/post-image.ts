import type { ImageMetadata } from 'astro';

export type ThumbnailPost = {
	data: {
		title: string;
		heroImage?: ImageMetadata;
	};
	body?: string;
};

export type Thumbnail =
	| { type: 'astro'; src: ImageMetadata }
	| { type: 'url'; src: string };

// Only a real picture becomes a thumbnail: the hero image, else the first
// image in the body. A post without one shows no thumbnail.
export function getPostImage(post: ThumbnailPost): Thumbnail | null {
	if (post.data.heroImage) {
		return { type: 'astro', src: post.data.heroImage };
	}

	if (post.body) {
		// Markdown images: ![alt](url)
		const mdMatch = post.body.match(/!\[.*?\]\((.*?)\)/);
		if (mdMatch && mdMatch[1]) {
			return { type: 'url', src: mdMatch[1] };
		}
		// HTML images: <img src="url">
		const htmlMatch = post.body.match(/<img[^>]+src=["'](.*?)["']/);
		if (htmlMatch && htmlMatch[1]) {
			return { type: 'url', src: htmlMatch[1] };
		}
	}

	return null;
}
