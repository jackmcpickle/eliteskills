import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isRateLimited } from './rate-limit';

describe('isRateLimited', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('allows requests under max', () => {
        const config = { max: 3, windowMs: 60_000 };
        expect(isRateLimited('test', 'key1', config)).toBe(false);
        expect(isRateLimited('test', 'key1', config)).toBe(false);
        expect(isRateLimited('test', 'key1', config)).toBe(false);
    });

    it('blocks after max reached', () => {
        const config = { max: 2, windowMs: 60_000 };
        const ns = `block-${Date.now()}`;
        isRateLimited(ns, 'k', config);
        isRateLimited(ns, 'k', config);
        expect(isRateLimited(ns, 'k', config)).toBe(true);
    });

    it('resets after window expires', () => {
        const config = { max: 1, windowMs: 10_000 };
        const ns = `expire-${Date.now()}`;
        expect(isRateLimited(ns, 'k', config)).toBe(false);
        expect(isRateLimited(ns, 'k', config)).toBe(true);

        vi.advanceTimersByTime(10_001);
        expect(isRateLimited(ns, 'k', config)).toBe(false);
    });

    it('namespaces are independent', () => {
        const config = { max: 1, windowMs: 60_000 };
        const key = `ind-${Date.now()}`;
        expect(isRateLimited('ns-a', key, config)).toBe(false);
        expect(isRateLimited('ns-b', key, config)).toBe(false);
    });

    it('keys within same namespace are independent', () => {
        const config = { max: 1, windowMs: 60_000 };
        const ns = `keys-${Date.now()}`;
        expect(isRateLimited(ns, 'a', config)).toBe(false);
        expect(isRateLimited(ns, 'b', config)).toBe(false);
    });
});
