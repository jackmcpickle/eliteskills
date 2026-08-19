# Middleware & Security

Cross-cutting concerns live in middleware — not duplicated per handler.

## CORS

Always allowlist origins. Never wildcard (`*`) in production.

Apply at app level before route modules. Include localhost origins only in development configs.

## Auth

Validate tokens/sessions in middleware before route handlers run.

Unauthenticated requests to protected paths return 401 without reaching business logic.

Attach resolved user/context to the request for downstream handlers.

## Rate Limiting

Use a persistent cache (KV, Redis) with TTL for durable limits across instances.

Sliding window counter pattern:

```
key = "ratelimit:{scope}:{identifier}"
count = cache.get(key) ?? 0
if count >= MAX → 429
cache.set(key, count + 1, ttl=WINDOW_SECONDS)
```

In-memory counters are acceptable for ephemeral limits that reset on process eviction.

Apply rate limits in middleware or a shared helper — not per-route copy-paste.

## Input Validation

- Validate all user input at the route boundary
- Parse request bodies with typed shapes; handle parse failures gracefully
- Return 400 with descriptive, field-level errors
- No untyped `any` — narrow from `unknown`

## SSRF Prevention

When fetching user-provided URLs, block before the outbound request:

- Loopback: `localhost`, `127.0.0.1`, `::1`
- Private IPv4: `10.x`, `172.16–31.x`, `192.168.x`, `169.254.x` (cloud metadata)
- IPv6 ULA/link-local
- Hostnames: `.local`, `.internal`, `.localhost`

Resolve DNS and re-check the resolved IP — don't trust the hostname alone.

## Secrets

- Never commit secrets — use the platform's secret store
- Type all environment bindings in the project's env/config interface
- Rotate secrets on a schedule

## Logging

No debug logging in production handlers. Use warn/error levels for operational signals.
