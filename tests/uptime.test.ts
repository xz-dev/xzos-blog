import assert from 'node:assert/strict';
import test from 'node:test';
import { formatUptime } from '../src/lib/uptime.ts';

const since = '2025-11-16T00:00:00+08:00';
const at = (iso: string) => Date.parse(iso);

test('uptime counts days, hours and minutes like fastfetch', () => {
	assert.equal(formatUptime(since, at('2026-11-15T04:12:00+08:00')), '364 days, 4 hours, 12 mins');
	assert.equal(formatUptime(since, at('2025-11-17T01:01:00+08:00')), '1 day, 1 hour, 1 min');
	assert.equal(formatUptime(since, at('2025-11-16T00:05:00+08:00')), '5 mins');
});

test('uptime never goes negative before the start', () => {
	assert.equal(formatUptime(since, at('2025-11-15T00:00:00+08:00')), '0 mins');
});
