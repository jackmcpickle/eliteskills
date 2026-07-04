# Hono Binding

Hono on Cloudflare Workers + Drizzle (D1). Applies the generic layered architecture to TypeScript worker APIs.

## Stack

Hono, Cloudflare Workers, Drizzle ORM (D1), TypeScript strict, vitest, oxlint, oxfmt.

## Layout

```
apps/{name}/src/
├── index.ts              # App entry — CORS, health, route registration
├── types.ts              # Env bindings interface
├── db/schema.ts          # Drizzle schema — repo-internal
├── routes/{domain}.ts    # Thin handlers
└── {domain}/
    ├── types.ts          # Request/response DTOs (Zod or TS types)
    ├── repository.ts     # Drizzle queries + row → DTO
    └── service.ts        # Business logic — DTOs only
```

Co-locate tests in `__tests__/` or beside modules. Migrations in `drizzle/`.

## Env Bindings

Every wrangler binding typed in `types.ts` — no `any`:

```typescript
export interface Env {
    DB: D1Database;
    CACHE: KVNamespace;
    MY_SECRET: string;
}
```

## App Entry

```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from '@/types';
import { noteRoutes } from '@/routes/notes';

const ALLOWED_ORIGINS = ['https://yourdomain.com', 'http://localhost:4321'];

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: ALLOWED_ORIGINS }));
app.get('/', (c) => c.json({ name: 'my-api', version: '1.0.0' }));
app.route('/api/notes', noteRoutes);

export default app;
```

Queue handler when needed:

```typescript
const worker: ExportedHandler<Env, JobType> = {
    fetch: app.fetch.bind(app),
    async queue(batch, env) {
        /* ... */
    },
};
export default worker;
```

## Route Module

Thin — parse, delegate, return JSON. Never throw:

```typescript
import { Hono } from 'hono';
import type { Env } from '@/types';
import * as service from '@/notes/service';

const app = new Hono<{ Bindings: Env }>();

app.post('/', async (c) => {
    const body = await c.req.json<NoteCreateBody>().catch(() => null);
    if (!body?.title) return c.json({ error: 'Title is required' }, 400);

    const result = await service.createNote(c.env.DB, body);
    if (result.error) return mapError(c, result.error);
    return c.json(result.data, 201);
});

export { app as noteRoutes };
```

Rules:

- Type `.json<T>()`; `.catch()` returns null or partial shape for strict TS
- `c.executionCtx.waitUntil()` for fire-and-forget side effects
- No `console.log` in production — warn/error only
- `@/` alias for internal imports

## Repository

Drizzle rows → DTO conversion happens **only here**:

```typescript
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { notes } from '@/db/schema';
import type { NoteDetail, NoteCreateBody } from './types';

export async function getNoteByKey(
    db: D1Database,
    key: string,
): Promise<Result<NotFound, NoteDetail>> {
    const row = await drizzle(db)
        .select()
        .from(notes)
        .where(eq(notes.key, key))
        .get();
    if (!row) return err({ kind: 'NotFound', entity: 'Note', identifier: key });
    return ok(toDetail(row));
}

function toDetail(row: typeof notes.$inferSelect): NoteDetail {
    return {
        key: row.key,
        title: row.title,
        content: row.content,
        isPinned: row.isPinned,
        createdAt: row.createdAt,
    };
}
```

Schema/table types never leave the repository module.

## Service

Never import from `@/db/schema`:

```typescript
export async function createNote(
    db: D1Database,
    data: NoteCreateBody,
): Promise<Result<InvalidInput, NoteDetail>> {
    if (!data.title.trim())
        return err({
            kind: 'InvalidInput',
            errors: { title: ['Title is required'] },
        });
    return repo.createNote(db, data);
}
```

## Result Pattern

Use the project's Result type or a simple discriminated union:

```typescript
type Result<E, T> = { ok: true; data: T } | { ok: false; error: E };

function mapError(c: Context, error: AppError): Response {
    switch (error.kind) {
        case 'NotFound':
            return c.json({ error: error.message }, 404);
        case 'InvalidInput':
            return c.json({ error: error.errors }, 400);
        default:
            return c.json({ error: 'Internal error' }, 500);
    }
}
```

## Binding Decisions

| Need               | Use          |
| ------------------ | ------------ |
| Relational data    | D1 + Drizzle |
| Cache, rate limits | KV           |
| Files              | R2           |
| Async jobs         | Queues       |

## Middleware

CORS, auth, rate limits — see [middleware-security.md](../middleware-security.md). KV sliding window for rate limits:

```typescript
const count = parseInt((await kv.get(ipKey)) ?? '0', 10);
if (count >= MAX) return c.json({ error: 'Rate limited' }, 429);
await kv.put(ipKey, String(count + 1), { expirationTtl: WINDOW_SECONDS });
```

## Verify

```bash
pnpm lint && pnpm fmt:check && pnpm test
```

See elite-testing and elite-deploy for CI strategy. Completion checklist:

- [ ] Route modules registered in `index.ts`
- [ ] Every wrangler binding typed in `Env`
- [ ] No thrown errors from handlers
- [ ] SSRF checks on user-provided URLs
- [ ] `wrangler deploy` succeeds

## Full Example

See [examples/hono-notes.md](../examples/hono-notes.md).
