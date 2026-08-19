# Feature scaffold

One **domain**, four **DTO**s, four **layer**s.

## Layout

```
{domain}/
├── types         # CreateBody, UpdateBody, Detail, ListItem
├── models        # Persistence — repository only
├── repository    # DTO ↔ persistence
├── services      # Rules — DTOs only
└── routes        # Parse, map Result → HTTP
```

Use `db/schema` in place of `models` when that is the project dialect.

## Placeholders

| Token        | Example |
| ------------ | ------- |
| `{Entity}`   | `Note`  |
| `{entity}`   | `note`  |
| `{entities}` | `notes` |
| `{domain}`   | `notes` |

## Stack syntax

Python (FastAPI + SQLModel) → [bindings/python.md](../bindings/python.md) and [examples/python-notes.md](../examples/python-notes.md).

Hono (Workers + Drizzle) → [bindings/hono.md](../bindings/hono.md) and [examples/hono-notes.md](../examples/hono-notes.md).
