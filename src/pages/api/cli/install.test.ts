import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetInstallKeyByKey = vi.fn();
const mockGetPurchaseById = vi.fn();
const mockGetProductById = vi.fn();
const mockIncrementDownloadCount = vi.fn();

vi.mock('@/libs/db/client', () => ({
    createDb: () => 'mock-db',
}));

vi.mock('@/libs/db/repo', () => ({
    getInstallKeyByKey: (...args: unknown[]) => mockGetInstallKeyByKey(...args),
    getPurchaseById: (...args: unknown[]) => mockGetPurchaseById(...args),
    getProductById: (...args: unknown[]) => mockGetProductById(...args),
    incrementDownloadCount: (...args: unknown[]) =>
        mockIncrementDownloadCount(...args),
}));

vi.mock('@/libs/download', () => ({
    resolveDownloadZip: (slug: string) => ({
        zipFile: `skills-${slug}.zip`,
        fileName: `elite-skill-${slug}.zip`,
    }),
}));

// Dynamic import after mocks
const { POST } = await import('./install');

function makeRequest(body: unknown): Request {
    return new Request('http://localhost/api/cli/install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const fakeLocals = {
    runtime: {
        env: {
            DB: {},
            ASSETS: {
                fetch: vi
                    .fn()
                    .mockResolvedValue(new Response(new Uint8Array([1, 2]))),
            },
        },
    },
};

function callPost(body: unknown) {
    return (POST as Function)({
        request: makeRequest(body),
        locals: fakeLocals,
    });
}

describe('POST /api/cli/install', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fakeLocals.runtime.env.ASSETS.fetch = vi
            .fn()
            .mockResolvedValue(new Response(new Uint8Array([1, 2])));
    });

    it('returns 400 for missing fields', async () => {
        const res = await callPost({});
        expect(res.status).toBe(400);
    });

    it('returns 400 for missing token', async () => {
        const res = await callPost({ skill: 'react' });
        expect(res.status).toBe(400);
    });

    it('returns 400 for missing skill', async () => {
        const res = await callPost({ token: 'abc' });
        expect(res.status).toBe(400);
    });

    it('returns 404 for invalid token', async () => {
        mockGetInstallKeyByKey.mockResolvedValue(undefined);

        const res = await callPost({ token: 'bad', skill: 'react' });
        expect(res.status).toBe(404);
    });

    it('returns 410 when download limit reached', async () => {
        mockGetInstallKeyByKey.mockResolvedValue({
            id: 'k1',
            purchaseId: 'p1',
            downloadCount: 5,
            maxDownloads: 5,
        });

        const res = await callPost({ token: 'limited', skill: 'react' });
        expect(res.status).toBe(410);
    });

    it('returns 404 when purchase not found', async () => {
        mockGetInstallKeyByKey.mockResolvedValue({
            id: 'k1',
            purchaseId: 'p1',
            downloadCount: 0,
            maxDownloads: null,
        });
        mockGetPurchaseById.mockResolvedValue(undefined);

        const res = await callPost({ token: 'tok', skill: 'react' });
        expect(res.status).toBe(404);
    });

    it('returns 404 when product not found', async () => {
        mockGetInstallKeyByKey.mockResolvedValue({
            id: 'k1',
            purchaseId: 'p1',
            downloadCount: 0,
            maxDownloads: null,
        });
        mockGetPurchaseById.mockResolvedValue({ id: 'p1', productId: 1 });
        mockGetProductById.mockResolvedValue(undefined);

        const res = await callPost({ token: 'tok', skill: 'react' });
        expect(res.status).toBe(404);
    });

    it('returns 403 when skill mismatch', async () => {
        mockGetInstallKeyByKey.mockResolvedValue({
            id: 'k1',
            purchaseId: 'p1',
            downloadCount: 0,
            maxDownloads: null,
        });
        mockGetPurchaseById.mockResolvedValue({ id: 'p1', productId: 1 });
        mockGetProductById.mockResolvedValue({
            id: 1,
            skillSlug: 'backend',
        });

        const res = await callPost({ token: 'tok', skill: 'react' });
        expect(res.status).toBe(403);
    });

    it('returns 200 zip for matching single skill', async () => {
        mockGetInstallKeyByKey.mockResolvedValue({
            id: 'k1',
            purchaseId: 'p1',
            downloadCount: 0,
            maxDownloads: null,
        });
        mockGetPurchaseById.mockResolvedValue({ id: 'p1', productId: 1 });
        mockGetProductById.mockResolvedValue({
            id: 1,
            skillSlug: 'react',
        });

        const res = await callPost({ token: 'tok', skill: 'react' });
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('application/zip');
        expect(mockIncrementDownloadCount).toHaveBeenCalledWith(
            'mock-db',
            'k1',
        );
    });

    it('returns 200 zip for bundle token with any skill', async () => {
        mockGetInstallKeyByKey.mockResolvedValue({
            id: 'k1',
            purchaseId: 'p1',
            downloadCount: 0,
            maxDownloads: null,
        });
        mockGetPurchaseById.mockResolvedValue({ id: 'p1', productId: 1 });
        mockGetProductById.mockResolvedValue({
            id: 1,
            skillSlug: null,
        });

        const res = await callPost({ token: 'tok', skill: 'react' });
        expect(res.status).toBe(200);
        expect(res.headers.get('content-type')).toBe('application/zip');
    });
});
