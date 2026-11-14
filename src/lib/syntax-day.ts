import light from '@shikijs/themes/solarized-light';
import dark from '@shikijs/themes/solarized-dark';

// Preserve Solarized scopes and passing colours; adjust only failing foregrounds
// along their HSL lightness axis for the site's code surfaces.
const lightOverrides: Record<string, string> = {
  '#268BD2': '#1e6da5',
  '#2AA198': '#1e746e',
  '#586E75': '#576c73',
  '#657B83': '#586c73',
  '#6C71C4': '#5a5fbd',
  '#859900': '#616f00',
  '#93A1A1': '#5e6b6b',
  '#B58900': '#846400',
  '#CB4B16': '#b64314',
  '#D33682': '#bf2a72',
  '#DC322F': '#ca2522'
};

const darkOverrides: Record<string, string> = {
  '#268BD2': '#469fde',
  '#2AA198': '#2ca99f',
  '#586E75': '#859ca3',
  '#6C71C4': '#8f93d2',
  '#839496': '#8b9b9d',
  '#859900': '#8ca200',
  '#B58900': '#c09100',
  '#CB4B16': '#eb7848',
  '#D33682': '#e174a9',
  '#DC322F': '#e87673'
};

function accessibleTheme(theme: typeof light, background: string, overrides: Record<string, string>) {
  const foreground = (color: string) => overrides[color] ?? color;
  return {
    ...theme,
    name: `${theme.name}-aa`,
    colors: { ...theme.colors, 'editor.background': background, 'editor.foreground': foreground(theme.colors!['editor.foreground']) },
    tokenColors: theme.tokenColors!.map(rule => ({
      ...rule,
      settings: { ...rule.settings, ...(rule.settings.foreground ? { foreground: foreground(rule.settings.foreground) } : {}) },
    })),
  };
}

export const daySyntaxTheme = accessibleTheme(light, '#eee8d5', lightOverrides);
export const nightSyntaxTheme = accessibleTheme(dark, '#073642', darkOverrides);
