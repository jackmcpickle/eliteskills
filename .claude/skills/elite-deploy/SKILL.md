---
name: elite-deploy
description: Design CI/CD pipelines, deployment strategies, and release workflows. Use when setting up continuous integration, deployment pipelines, preview environments, migration rollouts, or when asked to "deploy", "CI/CD", "pipeline", "release", "deployment strategy", "migrations", "rollback", or "set up CI". Covers linting, testing, building, type checking, documentation validation, and multiple deployment patterns.
version: 1.0.0
---

# CI/CD & Deployment Skill

Design production-grade pipelines and deployment strategies. Assess the project, recommend the right approach, implement with safety built in.

## Workflow

1. **Assess** — scan project for build system, test suite, infra, team size
2. **Recommend** — propose CI pipeline structure + deployment strategy
3. **Implement** — create pipeline config, deploy scripts, migration plan

## CI Pipeline Design

See [ci-pipeline.md](ci-pipeline.md) for detailed patterns.

### Pipeline Stages (in order)

```
lint → format-check → typecheck → test → build → deploy
  ↑ fast, cheap                         slow, expensive ↓
```

**Fail fast:** Put the cheapest checks first. A lint error caught in 10 seconds saves a 5-minute build.

### CI Gates — What to Check

Every PR should pass these before merge:

| Gate | Purpose | Blocks merge? |
|---|---|---|
| **Code linting** | Static analysis, style rules, security patterns | Yes |
| **Code formatting** | Format check (not auto-fix) — committed code must be formatted | Yes |
| **Type checking** | Strict mode, no implicit any | Yes |
| **Unit + integration tests** | Core logic verified | Yes |
| **Build succeeds** | Production build completes | Yes |
| **Coverage gate** | Coverage doesn't drop (ratchet) | Yes |
| **Type generation check** | Generated types match committed | Yes |
| **Dependency audit** | No known vulnerabilities | Advisory |
| **Bundle size** | No unexpected size increase | Advisory |
| **Documentation check** | Changed APIs have updated docs | Advisory |
| **E2E tests** | Full user flows | On main only |

### Type Generation Check

Catch stale codegen — when a PR changes the API but forgets to regenerate client types.

```
# CI step
run-codegen
git diff --exit-code generated/
# If diff → fail: "Generated types are stale. Run codegen and commit."
```

### Documentation Check

Detect when code changes aren't reflected in docs.

```
# If files in src/api/ changed, require changes in docs/api/
changed_api=$(git diff --name-only main | grep "src/api/")
changed_docs=$(git diff --name-only main | grep "docs/api/")
if [ -n "$changed_api" ] && [ -z "$changed_docs" ]; then
  warn "API files changed but docs were not updated"
fi
```

### Preview Environments

Ephemeral deploys per PR for visual review and testing.

- Deploy on PR open/update, tear down on PR close
- Unique URL per PR (e.g., `pr-123.preview.example.com`)
- Post URL as PR comment
- Auto-run smoke tests against preview

## Deployment Strategy

See [deployment-strategies.md](deployment-strategies.md) for all patterns.

### Decision Tree

```
Single server, small team?
  → Atomic deploy (symlink swap)

Stateless app, need instant rollback?
  → Blue-green deploy

High traffic, risk-averse?
  → Canary / progressive rollout

Container-based, multiple services?
  → Rolling deploy (orchestrator-managed)

Docker without orchestrator?
  → Docker red/green (proxy swap)

Serverless / edge platform?
  → Immutable function versions

Any of the above + gradual feature release?
  → Add feature flags
```

## Database Migrations

See [migrations.md](migrations.md) for patterns.

**Core principle:** Deployments and migrations are separate concerns. A deploy should never require downtime for schema changes.

- **Expand-contract pattern** for schema changes (add new → migrate → remove old)
- **Forward-only migrations** — don't write rollback SQL, use compensating transactions
- **Test migrations** against a production clone before running in prod

## AI-Powered CI

See [ai-ci.md](ai-ci.md) for patterns.

- **Auto-fix:** LLM reads CI failure logs, generates fix commits for lint/format/type errors
- **PR review:** LLM reviews diffs and posts advisory comments
- **Failure triage:** LLM categorizes failures (flaky, infra, real bug)
- **Guardrails:** Only auto-commit for mechanical fixes. Logic changes need human approval.

## Pipeline Principles

- **Deterministic builds:** Same commit → same output. Pin dependencies, lock files committed.
- **Secrets never in code:** Environment variables, secret managers, CI-level secrets. Rotate regularly.
- **Cache aggressively:** Dependencies, build artifacts, test results. Invalidate on lockfile change.
- **Parallelise independent jobs:** Lint, typecheck, and test can run simultaneously.
- **Artifact passing:** Build once, deploy the same artifact to all environments.
- **Idempotent deploys:** Running the same deploy twice produces the same result.
