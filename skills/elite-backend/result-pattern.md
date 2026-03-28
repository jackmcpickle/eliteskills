# Result Pattern

Use `Result[ErrorType, T]` at layer boundaries for explicit error handling.

## Basic Usage

```python
from app.core.result import Result, Ok, Err
from app.core.errors import NotFound

async def get_note(session: AsyncSession, key: str) -> Result[NotFound, Note]:
    stmt = select(Note).where(Note.key == key)
    result = await session.execute(stmt)
    note = result.scalars().one_or_none()
    if note is None:
        return Err(NotFound(entity="Note", identifier=key))
    return Ok(note)
```

## Where to Use Result

Use `Result` at **layer boundaries**:

- Repository -> Service
- Service -> Route

Inside services, use normal Python control flow:

```python
async def resolve_note(
    session: AsyncSession, key: str, resolution: str
) -> Result[NotFound | InvalidState, Note]:
    result = await repo.get_note(session, key)
    if result.is_err():
        return result

    note = result.ok()
    if note.status == "archived":
        return Err(InvalidState(entity="Note", reason="Cannot resolve archived note"))

    return await repo.update_note(session, key, status="resolved")
```

## Converting Result to HTTP in Routes

Use `or_raise()` for clean conversion:

```python
@router.get("/{key}")
async def get_note(
    key: str,
    session: AsyncSession = Depends(get_session),
) -> NoteDetail:
    result = await repo.get_note_by_key(session, key)
    note = result.or_raise(lambda e: HTTPException(status_code=404, detail=str(e)))
    return NoteDetail.model_validate(note, from_attributes=True)
```

For different error types, use `handle()`:

```python
result = await service.create_note(session, data)
return result.handle(
    on_ok=lambda note: NoteDetail.model_validate(note, from_attributes=True),
    on_err=lambda e: raise_http_error(e),
)
```

## Typed Errors

Always use typed errors from `app.core.errors`:

```python
from app.core.errors import NotFound, AlreadyExists, Forbidden, InvalidInput, InvalidState, QueryError

# Not found
Err(NotFound(entity="Note", identifier=key))

# Already exists
Err(AlreadyExists(entity="Note", field="slug", value="my-note"))

# Permission denied
Err(Forbidden(reason="Only admins can delete notes"))

# Validation errors
Err(InvalidInput(errors={"title": ["Title is required"]}))

# Invalid state
Err(InvalidState(entity="Note", reason="Cannot edit a published note"))

# Query error (for list operations that can't return NotFound)
Err(QueryError(reason="Failed to fetch notes"))
```

## When NOT to Use Result

Use exceptions for:

- Programming bugs (assertions)
- Truly exceptional cases (out of memory)
- Framework integration points

Use `Result` for:

- Expected failures (not found, validation errors)
- Business logic errors (insufficient permissions, invalid state)
- Anything the caller should explicitly handle
