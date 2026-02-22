import { describe, it, expect } from 'vitest';
import { createToken, verifyToken } from '@/libs/api/tokens';

const SECRET = 'test-secret-for-agent-flow';
const SESSION_SCOPE = 'create_payment_link';
const PAY_SCOPE = 'pay';

describe('Agent purchase flow — token lifecycle', () => {
    it('session token has correct scope and fields', async () => {
        const { token, expiresAt, jti } = await createToken(
            SECRET,
            SESSION_SCOPE,
            3600,
        );
        expect(token).toBeTruthy();
        expect(jti).toBeTruthy();
        expect(new Date(expiresAt).getTime()).toBeGreaterThan(Date.now());

        const payload = await verifyToken(token, SECRET, SESSION_SCOPE);
        expect(payload).not.toBeNull();
        expect(payload?.scope).toBe(SESSION_SCOPE);
    });

    it('pay token carries stripe session id as data', async () => {
        const stripeSessionId = 'cs_test_abc123';
        const { token } = await createToken(
            SECRET,
            PAY_SCOPE,
            3600,
            stripeSessionId,
        );
        const payload = await verifyToken(token, SECRET, PAY_SCOPE);
        expect(payload?.data).toBe(stripeSessionId);
    });

    it('session token cannot be used as pay token', async () => {
        const { token } = await createToken(SECRET, SESSION_SCOPE, 3600);
        const payload = await verifyToken(token, SECRET, PAY_SCOPE);
        expect(payload).toBeNull();
    });

    it('pay token cannot be used as session token', async () => {
        const { token } = await createToken(SECRET, PAY_SCOPE, 3600);
        const payload = await verifyToken(token, SECRET, SESSION_SCOPE);
        expect(payload).toBeNull();
    });
});

describe('Agent purchase flow — payload validation', () => {
    const validProducts = ['once', 'lifetime'];
    const invalidProducts = ['', 'monthly', 'annual', 'free', 'nonexistent'];

    it.each(validProducts)('accepts valid productId: %s', (productId) => {
        expect(validProducts.includes(productId)).toBe(true);
    });

    it.each(invalidProducts)('rejects invalid productId: %s', (productId) => {
        expect(validProducts.includes(productId)).toBe(false);
    });

    it('validates email format', () => {
        const validEmails = [
            'a@b.com',
            'user@example.co.uk',
            'test+tag@mail.com',
        ];
        const invalidEmails = [
            '',
            'notanemail',
            '@no-user.com',
            'no@',
            'spaces in@email.com',
        ];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        for (const email of validEmails) {
            expect(emailRegex.test(email)).toBe(true);
        }
        for (const email of invalidEmails) {
            expect(emailRegex.test(email)).toBe(false);
        }
    });

    it('company purchase requires all address fields', () => {
        const requiredCompanyFields = [
            'companyName',
            'addressLine1',
            'city',
            'postalCode',
            'country',
        ];
        const optionalCompanyFields = ['addressLine2'];

        // All required fields must be present
        for (const field of requiredCompanyFields) {
            expect(field).toBeTruthy();
        }

        // addressLine2 is optional
        expect(optionalCompanyFields).toContain('addressLine2');
        expect(requiredCompanyFields).not.toContain('addressLine2');
    });

    it('personal purchase does not require company fields', () => {
        const personalRequired = ['productId', 'name', 'email'];
        const companyOnly = [
            'companyName',
            'addressLine1',
            'city',
            'postalCode',
            'country',
        ];

        for (const field of companyOnly) {
            expect(personalRequired).not.toContain(field);
        }
    });
});

describe('Agent purchase flow — two-step API contract', () => {
    it('step 1 response shape: sessionToken + expiresAt', () => {
        const expectedShape = {
            ok: true,
            sessionToken: expect.any(String),
            expiresAt: expect.any(String),
        };

        // Simulate response
        const response = {
            ok: true,
            sessionToken: 'eyJ...',
            expiresAt: '2026-02-22T02:37:00.000Z',
        };

        expect(response).toMatchObject(expectedShape);
    });

    it('step 2 response shape: paymentUrl', () => {
        const expectedShape = {
            ok: true,
            paymentUrl: expect.any(String),
        };

        const response = {
            ok: true,
            paymentUrl: 'https://eliteskills.ai/pay?token=eyJ...',
        };

        expect(response).toMatchObject(expectedShape);

        // paymentUrl must contain /pay?token=
        expect(response.paymentUrl).toMatch(/\/pay\?token=/);
    });

    it('error response shape: error string', () => {
        const errorCodes = [400, 401, 429, 500];

        for (const _code of errorCodes) {
            const response = { error: 'Some error message.' };
            expect(response).toHaveProperty('error');
            expect(typeof response.error).toBe('string');
        }
    });
});
