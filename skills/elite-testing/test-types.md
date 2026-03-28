# Test Type Patterns

## Contents
- Unit test patterns
- Business logic test patterns
- Integration test patterns
- Contract test patterns
- E2E test patterns
- Smoke test patterns
- Performance test patterns
- Cross-tenant isolation patterns
- State machine testing
- Idempotency testing

## Unit Test Patterns

Test pure functions with no dependencies. If you need to mock, it's probably not a unit test.

**What to test:** Validators, formatters, parsers, calculators, type guards, utility functions.

**What NOT to test here:** Database queries, API calls, middleware, anything with I/O.

```
// Pattern: boundary values
test("validates score within range", () => {
  expect(validateScore(0, 10)).toBe(true);   // min
  expect(validateScore(10, 10)).toBe(true);  // max
  expect(validateScore(11, 10)).toBe(false); // over
  expect(validateScore(-1, 10)).toBe(false); // under
});

// Pattern: error cases
test("throws on malformed input", () => {
  expect(() => parseDate("not-a-date")).toThrow();
  expect(() => parseDate("")).toThrow();
});
```

## Business Logic Test Patterns

Test domain rules in isolation from infrastructure. These are the highest-value tests.

**What to test:** State transitions, authorization rules, validation logic, business invariants.

**What NOT to test here:** HTTP status codes, database schemas, serialization.

```
// Pattern: state machine transitions
describe("competition status transitions", () => {
  it("allows draft → published", () => {
    expect(canTransition("draft", "published")).toBe(true);
  });
  it("blocks draft → completed (skip)", () => {
    expect(canTransition("draft", "completed")).toBe(false);
  });
  it("allows any active → cancelled", () => {
    for (const status of ["draft", "published", "in_progress"]) {
      expect(canTransition(status, "cancelled")).toBe(true);
    }
  });
});

// Pattern: authorization rules
describe("tenant isolation rules", () => {
  it("blocks access to another company's resources", () => {
    expect(canAccess({ userId: "u1", companyId: "c1" }, { companyId: "c2" }))
      .toBe(false);
  });
});
```

## Integration Test Patterns

Test components working together through real boundaries. Use in-memory databases or test containers.

**What to test:** Full request → response cycles, database queries return expected data, middleware applies correctly, auth rejects unauthorized requests.

**What NOT to test here:** UI rendering, browser behavior, third-party API responses (mock those).

### Test Harness Pattern

```
// Create a test database with schema applied
function createTestDB() {
  const db = createInMemoryDB();
  applySchema(db);  // run DDL
  return db;
}

// Seed deterministic data
function seedTestData(db) {
  const IDS = {
    admin: "usr_admin_001",
    company: "comp_001",
    outsider: "usr_outsider_001",
  };
  // Insert users, companies, memberships with fixed IDs
  return IDS;
}

// Create authenticated callers per role
function createCallers(db, ids) {
  return {
    admin: createCaller({ db, userId: ids.admin, role: "admin" }),
    outsider: createCaller({ db, userId: ids.outsider, role: null }),
    anon: createCaller({ db, userId: null }),
  };
}
```

### Auth Gating Pattern

```
describe("auth middleware", () => {
  it("rejects unauthenticated requests", async () => {
    await expect(anon.resource.list()).rejects.toThrow("UNAUTHORIZED");
  });
  it("rejects unauthorized role", async () => {
    await expect(viewer.admin.action()).rejects.toThrow("FORBIDDEN");
  });
});
```

## Contract Test Patterns

Ensure producer and consumer agree on data shapes.

**API contract:** Generate types from your API schema. In CI, regenerate and diff against committed types. If they diverge, the PR missed a codegen step.

**Event contract:** Define shared schema for events. Both producer and consumer test against the same schema definition.

```
// Pattern: type generation check (CI script)
// 1. Run codegen
// 2. git diff --exit-code generated/
// 3. If diff exists → fail with "Generated types are stale. Run codegen."
```

## E2E Test Patterns

Full user journeys through the deployed system. Use sparingly — high confidence but slow and brittle.

**What to test:** Critical revenue paths, onboarding flows, the one flow that absolutely cannot break.

**What NOT to test here:** Every edge case (that's what unit/integration tests are for).

```
// Pattern: critical path
test("user can register, create resource, and view it", async () => {
  await page.goto("/register");
  await page.fill("[name=email]", "test@example.com");
  await page.click("button[type=submit]");
  // ... complete flow
  await expect(page.locator(".resource-title")).toHaveText("My Resource");
});
```

**Flaky test management:** Tag flaky tests, retry once, quarantine if they fail > 3 times in a week. Fix or delete — never ignore.

## Smoke Test Patterns

Post-deploy verification. Run automatically after every production deploy.

```
// Pattern: health check suite
const SMOKE_ENDPOINTS = [
  { path: "/health", status: 200 },
  { path: "/api/auth/me", status: 401 },  // auth works
  { path: "/api/resources", status: 401 }, // protected routes work
];

for (const { path, status } of SMOKE_ENDPOINTS) {
  test(`${path} returns ${status}`, async () => {
    const res = await fetch(`${BASE_URL}${path}`);
    expect(res.status).toBe(status);
  });
}
```

## Performance Test Patterns

Establish baselines and catch regressions.

```
// Pattern: latency baseline
test("list endpoint responds within p95 budget", async () => {
  const times = [];
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    await fetch(`${BASE}/api/resources`);
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const p95 = times[Math.floor(times.length * 0.95)];
  expect(p95).toBeLessThan(200); // ms
});
```

## Cross-Tenant Isolation Testing

Critical for multi-tenant systems. Every entity access must validate ownership chain.

```
// Pattern: Company B admin cannot access Company A data
describe("tenant isolation", () => {
  it("blocks cross-tenant read", async () => {
    const resource = await companyACaller.create({ name: "Secret" });
    await expect(
      companyBCaller.getById({ id: resource.id })
    ).rejects.toThrow("NOT_FOUND"); // not FORBIDDEN — don't leak existence
  });
});
```

**Key principle:** Return NOT_FOUND (not FORBIDDEN) for cross-tenant access. Don't confirm the resource exists to unauthorized users.

## State Machine Testing

Test every valid transition AND every invalid transition.

```
// Pattern: exhaustive transition matrix
const STATUSES = ["draft", "published", "active", "completed", "cancelled"];
const VALID_TRANSITIONS = new Map([
  ["draft", ["published", "cancelled"]],
  ["published", ["active", "cancelled"]],
  // ...
]);

for (const from of STATUSES) {
  for (const to of STATUSES) {
    if (from === to) continue;
    const valid = VALID_TRANSITIONS.get(from)?.includes(to) ?? false;
    test(`${from} → ${to}: ${valid ? "allowed" : "blocked"}`, () => {
      if (valid) {
        expect(() => transition(from, to)).not.toThrow();
      } else {
        expect(() => transition(from, to)).toThrow();
      }
    });
  }
}
```

## Idempotency Testing

For operations that should be safe to retry.

```
// Pattern: double-submit protection
test("duplicate create returns same result", async () => {
  const idempotencyKey = "unique-key-123";
  const first = await api.create({ data, idempotencyKey });
  const second = await api.create({ data, idempotencyKey });
  expect(second.id).toBe(first.id); // same resource, not duplicate
});
```
