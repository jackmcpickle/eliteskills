# Test Harness Patterns

## Contents
- Factory pattern
- In-memory database setup
- Mock external services
- Test data seeding
- Shared test utilities
- Snapshot testing guidance

## Factory Pattern

Factories create test data with sensible defaults. Override only what matters for each test.

```
// Factory with defaults
function buildUser(overrides = {}) {
  return {
    id: generateId(),
    name: "Test User",
    email: "test@example.com",
    role: "member",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

// Usage — only override what the test cares about
const admin = buildUser({ role: "admin" });
const inactive = buildUser({ deletedAt: "2024-01-01" });
```

**Deterministic IDs:** For integration tests, use fixed IDs instead of random generation. Makes assertions clearer and debugging easier.

```
const IDS = {
  adminUser: "usr_test_admin_001",
  regularUser: "usr_test_user_001",
  company: "comp_test_001",
  outsiderUser: "usr_test_outsider_001",
};
```

## In-Memory Database Setup

For integration tests, use an in-memory database with your real schema applied.

```
// Generic pattern (applies to any SQL-compatible in-memory DB)
function createTestDB() {
  const db = connectToInMemoryDB();

  // Apply your schema DDL
  const ddl = extractDDLFromSchema();
  for (const statement of ddl) {
    db.execute(statement);
  }

  return db;
}

// Per-test isolation
beforeEach(() => {
  db = createTestDB();
  seed(db);  // insert baseline data
});
```

**Key principle:** Each test gets a fresh database. Never share database state between tests.

## Mock External Services

Replace external dependencies with controlled implementations.

### HTTP Services
```
// Mock HTTP client
class MockHTTPClient {
  private responses = new Map();

  onGet(url, response) {
    this.responses.set(`GET:${url}`, response);
  }

  async get(url) {
    return this.responses.get(`GET:${url}`) ?? { status: 404 };
  }
}
```

### Object Storage
```
// Mock storage bucket (S3, R2, GCS, etc.)
class MockStorage {
  private objects = new Map();

  async put(key, body) {
    this.objects.set(key, body);
  }

  async get(key) {
    return this.objects.get(key) ?? null;
  }

  async delete(key) {
    this.objects.delete(key);
  }

  async list(prefix) {
    return [...this.objects.keys()].filter(k => k.startsWith(prefix));
  }
}
```

### Queue / Event Bus
```
// Mock queue that captures published messages
class MockQueue {
  published = [];

  async publish(topic, message) {
    this.published.push({ topic, message, at: Date.now() });
  }

  // Test helper
  messagesFor(topic) {
    return this.published.filter(m => m.topic === topic);
  }
}
```

## Test Data Seeding

Seed functions create a realistic baseline state for integration tests.

```
function seedBaselineData(db) {
  // Create users across roles
  db.insert("users", buildUser({ id: IDS.admin, role: "admin" }));
  db.insert("users", buildUser({ id: IDS.member, role: "member" }));
  db.insert("users", buildUser({ id: IDS.outsider, role: "member" }));

  // Create organization
  db.insert("companies", buildCompany({ id: IDS.company }));

  // Link users to org
  db.insert("memberships", {
    userId: IDS.admin, companyId: IDS.company, role: "admin"
  });
  db.insert("memberships", {
    userId: IDS.member, companyId: IDS.company, role: "member"
  });
  // outsider has NO membership — used for tenant isolation tests

  return IDS;
}
```

**Seeding tips:**
- Create the minimum data needed for most tests
- Let individual tests add their own specific data
- Include at least one "outsider" user for isolation tests
- Include soft-deleted records to test filtering

## Shared Test Utilities

Keep DRY across test files.

```
// helpers/setup.ts — shared across all test files
export function createTestContext() {
  const db = createTestDB();
  const ids = seedBaselineData(db);
  return {
    db,
    ids,
    adminCaller: createCaller(db, ids.admin, "admin"),
    memberCaller: createCaller(db, ids.member, "member"),
    outsiderCaller: createCaller(db, ids.outsider, null),
    anonCaller: createCaller(db, null, null),
  };
}

// In test files:
let ctx;
beforeEach(() => { ctx = createTestContext(); });

test("admin can create", async () => {
  const result = await ctx.adminCaller.resource.create({ name: "Test" });
  expect(result.name).toBe("Test");
});
```

## Snapshot Testing Guidance

Snapshots capture output and compare against a saved version.

**Good uses:**
- Serialized output formats (JSON responses, HTML rendering)
- Error message formatting
- Configuration generation

**Bad uses:**
- Anything with timestamps, IDs, or non-deterministic data
- Large objects where a small change causes a massive diff
- Tests where you don't actually inspect the snapshot

**Rules:**
- Review every snapshot update — don't blindly `--update`
- Keep snapshots small and focused
- If a snapshot changes on every PR, it's testing the wrong thing
