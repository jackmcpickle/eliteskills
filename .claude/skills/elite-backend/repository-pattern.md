# Repository Pattern

Repositories handle all async database operations, own the SQLModel-to-DTO conversion, and return `Result` types. SQLModel objects never leave the repository.

## Core Responsibilities

1. **All database operations** via `AsyncSession`
2. **Own SQLModel to DTO conversion** via `model_validate(obj, from_attributes=True)`
3. **Return `Result[ErrorType, DTO]`** — never return raw SQLModel objects
4. **Use typed errors** from `app.core.errors`

## Basic Structure

```python
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import NotFound, QueryError
from app.core.result import Err, Ok, Result
from ..models.note import Note
from ..types.note import NoteCreateBody, NoteUpdateBody, NoteDetail, NoteListItem


async def get_note_by_key(
    session: AsyncSession,
    key: str,
) -> Result[NotFound, NoteDetail]:
    stmt = select(Note).where(Note.key == key)
    result = await session.execute(stmt)
    note = result.scalars().one_or_none()
    if note is None:
        return Err(NotFound(entity="Note", identifier=key))
    return Ok(NoteDetail.model_validate(note, from_attributes=True))


async def list_notes(
    session: AsyncSession,
    pinned_only: bool = False,
) -> Result[QueryError, list[NoteListItem]]:
    stmt = select(Note)
    if pinned_only:
        stmt = stmt.where(Note.is_pinned)
    stmt = stmt.order_by(Note.created_at.desc())
    result = await session.execute(stmt)
    return Ok([NoteListItem.model_validate(n, from_attributes=True) for n in result.scalars().all()])


async def create_note(
    session: AsyncSession,
    data: NoteCreateBody,
) -> NoteDetail:  # Use Result[ErrorType, ...] if create can fail (e.g., AlreadyExists)
    note = Note(
        title=data.title,
        content=data.content,
        is_pinned=data.is_pinned,
    )
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return NoteDetail.model_validate(note, from_attributes=True)


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


async def delete_note(
    session: AsyncSession,
    key: str,
) -> Result[NotFound, None]:
    stmt = select(Note).where(Note.key == key)
    result = await session.execute(stmt)
    note = result.scalars().one_or_none()
    if note is None:
        return Err(NotFound(entity="Note", identifier=key))
    await session.delete(note)
    await session.commit()
    return Ok(None)
```

## Naming Conventions

| Operation      | Function Name                         | Returns                                              |
| -------------- | ------------------------------------- | ---------------------------------------------------- |
| Get one by key | `get_{entity}_by_key(session, key)`   | `Result[NotFound, EntityDetail]`                     |
| Get one by id  | `get_{entity}_by_id(session, id)`     | `Result[NotFound, EntityDetail]`                     |
| List           | `list_{entities}(session, ...)`       | `Result[QueryError, list[EntityListItem]]`           |
| Create         | `create_{entity}(session, ..., data)` | `EntityDetail` (wrap in `Result` if create can fail) |
| Update         | `update_{entity}(session, key, data)` | `Result[NotFound, EntityDetail]`                     |
| Delete         | `delete_{entity}(session, key)`       | `Result[NotFound, None]`                             |

## Key Pattern: Repos Accept DTOs

Repositories accept request DTOs (or primitives) as input and return response DTOs:

```python
# Input: NoteCreateBody (request DTO)
# Output: Result[..., NoteDetail] (response DTO)
async def create_note(session, data: NoteCreateBody) -> Result[..., NoteDetail]:
    note = Note(title=data.title, ...)  # DTO to SQLModel
    session.add(note)
    await session.commit()
    await session.refresh(note)
    return Ok(NoteDetail.model_validate(note, from_attributes=True))  # SQLModel to DTO
```

## Error Types

Use typed errors from `app.core.errors`:

```python
from app.core.errors import NotFound, AlreadyExists, InvalidState, QueryError

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
    article_type: str | None = None,
    offset: int = 0,
    limit: int = 20,
) -> Result[QueryError, list[ArticleListItem]]:
    stmt = select(Article)
    if article_type:
        stmt = stmt.where(Article.article_type == article_type)
    stmt = stmt.offset(offset).limit(limit).order_by(Article.created_at.desc())
    result = await session.execute(stmt)
    return Ok([ArticleListItem.model_validate(a, from_attributes=True) for a in result.scalars().all()])
```

## SQL vs Python Filtering

Always filter in SQL when possible. Python-side filtering is acceptable only when the column type doesn't support portable SQL operators (e.g., JSON array membership) AND the dataset is bounded. Document the reason in a comment.

```python
# Good — filter in SQL
stmt = stmt.where(Article.article_type == article_type)

# Acceptable — JSON array membership not portable in SQL, dataset bounded
tags = [tag for item in items if target_tag in item.tags]  # bounded dataset
```

## State Transitions

For toggle endpoints, use the service pattern from the notes example (read then check then update). For explicit set-state endpoints (archive, unarchive), succeed silently if already in target state:

```python
async def archive_note(session, key) -> Result[NotFound, NoteDetail]:
    result = await repo.get_note_by_key(session, key)
    if result.is_err():
        return result
    note = result.ok()
    if note.is_archived:
        return result  # already archived — succeed silently
    return await repo.update_note(session, key, NoteUpdateBody(is_archived=True))
```

## What NOT to Put in Repositories

- No business logic (that goes in services)
- No HTTP concerns (that goes in routes)
- No returning raw SQLModel objects — always convert to DTO
- No complex orchestration (that goes in services)
