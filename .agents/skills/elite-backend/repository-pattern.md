# Repository Pattern

Repositories own all database operations and persistence → DTO conversion. They return `Result` types.

## Core Responsibilities

1. All database operations via the project's session/connection
2. Own persistence → DTO conversion
3. Return `Result[ErrorType, DTO]` — never raw persistence objects
4. Use typed errors from the project's error module

## Naming Conventions

| Operation      | Function                              | Returns                                                         |
| -------------- | ------------------------------------- | --------------------------------------------------------------- |
| Get one by key | `get_{entity}_by_key(session, key)`   | `Result[NotFound, EntityDetail]`                                |
| Get one by id  | `get_{entity}_by_id(session, id)`     | `Result[NotFound, EntityDetail]`                                |
| List           | `list_{entities}(session, ...)`       | `Result[QueryError, list[EntityListItem]]`                      |
| Create         | `create_{entity}(session, data)`      | `Result[Error, EntityDetail]` or bare DTO if create cannot fail |
| Update         | `update_{entity}(session, key, data)` | `Result[NotFound, EntityDetail]`                                |
| Delete         | `delete_{entity}(session, key)`       | `Result[NotFound, None]`                                        |

## Input/Output Pattern

```
Input:  EntityCreateBody (request DTO) or primitives
Process: map to persistence object → save → refresh
Output: Result[..., EntityDetail] (response DTO)
```

## Partial Updates

Apply only fields present in the update DTO (exclude unset/nil fields). Load by key first; return `NotFound` if missing.

## Error Types

Use typed errors — never generic strings:

- `NotFound(entity, identifier)` — single-item lookup miss
- `AlreadyExists(entity, field, value)` — uniqueness violation
- `InvalidState(entity, reason)` — illegal state transition
- `QueryError(reason)` — list/query failures

## Filtering and Pagination

Filter in SQL when possible. Apply `offset`, `limit`, and `order_by` in the query.

Python-side filtering is acceptable only when the column type lacks portable SQL operators (e.g., JSON array membership) **and** the dataset is bounded. Document why in a comment.

## Boolean Column Filtering

Prefer truthiness operators native to the query builder over explicit `== true` comparisons that trigger linter warnings.

## State Transitions

For toggle endpoints: read current DTO in service, build update DTO, call repo.

For explicit set-state endpoints (archive, publish): succeed silently if already in target state — return the current DTO without error.

## What NOT to Put in Repositories

- Business logic
- HTTP concerns
- Raw persistence objects in return values
- Multi-entity orchestration (belongs in services)
