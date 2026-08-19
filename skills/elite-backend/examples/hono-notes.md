# Hono Notes Example

Complete Notes feature on Hono + Drizzle (D1). Schema stays in repository; everything else uses DTOs.

## db/schema.ts

```typescript
/** Drizzle schema — only imported by repository. */
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable('notes', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    key: text('key').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull().default(''),
    isPinned: integer('is_pinned', { mode: 'boolean' })
        .notNull()
        .default(false),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
});
```

## notes/types.ts

```typescript
/** DTOs for Notes API. Imported by routes, service, repository. */

export interface NoteCreateBody {
    title: string;
    content?: string;
    isPinned?: boolean;
}

export interface NoteUpdateBody {
    title?: string;
    content?: string;
    isPinned?: boolean;
}

export interface NoteDetail {
    key: string;
    title: string;
    content: string;
    isPinned: boolean;
    createdAt: string;
}

export interface NoteListItem {
    key: string;
    title: string;
    isPinned: boolean;
    createdAt: string;
}
```

## notes/repository.ts

```typescript
/** DB ops for Notes. Owns row → DTO conversion. Never export schema rows. */
import { eq, desc } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import { notes } from '@/db/schema';
import type {
    NoteCreateBody,
    NoteUpdateBody,
    NoteDetail,
    NoteListItem,
} from './types';
import type { AppError } from '@/core/errors';
import { ok, err, type Result } from '@/core/result';
import { generateKey } from '@/core/keys';

function toDetail(row: typeof notes.$inferSelect): NoteDetail {
    return {
        key: row.key,
        title: row.title,
        content: row.content,
        isPinned: row.isPinned,
        createdAt: row.createdAt,
    };
}

function toListItem(row: typeof notes.$inferSelect): NoteListItem {
    return {
        key: row.key,
        title: row.title,
        isPinned: row.isPinned,
        createdAt: row.createdAt,
    };
}

export async function getNoteByKey(
    db: D1Database,
    key: string,
): Promise<Result<AppError, NoteDetail>> {
    const row = await drizzle(db)
        .select()
        .from(notes)
        .where(eq(notes.key, key))
        .get();
    if (!row) return err({ kind: 'NotFound', entity: 'Note', identifier: key });
    return ok(toDetail(row));
}

export async function listNotes(
    db: D1Database,
    pinnedOnly = false,
): Promise<Result<AppError, NoteListItem[]>> {
    let query = drizzle(db)
        .select()
        .from(notes)
        .orderBy(desc(notes.isPinned), desc(notes.createdAt));
    if (pinnedOnly)
        query = query.where(eq(notes.isPinned, true)) as typeof query;
    const rows = await query.all();
    return ok(rows.map(toListItem));
}

export async function createNote(
    db: D1Database,
    data: NoteCreateBody,
): Promise<NoteDetail> {
    const now = new Date().toISOString();
    const key = generateKey();
    await drizzle(db)
        .insert(notes)
        .values({
            key,
            title: data.title,
            content: data.content ?? '',
            isPinned: data.isPinned ?? false,
            createdAt: now,
            updatedAt: now,
        });
    const row = await drizzle(db)
        .select()
        .from(notes)
        .where(eq(notes.key, key))
        .get();
    return toDetail(row!);
}

export async function updateNote(
    db: D1Database,
    key: string,
    data: NoteUpdateBody,
): Promise<Result<AppError, NoteDetail>> {
    const existing = await drizzle(db)
        .select()
        .from(notes)
        .where(eq(notes.key, key))
        .get();
    if (!existing)
        return err({ kind: 'NotFound', entity: 'Note', identifier: key });

    const patch: Partial<typeof notes.$inferInsert> = {
        updatedAt: new Date().toISOString(),
    };
    if (data.title !== undefined) patch.title = data.title;
    if (data.content !== undefined) patch.content = data.content;
    if (data.isPinned !== undefined) patch.isPinned = data.isPinned;

    await drizzle(db).update(notes).set(patch).where(eq(notes.key, key));
    const row = await drizzle(db)
        .select()
        .from(notes)
        .where(eq(notes.key, key))
        .get();
    return ok(toDetail(row!));
}

export async function deleteNote(
    db: D1Database,
    key: string,
): Promise<Result<AppError, null>> {
    const existing = await drizzle(db)
        .select()
        .from(notes)
        .where(eq(notes.key, key))
        .get();
    if (!existing)
        return err({ kind: 'NotFound', entity: 'Note', identifier: key });
    await drizzle(db).delete(notes).where(eq(notes.key, key));
    return ok(null);
}
```

## notes/service.ts

```typescript
/** Business logic — DTOs only. Never imports @/db/schema. */
import type { NoteCreateBody, NoteUpdateBody, NoteDetail } from './types';
import type { AppError } from '@/core/errors';
import { err, ok, type Result } from '@/core/result';
import * as repo from './repository';

export async function createNote(
    db: D1Database,
    data: NoteCreateBody,
): Promise<Result<AppError, NoteDetail>> {
    if (!data.title.trim())
        return err({
            kind: 'InvalidInput',
            errors: { title: ['Title is required'] },
        });
    return ok(await repo.createNote(db, data));
}

export async function updateNote(
    db: D1Database,
    key: string,
    data: NoteUpdateBody,
): Promise<Result<AppError, NoteDetail>> {
    if (data.title !== undefined && !data.title.trim()) {
        return err({
            kind: 'InvalidInput',
            errors: { title: ['Title cannot be empty'] },
        });
    }
    return repo.updateNote(db, key, data);
}

export async function togglePin(
    db: D1Database,
    key: string,
): Promise<Result<AppError, NoteDetail>> {
    const result = await repo.getNoteByKey(db, key);
    if (!result.ok) return result;
    return repo.updateNote(db, key, { isPinned: !result.data.isPinned });
}
```

## routes/notes.ts

```typescript
/** Thin route module — parse, delegate, map errors. */
import { Hono } from 'hono';
import type { Env } from '@/types';
import { mapError } from '@/core/errors';
import * as repo from '@/notes/repository';
import * as service from '@/notes/service';
import type { NoteCreateBody, NoteUpdateBody } from '@/notes/types';

const app = new Hono<{ Bindings: Env }>();

app.get('/', async (c) => {
    const pinned = c.req.query('pinned') === 'true';
    const result = await repo.listNotes(c.env.DB, pinned);
    if (!result.ok) return mapError(c, result.error);
    return c.json(result.data);
});

app.post('/', async (c) => {
    const body = await c.req.json<NoteCreateBody>().catch(() => null);
    if (!body) return c.json({ error: 'Invalid JSON' }, 400);
    const result = await service.createNote(c.env.DB, body);
    if (!result.ok) return mapError(c, result.error);
    return c.json(result.data, 201);
});

app.get('/:key', async (c) => {
    const result = await repo.getNoteByKey(c.env.DB, c.req.param('key'));
    if (!result.ok) return mapError(c, result.error);
    return c.json(result.data);
});

app.patch('/:key', async (c) => {
    const body = await c.req.json<NoteUpdateBody>().catch(() => null);
    if (!body) return c.json({ error: 'Invalid JSON' }, 400);
    const result = await service.updateNote(c.env.DB, c.req.param('key'), body);
    if (!result.ok) return mapError(c, result.error);
    return c.json(result.data);
});

app.delete('/:key', async (c) => {
    const result = await repo.deleteNote(c.env.DB, c.req.param('key'));
    if (!result.ok) return mapError(c, result.error);
    return c.body(null, 204);
});

app.post('/:key/toggle-pin', async (c) => {
    const result = await service.togglePin(c.env.DB, c.req.param('key'));
    if (!result.ok) return mapError(c, result.error);
    return c.json(result.data);
});

export { app as noteRoutes };
```

## Key Points

- **`toDetail` / `toListItem`** — row → DTO conversion only in repository
- **Routes never import schema** — delegate to service/repo, map errors via `mapError`
- **Service never imports schema** — works with DTOs from `notes/types.ts`
- **Request DTOs** have no key/timestamps; **response DTOs** include key + `createdAt`
- **`togglePin`** — service composes: get DTO → build update → call repo
