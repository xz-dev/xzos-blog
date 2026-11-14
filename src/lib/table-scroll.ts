// Sätteri hast plugin: wrap every Markdown table in a focusable region so a
// table wider than the column scrolls inside it while <table> keeps its role.
// Keyboard users focus the region to scroll it; the label names it for screen readers.
import { defaultLang, ui, type Lang } from '../i18n/ui.ts';

// The language comes from the content path (blog/en/, blog/zh-CN/); the
// label text lives in src/i18n/ui.ts with the other UI strings.
export const tableScrollLabel = (fileURL: URL | undefined): string => {
  const lang = fileURL?.pathname.match(/\/content\/[^/]+\/(en|zh-CN)\//)?.[1] as Lang | undefined;
  return ui[lang ?? defaultLang]['table.label'];
};

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
