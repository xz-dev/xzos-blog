/**
 * Splits a prompt's command line into plain text and path arguments, so a
 * prompt can draw paths in --term-path the way a shell highlights them. The
 * parts join back to the exact input: copy and paste never change.
 */
export interface CommandPart {
	text: string;
	/** A path argument (`~`, `~/blog`, `/etc`). */
	path?: true;
}

// A word that starts a path: `~` or `/`, at the line's start or after a space.
const PATH = /(?<=^|\s)[~/][^\s|;&<>]*/g;

export function commandParts(command: string): CommandPart[] {
	const parts: CommandPart[] = [];
	let last = 0;
	for (const match of command.matchAll(PATH)) {
		if (match.index > last) parts.push({ text: command.slice(last, match.index) });
		parts.push({ text: match[0], path: true });
		last = match.index + match[0].length;
	}
	if (last < command.length) parts.push({ text: command.slice(last) });
	return parts;
}

/** A synopsis (`ls [-a]`) as its command name and the rest (` [-a]`). */
export function splitName(synopsis: string): [string, string] {
	const end = synopsis.search(/\s|$/);
	return [synopsis.slice(0, end), synopsis.slice(end)];
}
