---
title: Validate
description: Playwright e2e presentation tests — deterministic specs with step screenshots, session video, and an HTML walkthrough for local UI flows.
icon: MonitorPlay
order: 11
released: true
isNew: true
highlights:
    - Prerequisite gate for Playwright, local app, personas, and helpers
    - Discovery phase for persona, user stories, URL, and headed mode
    - Per-flow folders with committed specs and gitignored artifacts
    - Step screenshots, session video, and HTML presentation deliverable
    - Portable presentation helpers scaffolded when the repo lacks them
    - Package-manager agnostic run commands
    - SKILL.state — each step is skill spec + JSON state + latest observation only
structure:
    - SKILL.md
    - prerequisites.md
    - scripts/
    - scripts/state.sh
    - templates/
    - templates/playwright-e2e.ts.md
    - templates/presentation.ts.md
examples:
    - label: Record a login demo
      command: 'Login as a member'
    - label: Validate a checkout flow
      command: 'Checkout flow from cart to order confirmation'
    - label: Demo a feature walkthrough
      command: 'Settings flow as an admin'
    - label: Scaffold helpers
      command: 'Onboarding flow for a new user'
bestPractices:
    - Complete the prerequisites gate before authoring any specs
    - Wait for explicit approval of persona and user stories (Phase 0)
    - Prefer getByRole/getByLabel locators over brittle CSS selectors
    - Never commit artifacts/ — only the .spec.ts and shared helpers
    - Reset and reseed when the project has seed scripts to avoid flaky data
    - Next step is SKILL.md + state.json + latest observation — do not replay probe or run logs
---
