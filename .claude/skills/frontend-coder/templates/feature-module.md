# Feature Module Template

Scaffold a complete feature module with routes, hooks, components, and barrel exports.

## Directory Structure

```
src/ui-service-desk/src/modules/{feature}/
├── index.ts                           # Barrel exports (public API)
├── types.ts                           # Local types, const enums, tab configs
├── helpers.ts                         # Pure data transformation functions
├── constants.ts                       # Feature-specific constants (optional)
├── schemas/
│   └── {feature}.schema.ts            # Zod validation schemas
├── hooks/
│   ├── use{Feature}sQuery.ts          # List query (paginated)
│   ├── use{Feature}Query.ts           # Single item query
│   ├── use{Feature}StatsQuery.ts      # Stats/aggregates query (optional)
│   ├── useCreate{Feature}Mutation.ts  # Create mutation
│   ├── useUpdate{Feature}Mutation.ts  # Update mutation
│   ├── useDelete{Feature}Mutation.ts  # Delete mutation
│   ├── use{Feature}Form.ts            # createFormHook instance
│   └── use{Feature}FormController.ts  # Form create/edit logic
├── providers/                         # React context (optional, rare)
│   └── {Feature}Context.tsx
└── components/
    ├── {Feature}sListView.tsx         # Table + filters + pagination
    ├── columns.tsx                    # TanStack Table column defs
    ├── {Feature}Form.tsx              # Create/edit form
    ├── {Feature}DetailView.tsx        # Detail page layout
    └── {Feature}Section.tsx           # Subsections of detail view
```

## Step 1: index.ts (Barrel Exports)

```typescript
// Components
export { {Feature}sListView } from '@/modules/{feature}/components/{Feature}sListView';
export { {Feature}DetailView } from '@/modules/{feature}/components/{Feature}DetailView';
export { {Feature}Form } from '@/modules/{feature}/components/{Feature}Form';

// Hooks
export {
    use{Feature}sQuery,
    type {Feature}QueryParams,
} from '@/modules/{feature}/hooks/use{Feature}sQuery';
export { use{Feature}Query } from '@/modules/{feature}/hooks/use{Feature}Query';

// Types
export type { {Feature}, {Feature}Tab } from '@/modules/{feature}/types';
```

Only export what other modules need. Keep internal components/hooks private.

## Step 2: types.ts

```typescript
import type { ObjectValues } from '@/utils/types';

export interface {Feature} {
    id: number;
    key: string;
    name: string;
    status: string;
    createdAt: Date;
    updatedAt?: Date | null;
}

// Tab navigation (for detail views with tabs)
export const {FEATURE}_TAB = {
    details: 'details',
    settings: 'settings',
} as const;

export type {Feature}Tab = ObjectValues<typeof {FEATURE}_TAB>;

interface {Feature}TabConfig {
    value: {Feature}Tab;
    label: string;
    path: string;
}

export const {FEATURE}_TABS: {Feature}TabConfig[] = [
    { value: 'details', label: 'Details', path: '/{feature}/${{feature}Key}' },
    { value: 'settings', label: 'Settings', path: '/{feature}/${{feature}Key}/settings' },
];

export function get{Feature}TabLink(
    teamKey: string,
    {feature}Key: string,
    path: string,
): string {
    return `/t/${teamKey}${path.replace('${{feature}Key}', {feature}Key)}`;
}
```

## Step 3: Routes

### List route: `routes/_app/t/$teamKey/{feature}/index.tsx`

```typescript
import { createFileRoute } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { PageHeading } from '@/components/PageHeading';
import { Separator } from '@superit/ui-core';
import { {Feature}sListView } from '@/modules/{feature}';
import { useActiveTeam } from '@/modules/team';

export const Route = createFileRoute('/_app/t/$teamKey/{feature}/')({
    component: {Feature}IndexPage,
});

function {Feature}IndexPage(): ReactElement {
    const { team } = useActiveTeam();

    return (
        <>
            <PageHeading title={`{Feature}s for ${team.name}`} />
            <Separator />
            <{Feature}sListView />
        </>
    );
}
```

### Detail route with loader: `routes/_app/t/$teamKey/{feature}/${{feature}Key}/route.tsx`

```typescript
import { createFileRoute, notFound, Outlet } from '@tanstack/react-router';
import type { ReactElement } from 'react';
import { api } from '@/lib/api';
import { {Feature}DetailView } from '@/modules/{feature}';

export const Route = createFileRoute(
    '/_app/t/$teamKey/{feature}/${{feature}Key}',
)({
    loader: async ({ params }) => {
        const {feature} = await api.{resource}.get{Feature}({
            teamKey: params.teamKey,
            {feature}Key: params.{feature}Key,
        });
        if (!{feature}) {
            throw notFound();
        }
        return { {feature} };
    },
    component: {Feature}DetailPage,
});

function {Feature}DetailPage(): ReactElement {
    const { {feature} } = Route.useLoaderData();
    const { {feature}Key } = Route.useParams();

    return (
        <{Feature}DetailView {feature}={{feature}} {feature}Key={{feature}Key}>
            <Outlet />
        </{Feature}DetailView>
    );
}
```

### Detail sub-routes (tabs):

```
routes/_app/t/$teamKey/{feature}/${{feature}Key}/
├── index.tsx          # Details tab (default)
├── settings.tsx       # Settings tab
└── route.tsx          # Layout with loader + Outlet
```

## Step 4: Query Keys

Add to `src/ui-service-desk/src/utils/queryKeys.ts`:

```typescript
export const {feature}Keys = {
    all: ['{feature}'] as const,
    lists: () => [...{feature}Keys.all, 'list'] as const,
    list: (params: Record<string, unknown>) =>
        [...{feature}Keys.lists(), params] as const,
    details: () => [...{feature}Keys.all, 'detail'] as const,
    detail: (key: string) => [...{feature}Keys.details(), key] as const,
    stats: (teamKey: string) =>
        [...{feature}Keys.all, 'stats', teamKey] as const,
};
```

## Step 5: Hooks, Schema, Components

Use the individual templates for each:
- [Query Hook](query-hook.ts.md) for `use{Feature}sQuery.ts` and `use{Feature}Query.ts`
- [Mutation Hook](mutation-hook.ts.md) for create/update/delete mutations
- [Form Component](form-component.tsx.md) for `{Feature}Form.tsx`
- [Form Controller](form-controller-hook.ts.md) for create vs edit logic
- [Table Component](table-component.tsx.md) for `{Feature}sListView.tsx` + `columns.tsx`
- [Schemas](schemas.ts.md) for `{feature}.schema.ts`

## Build Sequence

1. `types.ts` + `constants.ts` - data shapes first
2. `schemas/{feature}.schema.ts` - validation rules
3. Query keys in `queryKeys.ts`
4. `hooks/use{Feature}sQuery.ts` - list data
5. `hooks/use{Feature}Query.ts` - single item
6. `components/columns.tsx` - table columns
7. `components/{Feature}sListView.tsx` - list page
8. Mutation hooks (create/update/delete)
9. `hooks/use{Feature}Form.ts` + `use{Feature}FormController.ts`
10. `components/{Feature}Form.tsx` - form UI
11. `components/{Feature}DetailView.tsx` - detail layout
12. Route files
13. `index.ts` - barrel exports (only public API)

## Key Rules

- **Barrel exports**: only expose what other modules consume
- **No cross-module deep imports**: always import from `@/modules/{feature}` not `@/modules/{feature}/hooks/...`
- **Route loaders** fetch initial data, components use hooks for dynamic data
- **`useActiveTeam()`** provides `teamKey`/`teamSlug` context
- **Tab navigation** via const enum + tabConfig array pattern
- **Helpers** for transforming API data to formats other modules need
