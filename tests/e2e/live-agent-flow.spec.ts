import { test, expect } from '@playwright/test';

const LIVE_BASE = 'https://eliteskills.ai';

test.describe('@live @llm Live agent API purchase flow', () => {
    // Single request pair per run to avoid rate-limit burn
    test('full agent flow: session token -> payment link', async ({
        request,
    }) => {
        // Step 1: Create session token (no auth needed, IP rate-limited)
        const sessionRes = await request.post(
            `${LIVE_BASE}/api/cli/payment-session`,
        );

        expect(sessionRes.status()).toBe(200);
        const sessionBody = await sessionRes.json();
        expect(sessionBody.ok).toBe(true);
        expect(sessionBody.sessionToken).toBeTruthy();
        expect(sessionBody.expiresAt).toBeTruthy();

        // Verify expiry is in the future
        const expiresAt = new Date(sessionBody.expiresAt);
        expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

        // Step 2: Create payment link
        const linkRes = await request.post(`${LIVE_BASE}/api/payment-link`, {
            headers: {
                authorization: `Bearer ${sessionBody.sessionToken}`,
                'content-type': 'application/json',
            },
            data: {
                productId: 'once',
                name: 'CI Test User',
                email: 'ci-test@eliteskills.ai',
            },
        });

        expect(linkRes.status()).toBe(200);
        const linkBody = await linkRes.json();
        expect(linkBody.ok).toBe(true);
        expect(linkBody.paymentUrl).toBeTruthy();

        // Validate URL structure
        const paymentUrl = new URL(linkBody.paymentUrl);
        expect(paymentUrl.hostname).toBe('eliteskills.ai');
        expect(paymentUrl.pathname).toBe('/pay');
        expect(paymentUrl.searchParams.get('token')).toBeTruthy();
    });
});

test.describe('@live Live agent API error cases', () => {
    test('payment-link rejects expired/invalid session token', async ({
        request,
    }) => {
        const res = await request.post(`${LIVE_BASE}/api/payment-link`, {
            headers: {
                authorization: 'Bearer invalid-session-token',
                'content-type': 'application/json',
            },
            data: {
                productId: 'once',
                name: 'Test',
                email: 'test@example.com',
            },
        });
        expect(res.status()).toBe(401);
        const body = await res.json();
        expect(body.error).toBeTruthy();
    });

    test('payment-link rejects invalid product', async ({ request }) => {
        // Get valid session token first
        const sessionRes = await request.post(
            `${LIVE_BASE}/api/cli/payment-session`,
        );
        const { sessionToken } = await sessionRes.json();

        const res = await request.post(`${LIVE_BASE}/api/payment-link`, {
            headers: {
                authorization: `Bearer ${sessionToken}`,
                'content-type': 'application/json',
            },
            data: {
                productId: 'nonexistent',
                name: 'Test',
                email: 'test@example.com',
            },
        });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/invalid product/i);
    });

    test('payment-link rejects missing email', async ({ request }) => {
        const sessionRes = await request.post(
            `${LIVE_BASE}/api/cli/payment-session`,
        );
        const { sessionToken } = await sessionRes.json();

        const res = await request.post(`${LIVE_BASE}/api/payment-link`, {
            headers: {
                authorization: `Bearer ${sessionToken}`,
                'content-type': 'application/json',
            },
            data: {
                productId: 'once',
                name: 'Test',
                email: '',
            },
        });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body.error).toBeTruthy();
    });

    test('payment-link rejects incomplete company purchase', async ({
        request,
    }) => {
        const sessionRes = await request.post(
            `${LIVE_BASE}/api/cli/payment-session`,
        );
        const { sessionToken } = await sessionRes.json();

        const res = await request.post(`${LIVE_BASE}/api/payment-link`, {
            headers: {
                authorization: `Bearer ${sessionToken}`,
                'content-type': 'application/json',
            },
            data: {
                productId: 'once',
                name: 'Test',
                email: 'test@example.com',
                purchaseKind: 'company',
                // Missing companyName, address fields
            },
        });
        expect(res.status()).toBe(400);
        const body = await res.json();
        expect(body.error).toMatch(/company/i);
    });
});
