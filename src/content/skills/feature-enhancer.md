---
title: Feature Enhancer
description: Take rough features and polish them. Error handling, edge cases, loading states, optimistic updates — the finishing touches.
icon: Sparkles
order: 6
highlights:
  - Comprehensive error handling and fallbacks
  - Edge case coverage and input validation
  - Loading states and skeleton screens
  - Optimistic updates with rollback
  - Retry strategies and graceful degradation
structure:
  - SKILL.md
  - templates/
  - templates/error-handling.md
  - templates/loading-states.md
  - templates/optimistic-update.md
  - examples/
  - examples/form-polish.md
  - examples/data-fetch-hardening.md
examples:
  - label: Harden a form
    command: "Add validation, error states, loading indicators, and success feedback to this form"
  - label: Resilient data fetching
    command: "Add retry logic, error boundaries, and skeleton loading to this data fetch"
  - label: Optimistic updates
    command: "Implement optimistic updates with rollback for this list mutation"
bestPractices:
  - Point it at a specific feature, not an entire app
  - Describe the current behavior and desired behavior clearly
  - Include edge cases you've already identified
  - Run after initial feature build, not during — separation of concerns
---
