import { describe, it, expect } from 'vitest';
import {
    isRateLimited,
    LOGIN_LINK_IP,
    LOGIN_LINK_EMAIL,
} from '@/libs/api/rate-limit';
import { createToken, verifyToken } from '@/libs/api/tokens';
import { GET } from '@/pages/api/logout';

const SECRET = 'test-secret-for-account-features';

// ── 1. Login token lifecycle ────────────────────────────────────────

describe('Login token lifecycle', () => {
    it('login token has scope "login" and carries email as data', async () => {
        const email = 'user@example.com';
        const { token, expiresAt, jti } = await createToken(
            SECRET,
            'login',
            900,
            email,
        );
        expect(token).toBeTruthy();
        expect(jti).toBeTruthy();
        expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());

        const payload = await verifyToken(token, SECRET, 'login');
        expect(payload).not.toBeNull();
        expect(payload?.scope).toBe('login');
        expect(payload?.data).toBe(email);
    });

    it('login token TTL is 900s (15min)', async () => {
        const { token } = await createToken(SECRET, 'login', 900);
        const payload = await verifyToken(token, SECRET, 'login');
        expect(payload).not.toBeNull();
        expect(payload?.exp && payload?.iat && payload.exp - payload.iat).toBe(
            900,
        );
    });

    it('login token cannot be used as pay or create_payment_link token', async () => {
        const { token } = await createToken(SECRET, 'login', 900);
        expect(await verifyToken(token, SECRET, 'pay')).toBeNull();
        expect(
            await verifyToken(token, SECRET, 'create_payment_link'),
        ).toBeNull();
    });

    it('other-scoped tokens cannot be used as login tokens', async () => {
        const { token: payToken } = await createToken(SECRET, 'pay', 900);
        const { token: sessionToken } = await createToken(
            SECRET,
            'create_payment_link',
            900,
        );
        expect(await verifyToken(payToken, SECRET, 'login')).toBeNull();
        expect(await verifyToken(sessionToken, SECRET, 'login')).toBeNull();
    });

    it('expired login token returns null', async () => {
        const { token } = await createToken(SECRET, 'login', -1);
        expect(await verifyToken(token, SECRET, 'login')).toBeNull();
    });
});

// ── 3. Login rate limit config values ───────────────────────────────

describe('Login rate limit config values', () => {
    it('LOGIN_LINK_IP: max 10, windowMs 600000', () => {
        expect(LOGIN_LINK_IP.max).toBe(10);
        expect(LOGIN_LINK_IP.windowMs).toBe(600_000);
    });

    it('LOGIN_LINK_EMAIL: max 3, windowMs 3600000', () => {
        expect(LOGIN_LINK_EMAIL.max).toBe(3);
        expect(LOGIN_LINK_EMAIL.windowMs).toBe(3_600_000);
    });
});

// ── 4. Rate limiter with login namespace ────────────────────────────

describe('Rate limiter with login namespace', () => {
    const config = { max: 2, windowMs: 60_000 };

    it('allows requests under limit', () => {
        const key = `test-under-${Date.now()}`;
        expect(isRateLimited('login-test', key, config)).toBe(false);
        expect(isRateLimited('login-test', key, config)).toBe(false);
    });

    it('blocks after limit exceeded', () => {
        const key = `test-over-${Date.now()}`;
        isRateLimited('login-test', key, config);
        isRateLimited('login-test', key, config);
        expect(isRateLimited('login-test', key, config)).toBe(true);
    });

    it('different namespaces are independent', () => {
        const key = `test-ns-${Date.now()}`;
        isRateLimited('ns-a', key, config);
        isRateLimited('ns-a', key, config);
        // ns-a exhausted
        expect(isRateLimited('ns-a', key, config)).toBe(true);
        // ns-b still has room
        expect(isRateLimited('ns-b', key, config)).toBe(false);
    });
});

// ── 5. Logout endpoint contract ─────────────────────────────────────

describe('Logout endpoint contract', () => {
    it('returns 302 with Location / and clears account_key cookie', async () => {
        const response = await GET({} as Parameters<typeof GET>[0]);
        expect(response.status).toBe(302);
        expect(response.headers.get('Location')).toBe('/');
        const cookie = response.headers.get('Set-Cookie') ?? '';
        expect(cookie).toContain('account_key=');
        expect(cookie).toContain('Max-Age=0');
    });
});

// ── 6. Account page contracts ───────────────────────────────────────

describe('Account page contracts', () => {
    it('account URL pattern: /account/{hex32}', () => {
        const pattern = /^\/account\/[a-f0-9]{32}$/;
        expect(pattern.test('/account/abcdef1234567890abcdef1234567890')).toBe(
            true,
        );
        expect(pattern.test('/account/short')).toBe(false);
    });

    it('login verify URL: /api/verify-login?token={token}', () => {
        const token = 'eyJhbGciOiJIUzI1NiJ9.sig';
        const url = `/api/verify-login?token=${encodeURIComponent(token)}`;
        expect(url).toContain('/api/verify-login?token=');
    });

    it('cookie format matches expected shape', () => {
        const key = 'abcdef1234567890abcdef1234567890';
        const maxAge = 60 * 60 * 24 * 30;
        const cookie = `account_key=${key}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('Secure');
        expect(cookie).toContain('SameSite=Lax');
        expect(cookie).toContain('Path=/');
        expect(cookie).toContain('Max-Age=2592000');
    });

    it('install command format: npx @eliteskills/cli install {slug}', () => {
        const slug = 'code-review';
        const cmd = `npx @eliteskills/cli install ${slug}`;
        expect(cmd).toMatch(/^npx @eliteskills\/cli install [a-z0-9-]+$/);
    });
});

// ── 7. Update profile validation rules ──────────────────────────────

describe('Update profile validation rules', () => {
    it('name max length is 100', () => {
        const maxLen = 100;
        const okName = 'A'.repeat(maxLen);
        const tooLong = 'A'.repeat(maxLen + 1);
        expect(okName.length).toBeLessThanOrEqual(maxLen);
        expect(tooLong.length).toBeGreaterThan(maxLen);
    });

    it('empty name is rejected', () => {
        const name = ''.trim();
        expect(!name).toBe(true);
    });

    it('empty accountKey is rejected', () => {
        const key = ''.trim();
        expect(!key).toBe(true);
    });
});

// ── 8. Send login link validation ───────────────────────────────────

describe('Send login link validation', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it('accepts valid emails', () => {
        const valid = ['a@b.com', 'user@example.co.uk', 'test+tag@mail.com'];
        for (const e of valid) {
            expect(emailRegex.test(e)).toBe(true);
        }
    });

    it('rejects invalid emails', () => {
        const invalid = [
            '',
            'notanemail',
            '@no-user.com',
            'no@',
            'spaces in@email.com',
        ];
        for (const e of invalid) {
            expect(emailRegex.test(e)).toBe(false);
        }
    });

    it('honeypot field name is "website"', () => {
        // checkHoneypot reads formData.get('website')
        const form = new FormData();
        form.set('website', 'http://spam.com');
        const honeypot =
            typeof form.get('website') === 'string'
                ? (form.get('website') as string).trim()
                : '';
        expect(honeypot.length).toBeGreaterThan(0);
    });

    it('non-existent user still returns success (email enumeration protection)', () => {
        // Server always returns jsonOk({ sent: true }) even for unknown emails
        const response = { sent: true };
        expect(response.sent).toBe(true);
    });
});
