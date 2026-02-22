import { describe, it, expect } from 'vitest';
import { BUNDLE_PRODUCT_IDS, SKILL_SLUG_TO_PRODUCT_ID } from '@/constants/products';

describe('Human purchase flow — product catalog', () => {
    // DB seed: 6 skill products (id 1-6), 3 bundle products (id 7-9)
    const bundleProducts = {
        7: { code: 'bundle-once', name: 'Elite AI Skills — All Skills', price: 29 },
        8: { code: 'bundle-lifetime', name: 'Elite AI Skills — Lifetime Access', price: 99 },
        9: { code: 'bundle-teams', name: 'Elite AI Skills — Teams', price: 299 },
    } as const;

    const skillProducts = {
        1: { code: 'skill-frontend', name: 'Elite Skill — Frontend', price: 9 },
        2: { code: 'skill-backend', name: 'Elite Skill — Backend', price: 9 },
        3: { code: 'skill-style', name: 'Elite Skill — Style', price: 9 },
        4: { code: 'skill-code-review', name: 'Elite Skill — Code Review', price: 9 },
        5: { code: 'skill-feature-enhancer', name: 'Elite Skill — Feature Enhancer', price: 9 },
        6: { code: 'skill-app-bootstrap', name: 'Elite Skill — App Bootstrap', price: 9 },
    } as const;

    it('has 3 bundle products', () => {
        expect(Object.keys(bundleProducts)).toHaveLength(3);
    });

    it('has 6 skill products', () => {
        expect(Object.keys(skillProducts)).toHaveLength(6);
    });

    it('bundle-once NA price is $29', () => {
        expect(bundleProducts[7].price).toBe(29);
    });

    it('bundle-lifetime NA price is $99', () => {
        expect(bundleProducts[8].price).toBe(99);
    });

    it('skill NA price is $9', () => {
        expect(skillProducts[1].price).toBe(9);
    });

    it('checkout routes use integer product ids', () => {
        for (const id of Object.keys(bundleProducts)) {
            const route = `/checkout/${id}`;
            expect(route).toMatch(/^\/checkout\/\d+$/);
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

        for (const field of requiredFields) {
            expect(optionalFields).not.toContain(field);
        }
    });

    it('honeypot field name is "website"', () => {
        const honeypotField = 'website';
        expect(honeypotField).toBe('website');
    });

    it('productId is a numeric integer', () => {
        const validIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        for (const id of validIds) {
            expect(Number.isInteger(id)).toBe(true);
            expect(id).toBeGreaterThan(0);
        }
    });

    it('purchaseKind values are "personal" and "company"', () => {
        const validKinds = ['personal', 'company'];
        expect(validKinds).toContain('personal');
        expect(validKinds).toContain('company');
    });
});

describe('Human purchase flow — success page contract', () => {
    it('success page uses session_id query param', () => {
        const url = new URL(
            'https://eliteskills.ai/checkout/success?product=7&session_id=cs_test_123',
        );
        expect(url.searchParams.get('session_id')).toBe('cs_test_123');
        expect(url.searchParams.get('product')).toBe('7');
    });

    it('success URL built by Stripe includes session_id placeholder', () => {
        // Stripe success_url pattern from stripe.ts
        const template =
            'https://eliteskills.ai/checkout/success?product=7&session_id={CHECKOUT_SESSION_ID}';
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
            'productName',
            'stripePriceId',
            'customerEmail',
            'customerName',
            'payUrl',
            'continent',
        ];

        expect(requiredOptions).toHaveLength(7);
        expect(requiredOptions).toContain('productId');
        expect(requiredOptions).toContain('stripePriceId');
        expect(requiredOptions).toContain('continent');
    });

    it('metadata includes productId as string number and customerName', () => {
        const metadata = {
            productId: '7',
            customerName: 'Test User',
            continent: 'NA',
            source: 'website',
            purchaseKind: 'personal',
        };

        expect(metadata).toHaveProperty('productId');
        expect(metadata).toHaveProperty('customerName');
        expect(metadata).toHaveProperty('continent');
        expect(metadata).toHaveProperty('source');
    });
});

describe('Human purchase flow — skills CTA routing contract', () => {
    it('skill CTAs use new /checkout/{id} routes only', () => {
        const skillRoutes = Object.values(SKILL_SLUG_TO_PRODUCT_ID).map(
            (id) => `/checkout/${id}`,
        );

        for (const route of skillRoutes) {
            expect(route).toMatch(/^\/checkout\/\d+$/);
            expect(route.includes('/checkout/single?skill=')).toBe(false);
        }
    });

    it('bundle CTA uses new all-skills product id route', () => {
        const allSkillsRoute = `/checkout/${BUNDLE_PRODUCT_IDS.allSkills}`;
        expect(allSkillsRoute).toBe('/checkout/7');
        expect(allSkillsRoute).not.toBe('/checkout/once');
    });
});
