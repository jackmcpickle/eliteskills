/**
 * In-memory rate limiter with named buckets and configurable windows.
 *
 * TODO: Replace with Cloudflare KV or Durable Objects for production-grade
 * persistence across isolates and cold starts. In-memory works for burst
 * protection within a single worker instance.
 */

interface RateLimitConfig {
    /** Max requests allowed in window */
    max: number;
    /** Window size in milliseconds */
    windowMs: number;
}

interface BucketEntry {
    timestamps: number[];
}

const buckets = new Map<string, BucketEntry>();

function prune(entry: BucketEntry, now: number, windowMs: number): void {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
}

/**
 * Check if a key is rate-limited under the given config.
 * Returns true if limit exceeded (should reject).
 */
export function isRateLimited(
    namespace: string,
    key: string,
    config: RateLimitConfig,
): boolean {
    const bucketKey = `${namespace}:${key}`;
    const now = Date.now();

    let entry = buckets.get(bucketKey);
    if (!entry) {
        entry = { timestamps: [] };
        buckets.set(bucketKey, entry);
    }

    prune(entry, now, config.windowMs);

    if (entry.timestamps.length >= config.max) return true;

    entry.timestamps.push(now);
    return false;
}

/* ── Pre-configured rate limit profiles ──────────────────── */

/** /api/payment-session — very strict (agent key mint) */
export const PAYMENT_SESSION_IP = {
    max: 5,
    windowMs: 5 * 60_000,
} satisfies RateLimitConfig;
export const PAYMENT_SESSION_KEY = {
    max: 30,
    windowMs: 60 * 60_000,
} satisfies RateLimitConfig;

/** /api/payment-link — strict (agent creates link) */
export const PAYMENT_LINK_IP = {
    max: 20,
    windowMs: 10 * 60_000,
} satisfies RateLimitConfig;
export const PAYMENT_LINK_JTI = {
    max: 10,
    windowMs: 60 * 60_000,
} satisfies RateLimitConfig;
export const PAYMENT_LINK_EMAIL = {
    max: 5,
    windowMs: 60 * 60_000,
} satisfies RateLimitConfig;

/** /api/create-checkout — public form */
export const CREATE_CHECKOUT_IP = {
    max: 5,
    windowMs: 10 * 60_000,
} satisfies RateLimitConfig;
export const CREATE_CHECKOUT_EMAIL = {
    max: 3,
    windowMs: 60 * 60_000,
} satisfies RateLimitConfig;

/** /pay page — defensive */
export const PAY_PAGE_IP = {
    max: 60,
    windowMs: 10 * 60_000,
} satisfies RateLimitConfig;

/** /api/stripe-webhook — generous but bounded */
export const WEBHOOK_IP = {
    max: 100,
    windowMs: 60_000,
} satisfies RateLimitConfig;
