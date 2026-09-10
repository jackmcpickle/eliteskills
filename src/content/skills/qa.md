---
title: QA
description: Manual QA test plans for human testers. Click-by-click walkthroughs, priority tagging, regression checklists, and edge case libraries.
icon: ClipboardCheck
order: 9
released: true
isNew: true
highlights:
    - Click-by-click test plans with expected outcomes
    - Priority tagging for critical path vs nice-to-have scenarios
    - Regression checklists tied to feature areas
    - Edge case library with boundary and error conditions
    - Cross-browser and device testing matrices
    - Smoke test suites for deploy verification
structure:
    - SKILL.md
    - qa-checklist.md
    - edge-cases.md
examples:
    - label: QA a pull request
      command: 'This PR'
    - label: QA a feature area
      command: 'The checkout flow'
    - label: Regression checklist
      command: 'The auth module after this refactor'
    - label: Edge case library
      command: 'File upload'
bestPractices:
    - Start with the happy path before covering edge cases
    - Tag each test case with priority (P0-P3) so testers know what to run first
    - Include exact expected results, not just "should work"
    - Group related test cases by feature area for efficient test runs
    - Update regression checklists whenever a bug is found and fixed
---
