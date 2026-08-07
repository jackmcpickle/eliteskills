/\*\*

- Template: copy to <e2e-root>/<slug>/<slug>.spec.ts
- Run: <pm> exec playwright test <e2e-root>/<slug>/<slug>.spec.ts --headed
-
- Artifacts (gitignored): <e2e-root>/<slug>/artifacts/
-
- Adjust the presentation import path if helpers live elsewhere.
  \*/
  import { test, expect } from '@playwright/test';
  import {
  captureStep,
  createPresentationContext,
  finalizePresentation,
  SEEDED_USERS,
  } from '../utils/presentation';

const SLUG = 'example-flow';
const PERSONA = SEEDED_USERS.member; // change per Phase 0 discovery
const STORIES = [
'Story 1: login and reach dashboard',
'Story 2: complete the approved user flow',
];

test.describe.configure({ mode: 'serial' });

test.describe(`${SLUG} presentation`, () => {
test('run presentation workflow', async ({ browser }) => {
const artifacts = await createPresentationContext(browser, SLUG);
const page = await artifacts.context.newPage();
let passed = false;
let testError: string | undefined;

        try {
            await page.goto('/login');
            await captureStep(page, artifacts, '01-login-page', 'Login page');

            await page.getByLabel('Email').fill(PERSONA.email);
            await page.getByLabel('Password').fill(PERSONA.password);
            await page.getByRole('button', { name: /log ?in/i }).click();

            await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });
            await captureStep(page, artifacts, '02-dashboard', 'Dashboard');
            passed = true;

            // ... more steps from approved user stories
        } catch (error) {
            testError = error instanceof Error ? error.message : String(error);
            throw error;
        } finally {
            await page.close();
            const result = await finalizePresentation(artifacts, {
                title: SLUG,
                persona: PERSONA,
                stories: STORIES,
                passed: passed && !testError,
                error: testError,
            });
            console.log(`Open presentation: file://${result.htmlPath}`);
        }
    });

});
