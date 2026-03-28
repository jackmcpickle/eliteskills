# CI Pipeline Patterns

## Contents
- Job dependency graphs
- Caching strategies
- Monorepo considerations
- Secret management
- Conditional execution
- Preview environments
- Flaky test handling
- Auto-merge patterns
- Build matrix

## Job Dependency Graphs

Structure jobs so independent tasks run in parallel and dependent tasks wait.

```
            ┌─── lint ────┐
            │              │
commit ─────┼─── format ──┼──── build ──── deploy
            │              │
            ├─── types ───┤
            │              │
            └─── test ────┘
```

Lint, format, types, and test are independent — run in parallel.
Build depends on all passing. Deploy depends on build.

**Anti-pattern:** Running everything sequentially. A 2-minute lint failure shouldn't wait behind a 10-minute test suite.

## Caching Strategies

### Dependency Cache
Cache your package manager's store. Invalidate when lockfile changes.

```
Key: deps-{os}-{hash(lockfile)}
Restore: deps-{os}-   (prefix match for partial cache)
Paths: node_modules/, .pnpm-store/, vendor/, etc.
```

### Build Cache
Cache build output for unchanged packages.

```
Key: build-{os}-{hash(src/**)}
Paths: dist/, .next/, .astro/, build/
```

### Test Result Cache
Some test runners support caching results for unchanged files.

```
Key: test-{os}-{hash(src/**, tests/**)}
Paths: .vitest/, .jest-cache/
```

**Cache poisoning prevention:** Always include OS and lockfile hash in cache keys.

## Monorepo Considerations

### Affected Detection
Only run checks for packages that changed.

```
# Which packages changed since main?
changed_packages=$(detect-changes --since main)

# Only lint/test/build those packages
for pkg in $changed_packages; do
  run-tests --filter=$pkg
done
```

### Selective Builds
Path filters trigger specific jobs:

```
# Only run API tests when API code changes
paths: ["packages/api/**", "packages/shared/**"]

# Only run web deploy when web code changes
paths: ["apps/web/**", "packages/ui/**"]
```

### Dependency Awareness
If package A depends on package B, changes to B should trigger A's tests too. Build a dependency graph and test downstream consumers.

## Secret Management

### Levels
- **Repository secrets:** Shared across all workflows (API keys, deploy tokens)
- **Environment secrets:** Scoped to staging/production (database URLs)
- **Job-level secrets:** Narrow scope, least privilege

### Rotation
- Automate rotation where possible
- CI should fail gracefully on expired secrets (clear error, not cryptic failure)
- Never log secret values — mask in CI output

### Patterns
```
# Good: secret from CI environment
DATABASE_URL=${{ secrets.DATABASE_URL }}

# Bad: secret in code, env file committed, hardcoded in config
DATABASE_URL=postgres://user:pass@host/db
```

## Conditional Execution

### Skip Patterns
Don't run expensive jobs for documentation-only changes.

```
# Skip tests if only docs changed
if: "!contains(changed_files, 'docs/')"

# Skip deploy on draft PRs
if: "!github.event.pull_request.draft"
```

### Environment-Based
```
# Deploy to staging on PR merge to main
# Deploy to production on release tag
on:
  push:
    branches: [main]        → staging
    tags: ["v*"]             → production
```

## Preview Environments

Ephemeral environments per PR.

### Lifecycle
1. **PR opened/updated:** Deploy preview, post URL comment
2. **PR commented:** Optional — trigger re-deploy on command
3. **PR closed/merged:** Tear down preview, clean up resources

### Implementation Pattern
```
# Deploy
preview_url=$(deploy-preview --pr=$PR_NUMBER)
comment-on-pr "Preview deployed: $preview_url"

# Smoke test the preview
run-smoke-tests --url=$preview_url

# Cleanup (on PR close)
destroy-preview --pr=$PR_NUMBER
```

### Resource Management
- Set TTL on preview environments (auto-destroy after 7 days)
- Limit concurrent previews (max 10 active)
- Use lightweight infrastructure (not full production replicas)

## Flaky Test Handling

Flaky tests erode trust in CI. Handle them explicitly.

### Detection
```
# Track test results over time
# If a test fails > 2 times in 7 days but passes in between → flaky
```

### Strategies
1. **Retry once** — automatic, catches transient failures
2. **Quarantine** — move to a separate non-blocking job after 3+ flakes
3. **Fix or delete** — quarantined tests must be fixed within 2 weeks or removed
4. **Never ignore** — a flaky test is worse than no test (teaches team to dismiss failures)

### Retry Pattern
```
# Retry failed tests once before reporting failure
run-tests || run-tests --only-failed
```

## Auto-Merge Patterns

When all checks pass and approvals are in, merge automatically.

### Conditions
- All required checks green
- Required number of approvals met
- No unresolved review comments
- No merge conflicts
- Author has opted in (label or command)

### Safety
- Never auto-merge to production branches
- Require at least one human approval
- Exclude PRs that touch sensitive paths (auth, payments, config)

## Build Matrix

Test across multiple environments when needed.

```
# When to use a matrix
- Library published to multiple runtimes (Node 18, 20, 22)
- Cross-platform builds (linux, macos, windows)
- Multiple database versions

# When NOT to use a matrix
- Application deployed to a single known environment
- Doubling CI time for theoretical compatibility
```

**Keep matrices small.** 3×3 = 9 jobs. 5×5 = 25 jobs. Cost and time add up fast.
