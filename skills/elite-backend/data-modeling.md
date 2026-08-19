# Data structures

Persistence describes storage. A **DTO** describes a **boundary**.

## Persistence

Inherit the project's base row when one exists:

```
Entity
  id          internal primary key
  key         public identifier (unique, indexed)
  created_at  server default
  updated_at  server default + on update
  …domain columns
```

Rows, table classes, and schema types stay in the repository.

## DTO catalog

Request shapes have no `id` or `key`. Response shapes expose `key` (and usually `created_at`).

| DTO          | Purpose                               | key? |
| ------------ | ------------------------------------- | ---- |
| `CreateBody` | Create input                          | No   |
| `UpdateBody` | Partial update — every field optional | No   |
| `Detail`     | Full single-item read                 | Yes  |
| `ListItem`   | Collection row                        | Yes  |

`Detail` includes `updated_at` when the entity is editable. `ListItem` usually omits it. JSON casing follows the project.

## When to split

| Situation                   | Shapes                   |
| --------------------------- | ------------------------ |
| Create and update differ    | CreateBody + UpdateBody  |
| Partial update              | UpdateBody, all optional |
| List is thinner than detail | ListItem + Detail        |
| Same fields, two call sites | Reuse                    |

## Mapping

The repository maps persistence → DTO on the way out, and CreateBody/UpdateBody → persistence on the way in. Lists map each row before returning.

## Fields

- **Enums on persistence** — named enum types the store accepts (usually string columns). Literal unions belong on DTOs.
- **Validation** — format and required fields on request DTOs; cross-field rules, ownership, and state in the service.
- **Complex columns** — JSON/blobs get explicit column types; shape checks stay on the DTO.
