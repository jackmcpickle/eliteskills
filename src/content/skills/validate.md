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
structure:
    - SKILL.md
    - prerequisites.md
    - templates/playwright-e2e.ts.md
    - templates/presentation.ts.md
examples:
    - label: Record a login demo
      command: 'Write a Playwright presentation test for login as a member and capture screenshots plus video'
    - label: Validate a checkout flow
      command: 'Create an e2e presentation for checkout with headed recording and an HTML report'
    - label: Demo a feature walkthrough
      command: 'Record step-by-step screenshots of the settings flow as an admin persona'
    - label: Scaffold helpers
      command: 'Set up elite-validate presentation helpers in this repo and run the smoke flow'
bestPractices:
    - Complete the prerequisites gate before authoring any specs
    - Wait for explicit approval of persona and user stories (Phase 0)
    - Prefer getByRole/getByLabel locators over brittle CSS selectors
    - Never commit artifacts/ — only the .spec.ts and shared helpers
    - Reset and reseed when the project has seed scripts to avoid flaky data
---
