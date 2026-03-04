---
name: elite-testing
description: Design and implement comprehensive test strategies across the testing pyramid. Use when building tests, defining test strategy, improving coverage, creating test harnesses, or when asked to "add tests", "test coverage", "write tests", "test strategy", "what tests do I need", or "test this". Covers unit, integration, e2e, smoke, business logic, contract, performance, and LLM evaluation testing.
version: 1.0.0
---

# Testing Strategy Skill

Build production-grade test suites with clear purpose at every layer. Assess what exists, recommend what's missing, implement with precision.

## Workflow

1. **Audit** — scan codebase for existing tests, coverage, gaps
2. **Recommend** — propose test strategy (which types, priorities, ratios)
3. **Implement** — write tests following the patterns below

## Testing Pyramid

Each layer has a job. Don't test the same thing twice at different layers.

### Unit Tests
Pure functions, calculations, transformations. No I/O, no state. Fast.
- Domain rules, validators, formatters, parsers
- Edge cases: empty input, boundary values, overflow, unicode
- One assertion per logical concept

### Business Logic Tests
Domain services, state machines, invariants. The "what", not the "how".
- State transition validity (allowed vs blocked transitions)
- Validation rules (registration windows, capacity limits, ownership chains)
- Permission/authorization logic in isolation
- See [test-types.md](test-types.md) for patterns

### Integration Tests
Components working together through real boundaries.
- API endpoints through the router (not mocking the framework)
- Database queries against a real (in-memory or test) database
- Middleware chains, auth flows, tenant isolation
- See [test-types.md](test-types.md) and [test-harness.md](test-harness.md) for setup

### Contract Tests
Agreements between producer and consumer stay in sync.
- API request/response schemas match between client and server
- Generated types match committed types (detect stale codegen)
- Event payload shapes between services

### End-to-End Tests
Full user flows through the real system.
- Critical paths only (login → create → edit → delete)
- Browser automation for frontend, API chains for backend
- Slow — run on main branch, not every PR (or use selective triggering)

### Smoke Tests
Post-deploy sanity. Run in production after every deploy.
- Health endpoints respond
- Critical API paths return 200
- Database connectivity verified
- < 30 seconds total

### Performance Tests
Baseline and regression detection.
- Latency percentiles (p50, p95, p99) for critical endpoints
- Throughput under expected and peak load
- Compare against baseline — fail on regression

### LLM / AI Evaluation Tests
When the system uses AI models. See [llm-evals.md](llm-evals.md).
- Output quality scoring (rubric-based, reference comparison)
- Regression detection against golden datasets
- Prompt perturbation testing

## Coverage Philosophy

See [coverage-strategy.md](coverage-strategy.md) for details.

- Coverage is a **floor**, not a ceiling. 80% line coverage means nothing if the critical path is untested.
- **Ratchet pattern**: coverage can only go up. CI fails if new code drops below current threshold.
- **Mutation testing** finds tests that pass but don't actually catch bugs.
- Don't chase 100%. Test what matters: business logic, security boundaries, data integrity.

## Test Design Principles

- **Arrange / Act / Assert** — three distinct blocks, every test
- **Test behaviour, not implementation** — assert outcomes, not internal calls
- **Deterministic data** — factory functions, fixed IDs, seeded randomness. No `Math.random()` in tests.
- **Isolation** — each test gets fresh state. No shared mutable state between tests.
- **Role-based fixtures** — test as admin, regular user, unauthenticated, cross-tenant outsider
- **Name tests as specifications** — `it("rejects registration when competition is not published")`
- **Don't test the framework** — don't test that your router routes or your ORM queries

## Anti-Patterns

- Mocking everything → tests pass but nothing works
- Testing implementation details → brittle, breaks on refactor
- Shared mutable state → flaky, order-dependent
- Giant test files → split by feature or behavior group
- "One more assertion" → multiple concerns per test
- Copy-paste test data → use factories
