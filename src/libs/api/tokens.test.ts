import { describe, it, expect, vi } from 'vitest';
import { createToken, verifyToken } from './tokens';

const SECRET = 'test-secret-key-for-tokens';

describe('createToken', () => {
    it('returns token string, expiresAt, and jti', async () => {
        const result = await createToken(SECRET, 'test', 3600);
        expect(result.token).toMatch(/^[\w-]+\.[\w-]+$/);
        expect(result.jti).toBeTruthy();
        expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(
            Date.now(),
        );
    });

    it('includes data when provided', async () => {
        const result = await createToken(SECRET, 'pay', 3600, 'session-123');
        const payload = await verifyToken(result.token, SECRET, 'pay');
        expect(payload?.data).toBe('session-123');
    });

    it('generates unique jtis', async () => {
        const a = await createToken(SECRET, 'test', 3600);
        const b = await createToken(SECRET, 'test', 3600);
        expect(a.jti).not.toBe(b.jti);
    });
});

describe('verifyToken', () => {
    it('verifies valid token', async () => {
        const { token } = await createToken(SECRET, 'myScope', 3600);
        const payload = await verifyToken(token, SECRET, 'myScope');
        expect(payload).not.toBeNull();
        expect(payload?.scope).toBe('myScope');
    });

    it('rejects wrong secret', async () => {
        const { token } = await createToken(SECRET, 'test', 3600);
        expect(await verifyToken(token, 'wrong-secret', 'test')).toBeNull();
    });

    it('rejects wrong scope', async () => {
        const { token } = await createToken(SECRET, 'test', 3600);
        expect(await verifyToken(token, SECRET, 'other')).toBeNull();
    });

    it('rejects expired token', async () => {
        vi.useFakeTimers();
        const { token } = await createToken(SECRET, 'test', 10);
        vi.advanceTimersByTime(11_000);
        expect(await verifyToken(token, SECRET, 'test')).toBeNull();
        vi.useRealTimers();
    });

    it('rejects tampered token', async () => {
        const { token } = await createToken(SECRET, 'test', 3600);
        const tampered = 'x' + token.slice(1);
        expect(await verifyToken(tampered, SECRET, 'test')).toBeNull();
    });

    it('rejects malformed token', async () => {
        expect(await verifyToken('not-a-token', SECRET, 'test')).toBeNull();
        expect(await verifyToken('', SECRET, 'test')).toBeNull();
        expect(await verifyToken('a.b.c', SECRET, 'test')).toBeNull();
    });
});
