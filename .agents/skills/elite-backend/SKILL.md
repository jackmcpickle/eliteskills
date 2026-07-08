---
name: elite-backend
description: Backend domain features with layered architecture, DTO boundaries, and Result error handling. Use when building APIs, endpoints, routes, services, repositories, domain models, or middleware.
version: 3.0.0
---

# Backend Development

Build production backend features with strict **layer** boundaries. Persistence stays in repositories; **DTOs** cross every **boundary**; **Result** carries expected failures.

## Core Rules

- **Persistence models never leave the repository** — only DTOs cross layer boundaries
- **Request DTOs in, response DTOs out** at every boundary
- **Result at layer boundaries** — services and repos return `Result`; routes map errors to HTTP
- **Thin routes** — parse input, call service/repo, map Result; no business logic
- **Validate at the boundary** — request shape at the route; business rules in services

## Workflow

1. **Pick binding** — identify stack (Python or Hono) and read the binding file. **Done when:** binding file read and project conventions located (Result type, typed errors, persistence base, session/connection, existing domain module).
2. **Scaffold domain** — create models, types, repository, services, routes under one domain folder. See [templates/feature.md](templates/feature.md) + binding file. **Done when:** every layer file exists with stubs.
3. **Implement inside-out** — types → repository → services → routes. **Done when:** CRUD (or scoped operations) wired end-to-end with DTO flow intact.
4. **Add cross-cutting concerns** — auth, CORS, rate limits, SSRF guards only if the feature needs them. See [middleware-security.md](middleware-security.md). **Done when:** each applicable control is in middleware, not duplicated per handler.
5. **Verify** — lint, test, build per project scripts; use elite-testing and elite-deploy for strategy. **Done when:** project quality gates pass.

## Domain Layout

```
src/{app}/{domain}/
├── models/          # Persistence schema — repo-internal only
├── types/           # DTOs — imported by all layers
├── repository/      # DB ops + persistence → DTO conversion
├── services/        # Business logic — DTOs only, no models
└── routes/          # Thin handlers — wire DTOs, map Result → HTTP
```

App entry stays thin: register route modules, apply global middleware, expose health check.

## DTO Flow

```
Request DTO                    Response DTO
(CreateBody)                   (Detail / ListItem)
     │                               ▲
     ▼                               │
  Route ── map Result → HTTP ────────┘
     │
     ▼
 Service ── validate, orchestrate ───┘
     │
     ▼
   Repo ── DTO → persistence → DB → DTO
```

## Reference

| Topic                                | File                                                 |
| ------------------------------------ | ---------------------------------------------------- |
| **Python** (FastAPI + SQLModel)      | [bindings/python.md](bindings/python.md)             |
| **Hono** (Workers + Drizzle)         | [bindings/hono.md](bindings/hono.md)                 |
| Layer rules and data flow            | [layered-architecture.md](layered-architecture.md)   |
| Persistence models and DTO naming    | [data-modeling.md](data-modeling.md)                 |
| Repository operations and conversion | [repository-pattern.md](repository-pattern.md)       |
| Result and typed errors              | [result-pattern.md](result-pattern.md)               |
| Thin routes and HTTP error mapping   | [route-handlers.md](route-handlers.md)               |
| Auth, CORS, rate limits, SSRF        | [middleware-security.md](middleware-security.md)     |
| Feature scaffold                     | [templates/feature.md](templates/feature.md)         |
| Python example                       | [examples/python-notes.md](examples/python-notes.md) |
| Hono example                         | [examples/hono-notes.md](examples/hono-notes.md)     |

## Default Biases

- Fewer files over more files
- Separate Create/Update DTOs (create has no id/key; update has optional fields)
- Filter in SQL when possible; document when filtering in application code
- Idempotent state transitions succeed silently when already in target state
