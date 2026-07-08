import { test, expect } from '@playwright/test';

test.describe('Human site flow — homepage', () => {
    test('homepage loads with skills section and install CTA', async ({
        page,
    }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Elite Skills/);

        const skills = page.locator('#skills');
        await expect(skills).toBeVisible();

        await expect(
            page.getByRole('heading', { name: /Teach Your AI/i }),
        ).toBeVisible();
    });

    test('hero "See What\'s Inside" links to skills section', async ({
        page,
    }) => {
        await page.goto('/');
        const heroLink = page.locator('a[href="#skills"]', {
            hasText: /see what's inside/i,
        });
        await expect(heroLink).toBeVisible();
    });

    test('skills grid links to skill detail pages', async ({ page }) => {
        await page.goto('/');
        const skills = page.locator('#skills');
        const skillLinks = skills.locator('a[href^="/skills/"]');
        await expect(skillLinks.first()).toBeVisible();
        expect(await skillLinks.count()).toBeGreaterThanOrEqual(3);
    });
});

test.describe('Human site flow — skills index', () => {
    test('/skills loads with skill list', async ({ page }) => {
        await page.goto('/skills');
        await expect(page).toHaveTitle(/Skills — Elite Skills/);
        await expect(page.locator('a[href^="/skills/"]').first()).toBeVisible();
    });
});

test.describe('Human site flow — skill detail', () => {
    test('skill detail page renders content', async ({ page }) => {
        await page.goto('/skills/react');
        await expect(page).toHaveTitle(/React/);
        await expect(page.locator('#main-content')).toBeVisible();
    });
});

test.describe('Human site flow — contact', () => {
    test('contact page has required fields', async ({ page }) => {
        await page.goto('/contact');

        await expect(page.locator('#name')).toBeVisible();
        await expect(page.locator('#email')).toBeVisible();
        await expect(page.locator('#message')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('honeypot field exists but positioned off-screen', async ({
        page,
    }) => {
        await page.goto('/contact');
        const honeypot = page.locator('#website');
        await expect(honeypot).toHaveCount(1);
        const parent = page
            .locator('[aria-hidden="true"]')
            .filter({ has: honeypot });
        await expect(parent).toHaveCount(1);
        await expect(honeypot).toHaveAttribute('tabindex', '-1');
    });

    test('contact form submits to /api/contact', async ({ page }) => {
        await page.goto('/contact');

        const apiPromise = page.waitForRequest(
            (req) =>
                req.url().includes('/api/contact') && req.method() === 'POST',
        );

        await page.fill('#name', 'Test User');
        await page.fill('#email', 'test@example.com');
        await page.fill('#message', 'Hello from e2e');
        await page.click('button[type="submit"]');

        const apiRequest = await apiPromise;
        const postData = apiRequest.postData() ?? '';

        expect(postData).toContain('name');
        expect(postData).toContain('email');
        expect(postData).toContain('message');
    });
});
