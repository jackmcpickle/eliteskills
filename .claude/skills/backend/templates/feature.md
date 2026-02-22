# Feature Template

A complete, minimal template for a new FastAPI feature with strict DTO boundaries. Copy and adapt.

## File Structure

```
src/srv/{domain}/
├── models/
│   ├── __init__.py
│   └── {entity}.py
├── types/
│   ├── __init__.py
│   └── {entity}.py
├── repository/
│   ├── __init__.py
│   └── {entity}.py
├── services/
│   └── {entity}.py
└── routes/
    ├── __init__.py
    └── {entities}.py
```

## models/{entity}.py

```python
"""SQLModel table for {Entity}. Only imported by repository."""
from sqlmodel import Field
from srv.db.base import BaseModel


class {Entity}(BaseModel, table=True):
    __tablename__ = "{entities}"

    name: str = Field(max_length=255)
    team_id: int = Field(foreign_key="teams.id", index=True)
    # Add fields...
```

## types/{entity}.py

```python
"""DTOs for {Entity} API. Imported by all layers."""
from datetime import datetime
from pydantic import BaseModel
from srv.core.base.types import CamelModel


class {Entity}CreateBody(BaseModel):
    """Request DTO for creating. No id/key/timestamps."""
    name: str
    # Add fields...


class {Entity}UpdateBody(BaseModel):
    """Request DTO for partial update. All fields optional."""
    name: str | None = None
    # Add fields...


class {Entity}Detail(CamelModel):
    """Response DTO with key and timestamps."""
    key: str
    name: str
    created_at: datetime


class {Entity}ListItem(CamelModel):
    """Lightweight response DTO for lists."""
    key: str
    name: str
    created_at: datetime
```

## repository/{entity}.py

```python
"""Database operations for {Entity}. Owns SQLModel to DTO conversion."""
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from srv.core.errors import NotFound
from srv.core.result import Err, Ok, Result
from ..models.{entity} import {Entity}
from ..types.{entity} import {Entity}CreateBody, {Entity}UpdateBody, {Entity}Detail, {Entity}ListItem


async def get_{entity}_by_key(
    session: AsyncSession,
    key: str,
) -> Result[NotFound, {Entity}Detail]:
    stmt = select({Entity}).where({Entity}.key == key)
    result = await session.execute(stmt)
    obj = result.scalars().one_or_none()
    if obj is None:
        return Err(NotFound(entity="{Entity}", identifier=key))
    return Ok({Entity}Detail.model_validate(obj, from_attributes=True))


async def list_{entities}_for_team(
    session: AsyncSession,
    team_id: int,
) -> Result[NotFound, list[{Entity}ListItem]]:
    stmt = (
        select({Entity})
        .where({Entity}.team_id == team_id)
        .order_by({Entity}.created_at.desc())
    )
    result = await session.execute(stmt)
    return Ok([{Entity}ListItem.model_validate(obj, from_attributes=True) for obj in result.scalars().all()])


async def create_{entity}(
    session: AsyncSession,
    team_id: int,
    data: {Entity}CreateBody,
) -> Result[NotFound, {Entity}Detail]:
    obj = {Entity}(team_id=team_id, name=data.name)
    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return Ok({Entity}Detail.model_validate(obj, from_attributes=True))


async def update_{entity}(
    session: AsyncSession,
    key: str,
    data: {Entity}UpdateBody,
) -> Result[NotFound, {Entity}Detail]:
    stmt = select({Entity}).where({Entity}.key == key)
    result = await session.execute(stmt)
    obj = result.scalars().one_or_none()
    if obj is None:
        return Err(NotFound(entity="{Entity}", identifier=key))

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(obj, field, value)

    session.add(obj)
    await session.commit()
    await session.refresh(obj)
    return Ok({Entity}Detail.model_validate(obj, from_attributes=True))


async def delete_{entity}(
    session: AsyncSession,
    key: str,
) -> Result[NotFound, None]:
    stmt = select({Entity}).where({Entity}.key == key)
    result = await session.execute(stmt)
    obj = result.scalars().one_or_none()
    if obj is None:
        return Err(NotFound(entity="{Entity}", identifier=key))
    await session.delete(obj)
    await session.commit()
    return Ok(None)
```

## services/{entity}.py

```python
"""Business logic for {Entity}. Works with DTOs only — never imports models."""
from sqlmodel.ext.asyncio.session import AsyncSession

from srv.core.errors import InvalidInput
from srv.core.result import Err, Result
from ..repository import {entity} as repo
from ..types.{entity} import {Entity}CreateBody, {Entity}Detail


async def create_{entity}(
    session: AsyncSession,
    team_id: int,
    data: {Entity}CreateBody,
) -> Result[InvalidInput, {Entity}Detail]:
    if not data.name.strip():
        return Err(InvalidInput(errors={"name": ["Name is required"]}))
    return await repo.create_{entity}(session, team_id, data)
```

## routes/{entities}.py

```python
"""FastAPI routes for {Entity}. Thin — just wires DTOs."""
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel.ext.asyncio.session import AsyncSession

from srv.db import get_session
from srv.identity.auth import get_current_user
from ..services import {entity} as service
from ..repository import {entity} as repo
from ..types.{entity} import {Entity}CreateBody, {Entity}UpdateBody, {Entity}Detail, {Entity}ListItem

router = APIRouter(prefix="/{entities}", tags=["{entities}"])


@router.get("/")
async def list_{entities}(
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
) -> list[{Entity}ListItem]:
    result = await repo.list_{entities}_for_team(session, user.team_id)
    return result.or_raise(lambda e: HTTPException(status_code=500, detail=str(e)))


@router.post("/", status_code=201)
async def create_{entity}(
    body: {Entity}CreateBody,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
) -> {Entity}Detail:
    result = await service.create_{entity}(session, user.team_id, body)
    return result.or_raise(lambda e: HTTPException(status_code=400, detail=str(e)))


@router.get("/{key}")
async def get_{entity}(
    key: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
) -> {Entity}Detail:
    result = await repo.get_{entity}_by_key(session, key)
    return result.or_raise(lambda e: HTTPException(status_code=404, detail=str(e)))


@router.patch("/{key}")
async def update_{entity}(
    key: str,
    body: {Entity}UpdateBody,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
) -> {Entity}Detail:
    result = await repo.update_{entity}(session, key, body)
    return result.or_raise(lambda e: HTTPException(status_code=400, detail=str(e)))


@router.delete("/{key}", status_code=204)
async def delete_{entity}(
    key: str,
    session: AsyncSession = Depends(get_session),
    user=Depends(get_current_user),
) -> None:
    result = await repo.delete_{entity}(session, key)
    result.or_raise(lambda e: HTTPException(status_code=404, detail=str(e)))
```

## Placeholders

| Placeholder  | Example | Description |
| ------------ | ------- | ----------- |
| `{Entity}`   | `Note`  | PascalCase  |
| `{entity}`   | `note`  | lowercase   |
| `{entities}` | `notes` | plural      |
