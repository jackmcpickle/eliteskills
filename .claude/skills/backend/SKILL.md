---
name: backend
description: Create FastAPI backend features following SubTechnica patterns. Use when building new APIs, services, domain models, or repository functions. Uses SQLModel for DB, Pydantic CamelModel for API types, and Result pattern for error handling.
---

# Backend Development Skill

Build production-grade FastAPI features using SubTechnica's established patterns. SQLModel for persistence, Pydantic DTOs for layer boundaries, Result for error handling.

## Core Philosophy

- **SQLModel** (`table=True`) for database models with automatic key/timestamps via `BaseModel`
- **DTOs (Pydantic)** at every layer boundary — request DTOs in, response DTOs out
- **Repositories own the conversion** — SQLModel never leaks past the repository
- **Result[ErrorType, T]** for explicit error handling
- **Typed errors** from `srv.core.errors` (NotFound, AlreadyExists, Forbidden, etc.)

## When to Use This Skill

Activate when the user requests:

- New FastAPI endpoints or routes
- Domain models or data structures
- Repository functions or database operations
- Business logic services
- New domain modules under `src/srv/`

## Quick Start Checklist

For a new feature, create files under the domain:

```
src/srv/{domain}/
├── models/
│   └── {entity}.py        # SQLModel table=True (DB only)
├── types/
│   └── {entity}.py        # DTOs: CreateBody, UpdateBody, Detail, ListItem
├── repository/
│   └── {entity}.py        # DB ops, converts SQLModel → DTO
├── services/
│   └── {entity}.py        # Business logic with DTOs
└── routes/
    └── {entity}.py        # Thin: parse request DTO, return response DTO
```

## DTO Flow

```
Request DTO          Response DTO
(CreateBody)         (Detail/ListItem)
     │                     ▲
     ▼                     │
┌─────────┐          ┌─────────┐
│  Route   │──────────│  Route  │   Route: parse request, return response
└────┬─────┘          └────▲────┘
     │                     │
     ▼                     │
┌─────────┐          ┌─────────┐
│ Service  │──────────│ Service │   Service: validate, orchestrate (DTOs only)
└────┬─────┘          └────▲────┘
     │                     │
     ▼                     │
┌─────────┐          ┌─────────┐
│  Repo   │──────────│  Repo   │   Repo: DTO → SQLModel → DB → SQLModel → DTO
└─────────┘          └─────────┘
```

**SQLModel objects never leave the repository.** The repo is the only layer that knows about the database model.

## Layer Responsibilities

### Routes (Thin)

- Receive request DTOs (FastAPI validates automatically)
- Pass DTOs to services/repositories
- Return response DTOs directly (no conversion needed)
- **No business logic, no model_validate**

### Services (Orchestration)

- Receive DTOs, return `Result[ErrorType, DTO]`
- Business rules and validation
- Compose multiple repository calls
- **Never import SQLModel models**

### Repositories (Data Access + Conversion)

- Accept DTOs or primitives as input
- Create/query SQLModel objects internally
- **Convert SQLModel → response DTO before returning**
- Return `Result[ErrorType, DTO]`

### Models (SQLModel tables) — repo-internal

- Extend `srv.db.base.BaseModel` for auto key/timestamps
- Set `table=True` and `__tablename__`
- Use `str, Enum` classes for enum fields (NOT `Literal`)

### Types (DTOs)

- **Request DTOs**: `CreateXxxBody`, `UpdateXxxBody` — plain `BaseModel`, no id/key
- **Response DTOs**: `XxxDetail`, `XxxListItem` — `CamelModel` with key, timestamps

## Key Patterns

### Request DTOs (no id/key)

```python
from pydantic import BaseModel

class NoteCreateBody(BaseModel):
    title: str
    content: str = ""
    is_pinned: bool = False

class NoteUpdateBody(BaseModel):
    title: str | None = None
    content: str | None = None
    is_pinned: bool | None = None
```

### Response DTOs (with key, timestamps)

```python
from datetime import datetime
from srv.core.base.types import CamelModel

class NoteDetail(CamelModel):
    key: str
    title: str
    content: str
    is_pinned: bool
    created_at: datetime

class NoteListItem(CamelModel):
    key: str
    title: str
    is_pinned: bool
    created_at: datetime
```

### Repository — converts SQLModel → DTO

```python
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from srv.core.errors import NotFound
from srv.core.result import Err, Ok, Result
from ..models.note import Note
from ..types.note import NoteDetail

async def get_note_by_key(
    session: AsyncSession,
    key: str,
) -> Result[NotFound, NoteDetail]:
    stmt = select(Note).where(Note.key == key)
    result = await session.exec(stmt)
    note = result.one_or_none()
    if note is None:
        return Err(NotFound(entity="Note", identifier=key))
    return Ok(NoteDetail.model_validate(note, from_attributes=True))


async def create_note(
    session: AsyncSession,
    team_id: int,
    data: NoteCreateBody,
) -> Result[NotFound, NoteDetail]:
    note = Note(
        team_id=team_id,
        title=data.title,
        content=data.content,
        is_pinned=data.is_pinned,
    )
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return Ok(NoteDetail.model_validate(note, from_attributes=True))
```

### Service — works with DTOs only

```python
from srv.core.errors import InvalidInput
from srv.core.result import Err, Result
from ..repository import note as repo
from ..types.note import NoteCreateBody, NoteDetail

async def create_note(
    session: AsyncSession,
    team_id: int,
    data: NoteCreateBody,
) -> Result[InvalidInput, NoteDetail]:
    if not data.title.strip():
        return Err(InvalidInput(errors={"title": ["Title is required"]}))
    return await repo.create_note(session, team_id, data)
```

### Route — thin passthrough

```python
@router.post("/", status_code=201)
async def create_note(
    body: NoteCreateBody,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
) -> NoteDetail:
    result = await service.create_note(session, user.team_id, body)
    return result.or_raise(lambda e: HTTPException(status_code=400, detail=str(e)))
```

### Boolean Column Filtering

```python
# Good — pass column directly for truthiness
stmt = stmt.where(Note.is_pinned)

# Good — negate with ~
stmt = stmt.where(~Note.is_pinned)

# Bad — triggers noqa/type-ignore
stmt = stmt.where(Note.is_pinned == True)   # noqa: E712
stmt = stmt.where(Note.is_pinned.is_(True)) # ty error
```

### Enum Fields (NOT Literal)

```python
from enum import Enum

class ArticleType(str, Enum):
    knowledge = "knowledge"
    troubleshooting = "troubleshooting"

# In SQLModel table
article_type: ArticleType = Field(default=ArticleType.knowledge)
```

## Default Biases

When in doubt, prefer:

- Fewer files over more files
- DTOs at boundaries, SQLModel stays in repos
- Separate Create/Update DTOs (create has no id/key, update has optional fields)
- `Result.or_raise()` in routes for clean HTTP error conversion

## Reference Documentation

- [layered-architecture.md](layered-architecture.md) - Layer boundaries and data flow
- [data-modeling.md](data-modeling.md) - SQLModel + DTO patterns
- [repository-pattern.md](repository-pattern.md) - Async repository with DTO conversion
- [result-pattern.md](result-pattern.md) - Error handling
- [templates/feature.md](templates/feature.md) - Copy-paste starter template
- [examples/notes.md](examples/notes.md) - Complete working example

## Source of Truth

Reference these existing files for patterns:

- Result: `src/srv/core/result.py`
- Errors: `src/srv/core/errors.py`
- CamelModel: `src/srv/core/base/types.py`
- DB base: `src/srv/db/base.py`
- Session: `src/srv/db/session.py`
- Auth: `src/srv/identity/auth/dependencies.py`
- Example domain: `src/srv/kb/` (models, types, repository, routes)
