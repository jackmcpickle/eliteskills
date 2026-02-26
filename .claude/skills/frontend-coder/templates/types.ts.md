# Types Template

Standard type definitions using discriminated unions.

> **When to use this template:** Only include `Model`, `Action`, and type guard sections when the feature uses the [TEA/useReducer pattern](hook.ts.md) for complex local state. For features using TanStack Query (most CRUD modules), `types.ts` should only contain data interfaces, tab configs, and const enums. Delete the Model/Action/type-guard sections entirely.

> **Display label maps** (`STATUS_LABELS`, `PRIORITY_LABELS`, etc.) belong in `helpers.ts` or `constants.ts`, not `types.ts`.

```typescript
/**
 * {FeatureName} Type Definitions
 *
 * TEA-style discriminated unions that make invalid states unrepresentable.
 */

// =============================================================================
// Data Types
// =============================================================================

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

// =============================================================================
// Model - Feature State (Mutually Exclusive)
// =============================================================================

/**
 * The primary state model. Only ONE state can be active at a time.
 *
 * State transitions:
 * - Loading → Loaded | Error
 * - Loaded → Editing → Saving → Loaded | SaveError
 * - Error → Loading (retry)
 */
export type Model =
    | { type: 'Loading' }
    | { type: 'Loaded'; data: Item[] }
    | { type: 'Error'; error: string }
    | { type: 'Editing'; data: Item[]; editingItem: Item; draft: ItemDraft }
    | { type: 'Saving'; data: Item[]; editingItem: Item; draft: ItemDraft }
    | {
          type: 'SaveError';
          data: Item[];
          editingItem: Item;
          draft: ItemDraft;
          error: string;
      };

// =============================================================================
// Actions - All State Transitions
// =============================================================================

/**
 * User-initiated actions
 */
export type UserAction =
    | { type: 'START_EDIT'; item: Item }
    | { type: 'UPDATE_DRAFT'; field: keyof ItemDraft; value: string }
    | { type: 'SAVE' }
    | { type: 'CANCEL_EDIT' }
    | { type: 'RETRY' };

/**
 * API response actions
 */
export type ApiAction =
    | { type: 'LOAD_SUCCESS'; data: Item[] }
    | { type: 'LOAD_ERROR'; error: string }
    | { type: 'SAVE_SUCCESS'; item: Item }
    | { type: 'SAVE_ERROR'; error: string };

/**
 * All possible actions
 */
export type Action = UserAction | ApiAction;

// =============================================================================
// Type Guards
// =============================================================================

export function isLoaded(
    model: Model,
): model is { type: 'Loaded'; data: Item[] } {
    return model.type === 'Loaded';
}

export function isEditing(
    model: Model,
): model is
    | { type: 'Editing'; data: Item[]; editingItem: Item; draft: ItemDraft }
    | { type: 'Saving'; data: Item[]; editingItem: Item; draft: ItemDraft }
    | {
          type: 'SaveError';
          data: Item[];
          editingItem: Item;
          draft: ItemDraft;
          error: string;
      } {
    return (
        model.type === 'Editing' ||
        model.type === 'Saving' ||
        model.type === 'SaveError'
    );
}

export function hasData(model: Model): model is Model & { data: Item[] } {
    return 'data' in model;
}

// =============================================================================
// Initial State
// =============================================================================

export function createInitialModel(): Model {
    return { type: 'Loading' };
}

export function createDraftFromItem(item: Item): ItemDraft {
    return {
        name: item.name,
        description: item.description,
    };
}
```

## Key Patterns

1. **Discriminated unions** - `type` field distinguishes states
2. **Grouped actions** - User, API, and internal actions separated
3. **Type guards** - Safe narrowing functions
4. **Factory functions** - `createInitialModel()`, `createDraftFromItem()`

## Customize For Your Feature

1. Replace `Item` and `ItemDraft` with your data types
2. Add/remove states based on your feature's lifecycle
3. Add/remove actions based on user interactions and API calls
4. Create type guards for state groups you need to check
5. If using TanStack Query (not TEA), delete Model, Action, UserAction, ApiAction types and all type guards — they are dead code in a Query-based module
