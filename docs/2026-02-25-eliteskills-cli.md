# Plan: `@eliteskills/cli` — npx installer

## Context

Users buy Claude Code skills on eliteskills.ai. Currently download is manual (zip from account page). Need a CLI so users can run `npx @eliteskills/cli add react` to install skills directly into their project's `.claude/skills/` directory.

## User Flow

```
npx @eliteskills/cli add react
> Enter your install token: ▊
> (user pastes token from account page)
> ✓ Installed frontend-coder (17 files) to .claude/skills/
```

Or with token inline:
```
npx @eliteskills/cli add react abc123def
```

## Architecture

### 1. CLI Package (`packages/cli/`)

Monorepo sub-package, published to npm as `@eliteskills/cli`.

```
packages/cli/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── bin/
│   └── cli.mjs              # #!/usr/bin/env node shebang entry
└── src/
    ├── index.ts              # Arg parsing, command dispatch
    ├── commands/
    │   └── add.ts            # Download + extract logic
    └── lib/
        ├── api.ts            # Fetch wrapper + error handling
        ├── extract.ts        # Zip extraction (fflate)
        ├── prompt.ts         # Interactive token prompt (readline)
        └── log.ts            # Colored console output (ANSI)
```

**Dependencies**: `fflate` only (runtime). `tsup` + `typescript` (dev).

### 2. New Server API Endpoint

**`POST /api/cli/install`** — validates token + skill, returns zip.

```
Request:  { "token": "abc123", "skill": "react" }
Response: zip binary (same as /download/[key])

Errors:
  400 — missing token or skill
  404 — invalid token / skill not found
  403 — token doesn't grant access to this skill
  410 — download limit reached
```

**Why new endpoint instead of reusing `/download/[key]`:**
- Validates skill matches token (prevents confusion with bundle tokens)
- Server-side skill resolution (token for bundle + skill=react → serve only react zip)
- Future: version handling (v1 vs v2 based on purchase date)
- Clean contract for CLI ↔ server

**File**: `src/pages/api/cli/install.ts`

**Logic**:
1. Parse JSON body → `{ token, skill }`
2. `getInstallKeyByKey(db, token)` → validate exists + download limit
3. Trace: installKey → purchase → product
4. If product has `skillSlug` → verify it matches requested `skill`
5. If product is bundle (`skillSlug=null`) → serve the per-skill zip for `skill`
6. Serve zip (same pattern as existing download handler)
7. Increment download count

## Implementation Steps

### Step 1: Root workspace setup
- Create `pnpm-workspace.yaml` with `packages/*`
- No changes to existing root `package.json`

### Step 2: CLI package scaffold
- `packages/cli/package.json` — name `@eliteskills/cli`, bin `eliteskills` → `./bin/cli.mjs`
- `packages/cli/tsconfig.json` — ESNext, Node18 target
- `packages/cli/tsup.config.ts` — ESM output, minified
- `packages/cli/bin/cli.mjs` — shebang wrapper

### Step 3: CLI implementation

**`src/index.ts`** — Parse `process.argv`:
- `add <skill> [token]` → run add command
- `--help` / no args → print usage
- Unknown command → error + usage

**`src/lib/prompt.ts`** — If token omitted, prompt via `readline`:
```ts
import { createInterface } from 'node:readline/promises';
const rl = createInterface({ input: process.stdin, output: process.stdout });
const token = await rl.question('Enter your install token: ');
```

**`src/lib/api.ts`** — POST to `/api/cli/install`:
```ts
const res = await fetch(`${API_BASE}/api/cli/install`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, skill }),
});
```
Error mapping: 400/403/404/410 → clear user messages.

**`src/lib/extract.ts`** — `fflate.unzipSync()`:
- Safety check: all paths start with `.claude/skills/`
- Skip directory entries + `.DS_Store`
- Write files relative to CWD
- Return file count + skill dir names

**`src/commands/add.ts`** — Orchestrator:
1. Prompt for token if missing
2. Call API
3. Handle errors
4. Extract zip
5. Print success summary

### Step 4: Server endpoint
- Create `src/pages/api/cli/install.ts`
- Reuse existing repo functions (`getInstallKeyByKey`, `getPurchaseById`, `getProductById`, `resolveDownloadZip`, `incrementDownloadCount`)
- Add skill validation logic (match `skill` param against product's `skillSlug`)
- Bundle handling: if product is bundle, serve per-skill zip using `skill` param

### Step 5: Build + test
- `pnpm --filter @eliteskills/cli build`
- Test locally: `node packages/cli/bin/cli.mjs add react <real-token>`
- Add `build:cli` script to root package.json

## Key Files to Modify

| File | Change |
|---|---|
| `pnpm-workspace.yaml` | **NEW** — workspace config |
| `packages/cli/*` | **NEW** — entire CLI package |
| `src/pages/api/cli/install.ts` | **NEW** — server endpoint |
| `package.json` (root) | Add `build:cli` script |

## Key Files to Reuse

| File | What |
|---|---|
| `src/libs/db/repo.ts` | `getInstallKeyByKey`, `incrementDownloadCount`, `getPurchaseById`, `getProductById` |
| `src/libs/download.ts` | `resolveDownloadZip()` |
| `src/libs/db/client.ts` | `createDb()` |

## Testing (CI)

### CLI Unit Tests (`packages/cli/src/**/*.test.ts`)

CLI package gets its own `vitest.config.ts`. Tests run via `pnpm --filter @eliteskills/cli test`.

**`src/lib/extract.test.ts`** — Zip extraction:
- Creates test zips in-memory with `fflate.zipSync()`, passes to `extractZip()`
- Valid zip → extracts to temp dir, verify files written correctly
- Zip with paths outside `.claude/skills/` → throws error (path traversal protection)
- Zip with `.DS_Store` → skipped
- Zip with directory-only entries → skipped
- Empty zip → returns 0 files
- Bundle zip (multiple skill dirs) → all extracted, returns correct dir names

**`src/lib/api.test.ts`** — HTTP error mapping:
- 400 → "Missing skill or token"
- 403 → "Token doesn't grant access to this skill"
- 404 → "Invalid install token"
- 410 → "Download limit reached"
- 500 → "Server error"
- Network failure (fetch throws) → "Network error"

**`src/commands/add.test.ts`** — Full add flow (mocked fetch):
- Mock `globalThis.fetch` to return a test zip → verify files extracted to temp dir
- Mock fetch returning 404 → verify error message + exit code 1
- Mock fetch returning 410 → verify limit message
- Verify download count isn't incremented on client (server-side concern)

**`src/index.test.ts`** — Arg parsing:
- `['add', 'react', 'token123']` → calls add with correct args
- `['add', 'react']` → calls add with skill only (token undefined)
- `['add']` → exits with error (missing skill)
- `['--help']` → prints usage, exits 0
- `[]` → prints usage, exits 0
- `['unknown']` → error + usage, exits 1

### Server Endpoint Tests (`src/pages/api/cli/install.test.ts`)

Follows existing pattern (colocated test, vitest). Tests the endpoint handler function directly.

**Logic tests** (mock db functions via `vi.mock`):
- Missing body fields → 400
- Invalid token (key not found) → 404
- Download limit exceeded → 410
- Token for single skill, matching `skill` param → 200 + zip
- Token for single skill, mismatched `skill` param → 403
- Token for bundle, any valid `skill` param → 200 + per-skill zip
- Purchase not found → 404
- Product not found → 404

### CI Integration

Add to root `package.json` scripts:
```json
"test:cli": "pnpm --filter @eliteskills/cli test"
```

Existing `pnpm test` (runs vitest at root) covers server endpoint tests. CLI tests run separately since they're a workspace package.

GitHub Actions (if exists) would add:
```yaml
- run: pnpm --filter @eliteskills/cli build
- run: pnpm --filter @eliteskills/cli test
```

### Updated file structure with tests

```
packages/cli/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts           # CLI-specific vitest config
├── bin/
│   └── cli.mjs
└── src/
    ├── index.ts
    ├── index.test.ts
    ├── commands/
    │   ├── add.ts
    │   └── add.test.ts
    └── lib/
        ├── api.ts
        ├── api.test.ts
        ├── extract.ts
        ├── extract.test.ts
        ├── prompt.ts
        └── log.ts
```

## Verification

1. `pnpm --filter @eliteskills/cli build` — builds without errors
2. `pnpm --filter @eliteskills/cli test` — all CLI unit tests pass
3. `pnpm test` — existing + new server endpoint tests pass
4. `node packages/cli/bin/cli.mjs --help` — prints usage
5. `node packages/cli/bin/cli.mjs add react` — prompts for token
6. `pnpm dev` → `curl -X POST localhost:3000/api/cli/install -H 'Content-Type: application/json' -d '{"token":"test","skill":"react"}'` — returns 404 (invalid token, but endpoint works)
7. End-to-end with real token against deployed site

## Unresolved Questions

- npm org `@eliteskills` — registered? Need to claim before publish
- Version handling — defer to future? Current plan: server returns latest zip, version logic added later
- Post-install message (e.g., "restart Claude Code to pick up new skill")?
