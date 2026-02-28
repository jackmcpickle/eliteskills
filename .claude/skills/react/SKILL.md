---
name: react
description: Creates production-grade React frontend features using TanStack Router/Query/Form/Table, shadcn components, Tailwind v4, and Zod validation. Use when building React components, pages, forms, tables, hooks, or CRUD interfaces.
version: 1.1.0
---

# Frontend Coder Skill

Build React frontend features using a pnpm monorepo structure.

## When to Use

- React components, pages, or modules
- Forms with TanStack Form + Zod validation
- Data tables with TanStack Table
- Query/mutation hooks with TanStack Query
- CRUD interfaces

## Project Structure

```
src/
├── routes/                    # TanStack Router (file-based)
├── modules/{feature}/         # Feature modules
│   ├── components/            # Feature-specific components
│   ├── hooks/                 # Query/mutation/form hooks
│   ├── schemas/               # Zod validation schemas
│   └── types.ts               # TypeScript types
├── components/                # App-level shared components
├── components/ui/             # Generic UI components (shadcn)
├── lib/api.ts                 # API client instance + types
├── lib/form.ts                # Shared form contexts + field components
└── utils/queryKeys.ts         # Centralized query key factories
```

## New Feature Module Checklist

```
src/modules/{feature}/
├── index.ts                    # [required] Public barrel exports
├── types.ts                    # [required] TypeScript types
├── helpers.ts                  # [required] Pure transforms, getters, display label maps
├── constants.ts                # [optional] Static feature constants
├── schemas/
│   └── {feature}.schema.ts     # [required] Zod validation schema
├── hooks/
│   ├── use{Feature}Query.ts    # [required] TanStack Query hook
│   ├── use{Feature}Mutation.ts # [required] TanStack mutation hook
│   ├── use{Feature}Form.ts     # [required if forms] createFormHook instance
│   └── use{Feature}FormController.ts  # [optional] Create/edit branching logic
└── components/
    ├── {Feature}Form.tsx        # [required if forms] Form component
    ├── {Feature}ListView.tsx    # [required if list] Table/list view
    └── columns.tsx              # [required if list] TanStack Table column defs
```

## Templates

Use these templates as starting points. See each for full examples:

**Feature:**

- [Feature Module](templates/feature-module.md) - Full module scaffold: directory structure, barrel exports, types, routes, query keys, build sequence

**Hooks:**

- [Query Hook](templates/query-hook.ts.md) - TanStack Query data fetching
- [Mutation Hook](templates/mutation-hook.ts.md) - Create/update/delete mutations
- [Form Controller Hook](templates/form-controller-hook.ts.md) - Form business logic (create vs edit)
- [State Hook (TEA)](templates/hook.ts.md) - Complex local state with useReducer

**Components:**

- [Form Component](templates/form-component.tsx.md) - TanStack Form with Zod, field renderers
- [Table Component](templates/table-component.tsx.md) - Column factory, DataTable, server pagination
- [Business Component](templates/business-component.tsx.md) - Components with hooks, data fetching, handlers
- [Presentation Component](templates/presentation-component.tsx.md) - Pure UI, props-only, no hooks

**Data:**

- [Schemas](templates/schemas.ts.md) - Zod validation schemas
- [Types](templates/types.ts.md) - Discriminated unions, type guards

## Import Rules

```typescript
// UI components from shared ui library
import { Button, Card, cn } from '@/components/ui';

// API types from generated client
import type { TicketResponse } from '@/lib/api';

// API client instance
import { api } from '@/lib/api';

// Form hook setup - always use project wrapper
import { fieldContext, formContext, TextField, SubmitButton } from '@/lib/form';

// React - never use React.* or import React
import { useState, useMemo } from 'react';
import type { ReactElement } from 'react';
```

## Form Hook Setup

Each feature creates a form hook via `createFormHook`. The shared field/form contexts and reusable field components live at `@/lib/form`. If this file doesn't exist yet, create it with your app's common field components (TextField, SelectField, etc.) and export `fieldContext`/`formContext` for all feature form hooks to share.

### hooks/use{Feature}Form.ts

```typescript
import { createFormHook } from '@tanstack/react-form';
import { fieldContext, formContext } from '@/lib/form';
import { TextField, SelectField, SwitchField, TextareaField, SubmitButton } from '@/lib/form';

export const use{Feature}Form = createFormHook({
    fieldContext,
    formContext,
    fieldComponents: { TextField, SelectField, SwitchField, TextareaField },
    formComponents: { SubmitButton },
});
```

> `fieldContext` and `formContext` are React contexts that connect `form.AppField`, `form.AppForm`, and `form.SubmitButton` to the registered components. Create them once in `@/lib/form` and reuse across all feature form hooks.

## Component Rules

- Named exports only (no default exports)
- Explicit `ReactElement` return type on all components
- `handle*` prefix for event handlers, `on*` for callback props
- `satisfies` over `as` on object literals
- `import type` for type-only imports
- Prefix params with underscore ONLY when truly unused (never accessed in function body)

## Reference Documentation

- [Code Style](code-style.md) - React style rules and conventions
- [API Integration](api-integration.md) - API client and data fetching patterns
