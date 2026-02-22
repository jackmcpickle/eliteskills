---
name: frontend-coder
description: Creates production-grade React frontend features using TanStack Router/Query/Form/Table, shadcn components, Tailwind v4, and Zod validation. Use when building React components, pages, forms, tables, hooks, or CRUD interfaces.
version: 1.0.0
---

# Frontend Coder Skill

Build React frontend features for SubTechnica's pnpm monorepo.

## When to Use

- React components, pages, or modules
- Forms with TanStack Form + Zod validation
- Data tables with TanStack Table
- Query/mutation hooks with TanStack Query
- CRUD interfaces

## Monorepo Structure

```
src/ui-core/                    # Generic UI components (shadcn)
src/ui-service-desk/            # Main application
├── src/routes/                 # TanStack Router (file-based)
├── src/modules/{feature}/      # Feature modules
│   ├── components/             # Feature-specific components
│   ├── hooks/                  # Query/mutation/form hooks
│   ├── schemas/                # Zod validation schemas
│   └── types.ts                # TypeScript types
├── src/components/             # App-level shared components
└── src/utils/queryKeys.ts      # Centralized query key factories
src/ui-superit-api/             # Generated API client (OpenAPI)
```

## New Feature Module Checklist

```
src/ui-service-desk/src/modules/{feature}/
├── index.ts                    # Public barrel exports
├── types.ts                    # TypeScript types
├── schemas/
│   └── {feature}.schema.ts     # Zod validation schema
├── hooks/
│   ├── use{Feature}Query.ts    # TanStack Query hook
│   ├── use{Feature}Mutation.ts # TanStack mutation hook
│   └── use{Feature}Form.ts     # createFormHook instance
└── components/
    ├── {Feature}Form.tsx        # Form component
    ├── {Feature}ListView.tsx    # Table/list view
    └── columns.tsx              # TanStack Table column defs
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
// UI components from ui-core
import { Button, Card, cn } from '@superit/ui-core';

// API types from generated client
import type { TicketResponse } from '@superit/ui-superit-api';

// API client instance
import { api } from '@/lib/api';

// React - never use React.* or import React
import { useState, useMemo } from 'react';
import type { ReactElement } from 'react';
```

## Component Rules

- Named exports only (no default exports)
- Explicit `ReactElement` return type on all components
- `handle*` prefix for event handlers, `on*` for callback props
- `satisfies` over `as` on object literals
- `import type` for type-only imports
- Unused params prefixed with underscore

## Reference Documentation

- [Code Style](code-style.md) - React style rules and conventions
- [API Integration](api-integration.md) - API client and data fetching patterns
