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

function pruneOld(entry: RateEntry, now: number): void {
	entry.timestamps = entry.timestamps.filter((t) => now - t < RATE_WINDOW_MS);
}

export function parseFormField(formData: FormData, field: string): string {
	const value = formData.get(field);
	if (typeof value !== 'string') return '';
	return value.trim();
}

export function checkHoneypot(formData: FormData): boolean {
	const honeypot = parseFormField(formData, 'website');
	return honeypot.length > 0;
}

export function checkRateLimit(ip: string): boolean {
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
}

/** Extract bearer token from Authorization header. Returns empty string if missing/malformed. */
export function parseBearer(request: Request): string {
	const header = request.headers.get('authorization') ?? '';
	if (!header.startsWith('Bearer ')) return '';
	return header.slice(7).trim();
}

/**
 * Constant-time string comparison to prevent timing attacks.
 * Uses Web Crypto API digest for safe comparison on CF Workers.
 */
export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
	const encoder = new TextEncoder();
	const keyA = await crypto.subtle.digest('SHA-256', encoder.encode(a));
	const keyB = await crypto.subtle.digest('SHA-256', encoder.encode(b));
	const bufA = new Uint8Array(keyA);
	const bufB = new Uint8Array(keyB);
	if (bufA.length !== bufB.length) return false;
	let mismatch = 0;
	for (let i = 0; i < bufA.length; i += 1) mismatch |= bufA[i] ^ bufB[i];
	return mismatch === 0;
}

/** Parse a JSON request body. Returns null on failure. */
export async function parseJsonBody<T = Record<string, unknown>>(request: Request): Promise<T | null> {
	try {
		return (await request.json()) as T;
	} catch {
		return null;
	}
}

export function jsonError(error: string, status: number): Response {
	return new Response(JSON.stringify({ error }), {
		status,
		headers: { 'Content-Type': 'application/json' },
	});
}

export function jsonOk(data: Record<string, unknown> = { ok: true }): Response {
	return new Response(JSON.stringify(data), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
}
