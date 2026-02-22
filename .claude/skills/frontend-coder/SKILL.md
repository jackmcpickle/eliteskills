---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
---

# Frontend Design Skill

Create React frontend features for SubTechnica's pnpm monorepo. Uses TanStack Router/Query, shadcn components, Tailwind v4, Zod validation, and TEA pattern for state management.

## When to Use This Skill

Activate when the user requests:

- React components or pages
- Frontend forms or form validation
- CRUD interfaces or data management UIs
- Interactive UI features
- TypeScript React development
- shadcn or Radix UI components

## Monorepo Structure

```
src/ui-core/                    # Generic UI components + Storybook
├── src/components/ui/          # shadcn base components
├── src/lib/utils.ts            # cn() utility
└── .storybook/                 # Storybook config (port 6006)

src/ui-service-desk/            # Main application
├── src/routes/                 # TanStack Router (file-based)
├── src/modules/{feature}/      # Feature modules
│   ├── components/             # Feature-specific components
│   ├── hooks/                  # TanStack Query hooks, state hooks
│   ├── types.ts                # TypeScript types
│   └── helpers.ts              # Pure utility functions
└── src/components/             # App-level wrapped components

src/ui-superit-api/             # Generated API client (OpenAPI Generator)
```

## Quick Start Checklist

When building a new feature module:

```
src/ui-service-desk/src/modules/{feature}/
├── index.ts                    # Public exports
├── types.ts                    # TypeScript types (discriminated unions)
├── helpers.ts                  # Pure utility functions
├── hooks/
│   ├── use{Feature}Query.ts    # TanStack Query hook
│   └── use{Feature}Mutation.ts # TanStack mutation hook
└── components/
    └── *.tsx                   # Feature components
```

Then add a route file at `src/ui-service-desk/src/routes/_app/{feature}.tsx`.

## Architecture Overview

### Routing: TanStack Router (File-based)

Routes live in `src/ui-service-desk/src/routes/`:

```
_app.tsx                        # Authenticated layout
_app/
  tickets.tsx                   # /tickets layout
  tickets/
    index.tsx                   # /tickets (list)
    $ticketKey.tsx              # /tickets/:ticketKey (detail)
_fullscreen.tsx                 # Full-screen layout
_fullscreen/
  chat.$chatKey.tsx             # /chat/:chatKey
```

### State Management

**Server state:** TanStack Query (preferred for API data)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function useTicketsQuery(teamId: string) {
    return useQuery({
        queryKey: ['tickets', teamId],
        queryFn: () => api.listTickets(teamId),
    });
}
```

**Local state:** TEA pattern with `useReducer` for complex state, `useState` for simple values.

Use **discriminated unions** to make invalid states unrepresentable:

```typescript
type Model =
    | { type: 'Idle' }
    | { type: 'Loading' }
    | { type: 'Loaded'; data: Data }
    | { type: 'Error'; error: string };
```

### Validation Strategy

Use **Zod at boundaries** (API responses, form inputs):

```typescript
import { z } from 'zod';

const ResponseSchema = z.object({
    success: z.boolean(),
    data: z.object({
        id: z.string(),
        name: z.string(),
    }),
});

type Response = z.infer<typeof ResponseSchema>;
```

### Component Patterns

1. **Controlled components** - value + onChange, state lifted to parent
2. **Thin components, fat hooks** - business logic in hooks, components just render
3. **Type guards for narrowing** - safe access to discriminated union properties

## UI Component Policy

> **CONSTRAINT**: All generic UI components MUST come from `@superit/ui-core` (`src/ui-core/src/components/ui/`).
>
> Feature-specific components go in the module's `components/` directory.
> App-level wrapped components go in `src/ui-service-desk/src/components/`.

### Import Patterns

```typescript
// Generic UI from ui-core
import { Button } from '@superit/ui-core';
import { Card } from '@superit/ui-core';
import { cn } from '@superit/ui-core';

// Generated API client
import { TicketsApi } from '@superit/superit-api';
```

### Styling Utilities

```typescript
import { cn } from '@superit/ui-core'

<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === "primary" && "primary-class"
)} />
```

### Storybook

All generic components in `src/ui-core/` need Storybook stories (`*.stories.tsx`). Run with `pnpm --filter ui-core storybook` at port 6006.

## Build Tools

- **Vite** for bundling (not Webpack)
- **Tailwind v4** with `@tailwindcss/vite`
- **oxlint** for linting
- **oxfmt** for formatting
- **TypeScript** strict mode

## Reference Documentation

For detailed patterns and examples, see:

- [code-style.md](code-style.md) - React style rules and conventions
- [architecture.md](architecture.md) - State management deep dive
- [api-integration.md](api-integration.md) - API client and data fetching patterns

## Source of Truth

Reference these existing files for patterns:

**Component Library** (MUST use for UI primitives):

- UI Components: `src/ui-core/src/components/ui/*.tsx`
- Usage Examples: `src/ui-core/src/components/ui/*.stories.tsx`
- cn utility: `src/ui-core/src/lib/utils.ts`

**Application Patterns** (reference implementations):

- Tickets module: `src/ui-service-desk/src/modules/tickets/`
- Insights module: `src/ui-service-desk/src/modules/insights/`
- Routes: `src/ui-service-desk/src/routes/_app/`
