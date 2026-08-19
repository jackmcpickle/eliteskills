---
title: Backend
description: Domain layers, DTO boundaries, Result errors, and data flow. Stack-agnostic — Python and Hono bindings included.
icon: Database
released: true
order: 2
highlights:
    - Layered domains with a DTO boundary
    - Persistence stays in the repository
    - Result for expected failure
    - CreateBody, UpdateBody, Detail, ListItem catalog
    - Python and Hono bindings
structure:
    - SKILL.md
    - layered-architecture.md
    - data-modeling.md
    - repository-pattern.md
    - result-pattern.md
    - route-handlers.md
    - middleware-security.md
    - templates/
    - templates/feature.md
    - bindings/
    - bindings/python.md
    - bindings/hono.md
    - examples/
    - examples/python-notes.md
    - examples/hono-notes.md
examples:
    - label: CRUD feature
      command: 'Build a notes domain with DTOs, repository, service, and thin routes'
    - label: New domain module
      command: 'Create a bookmarks domain with create, list, update, and delete'
    - label: Repository function
      command: 'Add a filtered list with pagination to the articles repository'
bestPractices:
    - Define the four DTOs before writing queries or handlers
    - Persistence objects stay in the repository — only DTOs cross a boundary
    - Return Result at layer boundaries
    - Scaffold from the feature template
---
