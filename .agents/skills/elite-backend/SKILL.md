---
name: elite-backend
description: DTO-boundary backend domains. Use when adding a domain, API, service, repository, or route.
version: 4.0.0
---

# Backend domains

Every **domain** is a **layer** stack. Only a **DTO** crosses a **boundary**. **Result** carries expected failure.

## Steps

1. **Locate conventions** — Result type, typed errors, persistence base, session/connection, one existing domain. **Done when:** each is named with its import path (or you recorded that the project has no equivalent yet).

2. **Define DTOs** — write CreateBody, UpdateBody, Detail, ListItem before any handler or query. See [data-modeling.md](data-modeling.md). **Done when:** every field the feature creates, updates, lists, or returns lives on exactly one of those four shapes.

3. **Scaffold the domain** — types, persistence, repository, services, routes under one folder. See [templates/feature.md](templates/feature.md). If the stack is Python, read [bindings/python.md](bindings/python.md). If Hono/Workers, read [bindings/hono.md](bindings/hono.md). **Done when:** each layer file exists and imports only inward (routes → services → repos → persistence).

4. **Implement inside-out** — persistence mapping in the repository, rules in the service, HTTP in the route. Data flow: [layered-architecture.md](layered-architecture.md). Queries: [repository-pattern.md](repository-pattern.md). Errors: [result-pattern.md](result-pattern.md). Handlers: [route-handlers.md](route-handlers.md). **Done when:** one write and one read travel CreateBody/key → Result → Detail/ListItem with no persistence type outside the repository.

5. **Add middleware only when the feature needs it** — [middleware-security.md](middleware-security.md). **Done when:** each control lives once at the app edge.

6. **Verify** — project lint/test/build. Testing strategy is elite-testing. **Done when:** those gates pass.

## DTO catalog

| Shape        | Role                         | Public key? |
| ------------ | ---------------------------- | ----------- |
| `CreateBody` | Create input                 | No          |
| `UpdateBody` | Partial update, all optional | No          |
| `Detail`     | Full read                    | Yes         |
| `ListItem`   | Collection row               | Yes         |

Reuse a shape when two contexts share fields. Split when create, update, list, or detail differ.

## Data flow

```
CreateBody / UpdateBody / key
            │
            ▼
         Route  ── Result → HTTP ──▶  Detail / ListItem
            │
            ▼
        Service ── rules, orchestration
            │
            ▼
          Repo  ── DTO → persistence → DB → DTO
```

## Layer contract

| Layer       | Speaks             | Returns              |
| ----------- | ------------------ | -------------------- |
| Route       | DTOs + deps        | DTO or HTTP error    |
| Service     | DTOs               | `Result[Error, DTO]` |
| Repository  | DTOs or primitives | `Result[Error, DTO]` |
| Persistence | columns and rows   | stays in the repo    |

App entry registers route modules and global middleware. Health check at `/`.

## Biases

- Fewer files
- Filter in the query; comment when the dataset is filtered in memory
- Idempotent state sets return the current Detail
