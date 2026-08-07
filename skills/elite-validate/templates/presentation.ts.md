/\*\*

- Portable E2E presentation helpers for elite-validate.
- Copy to <e2e-root>/utils/presentation.ts (or adapt path).
-
- Customize SEEDED_USERS to match your project's seed data / env.
  \*/
  import { mkdir, writeFile } from 'node:fs/promises';
  import { dirname, join } from 'node:path';
  import { fileURLToPath } from 'node:url';
  import type { Browser, BrowserContext, Page } from '@playwright/test';

export type Persona = {
key: string;
email: string;
password: string;
role?: string;
tenant?: string;
};

/\*_ Replace with project seeds or env-backed values. _/
export const SEEDED_USERS: Record<string, Persona> = {
member: {
key: 'member',
email: process.env.E2E_EMAIL ?? 'member@example.com',
password: process.env.E2E_PASSWORD ?? 'password',
role: 'member',
},
};

export type PresentationArtifacts = {
slug: string;
rootDir: string;
screenshotsDir: string;
videoDir: string;
context: BrowserContext;
steps: { id: string; label: string; file: string }[];
};

export type FinalizeInput = {
title: string;
persona: Persona;
stories: string[];
passed: boolean;
error?: string;
};

function e2eRootFromMeta(metaUrl: string): string {
// helpers live at <e2e-root>/utils/presentation.ts → e2e root is parent of utils
return join(dirname(fileURLToPath(metaUrl)), '..');
}

export async function createPresentationContext(
browser: Browser,
slug: string,
options?: { e2eRoot?: string; baseURL?: string },
): Promise<PresentationArtifacts> {
const e2eRoot = options?.e2eRoot ?? e2eRootFromMeta(import.meta.url);
const rootDir = join(e2eRoot, slug, 'artifacts');
const screenshotsDir = join(rootDir, 'screenshots');
const videoDir = join(rootDir, 'video');

    await mkdir(screenshotsDir, { recursive: true });
    await mkdir(videoDir, { recursive: true });

    const context = await browser.newContext({
        baseURL:
            options?.baseURL ?? process.env.BASE_URL ?? 'http://localhost:3000',
        recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } },
    });

    return { slug, rootDir, screenshotsDir, videoDir, context, steps: [] };

}

export async function captureStep(
page: Page,
artifacts: PresentationArtifacts,
id: string,
label: string,
): Promise<void> {
const file = `${id}.png`;
await page.screenshot({
path: join(artifacts.screenshotsDir, file),
fullPage: true,
});
artifacts.steps.push({ id, label, file });
}

export async function finalizePresentation(
artifacts: PresentationArtifacts,
input: FinalizeInput,
): Promise<{ htmlPath: string; resultsPath: string }> {
await artifacts.context.close();

    const results = {
        title: input.title,
        slug: artifacts.slug,
        persona: {
            key: input.persona.key,
            email: input.persona.email,
            role: input.persona.role,
            tenant: input.persona.tenant,
        },
        stories: input.stories,
        passed: input.passed,
        error: input.error ?? null,
        steps: artifacts.steps,
        video: 'video/session.webm',
        createdAt: new Date().toISOString(),
    };

    const resultsPath = join(artifacts.rootDir, 'results.json');
    await writeFile(resultsPath, JSON.stringify(results, null, 2), 'utf8');

    const htmlPath = join(artifacts.rootDir, 'presentation.html');
    await writeFile(htmlPath, renderHtml(results), 'utf8');

    return { htmlPath, resultsPath };

}

function escapeHtml(value: string): string {
return value
.replaceAll('&', '&amp;')
.replaceAll('<', '&lt;')
.replaceAll('>', '&gt;')
.replaceAll('"', '&quot;');
}

function renderHtml(results: {
title: string;
passed: boolean;
error: string | null;
persona: { key: string; email: string; role?: string; tenant?: string };
stories: string[];
steps: { id: string; label: string; file: string }[];
video: string;
}): string {
const status = results.passed ? 'PASSED' : 'FAILED';
const steps = results.steps
.map(
(step, i) => `
      <section class="step">
        <h2>${i + 1}. ${escapeHtml(step.label)}</h2>
        <img src="screenshots/${escapeHtml(step.file)}" alt="${escapeHtml(step.label)}" />
      </section>`,
)
.join('\n');

    const stories = results.stories
        .map((s) => `<li>${escapeHtml(s)}</li>`)
        .join('\n');

    return `<!doctype html>

<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(results.title)} — ${status}</title>
  <style>
    :root { color-scheme: light; font-family: ui-sans-serif, system-ui, sans-serif; }
    body { margin: 0; background: #f6f7f9; color: #111; }
    header { padding: 2rem; background: #111; color: #fff; }
    header.failed { background: #7f1d1d; }
    main { max-width: 960px; margin: 0 auto; padding: 1.5rem; }
    .meta { display: grid; gap: 0.5rem; margin: 1rem 0 2rem; }
    .step { margin: 2rem 0; padding: 1rem; background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; }
    img, video { width: 100%; height: auto; border-radius: 6px; border: 1px solid #e5e7eb; }
    h1, h2 { margin: 0 0 0.75rem; }
  </style>
</head>
<body>
  <header class="${results.passed ? '' : 'failed'}">
    <h1>${escapeHtml(results.title)}</h1>
    <p>${status}${results.error ? ` — ${escapeHtml(results.error)}` : ''}</p>
  </header>
  <main>
    <div class="meta">
      <div><strong>Persona:</strong> ${escapeHtml(results.persona.key)} (${escapeHtml(results.persona.email)})</div>
      ${results.persona.role ? `<div><strong>Role:</strong> ${escapeHtml(results.persona.role)}</div>` : ''}
      ${results.persona.tenant ? `<div><strong>Tenant:</strong> ${escapeHtml(results.persona.tenant)}</div>` : ''}
      <div><strong>Stories</strong></div>
      <ol>${stories}</ol>
    </div>
    <section class="step">
      <h2>Session video</h2>
      <video controls src="${escapeHtml(results.video)}"></video>
    </section>
    ${steps}
  </main>
</body>
</html>
`;
}
