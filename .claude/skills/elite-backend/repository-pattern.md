# Repository

The repository owns one aggregate's queries and the persistence ↔ **DTO** map. It returns **Result**.

## Contract

1. All I/O for this aggregate goes through the project's session or connection
2. Outgoing values are DTOs
3. Failures are typed errors, not strings

## Operations

| Op     | Name                        | Returns                                                   |
| ------ | --------------------------- | --------------------------------------------------------- |
| Get    | `get{Entity}ByKey(key)`     | `Result[NotFound, Detail]`                                |
| List   | `list{Entities}(filters)`   | `Result[QueryError, ListItem[]]`                          |
| Create | `create{Entity}(body)`      | `Result[Error, Detail]` or Detail when create cannot fail |
| Update | `update{Entity}(key, body)` | `Result[NotFound, Detail]`                                |
| Delete | `delete{Entity}(key)`       | `Result[NotFound, unit]`                                  |

Use the project's naming dialect (camelCase or snake_case). Same verbs.

## Write path

```
in:   CreateBody or primitives
work: map → persist → reload
out:  Result[..., Detail]
```

Partial update: load by key, apply fields that are present, persist. Missing key → `NotFound`.

## Errors

- `NotFound(entity, identifier)`
- `AlreadyExists(entity, field, value)`
- `InvalidState(entity, reason)`
- `QueryError(reason)`

## Query

Filter, order, offset, and limit in the store. Memory-filter only when the column has no portable operator **and** the set is bounded — say so in a comment.

Boolean columns use the query builder's truthiness, not `== true`.

## State

Toggle: service reads Detail, builds UpdateBody, repo writes.

Explicit set (archive, publish): if already in the target state, return the current Detail.

## Scope

One aggregate. Multi-entity work belongs in the service. HTTP stays in the route.
