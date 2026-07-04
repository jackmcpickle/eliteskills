# Python Binding

FastAPI + SQLModel + Pydantic. Applies the generic layered architecture to Python projects.

## Stack

FastAPI, SQLModel (`table=True`), Pydantic DTOs, async SQLAlchemy session, typed `Result` errors.

## Assumptions

Locate these in the project (paths use `app` as root package placeholder):

| Module                | Provides                                                                               |
| --------------------- | -------------------------------------------------------------------------------------- |
| `app.core.result`     | `Result[E, T]`, `Ok`, `Err`                                                            |
| `app.core.errors`     | `NotFound`, `AlreadyExists`, `Forbidden`, `InvalidInput`, `InvalidState`, `QueryError` |
| `app.core.base.types` | `CamelModel` — camelCase JSON serialization                                            |
| `app.db.base`         | `BaseModel` — auto `id`, `key`, `created_at`, `updated_at`                             |
| `app.db`              | `get_session` dependency                                                               |

## Layout

```
src/{app}/{domain}/
├── models/{entity}.py       # SQLModel table=True — repo only
├── types/{entity}.py        # CreateBody, UpdateBody, Detail, ListItem
├── repository/{entity}.py   # DB ops + model_validate → DTO
├── services/{entity}.py     # Business logic — DTOs only
└── routes/{entities}.py     # Thin — Depends(get_session), or_raise()
```

`__init__.py` files stay empty. Register routers in the app main router.

## Request DTOs

Plain `BaseModel` — no id/key/timestamps:

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

## Response DTOs

`CamelModel` with key + timestamps:

```python
from datetime import datetime
from app.core.base.types import CamelModel

class NoteDetail(CamelModel):
    key: str
    title: str
    content: str
    is_pinned: bool
    created_at: datetime
```

## Repository

`model_validate(obj, from_attributes=True)` happens **only here**:

```python
async def get_note_by_key(session, key) -> Result[NotFound, NoteDetail]:
    stmt = select(Note).where(Note.key == key)
    result = await session.execute(stmt)
    note = result.scalars().one_or_none()
    if note is None:
        return Err(NotFound(entity="Note", identifier=key))
    return Ok(NoteDetail.model_validate(note, from_attributes=True))
```

Partial update — `model_dump(exclude_unset=True)`:

```python
updates = data.model_dump(exclude_unset=True)
for field, value in updates.items():
    setattr(note, field, value)
```

## Service

Never import from `models/`:

```python
async def create_note(session, data: NoteCreateBody) -> Result[InvalidInput, NoteDetail]:
    if not data.title.strip():
        return Err(InvalidInput(errors={"title": ["Title is required"]}))
    return await repo.create_note(session, data)
```

## Route

```python
@router.post("/", status_code=201)
async def create_note(
    body: NoteCreateBody,
    session: AsyncSession = Depends(get_session),
) -> NoteDetail:
    result = await service.create_note(session, body)
    return result.or_raise(lambda e: HTTPException(status_code=400, detail=str(e)))
```

FastAPI validates request DTOs automatically. Map `Result` → HTTP via `or_raise()`.

## Python-Specific Rules

- **Enum fields** — use `str, Enum` in SQLModel tables, not `Literal`
- **Boolean filters** — `stmt.where(Note.is_pinned)` or `~Note.is_pinned`, not `== True`
- **JSON columns** — use `sa_column=Column(JSON, ...)` when SQLModel lacks native support
- **Field validators** — `@field_validator` on request DTOs for input format rules

## Full Example

See [examples/python-notes.md](../examples/python-notes.md).
