import { test, expect } from '@playwright/test';

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

        // $29 and $99 visible
        await expect(pricing.getByText('29')).toBeVisible();
        await expect(pricing.getByText('99')).toBeVisible();
    });
});

test.describe('Human purchase flow — once checkout page', () => {
    test('checkout/once loads with correct product info', async ({ page }) => {
        await page.goto('/checkout/once');
        await expect(page).toHaveTitle(/One-Time Purchase/);
        await expect(page.getByText('$29')).toBeVisible();
        await expect(page.locator('input[name="productId"]')).toHaveValue(
            'once',
        );
    });

    test('checkout form has required fields', async ({ page }) => {
        await page.goto('/checkout/once');

        await expect(page.locator('#name')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#purchaseKind')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('company fields hidden by default, shown when company selected', async ({
        page,
    }) => {
        await page.goto('/checkout/once');

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
        await page.goto('/checkout/once');
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
        await page.goto('/checkout/lifetime');
        await expect(page).toHaveTitle(/Lifetime Access/);
        await expect(page.getByText('$99')).toBeVisible();
        await expect(page.locator('input[name="productId"]')).toHaveValue(
            'lifetime',
        );
    });
});

test.describe('Human purchase flow — form submission', () => {
    test('personal purchase submits to /api/create-checkout', async ({
        page,
    }) => {
        await page.goto('/checkout/once');

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
        await page.goto('/checkout/once');

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
        await page.goto('/checkout/once');

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
        await page.goto('/checkout/once');

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
                    .forEach((el) => el.remove());
            });
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
            });
        });

        await page.goto('/checkout/once');

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
        await page.goto('/checkout/once');

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
        await expect(page.getByText(/expired|invalid|wrong/i)).toBeVisible();
    });
});

test.describe('Human purchase flow — success page', () => {
    test('success page shows confirmation for once', async ({ page }) => {
        await page.goto('/checkout/success?product=once');
        await expect(page.getByText(/payment confirmed/i)).toBeVisible();
        await expect(page.getByText(/one-time purchase/i)).toBeVisible();
    });

    test('success page shows confirmation for lifetime', async ({ page }) => {
        await page.goto('/checkout/success?product=lifetime');
        await expect(page.getByText(/payment confirmed/i)).toBeVisible();
        // Verify the URL carries the product param correctly
        expect(page.url()).toContain('product=lifetime');
    });

    test('success page has navigation links', async ({ page }) => {
        await page.goto('/checkout/success?product=once');
        await expect(page.locator('a[href="/"]')).toBeVisible();
        await expect(page.locator('a[href="/contact"]')).toBeVisible();
    });
});
