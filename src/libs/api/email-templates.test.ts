import { describe, it, expect } from 'vitest';
import {
    buildLoginEmail,
    buildAdminEmailText,
    buildCustomerEmail,
} from '@/libs/api/email-templates';
import type { EmailContext } from '@/libs/api/email-templates';

// ── buildLoginEmail output ───────────────────────────────────────

describe('buildLoginEmail output', () => {
    const loginUrl = 'https://eliteskills.ai/api/verify-login?token=abc123';
    const result = buildLoginEmail(loginUrl);

    it('returns { text, html } object', () => {
        expect(result).toHaveProperty('text');
        expect(result).toHaveProperty('html');
        expect(typeof result.text).toBe('string');
        expect(typeof result.html).toBe('string');
    });

    it('text contains login URL', () => {
        expect(result.text).toContain(loginUrl);
    });

    it('text contains expiry warning', () => {
        expect(result.text).toContain('15 minutes');
    });

    it('text contains "ignore this email" security note', () => {
        expect(result.text).toContain('ignore this email');
    });

    it('html contains login URL in <a href>', () => {
        expect(result.html).toContain(`href="${loginUrl}"`);
    });

    it('html contains "Elite Skills" branding', () => {
        expect(result.html).toContain('Elite Skills');
    });

    it('html contains "Log In" button text', () => {
        expect(result.html).toContain('Log In');
    });
});

// ── Customer & admin email coverage ─────────────────────────────

const emailCtx = {
    session: { id: 'sess_123', metadata: { purchaseKind: 'personal' } },
    customerName: 'Alice',
    email: 'alice@example.com',
    source: 'web',
    continent: 'NA',
    amountPaid: '$49.00',
    productName: 'Code Review',
    productCode: 'code-review',
    accountUrl: 'https://eliteskills.ai/account/abc123',
} satisfies EmailContext;

describe('buildAdminEmailText', () => {
    it('contains session, product, and customer info', () => {
        const text = buildAdminEmailText(emailCtx);
        expect(text).toContain('sess_123');
        expect(text).toContain('Code Review');
        expect(text).toContain('alice@example.com');
        expect(text).toContain('$49.00');
    });

    it('includes company name when present', () => {
        const ctx = {
            ...emailCtx,
            session: {
                id: 'sess_456',
                metadata: {
                    purchaseKind: 'company',
                    companyName: 'Acme Inc',
                },
            },
        };
        const text = buildAdminEmailText(ctx);
        expect(text).toContain('Acme Inc');
    });
});

describe('buildCustomerEmail', () => {
    const result = buildCustomerEmail(emailCtx);

    it('returns { text, html }', () => {
        expect(typeof result.text).toBe('string');
        expect(typeof result.html).toBe('string');
    });

    it('text contains account URL and amount', () => {
        expect(result.text).toContain(emailCtx.accountUrl);
        expect(result.text).toContain('$49.00');
    });

    it('html contains account URL and branding', () => {
        expect(result.html).toContain(`href="${emailCtx.accountUrl}"`);
        expect(result.html).toContain('Elite Skills');
    });
});
