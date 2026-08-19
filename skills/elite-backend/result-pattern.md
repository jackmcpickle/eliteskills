# Result

**Result** is the **boundary** type for expected failure.

## Where

- Repository → service
- Service → route

Inside a layer, ordinary control flow is enough.

## Shape

```
getEntity(key) → Result[NotFound, Detail]
  found     → Ok(detail)
  missing   → Err(NotFound(entity, key))
```

## Composition

```
loaded = repo.getEntity(key)
if loaded is Err → return loaded
if loaded.ok.status == archived → Err(InvalidState(...))
return repo.updateEntity(key, body)
```

Match the project's Result API (`is_err` / `ok` / `match`).

## Route mapping

One table at the route **boundary**:

| Error           | HTTP      |
| --------------- | --------- |
| `NotFound`      | 404       |
| `AlreadyExists` | 409       |
| `Forbidden`     | 403       |
| `InvalidInput`  | 400       |
| `InvalidState`  | 400 / 409 |
| `QueryError`    | 500       |

Use the project's Result → HTTP helper.

## Typed errors

Construct values, not strings:

- `NotFound(entity, identifier)`
- `AlreadyExists(entity, field, value)`
- `Forbidden(reason)`
- `InvalidInput(errors)` — field → messages
- `InvalidState(entity, reason)`
- `QueryError(reason)`

**Result** for not-found, validation, permission, and illegal state. Exceptions for bugs and infrastructure collapse.
