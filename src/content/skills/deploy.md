---
title: Deploy
description: Production CI/CD pipelines, deployment strategies, migration rollouts, and AI-powered CI automation.
icon: GitBranch
order: 8
released: true
isNew: true
highlights:
  - CI pipeline design with fail-fast gate ordering
  - Type generation and documentation drift detection
  - Multiple deployment strategies with decision tree
  - Zero-downtime database migration patterns
  - Preview environments per pull request
  - AI-powered auto-fix for lint, format, and type errors
  - Flaky test detection, quarantine, and triage
  - Secret management and rotation workflows
structure:
  - SKILL.md
  - ci-pipeline.md
  - deployment-strategies.md
  - migrations.md
  - ai-ci.md
examples:
  - label: CI pipeline
    command: "Design a CI pipeline for this monorepo with lint, test, type check, and deploy stages"
  - label: Deployment strategy
    command: "Recommend a deployment strategy for this app based on our infrastructure and team size"
  - label: Migration plan
    command: "Plan a zero-downtime migration to rename this column using expand-contract"
  - label: AI auto-fix
    command: "Set up AI-powered auto-fix for lint and format errors in our CI pipeline"
  - label: Preview environments
    command: "Add preview environment deploys for every PR with auto-cleanup"
bestPractices:
  - Put cheapest checks first in the pipeline — fail fast on lint before running tests
  - Use the deployment strategy decision tree to match your infrastructure
  - Never combine expand and contract phases in the same deploy
  - Set up type generation checks to catch stale codegen in PRs
  - Feature flags complement any deployment strategy for gradual rollouts
---
