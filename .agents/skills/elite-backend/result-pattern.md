# Result Pattern

Use `Result[ErrorType, T]` at layer boundaries for explicit error handling.

## Where to Use Result

At **layer boundaries**:

- Repository → Service
- Service → Route

Inside a layer, propagate Results or use normal control flow — don't wrap every internal call.

## Basic Shape

```
get_entity(key) → Result[NotFound, EntityDetail]
  found     → Ok(detail_dto)
  not found → Err(NotFound(entity="Entity", identifier=key))
```

## Service Composition

Services chain repo calls by checking `is_err()` / matching on error variants before continuing:

```
result = repo.get_entity(key)
if result.is_err(): return result
entity = result.ok()
if entity.status == "archived":
  return Err(InvalidState(...))
return repo.update_entity(key, update_body)
```

## Converting Result to HTTP in Routes

Map typed errors to status codes at the route boundary — one place, not scattered:

| Error           | Typical HTTP |
| --------------- | ------------ |
| `NotFound`      | 404          |
| `AlreadyExists` | 409          |
| `Forbidden`     | 403          |
| `InvalidInput`  | 400          |
| `InvalidState`  | 400 or 409   |
| `QueryError`    | 500          |

Use the project's `or_raise()` / `match` / `handle()` helper — whatever maps `Result` → HTTP response.

## Typed Errors

Always construct typed error values — never bare strings at the boundary:

- `NotFound(entity, identifier)`
- `AlreadyExists(entity, field, value)`
- `Forbidden(reason)`
- `InvalidInput(errors)` — field → message list
- `InvalidState(entity, reason)`
- `QueryError(reason)`

## When NOT to Use Result

Use exceptions for programming bugs and truly exceptional runtime failures.

Use Result for expected failures the caller should handle: not found, validation, permissions, invalid state.
