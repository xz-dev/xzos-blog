// A small reader for flat CSS rules, shared by the stylesheet tests. It sees
// plain `selector { declarations }` blocks only (at-rules and their bodies
// are not parsed as rules), with comments stripped.

export type CssRule = { selector: string; body: string };

/** Selector lists split at top-level commas only, so `:is(h2, h3)` stays whole. */
export const splitSelectors = (list: string) => list.split(/,(?![^(]*\))/).map((x) => x.trim());

export function cssRules(css: string): CssRule[] {
	return [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
		.map((rule) => ({ selector: rule[1], body: rule[2] }));
}

/** The declarations of every rule whose selector list names `selector`, joined. */
export function ruleFor(rules: CssRule[], selector: string): string {
	return rules.filter((rule) => splitSelectors(rule.selector).includes(selector)).map((rule) => rule.body).join('');
}
