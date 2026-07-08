# Route Handlers

Routes are thin. They parse input, delegate, map `Result` to HTTP, return response DTOs.

## Responsibilities

- Parse and validate request shape (framework/schema validation)
- Inject dependencies (session, auth context)
- Call service or repository
- Map `Result` errors to HTTP status + body
- Return response DTO directly

## Responsibilities NOT in Routes

- Business rules
- Database queries
- Persistence → DTO conversion
- Cross-cutting auth/CORS/rate limits (middleware handles these)

## Handler Shape

```
POST /{entities}
  body: EntityCreateBody
  → service.create(body)
  → map Result → 201 + EntityDetail

GET /{entities}/{key}
  → repo.get_by_key(key)
  → map NotFound → 404, else 200 + EntityDetail

PATCH /{entities}/{key}
  body: EntityUpdateBody
  → service.update(key, body)
  → map Result → 200 + EntityDetail

DELETE /{entities}/{key}
  → repo.delete(key)
  → map NotFound → 404, else 204
```

Simple reads may skip the service layer. Writes with business rules always go through services.

## Error Handling

**Never throw from route handlers** for expected failures — return typed JSON error responses.

Validate early, return early:

```
if input missing or wrong type → 400 with field error
if parse fails (URL, JSON)     → 400 with descriptive message
if Result.is_err()             → map typed error → status + body
```

## App Entry

Keep the app entry thin:

- Register route modules (one domain per module)
- Apply global middleware (CORS, auth, logging)
- Expose health check at `/` returning service name + version
- Export the app/handler per project convention

## Async Side Effects

Fire-and-forget work (analytics, notifications) via the runtime's background task mechanism — don't block the response.

## Module Export

Each route module exports a router/sub-app mounted by the entry file. The entry file never accumulates handler logic.
