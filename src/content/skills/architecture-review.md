---
title: Architecture Review
description: Catch bugs before they ship. Enforce conventions. Get PR feedback that actually teaches your AI something.
icon: ShieldCheck
order: 4
highlights:
  - Bug detection and anti-pattern identification
  - Convention enforcement and style consistency
  - Security vulnerability scanning
  - Performance bottleneck analysis
  - Actionable PR feedback with fix suggestions
structure:
  - SKILL.md
  - checklists/
  - checklists/security.md
  - checklists/performance.md
  - checklists/conventions.md
  - examples/
  - examples/pr-review.md
  - examples/codebase-audit.md
examples:
  - label: PR review
    command: "Review this PR for bugs, security issues, and convention violations"
  - label: Codebase audit
    command: "Audit the authentication module for security vulnerabilities and anti-patterns"
  - label: Convention check
    command: "Check all components follow our naming conventions and file structure"
bestPractices:
  - Point the AI at specific files or modules rather than the entire codebase
  - Include your team's convention docs for more relevant feedback
  - Run reviews on PRs before merge, not after
  - Use iteratively — fix findings and re-run for diminishing issues
---
