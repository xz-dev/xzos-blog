export interface PostDateDisplay {
  datetime: string;
  text: string;
}

const dateSource = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : value instanceof Date ? value.toISOString() : undefined;

// A Date retains the instant but loses the author's original UTC offset and precision.
// Capture both fields before the content schema coerces them for sorting and RSS.
export function captureDateSources(input: unknown): unknown {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const data = input as Record<string, unknown>;
  return { ...data, pubDateSource: dateSource(data.pubDate), updatedDateSource: dateSource(data.updatedDate) };
}

export function formatPostDate(date: Date, original?: string): PostDateDisplay {
  if (!Number.isFinite(date.getTime())) throw new RangeError('Invalid post date');
  const source = original ?? date.toISOString();
  const match = /^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?)(Z|[+-]\d{2}:\d{2}))?$/.exec(source);
  if (!match || new Date(source).getTime() !== date.getTime()) {
    throw new RangeError('Use a quoted ISO 8601 date or timestamp with its recorded UTC offset');
  }
  const [, day, clock, zone] = match;
  if (!clock) {
    if (date.toISOString().slice(0, 10) !== day) throw new RangeError('Invalid calendar date');
    return { datetime: source, text: day };
  }
  const offset = zone === 'Z' ? '+00:00' : zone;
  const minutes = (offset[0] === '-' ? -1 : 1) * (Number(offset.slice(1, 3)) * 60 + Number(offset.slice(4, 6)));
  const localISO = new Date(date.getTime() + minutes * 60_000).toISOString();
  if (!localISO.startsWith(`${day}T${clock}`)) throw new RangeError('Invalid local calendar date or time');
  return { datetime: source, text: `${day} ${clock} UTC${offset}` };
}
