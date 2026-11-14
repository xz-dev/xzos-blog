import { Marked } from 'marked';

// List excerpts sit under the entry's h2 title, so their own headings start
// at h3: a post's `#` becomes h3 instead of a second page-title h1.
const excerptMarked = new Marked({
	walkTokens(token) {
		if (token.type === 'heading') token.depth = Math.min(6, token.depth + 2);
	},
});

export interface Excerpt {
	html: string;
	hasMore: boolean;
}

// The text before <!--more-->, else the first three paragraphs.
export function getExcerptHtml(body: string): Excerpt {
	const moreIndex = body.indexOf('<!--more-->');
	if (moreIndex > 0) {
		return { html: excerptMarked.parse(body.substring(0, moreIndex).trim()) as string, hasMore: true };
	}
	const paragraphs = body.split(/\n\n+/);
	const firstFewParagraphs = paragraphs.slice(0, 3).join('\n\n');
	return {
		html: excerptMarked.parse(firstFewParagraphs) as string,
		hasMore: paragraphs.length > 3 || body.length > firstFewParagraphs.length + 100,
	};
}
