# Plan Output Template

After completing discovery and the user approves a tech stack, generate `BOOTSTRAP-PLAN.md` using this structure. Adapt sections based on what's relevant — skip sections that don't apply.

---

````markdown
# [App Name] — Bootstrap Plan

_Generated: [date]_

## Overview

**What:** [One-line description]
**Who:** [Target audience]
**Platform:** [Web / iOS / Android / Desktop / etc.]
**Point of difference:** [Key differentiator]

## Chosen Tech Stack

| Layer      | Choice | Rationale |
| ---------- | ------ | --------- |
| Framework  |        |           |
| Language   |        |           |
| UI Library |        |           |
| Database   |        |           |
| ORM        |        |           |
| Auth       |        |           |
| Hosting    |        |           |
| CI/CD      |        |           |
| Testing    |        |           |
| Monitoring |        |           |
| API style  |        |           |
| Payments   |        |           |

## Stage 0: Project Setup & DevEx

**Goal:** Repository is initialized with tooling so every future commit is linted, formatted, and type-checked.

### Tasks

- [ ] Initialize repository with .gitignore
- [ ] Set up package manager and install core dependencies
- [ ] Configure [linter] with project rules
- [ ] Configure [formatter]
- [ ] Set up pre-commit hooks
- [ ] Create .editorconfig
- [ ] Generate CLAUDE.md
- [ ] Create README.md with project description and setup instructions

### Why this matters

[Explain why DevEx setup first saves time across every subsequent stage]

---

## Stage 1: CI/CD & Deployment Pipeline

**Goal:** Every push triggers lint + test + build. Merges to main auto-deploy to staging.

### Tasks

- [ ] Create CI workflow ([CI platform] — lint, type-check, test on PR)
- [ ] Create CD workflow (deploy to [hosting] on merge to main)
- [ ] Configure environment variables for dev/staging/production
- [ ] Set up secret management via [approach]
- [ ] Verify preview deployments work

### Pipeline architecture

[Explain the flow: push → CI checks → PR review → merge → staging deploy → manual promote to production]

### Why CI/CD first

[Explain: every subsequent stage is automatically validated. No "it works on my machine" problems. Deployment muscle memory from day 1.]

---

## Stage 2: Test Harness

**Goal:** Testing infrastructure is in place with passing example tests at every level.

### Tasks

- [ ] Set up [unit test framework] with example test
- [ ] Set up [integration test framework] with example test
- [ ] Set up [E2E test framework] with smoke test (app loads)
- [ ] Configure coverage reporting (threshold: [X]%)
- [ ] Wire tests into CI pipeline (failing tests block merge)

### Testing strategy

[Explain the testing pyramid/trophy for this specific app. What to unit test, what to integration test, what to E2E test. Where the most value comes from given the app type.]

---

## Stage 3: Application Foundation

**Goal:** App runs locally and in staging with core layout, auth, and database connected.

### Tasks

- [ ] Scaffold project using [create command]
- [ ] Set up [UI library/design system]
- [ ] Define design tokens (colors, typography, spacing)
- [ ] Create core layout (navigation, header, footer)
- [ ] Set up database with [ORM] and run initial migration
- [ ] Implement authentication flow using [auth provider]
- [ ] Create health check endpoint
- [ ] Configure environment variable loading

### Architecture decisions

[Explain folder structure, naming conventions, and any architectural patterns being used (e.g., feature-based modules, layered architecture)]

---

## Stage 4: Core Features

### Feature 1: [Name]

**Priority:** P0 — [why this is first]

#### Data model

[Tables/collections needed, key fields, relationships]

#### API / Service layer

- [ ] [Endpoint/function 1]
- [ ] [Endpoint/function 2]

#### UI

- [ ] [Page/screen 1]
- [ ] [Component 1]

#### Tests

- [ ] Unit tests for [business logic]
- [ ] E2E test for [critical path]

#### Acceptance criteria

- [ ] [User can...]
- [ ] [System should...]

---

### Feature 2: [Name]

[Same structure as Feature 1]

---

### Feature 3: [Name]

[Same structure as Feature 1]

---

## Stage 5: Polish & Launch Prep

**Goal:** App is production-ready with error handling, performance, accessibility, and monitoring.

### Tasks

- [ ] Implement error boundaries / global error handling
- [ ] Add loading states and skeleton screens
- [ ] SEO: meta tags, Open Graph, structured data
- [ ] Performance: run [Lighthouse / profiler], optimize critical path
- [ ] Accessibility: run [axe / screen reader], fix issues
- [ ] Set up [analytics tool]
- [ ] Set up [error tracking tool] with source maps
- [ ] Write API documentation
- [ ] Write contributing guide

---

## Stage 6: Launch

**Goal:** App is live in production and monitored.

### Tasks

- [ ] Configure production environment
- [ ] Set up custom domain and DNS
- [ ] Verify SSL/TLS
- [ ] Set up database backups ([schedule])
- [ ] Document rollback procedure
- [ ] Launch checklist:
    - [ ] All tests passing
    - [ ] Performance budget met
    - [ ] Error tracking verified
    - [ ] Analytics verified
    - [ ] Backup verified
    - [ ] Monitoring alerts configured

---

## Appendix: Key Commands

```bash
# Development
[dev command]          # Start dev server
[build command]        # Production build
[test command]         # Run all tests
[lint command]         # Lint code
[format command]       # Format code
[migrate command]      # Run database migrations
[deploy command]       # Deploy to staging/production
```
````

## Appendix: Architecture Decisions

| Decision | Choice | Alternatives Considered | Why |
| -------- | ------ | ----------------------- | --- |
|          |        |                         |     |

```

```
