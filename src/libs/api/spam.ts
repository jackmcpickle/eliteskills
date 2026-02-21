/**
 * Anti-spam: honeypot + in-memory rate limit.
 *
 * Honeypot: hidden field `website` must be empty — bots auto-fill it.
 * Rate limit: max N requests per IP in a rolling window.
 *
 * TODO: In-memory rate limiter resets on CF Workers cold starts and doesn't
 * share state across isolates. Replace with Cloudflare KV or Durable Objects
 * for production-grade rate limiting.
 */

const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;

interface RateEntry {
	timestamps: number[];
}

const rateBucket = new Map<string, RateEntry>();

const pruneOld = (entry: RateEntry, now: number): void => {
	entry.timestamps = entry.timestamps.filter((t) => now - t < RATE_WINDOW_MS);
};

export const parseFormField = (formData: FormData, field: string): string => {
	const value = formData.get(field);
	if (typeof value !== 'string') return '';
	return value.trim();
};

export const checkHoneypot = (formData: FormData): boolean => {
	const honeypot = parseFormField(formData, 'website');
	return honeypot.length > 0;
};

export const checkRateLimit = (ip: string): boolean => {
	const now = Date.now();
	let entry = rateBucket.get(ip);

	if (!entry) {
		entry = { timestamps: [] };
		rateBucket.set(ip, entry);
	}

	pruneOld(entry, now);

	if (entry.timestamps.length >= RATE_MAX) return true;

	entry.timestamps.push(now);
	return false;
};

export const jsonError = (error: string, status: number): Response =>
	new Response(JSON.stringify({ error }), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});

export const jsonOk = (data: Record<string, unknown> = { ok: true }): Response =>
	new Response(JSON.stringify(data), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
