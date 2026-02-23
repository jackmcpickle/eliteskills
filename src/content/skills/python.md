---
title: Python
description: API design, database queries, auth flows, server architecture. Battle-tested patterns from production systems.
icon: Database
order: 2
highlights:
  - RESTful API design with proper status codes
  - Database query optimization and indexing
  - Auth flows with JWT, sessions, and RBAC
  - Repository pattern and layered architecture
  - Error handling with Result types
structure:
  - SKILL.md
  - templates/
  - templates/api-route.py.md
  - templates/repository.py.md
  - templates/service.py.md
  - examples/
  - examples/crud-api.md
  - examples/auth-middleware.md
examples:
  - label: REST API with auth
    command: "Build a FastAPI REST API with JWT auth, user registration, and RBAC middleware"
  - label: Database layer
    command: "Create a repository pattern database layer with connection pooling and migrations"
  - label: Background tasks
    command: "Set up a task queue with Celery for email sending and report generation"
bestPractices:
  - Define your database schema before generating API routes
  - Specify your ORM (SQLAlchemy, Django ORM, Prisma) for accurate output
  - Break complex APIs into individual endpoint tasks
  - Include your error handling conventions in the prompt
---
