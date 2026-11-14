// Sätteri hast plugin: wrap every Markdown table in a focusable region so a
// table wider than the column scrolls inside it while <table> keeps its role.
// Keyboard users focus the region to scroll it; the label names it for screen readers.

export const tableScrollLabel = (fileURL: URL | undefined): string =>
  fileURL && /\/content\/blog\/en\//.test(fileURL.pathname) ? 'Table' : '表格';

export const tableScroll = {
  name: 'table-scroll',
  element: {
    filter: ['table'],
    visit(node: unknown, ctx: { fileURL: URL | undefined; wrapNode: (node: unknown, parent: unknown) => void }) {
      ctx.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: tableScrollLabel(ctx.fileURL) },
        children: [],
      });
    },
  },
};
