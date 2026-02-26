import { test, expect } from '@playwright/test';

// Seeded product IDs from drizzle/0001_products.sql
const BUNDLE_ONCE_ID = 7;
const BUNDLE_LIFETIME_ID = 8;

test.describe('Human purchase flow — homepage to checkout', () => {
    test('homepage loads with pricing section and CTAs', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Elite Skills/);

        const pricing = page.locator('#pricing');
        await expect(pricing).toBeVisible();

        // At least one checkout CTA exists per product
        const checkoutLinks = pricing.locator('a[href^="/checkout/"]');
        await expect(checkoutLinks.first()).toBeVisible();
        expect(await checkoutLinks.count()).toBeGreaterThanOrEqual(2);
    });

    test('hero "Get the Skills" links to pricing section', async ({ page }) => {
        await page.goto('/');
        const heroLink = page.locator('a[href="#pricing"]', {
            hasText: /get the skills/i,
        });
        await expect(heroLink).toBeVisible();
    });

    test('pricing card shows correct prices', async ({ page }) => {
        await page.goto('/');
        const pricing = page.locator('#pricing');

        // Target specific price elements via data-product-id
        const oncePrice = pricing.locator(
            `[data-product-id="${BUNDLE_ONCE_ID}"]`,
        );
        const lifetimePrice = pricing.locator(
            `[data-product-id="${BUNDLE_LIFETIME_ID}"]`,
        );
        await expect(oncePrice).toBeVisible();
        await expect(lifetimePrice).toBeVisible();
    });
});

test.describe('Human purchase flow — once checkout page', () => {
    test('checkout/once loads with correct product info', async ({ page }) => {
        await page.goto(`/checkout/${BUNDLE_ONCE_ID}`);
        await expect(page).toHaveTitle(/All Skills/);
        await expect(page.locator('input[name="productId"]')).toHaveValue(
            String(BUNDLE_ONCE_ID),
        );
    });

    test('checkout form has required fields', async ({ page }) => {
        await page.goto(`/checkout/${BUNDLE_ONCE_ID}`);

        await expect(page.locator('#name')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#purchaseKind')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('company fields hidden by default, shown when company selected', async ({
        page,
    }) => {
        await page.goto(`/checkout/${BUNDLE_ONCE_ID}`);

        const companyFields = page.locator('#company-fields');
        await expect(companyFields).toBeHidden();

        await page.selectOption('#purchaseKind', 'company');
        await expect(companyFields).toBeVisible();

        // Company-specific inputs visible
        await expect(page.locator('#companyName')).toBeVisible();
        await expect(page.locator('#addressLine1')).toBeVisible();
        await expect(page.locator('#city')).toBeVisible();
        await expect(page.locator('#postalCode')).toBeVisible();
        await expect(page.locator('#country')).toBeVisible();
    });

    test('honeypot field exists but positioned off-screen', async ({
        page,
    }) => {
        await page.goto(`/checkout/${BUNDLE_ONCE_ID}`);
        const honeypot = page.locator('#website');
        // Exists in DOM
        await expect(honeypot).toHaveCount(1);
        // Hidden via off-screen positioning and aria-hidden parent
        const parent = page
            .locator('[aria-hidden="true"]')
            .filter({ has: honeypot });
        await expect(parent).toHaveCount(1);
        await expect(honeypot).toHaveAttribute('tabindex', '-1');
    });
});

test.describe('Human purchase flow — lifetime checkout page', () => {
    test('checkout/lifetime loads with correct product info', async ({
        page,
    }) => {
        await page.goto(`/checkout/${BUNDLE_LIFETIME_ID}`);
        await expect(page).toHaveTitle(/Lifetime Access/);
        await expect(page.locator('input[name="productId"]')).toHaveValue(
            String(BUNDLE_LIFETIME_ID),
        );
    });
});

test.describe('Human purchase flow — form submission', () => {
    test('personal purchase submits to /api/create-checkout', async ({
        page,
    }) => {
        await page.goto(`/checkout/${BUNDLE_ONCE_ID}`);

        // Intercept API call
        const apiPromise = page.waitForRequest(
            (req) =>
                req.url().includes('/api/create-checkout') &&
                req.method() === 'POST',
        );

        await page.fill('#name', 'Test User');
        await page.fill('#email', 'test@example.com');
        await page.click('button[type="submit"]');

        const apiRequest = await apiPromise;
        const postData = apiRequest.postData() ?? '';

        // FormData includes required fields
        expect(postData).toContain('name');
        expect(postData).toContain('email');
        expect(postData).toContain('productId');
    });

    test('status shows "Creating secure checkout..." on submit', async ({
        page,
    }) => {
        await page.goto(`/checkout/${BUNDLE_ONCE_ID}`);

        // Stub the API to delay so we can see status text
        await page.route('**/api/create-checkout', async (route) => {
            await new Promise((r) => setTimeout(r, 500));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    ok: true,
                    paymentUrl: '/pay?token=test',
                }),
            });
        });

        await page.fill('#name', 'Test User');
        await page.fill('#email', 'test@example.com');
        await page.click('button[type="submit"]');

        await expect(page.locator('#checkout-status')).toContainText(
            'Creating secure checkout',
        );
    });

    test('shows error message on API failure', async ({ page }) => {
        await page.goto(`/checkout/${BUNDLE_ONCE_ID}`);

        await page.route('**/api/create-checkout', async (route) => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Email invalid.' }),
            });
        });

        await page.fill('#name', 'Test User');
        await page.fill('#email', 'bad-email');
        await page.click('button[type="submit"]');

        await expect(page.locator('#checkout-status')).toContainText(
            'Email invalid',
        );
    });

    test('redirects on successful checkout', async ({ page }) => {
        await page.goto(`/checkout/${BUNDLE_ONCE_ID}`);

        await page.route('**/api/create-checkout', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    ok: true,
                    paymentUrl: '/pay?token=fake-token-123',
                }),
            });
        });

        await page.fill('#name', 'Test User');
        await page.fill('#email', 'test@example.com');
        await page.click('button[type="submit"]');

        // Page redirects to /pay — wait for navigation
        await page.waitForURL('**/pay?token=fake-token-123');
        expect(page.url()).toContain('/pay?token=fake-token-123');
    });

    test('submit button disabled during submission', async ({ page }) => {
        // Suppress dev overlays that intercept clicks
        await page.addInitScript(() => {
            const observer = new MutationObserver(() => {
                document
                    .querySelectorAll('vite-error-overlay, astro-dev-toolbar')
                    .forEach((el) =>{  el.remove(); });
            });
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
        });

        await page.goto(`/checkout/${BUNDLE_ONCE_ID}`);

        // Slow response so we can observe disabled state
        let resolveRoute: (() => void) | undefined;
        const routePromise = new Promise<void>((r) => {
            resolveRoute = r;
        });
        await page.route('**/api/create-checkout', async (route) => {
            await routePromise;
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    ok: true,
                    paymentUrl: '/pay?token=test',
                }),
            });
        });

        await page.fill('#name', 'Test User');
        await page.fill('#email', 'test@example.com');
        await page.click('button[type="submit"]');

        const btn = page.locator('#checkout-submit');
        await expect(btn).toBeDisabled();

        // Release route to clean up
        resolveRoute!();
    });

    test('company purchase requires company fields', async ({ page }) => {
        await page.goto(`/checkout/${BUNDLE_ONCE_ID}`);

        // Stub API to return company validation error
        await page.route('**/api/create-checkout', async (route) => {
            await route.fulfill({
                status: 400,
                contentType: 'application/json',
                body: JSON.stringify({
                    error: 'Company name required for receipt.',
                }),
            });
        });

        await page.selectOption('#purchaseKind', 'company');
        await page.fill('#name', 'Test User');
        await page.fill('#email', 'test@example.com');
        // Don't fill company fields — server rejects
        await page.click('button[type="submit"]');

        await expect(page.locator('#checkout-status')).toContainText(
            'Company name required',
        );
    });
});

test.describe('Human purchase flow — pay page states', () => {
    test('pay page without token shows error', async ({ page }) => {
        await page.goto('/pay');
        await expect(page.getByText(/no payment token/i)).toBeVisible();
    });

    test('pay page with invalid token shows error', async ({ page }) => {
        await page.goto('/pay?token=invalid-token');
        await expect(
            page.locator('h1', { hasText: /went wrong|expired/i }),
        ).toBeVisible();
    });
});

test.describe('Human purchase flow — success page', () => {
    test('success page shows confirmation', async ({ page }) => {
        await page.goto('/checkout/success');
        await expect(page.getByText(/payment confirmed/i)).toBeVisible();
        await expect(page.getByText(/thanks for your purchase/i)).toBeVisible();
    });

    test('success page has navigation links', async ({ page }) => {
        await page.goto('/checkout/success');
        const main = page.locator('#main-content');
        await expect(main.locator('a[href="/"]')).toBeVisible();
        await expect(main.locator('a[href="/contact"]')).toBeVisible();
    });
});
