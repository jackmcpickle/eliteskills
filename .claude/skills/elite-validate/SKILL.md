---
name: elite-validate
description: Use when the user asks to run, write, or record end-to-end browser tests — including Playwright e2e specs, demo walkthroughs, screenshot capture, video recordings, or HTML presentations of UI flows against a local web app. Triggers include "e2e test", "record a demo", "presentation test", "validate this flow", "screenshot walkthrough", or "Playwright presentation".
version: 1.0.0
---

# Elite Validate — E2E Presentation Tests (Playwright)

Record deterministic Playwright e2e tests with step screenshots, session video, and an HTML presentation. Each workflow gets its own subfolder under the project's e2e root.

**Core principle:** Never start environment setup or test authoring until prerequisites are confirmed and the user approves the persona + user stories.

**Never commit runtime artifacts.** Only commit the `.spec.ts` source (and shared helpers if newly scaffolded). Everything under `artifacts/` is gitignored.

## Prerequisites (gate)

Complete this checklist **before Phase 0**. If anything is missing, stop and resolve it with the user — do not invent project-specific scripts or credentials.

| Check                | How                                                                                                                                                                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Package manager      | Detect from lockfile: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `bun.lock`/`bun.lockb` → bun, else npm. Use that package manager for all commands below.                                                                             |
| Node project         | `package.json` exists at repo root (or agreed workspace package).                                                                                                                                                                       |
| Playwright           | `@playwright/test` in dependencies/devDependencies. If missing, ask to install: `<pm> add -D @playwright/test` then `<pm> exec playwright install chromium`.                                                                            |
| Chromium browser     | Run `<pm> exec playwright install chromium` once if browsers are not installed.                                                                                                                                                         |
| Local app target     | Prefer local `BASE_URL` (default `http://localhost:3000` or the repo's documented port). Never use staging/prod without explicit approval.                                                                                              |
| App start command    | From README / `package.json` scripts (`dev`, `start`, `preview`). Confirm with the user if unclear.                                                                                                                                     |
| Test env file        | If the repo has `.env.example` / `.env.test.example`, copy when missing and set `BASE_URL`.                                                                                                                                             |
| Personas / auth      | Prefer seeded test users documented in the repo. If none exist, ask the user for email/password (or magic-link flow) and record them only in local env — never hardcode secrets into committed specs.                                   |
| Presentation helpers | Look for `captureStep` / `finalizePresentation` under the e2e tree. If missing, scaffold from [templates/presentation.ts.md](templates/presentation.ts.md) into `<e2e-root>/utils/presentation.ts` (or the repo's existing utils path). |
| Artifacts gitignore  | Ensure `<e2e-root>/**/artifacts/` (or equivalent) is gitignored before the first run.                                                                                                                                                   |

See [prerequisites.md](prerequisites.md) for the full probe script and failure messages.

**Stop if:** Playwright cannot be installed, the app cannot start locally, or the user refuses to provide a persona / credentials for authenticated flows.

## Folder layout

Discover `<e2e-root>` from the repo (`e2e/`, `tests/e2e/`, `playwright/`, or `testDir` in `playwright.config.*`). Default to `e2e/` only when none exist and the user agrees to create it.

```text
<e2e-root>/<slug>/
  <slug>.spec.ts          # committed — the test source
  artifacts/              # gitignored — generated on each run
    presentation.html     # HTML report with screenshots + video
    results.json          # machine-readable run summary
    screenshots/          # step PNGs
    video/session.webm    # full browser session recording
```

## Phase 0: Discovery (required)

Ask the user **before any other work**:

1. **User type** — which seeded persona / role / tenant context? (or credentials if no seeds)
2. **User stories** — numbered list of flows to test (Given/When/Then or plain steps)
3. **Target URL** — local dev server by default; never CI/staging/prod without explicit approval
4. **Headed or headless** — default headed for presentation recording

Confirm back a short test plan:

```text
Persona: <persona> (<role>, <tenant>)
Stories:
  1. Login → land on dashboard
  2. Open <feature> → perform <action> → see <result>
Artifacts: <e2e-root>/<slug>/artifacts/presentation.html + screenshots + video
File: <e2e-root>/<slug>/<slug>.spec.ts
```

Wait for explicit approval before proceeding.

## Phase 1: Environment

- Start the app stack using the repo's documented command (from prerequisites).
- **Reset and reseed the database** when the repo has a seed/reset script — stale data is the top cause of flaky flows. If no seed script exists, note the risk and proceed only with user approval.
- Ensure Chromium is installed (prerequisites gate).

Verify the app responds:

```bash
curl -sf "$BASE_URL/" > /dev/null && echo OK
```

## Phase 2: Author the test

Create `<e2e-root>/<slug>/<slug>.spec.ts` from [templates/playwright-e2e.ts.md](templates/playwright-e2e.ts.md). Adjust the import path to the scaffolded or existing presentation helpers.

Conventions:

| Item                   | Location                                                         |
| ---------------------- | ---------------------------------------------------------------- |
| Playwright specs       | `<e2e-root>/<slug>/<slug>.spec.ts` (committed)                   |
| Runtime artifacts      | `<e2e-root>/<slug>/artifacts/` (gitignored)                      |
| Shared personas        | presentation helpers → `SEEDED_USERS` (edit to match repo seeds) |
| HTML + capture helpers | `captureStep()`, `finalizePresentation()`                        |
| AI-driven flows        | separate dir — only when the user explicitly wants them          |

**Prefer Playwright locators** (`getByRole`, `getByLabel`) over AI `act()`-style steps — deterministic, no API key needed.

Map each user story to test steps. Call `captureStep(page, artifacts, '01-login', 'Login page')` after every meaningful UI state change.

Always call `finalizePresentation(artifacts, { title, persona, stories, passed, error? })` in a `finally` block — it writes `presentation.html`, `results.json`, and normalizes the video path.

## Phase 3: Run and collect artifacts

Prefer the repo's existing e2e scripts when present. Otherwise run Playwright directly:

```bash
# Headed (shows browser, records video)
<pm> exec playwright test <e2e-root>/<slug>/<slug>.spec.ts --headed

# Headless
<pm> exec playwright test <e2e-root>/<slug>/<slug>.spec.ts
```

Ensure `playwright.config` (or the test itself via `createPresentationContext`) records video into the slug's `artifacts/video/` directory.

After the run, open the HTML presentation locally and share the `file://` path with the user. Do **not** commit anything under `artifacts/`.

## Phase 4: Share results

Tell the user:

- Path to `presentation.html` (open in browser — screenshots and video use relative paths)
- Pass/fail from `results.json`
- If failed: error message and the last screenshot step

Do not write separate markdown presentations. The HTML file is the deliverable.

## Common mistakes

| Mistake                                  | Fix                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------- |
| Committing `artifacts/`                  | Only commit `.spec.ts` (+ helpers if new); artifacts are gitignored |
| Flat spec at `<e2e-root>/<slug>.spec.ts` | Use subfolder: `<e2e-root>/<slug>/<slug>.spec.ts`                   |
| Skipping prerequisites                   | Complete the gate before Phase 0                                    |
| Skipping DB reset when seeds exist       | Stale records cause flaky flows                                     |
| Starting without user stories            | Always complete Phase 0                                             |
| Assuming `pnpm test:e2e:*` scripts       | Use repo scripts if present; else `playwright test` directly        |
| Using `networkidle` wait                 | SPAs hold WebSockets open — poll URL or wait for locators           |
| Forgetting `finalizePresentation()`      | Required to emit HTML, video path, and results.json                 |
| Hardcoding real user passwords           | Use seeds or local env vars                                         |

## When NOT to use this skill

- API-only testing → use the backend / unit test suite (or elite-testing)
- Manual QA checklists for humans → elite-qa
- Production/staging without explicit user approval
- AI-exploratory flows with no fixed assertions → use an AI browser-agent harness instead

## Related files

- [prerequisites.md](prerequisites.md) — probe steps and install guidance
- [templates/playwright-e2e.ts.md](templates/playwright-e2e.ts.md) — spec starter
- [templates/presentation.ts.md](templates/presentation.ts.md) — portable capture + HTML helpers
