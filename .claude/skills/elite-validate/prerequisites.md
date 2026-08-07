# Prerequisites probe

Run these checks in order. Surface failures to the user with a concrete fix. Do not continue past a failed required check.

## 1. Detect package manager

```text
pnpm-lock.yaml          → pnpm
yarn.lock               → yarn
bun.lock / bun.lockb    → bun
package-lock.json       → npm
(none of the above)     → ask the user
```

Store as `<pm>` for later commands.

## 2. Playwright dependency

Required: `@playwright/test` in the target package.

```bash
# From package root — adapt to <pm>
node -e "const p=require('./package.json'); const d={...p.dependencies,...p.devDependencies}; if(!d['@playwright/test']) process.exit(1)"
```

If missing:

```bash
<pm> add -D @playwright/test
<pm> exec playwright install chromium
```

Ask before installing.

## 3. Playwright config

Look for `playwright.config.ts` / `.js` / `.mts`. Note `testDir`, `baseURL`, and video settings.

If no config exists, ask to scaffold a minimal one with:

- `testDir` pointing at `<e2e-root>`
- `use.baseURL` from env (`BASE_URL`)
- `use.video: 'on'` (presentation skill needs session video)

## 4. Discover e2e root

Priority:

1. `testDir` from Playwright config
2. Existing dirs: `e2e/`, `tests/e2e/`, `playwright/`
3. Ask user / default `e2e/`

## 5. Local app

1. Read README / `package.json` scripts for start command.
2. Confirm `BASE_URL` (default from config or `http://localhost:3000`).
3. Start the stack if not already running.
4. Probe: `curl -sf "$BASE_URL/" > /dev/null && echo OK`

Required: app responds on `BASE_URL`.

## 6. Auth / personas

Look for seed docs or constants (`SEEDED_USERS`, `seeded-users.md`, fixtures, `.env.test`).

| Situation                    | Action                                                                                       |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| Seeds documented             | Offer those personas in Phase 0                                                              |
| Seeds exist but undocumented | Infer from seed scripts; confirm with user                                                   |
| No seeds                     | Ask for test credentials; load via env (`E2E_EMAIL`, `E2E_PASSWORD`) — do not commit secrets |

## 7. Presentation helpers

Search for `finalizePresentation` / `captureStep` under `<e2e-root>`.

| Situation     | Action                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Helpers exist | Import from that path in the spec                                                                                                     |
| Missing       | Copy [templates/presentation.ts.md](templates/presentation.ts.md) to `<e2e-root>/utils/presentation.ts` and commit with user approval |

Edit `SEEDED_USERS` to match the project's seeds (or wire env-based personas).

## 8. Gitignore

Ensure artifacts are ignored before the first run. Add if missing:

```gitignore
**/artifacts/
```

Or scope to the e2e root: `<e2e-root>/**/artifacts/`.

## Ready checklist

- [ ] Package manager identified
- [ ] `@playwright/test` installed
- [ ] Chromium installed
- [ ] Playwright config understood (or scaffolded)
- [ ] `<e2e-root>` chosen
- [ ] App running at `BASE_URL`
- [ ] Persona source agreed
- [ ] Presentation helpers available
- [ ] `artifacts/` gitignored

Only then proceed to Phase 0 discovery in SKILL.md.
