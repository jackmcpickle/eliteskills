# Data Modeling

Persistence models for the database; DTOs at every layer boundary. Persistence never crosses the repository wall.

## Persistence Models (repo-internal)

Extend the project's base persistence model for auto id, public key, timestamps:

```
Entity
  id          — internal primary key
  key         — public identifier (nanoid/uuid, unique, indexed)
  created_at  — server default
  updated_at  — server default + on update
  ...domain fields...
```

**Persistence objects never leave the repository.**

## DTO Categories

### Request DTOs (no id/key)

Input shapes for create and update. Snake_case or camelCase per project convention.

| DTO                  | Purpose                              | Has id/key? |
| -------------------- | ------------------------------------ | ----------- |
| `{Entity}CreateBody` | Create request                       | No          |
| `{Entity}UpdateBody` | Partial update — all fields optional | No          |

### Response DTOs (with key, timestamps)

Output shapes for API consumers. JSON casing per project convention (often camelCase).

| DTO                | Purpose                   | Has key? |
| ------------------ | ------------------------- | -------- |
| `{Entity}Detail`   | Full single-item response | Yes      |
| `{Entity}ListItem` | Lightweight list response | Yes      |

### Timestamp Guidance

`Detail` includes `updated_at` when the entity is editable. `ListItem` typically omits it. Both include `created_at`.

## Persistence → DTO Conversion

Happens **only in repositories**. Map persistence fields to response DTO fields before returning.

For lists, convert each row before returning the collection.

## Enum Fields

Use named enum types in persistence models — not string unions or literal types where the ORM rejects them. DB stores as string/varchar; validation happens at the boundary.

Discriminated unions with literal tags are fine in non-persistence DTOs.

## Complex Column Types

When the ORM lacks native support (JSON arrays, metadata blobs), use explicit column types. Keep complex validation in request DTOs, not persistence models.

## Field Validation

Validate input in request DTOs (schema validators) or services (business rules):

- **DTO validators** — format, required fields, URL schemes
- **Service validators** — cross-field rules, ownership, state prerequisites

## When to Add DTOs

| Scenario                              | Add DTO?                            |
| ------------------------------------- | ----------------------------------- |
| Different fields for create vs update | Yes: `CreateBody`, `UpdateBody`     |
| Partial updates                       | Yes: `UpdateBody` with all optional |
| Different list vs detail shapes       | Yes: `ListItem`, `Detail`           |
| Same shape, different context         | No: reuse existing DTO              |
