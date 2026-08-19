# Layers

A **DTO** is the only value that crosses a **boundary**. Persistence stays in the repository.

## Stack

```
Route        request DTO in → response DTO out
     │
Service      DTOs in → rules → Result[Error, DTO]
     │
Repository   DTO → persistence → DB → DTO
     │
Persistence  schema / table / row — repo-internal
```

| Layer       | Receives           | Returns              | May import             |
| ----------- | ------------------ | -------------------- | ---------------------- |
| Route       | Request DTOs, deps | Response DTOs        | services, repos, types |
| Service     | DTOs               | `Result[Error, DTO]` | repos, types           |
| Repository  | DTOs or primitives | `Result[Error, DTO]` | persistence, types     |
| Persistence | —                  | —                    | persistence only       |
| Types       | —                  | —                    | DTO definitions        |

## Flows

**Create** — Route parses CreateBody → service validates → repo maps to persistence, saves, returns Detail.

**Update** — Route parses UpdateBody → service applies rules → repo loads by key, writes set fields, returns Detail.

**Read** — Route passes key → repo returns Detail. Skip the service when there is no rule.

**List** — Repo returns ListItem rows. Filter, sort, and page in the query.

## Folder

```
{domain}/
├── types         # CreateBody, UpdateBody, Detail, ListItem
├── models        # Persistence — repository only
├── repository    # types + models
├── services      # types + repository
└── routes        # types + services
```

Match the project's path dialect (`models/` vs `db/schema`, file-per-entity vs one module). Barrel files stay empty unless the project already uses them.

## Conversion

The repository is the only mapper. Routes and services never see a row, table, or schema type.

## Ownership

- Route — parse, inject deps, map Result to HTTP
- Service — business rules, multi-repo orchestration
- Repository — one aggregate's persistence and DTO mapping
