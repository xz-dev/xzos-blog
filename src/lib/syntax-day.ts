// Syntax colours as Shiki themes (Shiki bundles neither palette). Night keeps
// Aura Dark's token colours, only the comment grey is lifted to 4.5:1 on the
// code surface; day uses Termius Light's hues on its grey paper.
type Syntax = { fg: string; comment: string; keyword: string; string: string; func: string; type: string; constant: string };

function syntaxTheme(name: string, type: 'light' | 'dark', background: string, c: Syntax) {
  return {
    name,
    type,
    colors: { 'editor.background': background, 'editor.foreground': c.fg },
    tokenColors: [
      { settings: { foreground: c.fg, background } },
      { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: c.comment, fontStyle: 'italic' } },
      { scope: ['keyword', 'storage', 'storage.type', 'storage.modifier', 'keyword.operator.new', 'keyword.control'], settings: { foreground: c.keyword } },
      { scope: ['string', 'string.quoted', 'string.template', 'punctuation.definition.string', 'markup.inline.raw'], settings: { foreground: c.string } },
      { scope: ['entity.name.function', 'support.function', 'meta.function-call entity.name.function', 'entity.name.tag'], settings: { foreground: c.func } },
      { scope: ['entity.name.type', 'entity.name.class', 'support.type', 'support.class', 'entity.other.inherited-class', 'entity.other.attribute-name'], settings: { foreground: c.type } },
      { scope: ['constant', 'constant.numeric', 'constant.language', 'constant.character', 'variable.other.constant', 'support.constant'], settings: { foreground: c.constant } },
      { scope: ['variable.parameter', 'variable.language'], settings: { foreground: c.func } },
      { scope: ['keyword.operator', 'punctuation', 'meta.brace'], settings: { foreground: c.fg } },
      { scope: ['markup.heading', 'markup.bold'], settings: { foreground: c.keyword, fontStyle: 'bold' } },
      { scope: ['markup.inserted'], settings: { foreground: c.string } },
      { scope: ['markup.deleted', 'invalid'], settings: { foreground: c.constant } },
    ],
  };
}

export const daySyntaxTheme = syntaxTheme('termius-light', 'light', '#dde1e7', {
  fg: '#2b3040', comment: '#5c6376', keyword: '#8a3fa0', string: '#117140', func: '#865c00', type: '#1d67a5', constant: '#106f6f',
});
export const nightSyntaxTheme = syntaxTheme('aura-dark', 'dark', '#1f1d27', {
  fg: '#edecee', comment: '#858585', keyword: '#a277ff', string: '#61ffca', func: '#ffca85', type: '#82e2ff', constant: '#f694ff',
});
