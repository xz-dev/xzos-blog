// The contents of a post as `tree` draws a directory: each heading becomes a
// node under the nearest shallower heading before it, and carries the
// box-drawing prefix that `tree` prints before its name. Only h2 and h3 are
// listed, and a post with fewer than two of them gets no contents at all.

export interface Heading {
	depth: number;
	slug: string;
	text: string;
}

export interface TocNode extends Heading {
	/** `├─ `, `└─ `, behind one `│  ` or `   ` per ancestor. */
	prefix: string;
	children: TocNode[];
}

const TOC_MIN_ENTRIES = 2;

const BRANCH = '├─ ';
const LAST = '└─ ';
const PIPE = '│  ';
const GAP = '   ';

export function buildTocTree(headings: Heading[]): TocNode[] {
	const entries = headings.filter((heading) => heading.depth === 2 || heading.depth === 3);
	if (entries.length < TOC_MIN_ENTRIES) return [];

	// Nest first: a heading goes under the last node that is shallower than it.
	const roots: TocNode[] = [];
	const stack: TocNode[] = [];
	for (const { depth, slug, text } of entries) {
		const node: TocNode = { depth, slug, text, prefix: '', children: [] };
		while (stack.length && stack[stack.length - 1].depth >= depth) stack.pop();
		(stack.length ? stack[stack.length - 1].children : roots).push(node);
		stack.push(node);
	}

	// Then draw: an ancestor that has siblings after it keeps its `│` column open.
	const draw = (nodes: TocNode[], lead: string) => {
		nodes.forEach((node, index) => {
			const last = index === nodes.length - 1;
			node.prefix = lead + (last ? LAST : BRANCH);
			draw(node.children, lead + (last ? GAP : PIPE));
		});
	};
	draw(roots, '');
	return roots;
}
