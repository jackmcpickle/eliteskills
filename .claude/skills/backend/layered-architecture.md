# Layered Architecture

SubTechnica uses a layered architecture with strict DTO boundaries. SQLModel stays in repositories; everything else works with Pydantic DTOs.

## The Layers

```
┌─────────────────────────────────────────┐
│           Routes (FastAPI)              │
│  Request DTO in → Response DTO out      │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│              Services                    │
│  DTOs in → Business logic → DTOs out    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│             Repositories                 │
│  DTO → SQLModel → DB → SQLModel → DTO  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│          SQLModel Tables                 │
│  DB schema (repo-internal only)          │
└─────────────────────────────────────────┘
```

## Layer Rules

| Layer        | Receives            | Returns              | Knows About            |
| ------------ | ------------------- | -------------------- | ---------------------- |
| Routes       | Request DTOs + Deps | Response DTOs        | Services, Repos, Types |
| Services     | DTOs                | `Result[Error, DTO]` | Repos, Types           |
| Repositories | DTOs or primitives  | `Result[Error, DTO]` | SQLModel, Types        |
| Models       | N/A                 | N/A                  | SQLModel only          |
| Types        | N/A                 | N/A                  | Pydantic only          |

## DTO Flow

```
                    Request DTO                    Response DTO
                   (no id/key)                    (has key, timestamps)
                        │                               ▲
                        │                               │
  Route ───────────────▼─── or_raise() ────────────────┘
                        │                               ▲
                        │                               │
  Service ─────────────▼─── validate ──────────────────┘
                        │                               ▲
                        │                               │
  Repo ────────────────▼                                │
        DTO → SQLModel → DB → refresh → model_validate → DTO
```

**Key rule:** `model_validate(sqlmodel_obj, from_attributes=True)` happens ONLY in repositories.

## Example Flow: Create Note

```python
# types/note.py — DTOs
class NoteCreateBody(BaseModel):
    """Request DTO — no id, no key, no timestamps."""
    title: str
    content: str = ""
    is_pinned: bool = False

class NoteDetail(CamelModel):
    """Response DTO — has key and timestamps."""
    key: str
    title: str
    content: str
    is_pinned: bool
    created_at: datetime


# routes/notes.py — thin, just wires DTOs
@router.post("/", status_code=201)
async def create_note(
    body: NoteCreateBody,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
) -> NoteDetail:
    result = await note_service.create_note(session, user.team_id, body)
    return result.or_raise(lambda e: HTTPException(status_code=400, detail=str(e)))


# services/note.py — validates, delegates, returns DTO
async def create_note(
    session: AsyncSession,
    team_id: int,
    data: NoteCreateBody,
) -> Result[InvalidInput, NoteDetail]:
    if not data.title.strip():
        return Err(InvalidInput(errors={"title": ["Title is required"]}))
    return await note_repo.create_note(session, team_id, data)


# repository/note.py — owns SQLModel, converts to DTO
async def create_note(
    session: AsyncSession,
    team_id: int,
    data: NoteCreateBody,
) -> Result[InvalidInput, NoteDetail]:
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

## Example Flow: Update Note

```python
# types/note.py
class NoteUpdateBody(BaseModel):
    """Request DTO — all fields optional for partial update."""
    title: str | None = None
    content: str | None = None
    is_pinned: bool | None = None


# routes/notes.py
@router.patch("/{key}")
async def update_note(
    key: str,
    body: NoteUpdateBody,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
) -> NoteDetail:
    result = await note_service.update_note(session, key, body)
    return result.or_raise(lambda e: HTTPException(status_code=400, detail=str(e)))


# services/note.py
async def update_note(
    session: AsyncSession,
    key: str,
    data: NoteUpdateBody,
) -> Result[NotFound | InvalidInput, NoteDetail]:
    if data.title is not None and not data.title.strip():
        return Err(InvalidInput(errors={"title": ["Title cannot be empty"]}))
    return await note_repo.update_note(session, key, data)


# repository/note.py
async def update_note(
    session: AsyncSession,
    key: str,
    data: NoteUpdateBody,
) -> Result[NotFound, NoteDetail]:
    stmt = select(Note).where(Note.key == key)
    result = await session.execute(stmt)
    note = result.scalars().one_or_none()
    if note is None:
        return Err(NotFound(entity="Note", identifier=key))

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(note, field, value)

    session.add(note)
    await session.commit()
    await session.refresh(note)
    return Ok(NoteDetail.model_validate(note, from_attributes=True))
```

## File Organization

```
# Standard domain structure
src/srv/{domain}/
├── models/
│   ├── __init__.py
│   └── note.py           # SQLModel — only imported by repository
├── types/
│   ├── __init__.py
│   └── note.py           # DTOs — imported by all layers
├── repository/
│   ├── __init__.py
│   └── note.py           # imports models + types
├── services/
│   └── note.py           # imports repository + types (NOT models)
└── routes/
    ├── __init__.py
    └── notes.py           # imports services + types (NOT models)
```

## `__init__.py` Conventions

`__init__.py` files are empty. Router registration happens in the app's main router which imports and includes each domain router directly.

## What Each Layer Should NOT Do

### Routes

- No business logic
- No direct DB queries
- No `model_validate` calls — repo already returned DTOs

### Services

- No direct session queries (delegate to repos)
- No HTTP-specific concerns
- No importing from `models/` — work with DTOs only

### Repositories

- No business logic
- No HTTP concerns
- No returning raw SQLModel objects — always convert to DTO
