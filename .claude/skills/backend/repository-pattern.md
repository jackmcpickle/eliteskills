# Repository Pattern

Repositories handle all async database operations, own the SQLModel-to-DTO conversion, and return `Result` types. SQLModel objects never leave the repository.

## Core Responsibilities

1. **All database operations** via `AsyncSession`
2. **Own SQLModel to DTO conversion** via `model_validate(obj, from_attributes=True)`
3. **Return `Result[ErrorType, DTO]`** — never return raw SQLModel objects
4. **Use typed errors** from `srv.core.errors`

## Basic Structure

```python
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from srv.core.errors import NotFound
from srv.core.result import Err, Ok, Result
from ..models.note import Note
from ..types.note import NoteCreateBody, NoteUpdateBody, NoteDetail, NoteListItem


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


async def list_notes_for_team(
    session: AsyncSession,
    team_id: int,
    pinned_only: bool = False,
) -> Result[NotFound, list[NoteListItem]]:
    stmt = select(Note).where(Note.team_id == team_id)
    if pinned_only:
        stmt = stmt.where(Note.is_pinned)
    stmt = stmt.order_by(Note.created_at.desc())
    result = await session.exec(stmt)
    return Ok([NoteListItem.model_validate(n, from_attributes=True) for n in result.all()])


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


async def update_note(
    session: AsyncSession,
    key: str,
    data: NoteUpdateBody,
) -> Result[NotFound, NoteDetail]:
    stmt = select(Note).where(Note.key == key)
    result = await session.exec(stmt)
    note = result.one_or_none()
    if note is None:
        return Err(NotFound(entity="Note", identifier=key))

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(note, field, value)

    session.add(note)
    await session.commit()
    await session.refresh(note)
    return Ok(NoteDetail.model_validate(note, from_attributes=True))


async def delete_note(
    session: AsyncSession,
    key: str,
) -> Result[NotFound, None]:
    stmt = select(Note).where(Note.key == key)
    result = await session.exec(stmt)
    note = result.one_or_none()
    if note is None:
        return Err(NotFound(entity="Note", identifier=key))
    await session.delete(note)
    await session.commit()
    return Ok(None)
```

## Naming Conventions

| Operation      | Function Name                                | Returns                             |
| -------------- | -------------------------------------------- | ----------------------------------- |
| Get one by key | `get_{entity}_by_key(session, key)`          | `Result[NotFound, EntityDetail]`    |
| Get one by id  | `get_{entity}_by_id(session, id)`            | `Result[NotFound, EntityDetail]`    |
| List           | `list_{entities}_for_{parent}(session, ...)` | `Result[..., list[EntityListItem]]` |
| Create         | `create_{entity}(session, ..., data)`        | `Result[..., EntityDetail]`         |
| Update         | `update_{entity}(session, key, data)`        | `Result[NotFound, EntityDetail]`    |
| Delete         | `delete_{entity}(session, key)`              | `Result[NotFound, None]`            |

## Key Pattern: Repos Accept DTOs

Repositories accept request DTOs (or primitives) as input and return response DTOs:

```python
# Input: NoteCreateBody (request DTO)
# Output: Result[..., NoteDetail] (response DTO)
async def create_note(session, team_id, data: NoteCreateBody) -> Result[..., NoteDetail]:
    note = Note(team_id=team_id, title=data.title, ...)  # DTO to SQLModel
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return Ok(NoteDetail.model_validate(note, from_attributes=True))  # SQLModel to DTO
```

## Error Types

Use typed errors from `srv.core.errors`:

```python
from srv.core.errors import NotFound, AlreadyExists, InvalidState

# Not found
return Err(NotFound(entity="Note", identifier=key))

# Uniqueness violation
return Err(AlreadyExists(entity="Note", field="slug", value=slug))

# Invalid state transition
return Err(InvalidState(entity="Note", reason="Cannot archive a draft"))
```

## Filtering and Pagination

```python
async def list_articles(
    session: AsyncSession,
    team_id: int,
    article_type: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> Result[NotFound, list[ArticleListItem]]:
    stmt = select(Article).where(Article.team_id == team_id)
    if article_type:
        stmt = stmt.where(Article.article_type == article_type)
    stmt = stmt.offset(offset).limit(limit).order_by(Article.created_at.desc())
    result = await session.exec(stmt)
    return Ok([ArticleListItem.model_validate(a, from_attributes=True) for a in result.all()])
```

## What NOT to Put in Repositories

- No business logic (that goes in services)
- No HTTP concerns (that goes in routes)
- No returning raw SQLModel objects — always convert to DTO
- No complex orchestration (that goes in services)
