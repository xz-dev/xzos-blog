/**
 * fastfetch-style uptime ("364 days, 4 hours, 12 mins") from a fixed start.
 * fastfetch prints it in English on every locale, so the home page does too.
 */
const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function formatUptime(since: string, now: number): string {
	const total = Math.max(0, Math.floor((now - Date.parse(since)) / 60000));
	const days = Math.floor(total / 1440);
	const hours = Math.floor((total % 1440) / 60);
	const mins = total % 60;
	const parts = [];
	if (days) parts.push(unit(days, 'day'));
	if (hours) parts.push(unit(hours, 'hour'));
	parts.push(unit(mins, 'min'));
	return parts.join(', ');
}
