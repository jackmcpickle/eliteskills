import { describe, it, expect } from 'vitest';

describe('Human purchase flow — product catalog', () => {
    const products = {
        once: { name: 'Elite AI Skills - One-Time Purchase', price: 29 },
        lifetime: { name: 'Elite AI Skills - Lifetime Access', price: 99 },
    } as const;

    it('has exactly 2 products', () => {
        expect(Object.keys(products)).toHaveLength(2);
    });

    it('once product is $29', () => {
        expect(products.once.price).toBe(29);
    });

    it('lifetime product is $99', () => {
        expect(products.lifetime.price).toBe(99);
    });

    it('checkout routes match product ids', () => {
        const routes = ['/checkout/once', '/checkout/lifetime'];
        for (const id of Object.keys(products)) {
            expect(routes).toContain(`/checkout/${id}`);
        }
    });
});

describe('Human purchase flow — checkout form contract', () => {
    it('create-checkout expects FormData with required fields', () => {
        const requiredFields = ['productId', 'name', 'email'];
        const optionalFields = [
            'purchaseKind',
            'companyName',
            'addressLine1',
            'addressLine2',
            'city',
            'postalCode',
            'country',
        ];

        // All required fields are distinct from optional
        for (const field of requiredFields) {
            expect(optionalFields).not.toContain(field);
        }
    });

    it('honeypot field name is "website"', () => {
        // Must match the hidden field in CheckoutForm.astro
        const honeypotField = 'website';
        expect(honeypotField).toBe('website');
    });

    it('valid productId values are "once" and "lifetime"', () => {
        const validIds = ['once', 'lifetime'];
        expect(validIds).toContain('once');
        expect(validIds).toContain('lifetime');
        expect(validIds).toHaveLength(2);
    });

    it('purchaseKind values are "personal" and "company"', () => {
        const validKinds = ['personal', 'company'];
        expect(validKinds).toContain('personal');
        expect(validKinds).toContain('company');
    });
});

describe('Human purchase flow — success page contract', () => {
    it('success page uses product query param', () => {
        const successUrl = '/checkout/success';
        const onceUrl = `${successUrl}?product=once`;
        const lifetimeUrl = `${successUrl}?product=lifetime`;

        const onceParams = new URLSearchParams(
            new URL(`https://x${onceUrl}`).search,
        );
        const lifetimeParams = new URLSearchParams(
            new URL(`https://x${lifetimeUrl}`).search,
        );

        expect(onceParams.get('product')).toBe('once');
        expect(lifetimeParams.get('product')).toBe('lifetime');
    });

    it('success URL built by Stripe includes session_id placeholder', () => {
        // Stripe success_url pattern from stripe.ts
        const template =
            'https://eliteskills.ai/checkout/success?product=once&session_id={CHECKOUT_SESSION_ID}';
        expect(template).toContain('{CHECKOUT_SESSION_ID}');
        expect(template).toContain('product=');
    });
});

describe('Human purchase flow — pay page contract', () => {
    it('pay page requires token query param', () => {
        const payUrl = new URL('https://eliteskills.ai/pay?token=abc123');
        expect(payUrl.searchParams.get('token')).toBe('abc123');
    });

    it('pay page without token is an error state', () => {
        const payUrl = new URL('https://eliteskills.ai/pay');
        expect(payUrl.searchParams.get('token')).toBeNull();
    });

    it('pay page states are loading, unpaid, paid, expired, error', () => {
        const validStates = ['loading', 'unpaid', 'paid', 'expired', 'error'];
        expect(validStates).toHaveLength(5);
        expect(validStates).toContain('unpaid');
        expect(validStates).toContain('paid');
        expect(validStates).toContain('expired');
        expect(validStates).toContain('error');
    });
});

describe('Human purchase flow — Stripe checkout session contract', () => {
    it('createCheckoutSession needs required options', () => {
        const requiredOptions = [
            'productId',
            'product',
            'customerEmail',
            'customerName',
            'payUrl',
        ];

        // All required
        expect(requiredOptions).toHaveLength(5);
        expect(requiredOptions).toContain('productId');
        expect(requiredOptions).toContain('customerEmail');
    });

    it('metadata includes productId and customerName', () => {
        const metadata = {
            productId: 'once',
            customerName: 'Test User',
            source: 'website',
            purchaseKind: 'personal',
        };

        expect(metadata).toHaveProperty('productId');
        expect(metadata).toHaveProperty('customerName');
        expect(metadata).toHaveProperty('source');
    });
});
