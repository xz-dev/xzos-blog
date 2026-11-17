// The contents of a post as `tree` draws a directory: each heading becomes a
// node under the nearest shallower heading before it. The box-drawing lines
// are not part of the data; TableOfContents.astro draws them per list item, so
// a wrapped title keeps its line. Only h2 and h3 are listed, and a post with
// fewer than two of them gets no contents at all.

export interface Heading {
	depth: number;
	slug: string;
	text: string;
}

export interface TocNode extends Heading {
	children: TocNode[];
}

const TOC_MIN_ENTRIES = 2;

export function buildTocTree(headings: Heading[]): TocNode[] {
	const entries = headings.filter((heading) => heading.depth === 2 || heading.depth === 3);
	if (entries.length < TOC_MIN_ENTRIES) return [];

	// A heading goes under the last node that is shallower than it.
	const roots: TocNode[] = [];
	const stack: TocNode[] = [];
	for (const { depth, slug, text } of entries) {
		const node: TocNode = { depth, slug, text, children: [] };
		while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
		(stack.length ? stack[stack.length - 1].children : roots).push(node);
		stack.push(node);
	}
	return roots;
}
