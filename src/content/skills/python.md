---
title: Python
description: API design, database queries, auth flows, server architecture. Battle-tested patterns from production systems.
icon: Database
released: true
order: 2
highlights:
    - Layered architecture with strict DTO boundaries
    - Repository pattern with SQLModel → DTO conversion
    - Result pattern for explicit error handling
    - Copy-paste feature template for new domains
    - Typed errors (NotFound, AlreadyExists, Forbidden, etc.)
structure:
    - SKILL.md
    - layered-architecture.md
    - data-modeling.md
    - repository-pattern.md
    - result-pattern.md
    - templates/
    - templates/feature.md
    - examples/
    - examples/notes.md
examples:
    - label: CRUD feature
      command: 'Build a complete notes feature with models, DTOs, repository, service, and routes'
    - label: New domain module
      command: 'Create a bookmarks domain with create, list, update, and delete endpoints'
    - label: Repository function
      command: 'Add a filtered list endpoint with pagination to the articles repository'
bestPractices:
    - Define SQLModel tables and DTOs before writing repository functions
    - Keep SQLModel objects inside repositories — only DTOs cross layer boundaries
    - Use Result types at layer boundaries for explicit error handling
    - Start from the feature template for new domain modules
---
