---
title: React
description: React component patterns. Accessibility-first markup. Responsive layouts that don't break.
icon: Layers
order: 1
released: true
highlights:
  - Compound component patterns with slot-based APIs
  - Accessibility-first markup and ARIA patterns
  - Responsive layouts with mobile-first breakpoints
  - State management with hooks and context
  - Performance-optimized rendering strategies
structure:
  - SKILL.md
  - templates/
  - templates/component.tsx.md
  - templates/hook.ts.md
  - templates/form.tsx.md
  - examples/
  - examples/data-table.md
  - examples/auth-flow.md
examples:
  - label: Build a data table
    command: "Create a sortable, filterable data table with pagination using TanStack Table"
  - label: Auth flow
    command: "Build a login/signup flow with form validation, error states, and redirect"
  - label: Dashboard layout
    command: "Create a responsive dashboard with sidebar navigation and nested routes"
bestPractices:
  - Start with a clear component hierarchy before generating code
  - Provide your existing design tokens or Tailwind config so output matches your project
  - Use small, focused tasks rather than entire page builds
  - Review generated code for project-specific conventions
---
