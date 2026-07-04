# Notes Example

A complete working example of a Notes feature with strict DTO boundaries. SQLModel stays in repositories; everything else works with DTOs.

## models/note.py

```python
"""SQLModel table for Notes. Only imported by repository."""
from sqlmodel import Field
from app.db.base import BaseModel


class Note(BaseModel, table=True):
    __tablename__ = "notes"

    title: str = Field(max_length=255)
    content: str = Field(default="")
    is_pinned: bool = Field(default=False)
```

## types/note.py

```python
"""DTOs for Notes API. Imported by all layers."""
from datetime import datetime
from pydantic import BaseModel
from app.core.base.types import CamelModel


class NoteCreateBody(BaseModel):
    """Request DTO — no id, no key, no timestamps."""
    title: str
    content: str = ""
    is_pinned: bool = False


class NoteUpdateBody(BaseModel):
    """Request DTO — all fields optional for partial update."""
    title: str | None = None
    content: str | None = None
    is_pinned: bool | None = None


class NoteDetail(CamelModel):
    """Response DTO — has key and timestamps."""
    key: str
    title: str
    content: str
    is_pinned: bool
    created_at: datetime


class NoteListItem(CamelModel):
    """Response DTO — lightweight for list views."""
    key: str
    title: str
    is_pinned: bool
    created_at: datetime
```

## repository/note.py

```python
"""Database operations for Notes. Owns SQLModel to DTO conversion."""
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
    stmt = stmt.order_by(Note.is_pinned.desc(), Note.created_at.desc())
    result = await session.execute(stmt)
    return Ok([NoteListItem.model_validate(n, from_attributes=True) for n in result.scalars().all()])


async def create_note(
    session: AsyncSession,
    data: NoteCreateBody,
) -> NoteDetail:
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

## services/note.py

```python
"""Business logic for Notes. Works with DTOs only — never imports models."""
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.errors import InvalidInput, NotFound
from app.core.result import Err, Result
from ..repository import note as repo
from ..types.note import NoteCreateBody, NoteUpdateBody, NoteDetail


async def create_note(
    session: AsyncSession,
    data: NoteCreateBody,
) -> Result[InvalidInput, NoteDetail]:
    if not data.title.strip():
        return Err(InvalidInput(errors={"title": ["Title is required"]}))
    return await repo.create_note(session, data)


async def update_note(
    session: AsyncSession,
    key: str,
    data: NoteUpdateBody,
) -> Result[NotFound | InvalidInput, NoteDetail]:
    if data.title is not None and not data.title.strip():
        return Err(InvalidInput(errors={"title": ["Title cannot be empty"]}))
    return await repo.update_note(session, key, data)


async def toggle_pin(
    session: AsyncSession,
    key: str,
) -> Result[NotFound, NoteDetail]:
    result = await repo.get_note_by_key(session, key)
    if result.is_err():
        return result
    note = result.ok()
    return await repo.update_note(
        session, key, NoteUpdateBody(is_pinned=not note.is_pinned)
    )
```

## routes/notes.py

```python
"""FastAPI routes for Notes. Thin — just wires DTOs through."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from app.db import get_session
from ..services import note as service
from ..repository import note as repo
from ..types.note import NoteCreateBody, NoteUpdateBody, NoteDetail, NoteListItem

router = APIRouter(prefix="/notes", tags=["notes"])


@router.get("/")
async def list_notes(
    session: AsyncSession = Depends(get_session),
    pinned: bool = False,
) -> list[NoteListItem]:
    result = await repo.list_notes(session, pinned_only=pinned)
    return result.or_raise(lambda e: HTTPException(status_code=500, detail=str(e)))


@router.post("/", status_code=201)
async def create_note(
    body: NoteCreateBody,
    session: AsyncSession = Depends(get_session),
) -> NoteDetail:
    result = await service.create_note(session, body)
    return result.or_raise(lambda e: HTTPException(status_code=400, detail=str(e)))


@router.get("/{key}")
async def get_note(
    key: str,
    session: AsyncSession = Depends(get_session),
) -> NoteDetail:
    result = await repo.get_note_by_key(session, key)
    return result.or_raise(lambda e: HTTPException(status_code=404, detail=str(e)))


@router.patch("/{key}")
async def update_note(
    key: str,
    body: NoteUpdateBody,
    session: AsyncSession = Depends(get_session),
) -> NoteDetail:
    result = await service.update_note(session, key, body)
    return result.or_raise(lambda e: HTTPException(status_code=400, detail=str(e)))


@router.delete("/{key}", status_code=204)
async def delete_note(
    key: str,
    session: AsyncSession = Depends(get_session),
) -> None:
    result = await repo.delete_note(session, key)
    result.or_raise(lambda e: HTTPException(status_code=404, detail=str(e)))


@router.post("/{key}/toggle-pin")
async def toggle_pin(
    key: str,
    session: AsyncSession = Depends(get_session),
) -> NoteDetail:
    result = await service.toggle_pin(session, key)
    return result.or_raise(lambda e: HTTPException(status_code=400, detail=str(e)))
```

## Key Points

- **Repos own conversion** — `model_validate(obj, from_attributes=True)` only in repos
- **Routes are thin** — no `model_validate`, just `or_raise()` and return
- **Services never import models** — work with DTOs from types/ only
- **Request DTOs** (CreateBody, UpdateBody) have no id/key
- **Response DTOs** (Detail, ListItem) have key + timestamps
- **toggle_pin** shows service composing: get DTO, build UpdateBody, call repo
