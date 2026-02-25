import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fetchSkillZip } from './api';

describe('fetchSkillZip', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
        globalThis.fetch = originalFetch;
    });

    function mockFetch(status: number, body: BodyInit = '') {
        globalThis.fetch = vi
            .fn()
            .mockResolvedValue(new Response(body, { status }));
    }

    it('returns ArrayBuffer on 200', async () => {
        const data = new Uint8Array([1, 2, 3]);
        mockFetch(200, data);

        const result = await fetchSkillZip('token', 'react');
        expect(result.byteLength).toBe(3);
    });

    it('throws on 400', async () => {
        mockFetch(400);
        await expect(fetchSkillZip('', 'react')).rejects.toThrow(
            'Missing skill or token',
        );
    });

    it('throws on 403', async () => {
        mockFetch(403);
        await expect(fetchSkillZip('t', 'react')).rejects.toThrow(
            "doesn't grant access",
        );
    });

    it('throws on 404', async () => {
        mockFetch(404);
        await expect(fetchSkillZip('bad', 'react')).rejects.toThrow(
            'Invalid install token',
        );
    });

    it('throws on 410', async () => {
        mockFetch(410);
        await expect(fetchSkillZip('t', 'react')).rejects.toThrow(
            'Download limit reached',
        );
    });

    it('throws on 500', async () => {
        mockFetch(500);
        await expect(fetchSkillZip('t', 'react')).rejects.toThrow(
            'Server error',
        );
    });

    it('throws on network failure', async () => {
        globalThis.fetch = vi
            .fn()
            .mockRejectedValue(new TypeError('fetch failed'));
        await expect(fetchSkillZip('t', 'react')).rejects.toThrow(
            'Network error',
        );
    });
});
