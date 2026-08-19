# Routes

A route parses a **DTO**, calls inward, and maps **Result** to HTTP.

## Job

- Validate request shape
- Inject session, auth, and other deps
- Call service (writes with rules) or repository (plain reads)
- Map Result → status + body
- Return Detail or ListItem

## Shape

```
POST   /{entities}       CreateBody → service.create → 201 Detail
GET    /{entities}/{key} key → repo.get → 200 Detail
PATCH  /{entities}/{key} UpdateBody → service.update → 200 Detail
DELETE /{entities}/{key} key → repo.delete → 204
```

## Errors

Expected failure is a JSON body, not a throw.

```
missing / wrong type → 400 field error
parse failure        → 400
Result Err           → typed status from result-pattern.md
```

## Entry

Register one route module per domain. Apply CORS, auth, and logging as middleware. Health check at `/` returns name + version.

Fire-and-forget work uses the runtime background hook so the response is not blocked.
