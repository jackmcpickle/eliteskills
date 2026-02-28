# Code Style Guide

## React Style Rules

### Component Organization

- Each component in own file named same as component (PascalCase)
- Named exports over default exports
- Use @/ prefix for internal imports
- Remove all unused imports

### TypeScript Style

- Use `satisfies` over `as` or `:Type` on object literals
- Use `import type` for types (verbatimModuleSyntax)
- Explicit return types on functions
- ReactElement return type on components
- Explicit parameter types (no implicit any)
- Prefix params with underscore ONLY when truly unused (never accessed in function body)

### React Imports

```tsx
// GOOD
import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';

// BAD
import * as React from 'react';
import React from 'react';
React.useState(); // Never use React.* APIs
```

### Naming Conventions

- Event handlers: `handleX` (handleSubmit, handleClick)
- Event props: `onX` (onSubmit, onClick)
- useMutation hooks: postfix with mutation type

```tsx
// GOOD
<form onSubmit={handleSubmit}>

// Custom mutation hook
function useCreateUserMutation() { ... }
```

### Tailwind CSS

- Use `size-x` when both h-x and w-x are same value

```tsx
// GOOD
<div className="size-5" />

// BAD
<div className="h-5 w-5" />
```

### Component Extraction

- Extract focused single-responsibility components
- Encapsulate permission/conditional logic inside component
- Return null from component for conditional rendering (vs inline conditional in parent)

```tsx
// GOOD - Logic encapsulated in component
function AdminButton(): ReactElement | null {
    const { isAdmin } = useAuth();
    if (!isAdmin) return null;
    return <Button>Admin Action</Button>;
}

// Parent stays clean
function Page(): ReactElement {
    return (
        <div>
            <AdminButton />
        </div>
    );
}

// BAD - Conditional logic in parent
function Page(): ReactElement {
    const { isAdmin } = useAuth();
    return <div>{isAdmin && <Button>Admin Action</Button>}</div>;
}
```

---

# Architecture Patterns

Deep dive into state management, type-driven development, and validation strategies used in React applications.

## State Management Philosophy

### Why Discriminated Unions?

Traditional boolean flags create impossible states:

```typescript
// BAD: 2^3 = 8 possible states, but only 4 are valid
interface BadState {
    isLoading: boolean; // true when fetching
    isError: boolean; // true when failed
    data: Data | null; // null until loaded
}

// These combinations are invalid but possible:
// { isLoading: true, isError: true, data: {...} }  // Loading AND error AND data?
// { isLoading: false, isError: false, data: null } // Not loading, no error, but no data?
```

Discriminated unions make invalid states **unrepresentable**:

```typescript
// GOOD: Only 4 states, all valid
type Model =
  | { type: 'Idle' }
  | { type: 'Loading' }
  | { type: 'Loaded'; data: Data }
  | { type: 'Error'; error: string }

// TypeScript enforces correctness:
function render(model: Model) {
  switch (model.type) {
    case 'Idle':
      return <EmptyState />
    case 'Loading':
      return <Spinner />
    case 'Loaded':
      return <DataView data={model.data} />  // data guaranteed to exist
    case 'Error':
      return <ErrorMessage error={model.error} />  // error guaranteed to exist
  }
}
```

### TEA Pattern: Model → Action → Update → View

The Elm Architecture adapted for React:

```
┌─────────┐     ┌────────┐     ┌────────┐     ┌──────┐
│  View   │────▶│ Action │────▶│ Update │────▶│Model │
│(render) │     │(event) │     │(reducer│     │(state│
└─────────┘     └────────┘     └────────┘     └──────┘
     ▲                                            │
     └────────────────────────────────────────────┘
```

**Implementation with useReducer:**

```typescript
// 1. Define Model (state)
type Model =
    | { type: 'Empty' }
    | { type: 'Submitting'; formData: FormData }
    | { type: 'Success'; result: Result }
    | { type: 'Error'; error: string; formData: FormData };

// 2. Define Actions
type Action =
    | { type: 'SUBMIT'; formData: FormData }
    | { type: 'SUBMIT_SUCCESS'; result: Result }
    | { type: 'SUBMIT_ERROR'; error: string }
    | { type: 'RESET' };

// 3. Define Update (reducer)
function reducer(model: Model, action: Action): Model {
    switch (action.type) {
        case 'SUBMIT':
            return { type: 'Submitting', formData: action.formData };
        case 'SUBMIT_SUCCESS':
            return { type: 'Success', result: action.result };
        case 'SUBMIT_ERROR':
            if (model.type !== 'Submitting') return model;
            return {
                type: 'Error',
                error: action.error,
                formData: model.formData,
            };
        case 'RESET':
            return { type: 'Empty' };
    }
}

// 4. Use in component (View)
function Form() {
    const [model, dispatch] = useReducer(reducer, { type: 'Empty' });

    // View renders based on model.type
    // Events dispatch actions
}
```

### useState vs useReducer Decision Matrix

| Criteria                            | useState | useReducer |
| ----------------------------------- | -------- | ---------- |
| Single primitive value              | ✅       | ❌         |
| Independent values                  | ✅       | ❌         |
| Related values that change together | ❌       | ✅         |
| Complex state transitions           | ❌       | ✅         |
| State machine behavior              | ❌       | ✅         |
| Need to pass dispatch to children   | ❌       | ✅         |

**Rule of thumb:** If you find yourself calling multiple `setState` functions together, switch to `useReducer`.

## Type-Driven Development

### Define Types First

Before writing any component code:

1. Define the **Model** (what states are possible?)
2. Define the **Actions** (what can happen?)
3. Define the **data shapes** (what does the API return?)

```typescript
// types.ts - Define these FIRST

// What states can this feature be in?
export type Model =
    | { type: 'Idle' }
    | { type: 'Editing'; item: Item; draft: ItemDraft }
    | { type: 'Saving'; item: Item; draft: ItemDraft }
    | { type: 'Error'; item: Item; draft: ItemDraft; error: string };

// What actions can occur?
export type Action =
    | { type: 'START_EDIT'; item: Item }
    | { type: 'UPDATE_DRAFT'; field: keyof ItemDraft; value: string }
    | { type: 'SAVE' }
    | { type: 'SAVE_SUCCESS'; item: Item }
    | { type: 'SAVE_ERROR'; error: string }
    | { type: 'CANCEL' };

// What does the data look like?
export interface Item {
    id: string;
    name: string;
    description: string;
    createdAt: string;
}

export interface ItemDraft {
    name: string;
    description: string;
}
```

### Type Guards for Safe Narrowing

When working with discriminated unions, use type guards:

```typescript
// Type guard function
export function isEditing(model: Model): model is
  | { type: 'Editing'; item: Item; draft: ItemDraft }
  | { type: 'Saving'; item: Item; draft: ItemDraft }
  | { type: 'Error'; item: Item; draft: ItemDraft; error: string } {
  return model.type === 'Editing' || model.type === 'Saving' || model.type === 'Error'
}

// Usage in component
function EditForm({ model }: { model: Model }) {
  if (!isEditing(model)) {
    return null
  }

  // TypeScript now knows model has `item` and `draft`
  return (
    <form>
      <input value={model.draft.name} />
      <input value={model.draft.description} />
    </form>
  )
}
```

### Exhaustive Switch Statements

TypeScript ensures you handle all cases:

```typescript
function getStatusMessage(model: Model): string {
    switch (model.type) {
        case 'Idle':
            return 'Ready to edit';
        case 'Editing':
            return 'Editing...';
        case 'Saving':
            return 'Saving...';
        case 'Error':
            return `Error: ${model.error}`;
        // If you add a new state and forget to handle it,
        // TypeScript will error here
    }
}
```

## Validation Strategy

### Zod at Boundaries

Validate data at the edges of your application:

- API responses
- WebSocket messages
- Form submissions
- URL parameters

```typescript
// schemas.ts
import { z } from 'zod';

// Define schema
export const ItemSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Name is required'),
    description: z.string(),
    createdAt: z.string().datetime(),
});

// For API responses
export const ApiResponseSchema = z.object({
    success: z.literal(true),
    data: ItemSchema,
});

export const ApiErrorSchema = z.object({
    success: z.literal(false),
    error: z.string(),
});

export const ApiResultSchema = z.discriminatedUnion('success', [
    ApiResponseSchema,
    ApiErrorSchema,
]);

// Infer types from schemas
export type Item = z.infer<typeof ItemSchema>;
export type ApiResult = z.infer<typeof ApiResultSchema>;
```

### Safe Parsing Pattern

Always use `.safeParse()` for external data:

```typescript
async function fetchItem(id: string): Promise<Item | null> {
    const response = await fetch(`/api/items/${id}/`);
    const json = await response.json();

    // Validate at boundary
    const result = ApiResultSchema.safeParse(json);

    if (!result.success) {
        console.error('Invalid API response:', result.error.format());
        return null;
    }

    if (!result.data.success) {
        console.error('API error:', result.data.error);
        return null;
    }

    return result.data.data;
}
```

### Form Validation with Zod

```typescript
const FormSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    email: z.email('Invalid email address'),
    age: z.number().min(18, 'Must be 18 or older').optional(),
});

type FormData = z.infer<typeof FormSchema>;

function validateForm(
    data: unknown,
):
    | { success: true; data: FormData }
    | { success: false; errors: Record<string, string> } {
    const result = FormSchema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Convert Zod errors to field-level errors
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        errors[path] = issue.message;
    }

    return { success: false, errors };
}
```

## Component Patterns

### Controlled Components

State lives in parent, child receives value + onChange:

```typescript
// Parent owns state
function Form() {
  const [name, setName] = useState('')

  return <NameInput value={name} onChange={setName} />
}

// Child is controlled
function NameInput({
  value,
  onChange
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
```

### Thin Components, Fat Hooks

Keep components focused on rendering. Put logic in hooks:

```typescript
// FAT hook - all the logic
function useItemEditor(itemId: string) {
  const [model, dispatch] = useReducer(reducer, { type: 'Loading' })

  // Load item on mount
  useEffect(() => {
    loadItem(itemId).then(item =>
      dispatch({ type: 'LOAD_SUCCESS', item })
    )
  }, [itemId])

  // Save handler
  const save = useCallback(async () => {
    if (model.type !== 'Editing') return
    dispatch({ type: 'SAVE' })
    try {
      const result = await saveItem(model.item.id, model.draft)
      dispatch({ type: 'SAVE_SUCCESS', item: result })
    } catch (e) {
      dispatch({ type: 'SAVE_ERROR', error: e.message })
    }
  }, [model])

  return { model, dispatch, save }
}

// THIN component - just rendering
function ItemEditor({ itemId }: { itemId: string }) {
  const { model, dispatch, save } = useItemEditor(itemId)

  if (model.type === 'Loading') return <Spinner />
  if (model.type === 'Error') return <Error message={model.error} />

  return (
    <form onSubmit={save}>
      <Input
        value={model.draft.name}
        onChange={(e) => dispatch({
          type: 'UPDATE_DRAFT',
          field: 'name',
          value: e.target.value
        })}
      />
      <Button type="submit">Save</Button>
    </form>
  )
}
```

### Immutable Array Updates

Helper functions for updating arrays immutably:

```typescript
// Update item by key
function updateByKey<T extends { key: string }>(
  items: T[],
  key: string,
  updater: (item: T) => T
): T[] {
  const index = items.findIndex(item => item.key === key)
  if (index === -1) return items
  return [
    ...items.slice(0, index),
    updater(items[index]),
    ...items.slice(index + 1),
  ]
}

// Remove item by key
function removeByKey<T extends { key: string }>(
  items: T[],
  key: string
): T[] {
  return items.filter(item => item.key !== key)
}

// Usage in reducer
case 'UPDATE_ITEM':
  return {
    ...state,
    items: updateByKey(state.items, action.key, item => ({
      ...item,
      ...action.updates,
    })),
  }
```
