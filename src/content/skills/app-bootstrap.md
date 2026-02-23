---
title: App Bootstrap
description: Go from zero to deployed in minutes. Project scaffolding, CI/CD pipelines, infra-as-code — all wired up.
icon: Rocket
order: 5
highlights:
  - Project scaffolding with best-practice defaults
  - CI/CD pipeline configuration out of the box
  - Infrastructure-as-code templates
  - Monorepo and workspace setup
  - Environment and secrets management
structure:
  - SKILL.md
  - templates/
  - templates/monorepo.md
  - templates/ci-pipeline.md
  - templates/docker.md
  - examples/
  - examples/saas-starter.md
  - examples/api-service.md
examples:
  - label: SaaS starter
    command: "Scaffold a full-stack SaaS app with auth, billing, and dashboard"
  - label: API service
    command: "Bootstrap a production API service with Docker, CI/CD, and monitoring"
  - label: Monorepo setup
    command: "Create a pnpm monorepo with shared packages, apps, and workspace config"
bestPractices:
  - Specify your target deployment platform (Vercel, AWS, Cloudflare) upfront
  - List your preferred tech stack — the skill adapts scaffolding to match
  - Use for greenfield projects; for existing projects use Feature Enhancer
  - Review generated CI/CD configs for your specific provider's syntax
---
