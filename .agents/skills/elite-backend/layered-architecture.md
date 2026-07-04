# Layered Architecture

Strict DTO boundaries. Persistence models stay in repositories; every other layer works with DTOs only.

## The Layers

```
┌─────────────────────────────────────────┐
│              Routes                      │
│  Request DTO in → Response DTO out       │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              Services                    │
│  DTOs in → business logic → DTOs out     │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│             Repositories                 │
│  DTO → persistence → DB → DTO            │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          Persistence Models              │
│  DB schema (repo-internal only)           │
└─────────────────────────────────────────┘
```

## Layer Rules

| Layer        | Receives            | Returns              | Knows About               |
| ------------ | ------------------- | -------------------- | ------------------------- |
| Routes       | Request DTOs + deps | Response DTOs        | Services, repos, types    |
| Services     | DTOs                | `Result[Error, DTO]` | Repos, types              |
| Repositories | DTOs or primitives  | `Result[Error, DTO]` | Persistence models, types |
| Models       | N/A                 | N/A                  | Persistence layer only    |
| Types        | N/A                 | N/A                  | DTO definitions only      |

## Conversion Rule

**Persistence → DTO conversion happens only in repositories.** Routes and services receive DTOs; they never map from persistence objects.

## Example Flow: Create

```
types/       EntityCreateBody, EntityDetail
routes/      parse CreateBody → call service → map Result → return Detail
services/    validate CreateBody → call repo → return Result[Error, Detail]
repository/  CreateBody → persistence object → save → refresh → Detail
```

## Example Flow: Update

```
types/       EntityUpdateBody (all fields optional)
services/    validate partial update rules → delegate to repo
repository/  load by key → apply only set fields → save → Detail
```

Routes call services for writes that need business rules; simple reads may call repos directly.

## File Organization

```
src/{app}/{domain}/
├── models/       # Only imported by repository
├── types/        # Imported by all layers
├── repository/   # Imports models + types
├── services/     # Imports repository + types (NOT models)
└── routes/       # Imports services + types (NOT models)
```

Keep `__init__` / barrel files empty unless the project convention says otherwise. Register routers in the app entry.

## What Each Layer Must NOT Do

### Routes

- No business logic
- No direct database queries
- No persistence → DTO conversion

### Services

- No direct session/query calls (delegate to repos)
- No HTTP-specific concerns
- No importing from `models/`

### Repositories

- No business logic
- No HTTP concerns
- No returning raw persistence objects
