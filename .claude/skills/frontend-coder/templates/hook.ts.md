# State Hook Template (TEA Pattern)

Complex local state management with `useReducer` for state-machine behavior. Use this when TanStack Query is insufficient (multi-step workflows, offline state, complex transitions).

For server data fetching, prefer [Query Hook](query-hook.ts.md) and [Mutation Hook](mutation-hook.ts.md) instead.

```typescript
import { useReducer, useEffect, useCallback } from 'react';
import type { Item, ItemDraft, Model, Action } from '../types';

// =============================================================================
// Reducer
// =============================================================================

function reducer(model: Model, action: Action): Model {
    switch (action.type) {
        case 'LOAD_SUCCESS':
            return { type: 'Loaded', data: action.data };

        case 'LOAD_ERROR':
            return { type: 'Error', error: action.error };

        case 'START_EDIT': {
            if (!('data' in model)) return model;
            return {
                type: 'Editing',
                data: model.data,
                editingItem: action.item,
                draft: createDraftFromItem(action.item),
            };
        }

        case 'UPDATE_DRAFT': {
            if (model.type !== 'Editing' && model.type !== 'SaveError') return model;
            return {
                ...model,
                type: 'Editing',
                draft: { ...model.draft, [action.field]: action.value },
            };
        }

        case 'CANCEL_EDIT': {
            if (!('data' in model)) return model;
            return { type: 'Loaded', data: model.data };
        }

        case 'RETRY':
            return { type: 'Loading' };

        default:
            return model;
    }
}

function createDraftFromItem(item: Item): ItemDraft {
    return { name: item.name, description: item.description };
}

// =============================================================================
// Hook
// =============================================================================

interface Use{Feature}Return {
    model: Model;
    actions: {
        startEdit: (item: Item) => void;
        updateDraft: (field: keyof ItemDraft, value: string) => void;
        cancelEdit: () => void;
        retry: () => void;
    };
}

export function use{Feature}(): Use{Feature}Return {
    const [model, dispatch] = useReducer(reducer, { type: 'Loading' });

    const startEdit = useCallback((item: Item) => {
        dispatch({ type: 'START_EDIT', item });
    }, []);

    const updateDraft = useCallback((field: keyof ItemDraft, value: string) => {
        dispatch({ type: 'UPDATE_DRAFT', field, value });
    }, []);

    const cancelEdit = useCallback(() => {
        dispatch({ type: 'CANCEL_EDIT' });
    }, []);

    const retry = useCallback(() => {
        dispatch({ type: 'RETRY' });
    }, []);

    return {
        model,
        actions: { startEdit, updateDraft, cancelEdit, retry },
    };
}
```

## When to Use

| Criteria                            | useState | useReducer (this) | TanStack Query |
| ----------------------------------- | -------- | ------------------ | -------------- |
| Single primitive value              | Yes      | No                 | No             |
| Server data fetching                | No       | No                 | Yes            |
| Related values changing together    | No       | Yes                | No             |
| Complex state transitions           | No       | Yes                | No             |
| State machine behavior              | No       | Yes                | No             |
