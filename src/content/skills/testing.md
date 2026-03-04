---
title: Testing
description: Comprehensive test strategies across the full pyramid. Unit, integration, e2e, smoke, contract, and LLM evals.
icon: FlaskConical
order: 7
released: true
isNew: true
highlights:
  - Full testing pyramid strategy and prioritization
  - Integration test harness patterns with role-based fixtures
  - Cross-tenant isolation and state machine testing
  - Code coverage strategy with ratchet enforcement
  - LLM and AI model evaluation frameworks
  - Contract testing for API and type generation checks
  - Performance baseline and regression detection
  - Mutation testing for test quality validation
structure:
  - SKILL.md
  - test-types.md
  - coverage-strategy.md
  - llm-evals.md
  - test-harness.md
examples:
  - label: Test strategy audit
    command: "Audit this codebase and recommend a test strategy with priorities"
  - label: Integration test harness
    command: "Create a test harness with in-memory database, seed data, and role-based callers"
  - label: State machine tests
    command: "Generate exhaustive transition tests for this status state machine"
  - label: Tenant isolation suite
    command: "Write cross-tenant isolation tests ensuring Company B cannot access Company A data"
  - label: LLM eval suite
    command: "Design an evaluation suite for this RAG pipeline with golden dataset and regression detection"
bestPractices:
  - Start with a test audit to identify gaps before writing new tests
  - Focus business logic tests on domain rules and state machines first
  - Use deterministic data factories instead of random generation in tests
  - Test authorization as outsider/cross-tenant, not just as authenticated user
  - Keep test files focused — one behavior group per file
---
