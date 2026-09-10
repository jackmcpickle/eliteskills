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
      command: 'Audit this codebase'
    - label: Integration test harness
      command: 'Integration test harness for the API'
    - label: State machine tests
      command: 'The order status state machine'
    - label: Tenant isolation suite
      command: 'Cross-tenant isolation for the projects API'
    - label: LLM eval suite
      command: 'The RAG pipeline'
bestPractices:
    - Start with a test audit to identify gaps before writing new tests
    - Focus business logic tests on domain rules and state machines first
    - Use deterministic data factories instead of random generation in tests
    - Test authorization as outsider/cross-tenant, not just as authenticated user
    - Keep test files focused — one behavior group per file
---
