# Feature Scaffold

Generic domain layout — pick a binding for stack-specific code.

## Layout (all bindings)

```
{domain}/
├── models or db/schema   # Persistence — repo-internal
├── types                 # CreateBody, UpdateBody, Detail, ListItem
├── repository            # DB ops + persistence → DTO
├── services              # Business logic — DTOs only
└── routes                # Thin handlers — map Result → HTTP
```

## Binding Templates

| Stack                       | Read                                        |
| --------------------------- | ------------------------------------------- |
| Python (FastAPI + SQLModel) | [bindings/python.md](../bindings/python.md) |
| Hono (Workers + Drizzle)    | [bindings/hono.md](../bindings/hono.md)     |

## Placeholders

| Placeholder  | Example |
| ------------ | ------- |
| `{Entity}`   | `Note`  |
| `{entity}`   | `note`  |
| `{entities}` | `notes` |
| `{domain}`   | `notes` |

## End-to-End Examples

| Stack  | Example                                                 |
| ------ | ------------------------------------------------------- |
| Python | [examples/python-notes.md](../examples/python-notes.md) |
| Hono   | [examples/hono-notes.md](../examples/hono-notes.md)     |
