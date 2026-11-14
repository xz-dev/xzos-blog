// Day code highlighting: GitHub Light's rules and hue families on the peach
// code surface. GitHub Light's comment, keyword, tag and variable colours fall
// below WCAG AA (4.14, 3.93, 3.98 and 3.00:1) on --surface #ffeadb, so those
// four are darkened in their own hue until every colour here reaches 4.5:1
// (tests/tty-highlighting.test.ts measures each one).
export const daySyntax = {
	background: '#ffeadb',
	foreground: '#24292e',
	comment: '#636b74',
	keyword: '#c13442',
	string: '#032f62',
	constant: '#005cc5',
	entity: '#6f42c1',
	tag: '#1f7a35',
	variable: '#b14c07',
	invalid: '#b31d28',
	bracket: '#586069',
} as const;

const c = daySyntax;

export const daySyntaxTheme = {
	name: 'peach-day',
	type: 'light',
	colors: {
		'editor.background': c.background,
		'editor.foreground': c.foreground,
	},
	tokenColors: [
		{ scope: ['comment', 'punctuation.definition.comment', 'string.comment'], settings: { foreground: c.comment } },
		{ scope: ['constant', 'entity.name.constant', 'variable.other.constant', 'variable.other.enummember', 'variable.language'], settings: { foreground: c.constant } },
		{ scope: ['entity', 'entity.name'], settings: { foreground: c.entity } },
		{ scope: 'variable.parameter.function', settings: { foreground: c.foreground } },
		{ scope: 'entity.name.tag', settings: { foreground: c.tag } },
		{ scope: ['keyword', 'storage', 'storage.type'], settings: { foreground: c.keyword } },
		{ scope: ['storage.modifier.package', 'storage.modifier.import', 'storage.type.java'], settings: { foreground: c.foreground } },
		{ scope: ['string', 'punctuation.definition.string', 'string punctuation.section.embedded source'], settings: { foreground: c.string } },
		{ scope: ['support', 'meta.property-name', 'support.constant', 'support.variable', 'meta.module-reference', 'string variable'], settings: { foreground: c.constant } },
		{ scope: 'variable', settings: { foreground: c.variable } },
		{ scope: 'variable.other', settings: { foreground: c.foreground } },
		{ scope: ['invalid.broken', 'invalid.deprecated', 'invalid.illegal', 'invalid.unimplemented'], settings: { fontStyle: 'italic', foreground: c.invalid } },
		{ scope: 'message.error', settings: { foreground: c.invalid } },
		{ scope: ['source.regexp', 'string.regexp'], settings: { foreground: c.string } },
		{ scope: 'string.regexp constant.character.escape', settings: { fontStyle: 'bold', foreground: c.tag } },
		{ scope: 'punctuation.definition.list.begin.markdown', settings: { foreground: c.variable } },
		{ scope: ['markup.heading', 'markup.heading entity.name'], settings: { fontStyle: 'bold', foreground: c.constant } },
		{ scope: 'markup.quote', settings: { foreground: c.tag } },
		{ scope: 'markup.italic', settings: { fontStyle: 'italic', foreground: c.foreground } },
		{ scope: 'markup.bold', settings: { fontStyle: 'bold', foreground: c.foreground } },
		{ scope: 'markup.underline', settings: { fontStyle: 'underline' } },
		{ scope: 'markup.strikethrough', settings: { fontStyle: 'strikethrough' } },
		{ scope: 'markup.inline.raw', settings: { foreground: c.constant } },
		{ scope: ['markup.deleted', 'meta.diff.header.from-file', 'punctuation.definition.deleted'], settings: { foreground: c.invalid } },
		{ scope: ['markup.inserted', 'meta.diff.header.to-file', 'punctuation.definition.inserted'], settings: { foreground: c.tag } },
		{ scope: ['markup.changed', 'punctuation.definition.changed'], settings: { foreground: c.variable } },
		{ scope: 'meta.diff.range', settings: { fontStyle: 'bold', foreground: c.entity } },
		{ scope: ['meta.diff.header', 'meta.output'], settings: { foreground: c.constant } },
		{ scope: 'meta.separator', settings: { fontStyle: 'bold', foreground: c.constant } },
		{ scope: ['brackethighlighter.tag', 'brackethighlighter.curly', 'brackethighlighter.round', 'brackethighlighter.square', 'brackethighlighter.angle', 'brackethighlighter.quote'], settings: { foreground: c.bracket } },
		{ scope: 'brackethighlighter.unmatched', settings: { foreground: c.invalid } },
		{ scope: ['constant.other.reference.link', 'string.other.link'], settings: { fontStyle: 'underline', foreground: c.string } },
	],
};
