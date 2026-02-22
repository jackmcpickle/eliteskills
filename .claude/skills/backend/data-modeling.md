# Data Modeling

SQLModel for DB tables, Pydantic DTOs at every layer boundary. SQLModel stays in repositories.

## SQLModel Tables (repo-internal)

Extend `srv.db.base.BaseModel` for auto `id`, `key`, `created_at`, `updated_at`:

```python
from sqlmodel import Field
from srv.db.base import BaseModel


class Note(BaseModel, table=True):
    __tablename__ = "notes"

    title: str = Field(max_length=255)
    content: str = Field(default="")
    team_id: int = Field(foreign_key="teams.id", index=True)
    is_pinned: bool = Field(default=False)
```

Inherited fields from BaseModel:

- `id: int | None` (primary key, auto-increment)
- `key: str` (nanoid, unique, indexed, auto-generated via `generate_key()`)
- `created_at: datetime | None` (server default)
- `updated_at: datetime | None` (server default + on update)

**Important:** SQLModel table objects never leave the repository. Only DTOs cross layer boundaries.

## DTO Categories

### Request DTOs (no id/key)

Use plain `BaseModel` for request bodies (snake_case input):

```python
from pydantic import BaseModel


class NoteCreateBody(BaseModel):
    """Fields required to create a note. No id/key/timestamps."""
    title: str
    content: str = ""
    is_pinned: bool = False


class NoteUpdateBody(BaseModel):
    """All fields optional for partial update."""
    title: str | None = None
    content: str | None = None
    is_pinned: bool | None = None
```

### Response DTOs (with key, timestamps)

Use `CamelModel` for response types (camelCase JSON serialization):

```python
from datetime import datetime
from srv.core.base.types import CamelModel


class NoteDetail(CamelModel):
    """Full note for detail view."""
    key: str
    title: str
    content: str
    is_pinned: bool
    created_at: datetime


class NoteListItem(CamelModel):
    """Lightweight note for list view."""
    key: str
    title: str
    is_pinned: bool
    created_at: datetime
```

## DTO Naming Conventions

| DTO                  | Purpose                     | Base Class   | Has key? |
| -------------------- | --------------------------- | ------------ | -------- |
| `{Entity}CreateBody` | Create request              | `BaseModel`  | No       |
| `{Entity}UpdateBody` | Partial update request      | `BaseModel`  | No       |
| `{Entity}Detail`     | Full response (single)      | `CamelModel` | Yes      |
| `{Entity}ListItem`   | Lightweight response (list) | `CamelModel` | Yes      |

## SQLModel to DTO Conversion

**Happens ONLY in repositories** via `model_validate(obj, from_attributes=True)`:

```python
# In repository — the ONLY place this happens
async def get_note_by_key(session, key) -> Result[NotFound, NoteDetail]:
    stmt = select(Note).where(Note.key == key)
    result = await session.execute(stmt)
    note = result.scalars().one_or_none()
    if note is None:
        return Err(NotFound(entity="Note", identifier=key))
    return Ok(NoteDetail.model_validate(note, from_attributes=True))

# For lists
async def list_notes(session, team_id) -> Result[NotFound, list[NoteListItem]]:
    stmt = select(Note).where(Note.team_id == team_id)
    result = await session.execute(stmt)
    return Ok([NoteListItem.model_validate(n, from_attributes=True) for n in result.scalars().all()])
```

Routes and services receive DTOs directly — no conversion needed.

## Enum Fields

**Use `str, Enum` classes** (NOT `Literal`). SQLModel `table=True` models cannot use `Literal` type annotations.

```python
from enum import Enum

class ArticleType(str, Enum):
    knowledge = "knowledge"
    troubleshooting = "troubleshooting"
    how_to = "how_to"

# In SQLModel table
class Article(BaseModel, table=True):
    __tablename__ = "articles"
    article_type: ArticleType = Field(default=ArticleType.knowledge)
```

DB stores as VARCHAR, Pydantic validates enum values, OpenAPI generates proper enums.

**Note:** Discriminated unions with `Literal` work fine in non-table Pydantic models. Only SQLModel `table=True` requires `str, Enum`.

## When to Add DTOs

| Scenario                                   | Add DTO?                            |
| ------------------------------------------ | ----------------------------------- |
| Different fields for create vs update      | Yes: `CreateBody`, `UpdateBody`     |
| Partial updates with optional fields       | Yes: `UpdateBody` with all optional |
| Different response shapes (list vs detail) | Yes: `ListItem`, `Detail`           |
| Same shape, different context              | No: reuse existing DTO              |
