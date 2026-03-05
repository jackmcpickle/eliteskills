---
name: hono-api
description: Build and maintain Hono API workers on Cloudflare. Use when creating API endpoints, routes, middleware, workers, or when asked to "add an endpoint", "create an API", "add a route", or work on the scanner/API codebase. Covers project structure, typing, testing, linting, and deployment patterns.
version: 1.0.0
---

# Hono API Skill

Build production Hono APIs on Cloudflare Workers with strict TypeScript, oxlint, oxfmt, and vitest.

## Stack

- **Hono** — lightweight web framework
- **Cloudflare Workers** — runtime (D1, KV, R2, Queues, AI, Browser Rendering)
- **TypeScript** — strict mode, `noUncheckedIndexedAccess`
- **oxlint** — linting with type-aware rules (`--type-aware --type-check`)
- **oxfmt** — formatting (replaces prettier)
- **vitest** — unit + integration tests
- **Drizzle ORM** — when using D1/SQLite
- **pnpm** — package manager

## Project Structure

```
apps/{name}/
├── src/
│   ├── index.ts           # Hono app + worker export
│   ├── types.ts           # Env bindings + shared types
│   ├── routes/            # Route modules (one per domain)
│   │   └── {name}.ts
│   ├── lib/               # Pure logic, helpers
│   │   └── {name}.ts
│   ├── checks/            # Domain-specific modules (if applicable)
│   │   └── {name}.ts
│   ├── db/                # Drizzle schema (if using D1)
│   │   └── schema.ts
│   └── __tests__/         # Co-located tests
│       └── {name}.test.ts
├── drizzle/               # Migration SQL files
├── tsconfig.json          # Extends root, adds @cloudflare/workers-types
├── vitest.config.ts       # Path aliases
├── wrangler.toml          # Worker config + bindings
└── package.json
```

## Conventions

### App Entry (`index.ts`)

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from '@/types';
import { fooRoutes } from '@/routes/foo';

const ALLOWED_ORIGINS = [
  'https://yourdomain.com',
  'http://localhost:4321',
];

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: ALLOWED_ORIGINS }));

app.get('/', (c) => c.json({ name: 'my-api', version: '1.0.0' }));

app.route('/api/foo', fooRoutes);

export default app;
```

**Rules:**
- Never `cors({ origin: '*' })` — always allowlist origins
- Health check at `/` returning name + version
- Route modules via `app.route()` — keep `index.ts` thin
- Export `app` directly (Workers module format) unless you need `queue()` handler

### Worker Export with Queue

When using Queues, export a named handler object:

```typescript
const worker: ExportedHandler<Env, JobType> = {
  fetch: app.fetch.bind(app),
  async queue(batch, env) { /* ... */ },
};
export default worker;
```

### Env Type (`types.ts`)

```typescript
export interface Env {
  DB: D1Database;
  CACHE: KVNamespace;
  BUCKET: R2Bucket;
  AI: Ai;
  MY_SECRET: string;
  MY_VAR: string;
}
```

Every binding in `wrangler.toml` must have a typed field here. No `any`.

### Route Modules

```typescript
import { Hono } from 'hono';
import type { Env } from '@/types';

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
  const body = await c.req
    .json<{ email?: string }>()
    .catch(() => ({ email: undefined }));
  // ...
});

export { app as fooRoutes };
```

**Rules:**
- Use `@/` path alias for imports (configured in tsconfig + vitest)
- Type `.json<T>()` with the expected shape
- `.catch()` must return same shape with undefined fields (for strict TS)
- Use `c.executionCtx.waitUntil()` for fire-and-forget work
- Never `console.log` in production — use `console.warn` or `console.error`

### Error Handling

```typescript
// Validate early, return early
if (!body.url || typeof body.url !== 'string') {
  return c.json({ error: 'URL is required' }, 400);
}

// Parse with try/catch
let parsed: URL;
try {
  parsed = new URL(body.url);
} catch {
  return c.json({ error: 'Invalid URL' }, 400);
}
```

Never throw from route handlers — always return typed JSON responses.

### SSRF Prevention

When fetching user-provided URLs:

```typescript
function isPrivateHost(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h === '127.0.0.1' || h === '::1' /* ... */) return true;
  if (/^10\.|^172\.(1[6-9]|2\d|3[01])\.|^192\.168\.|^169\.254\./.test(h)) return true;
  if (/^f[cd][0-9a-f]{2}:/i.test(h) || /^fe80:/i.test(h)) return true;
  return false;
}
```

Block: loopback, private IPv4, IPv6 ULA/link-local, `.local`, `.internal`, `.localhost`, `169.254.x.x` (cloud metadata).

### Rate Limiting

Use KV with TTL for persistent limits:

```typescript
// Sliding window counter
const ipKey = `ratelimit:ip:${ip}`;
const existing = await kv.get(ipKey);
const count = existing ? parseInt(existing, 10) : 0;
if (count >= MAX) return { allowed: false };
await kv.put(ipKey, String(count + 1), { expirationTtl: WINDOW_SECONDS });
```

Or in-memory Map for ephemeral limits (resets on worker eviction).

## TypeScript

### tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "types": ["@cloudflare/workers-types"],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src/**/*.ts"]
}
```

Root tsconfig must have: `strict: true`, `noUncheckedIndexedAccess: true`, `noUnusedLocals: true`, `noUnusedParameters: true`.

### Rules
- No `any` types — use `unknown` + type narrowing
- No `as` type assertions unless unavoidable (document why)
- Use `satisfies` over `as` when checking shape
- Explicit return types on exported functions
- Use `@/` alias for all internal imports

## Linting (oxlint)

Root `.oxlintrc.json` with categories:

```json
{
  "categories": {
    "perf": "warn",
    "restriction": "warn",
    "correctness": "error",
    "suspicious": "warn",
    "pedantic": "warn"
  },
  "plugins": ["eslint", "typescript", "import", "react", "jsx-a11y", "react-perf"]
}
```

Key rules:
- `no-console`: warn (allow `warn`, `error`)
- `import/no-default-export`: warn (except entry files)
- `typescript/no-floating-promises`: error
- `typescript/explicit-function-return-type`: warn (allow expressions)
- `func-style`: declaration preferred
- `max-lines-per-function`: 500

Run with: `oxlint --type-aware --type-check --fix`

## Formatting (oxfmt)

Run with: `oxfmt --check` (CI) or `oxfmt` (fix).

Single quotes, 4-space indent (oxfmt defaults). No config file needed.

## Testing (vitest)

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
  resolve: {
    alias: { '@': new URL('./src', import.meta.url).pathname },
  },
});
```

### Patterns

- **One test file per module** in `__tests__/` directory
- Name tests as specifications: `it('rejects registration when competition is not published')`
- **Pure function tests** — pass HTML/data in, assert result shape
- **Mock KV/D1** with simple Map-based classes for unit tests
- **No mocking frameworks** — manual mocks are clearer
- Arrange / Act / Assert — three distinct blocks

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../lib/my-module';

describe('myFunction', () => {
  it('handles empty input', () => {
    const result = myFunction('');
    expect(result.status).toBe('fail');
  });
});
```

### Mock KV

```typescript
class MockKV {
  private store = new Map<string, string>();
  async get(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async put(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
}
```

## Wrangler Config

```toml
name = "my-api"
account_id = "..."
main = "src/index.ts"
compatibility_date = "2025-03-01"
compatibility_flags = ["nodejs_compat"]

[observability]
enabled = true
head_sampling_rate = 1

[observability.traces]
enabled = true
head_sampling_rate = 1

[vars]
ENVIRONMENT = "production"
```

Always enable observability. Set secrets via `wrangler secret put`.

## CI Pipeline

```yaml
lint → test → build → deploy (main only)
```

- `pnpm lint` — oxlint type-aware
- `pnpm fmt:check` — oxfmt
- `vitest run --reporter=verbose`
- `astro check` (web apps)
- Build once, deploy same artifact
- Concurrency: cancel in-progress

## Package Scripts

```json
{
  "dev": "wrangler dev",
  "deploy": "wrangler deploy --minify",
  "test": "vitest run",
  "lint": "oxlint --type-aware --type-check --fix",
  "fmt:check": "pnpm oxfmt --check",
  "fmt": "pnpm oxfmt"
}
```
