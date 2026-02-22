import { describe, it, expect, beforeEach } from 'vitest';
import {
	parseFormField,
	checkHoneypot,
	checkRateLimit,
	parseBearer,
	timingSafeEqual,
	parseJsonBody,
	jsonError,
	jsonOk,
} from './spam';

function makeFormData(fields: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.append(k, v);
	return fd;
}

describe('parseFormField', () => {
	it('returns trimmed string value', () => {
		expect(parseFormField(makeFormData({ name: '  Alice  ' }), 'name')).toBe('Alice');
	});

	it('returns empty string for missing field', () => {
		expect(parseFormField(makeFormData({}), 'name')).toBe('');
	});

	it('returns empty string for non-string value (File)', () => {
		const fd = new FormData();
		fd.append('file', new Blob(['x']), 'test.txt');
		expect(parseFormField(fd, 'file')).toBe('');
	});
});

describe('checkHoneypot', () => {
	it('returns false when website field is empty', () => {
		expect(checkHoneypot(makeFormData({ website: '' }))).toBe(false);
	});

	it('returns false when website field is missing', () => {
		expect(checkHoneypot(makeFormData({}))).toBe(false);
	});

	it('returns true when website field is filled (bot)', () => {
		expect(checkHoneypot(makeFormData({ website: 'http://spam.com' }))).toBe(true);
	});
});

describe('checkRateLimit', () => {
	// Rate limit state is module-scoped, use unique IPs per test
	it('allows requests under limit', () => {
		const ip = `rl-under-${Date.now()}`;
		for (let i = 0; i < 5; i += 1) {
			expect(checkRateLimit(ip)).toBe(false);
		}
	});

	it('blocks after 5 requests', () => {
		const ip = `rl-over-${Date.now()}`;
		for (let i = 0; i < 5; i += 1) checkRateLimit(ip);
		expect(checkRateLimit(ip)).toBe(true);
	});

	it('different IPs tracked separately', () => {
		const ip1 = `rl-sep-a-${Date.now()}`;
		const ip2 = `rl-sep-b-${Date.now()}`;
		for (let i = 0; i < 5; i += 1) checkRateLimit(ip1);
		expect(checkRateLimit(ip2)).toBe(false);
	});
});

describe('parseBearer', () => {
	it('extracts bearer token', () => {
		const req = new Request('http://x', { headers: { authorization: 'Bearer abc123' } });
		expect(parseBearer(req)).toBe('abc123');
	});

	it('returns empty for missing header', () => {
		const req = new Request('http://x');
		expect(parseBearer(req)).toBe('');
	});

	it('returns empty for non-Bearer scheme', () => {
		const req = new Request('http://x', { headers: { authorization: 'Basic abc' } });
		expect(parseBearer(req)).toBe('');
	});

	it('trims whitespace from token', () => {
		const req = new Request('http://x', { headers: { authorization: 'Bearer  tok  ' } });
		expect(parseBearer(req)).toBe('tok');
	});
});

describe('timingSafeEqual', () => {
	it('returns true for equal strings', async () => {
		expect(await timingSafeEqual('secret', 'secret')).toBe(true);
	});

	it('returns false for different strings', async () => {
		expect(await timingSafeEqual('secret', 'other')).toBe(false);
	});

	it('returns false for empty vs non-empty', async () => {
		expect(await timingSafeEqual('', 'x')).toBe(false);
	});

	it('returns true for both empty', async () => {
		expect(await timingSafeEqual('', '')).toBe(true);
	});
});

describe('parseJsonBody', () => {
	it('parses valid JSON', async () => {
		const req = new Request('http://x', {
			method: 'POST',
			body: JSON.stringify({ a: 1 }),
			headers: { 'content-type': 'application/json' },
		});
		expect(await parseJsonBody(req)).toEqual({ a: 1 });
	});

	it('returns null for invalid JSON', async () => {
		const req = new Request('http://x', { method: 'POST', body: 'not json' });
		expect(await parseJsonBody(req)).toBeNull();
	});
});

describe('jsonError', () => {
	it('returns correct status and body', async () => {
		const res = jsonError('bad', 400);
		expect(res.status).toBe(400);
		expect(res.headers.get('content-type')).toBe('application/json');
		expect(await res.json()).toEqual({ error: 'bad' });
	});
});

describe('jsonOk', () => {
	it('returns 200 with default body', async () => {
		const res = jsonOk();
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true });
	});

	it('returns 200 with custom body', async () => {
		const res = jsonOk({ ok: true, token: 'abc' });
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ ok: true, token: 'abc' });
	});
});
