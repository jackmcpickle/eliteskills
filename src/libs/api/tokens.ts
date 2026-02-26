/**
 * Stateless HMAC-signed tokens for session and pay flows.
 * Uses Web Crypto API (CF Workers compatible).
 */

interface TokenPayload {
    /** Unique token id */
    jti: string;
    /** Issued at (unix seconds) */
    iat: number;
    /** Expires at (unix seconds) */
    exp: number;
    /** Token scope */
    scope: string;
    /** Arbitrary string data */
    data?: string;
}

const encoder = new TextEncoder();

function toBase64Url(buf: Uint8Array | ArrayBuffer): string {
    const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    return Buffer.from(bytes).toString('base64url');
}

function fromBase64Url(str: string): Uint8Array {
    return new Uint8Array(Buffer.from(str, 'base64url'));
}

const keyCache = new Map<string, CryptoKey>();

async function getKey(secret: string): Promise<CryptoKey> {
    const cached = keyCache.get(secret);
    if (cached) return cached;

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify'],
    );
    keyCache.set(secret, key);
    return key;
}

async function hmacSign(payload: string, secret: string): Promise<string> {
    const key = await getKey(secret);
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    return toBase64Url(sig);
}

async function hmacVerify(
    payload: string,
    signature: string,
    secret: string,
): Promise<boolean> {
    const key = await getKey(secret);
    const sigBytes = fromBase64Url(signature);
    return crypto.subtle.verify(
        'HMAC',
        key,
        sigBytes.buffer as ArrayBuffer,
        encoder.encode(payload),
    );
}

function generateJti(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return toBase64Url(bytes.buffer);
}

/** Create a signed token string */
export async function createToken(
    secret: string,
    scope: string,
    ttlSeconds: number,
    data?: string,
): Promise<{ token: string; expiresAt: string; jti: string }> {
    const now = Math.floor(Date.now() / 1000);
    const payload: TokenPayload = {
        jti: generateJti(),
        iat: now,
        exp: now + ttlSeconds,
        scope,
        ...(data !== undefined && { data }),
    };
    const payloadB64 = toBase64Url(encoder.encode(JSON.stringify(payload)));
    const signature = await hmacSign(payloadB64, secret);
    const token = `${payloadB64}.${signature}`;
    return {
        token,
        expiresAt: new Date((now + ttlSeconds) * 1000).toISOString(),
        jti: payload.jti,
    };
}

/** Verify and decode a signed token. Returns null if invalid/expired. */
export async function verifyToken(
    token: string,
    secret: string,
    expectedScope: string,
): Promise<TokenPayload | null> {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    if (!payloadB64 || !signature) return null;

    const valid = await hmacVerify(payloadB64, signature, secret);
    if (!valid) return null;

    try {
        const decoded = new TextDecoder().decode(fromBase64Url(payloadB64));
        const payload = JSON.parse(decoded) as TokenPayload;

        if (payload.scope !== expectedScope) return null;

        const now = Math.floor(Date.now() / 1000);
        if (now > payload.exp) return null;

        return payload;
    } catch {
        return null;
    }
}
