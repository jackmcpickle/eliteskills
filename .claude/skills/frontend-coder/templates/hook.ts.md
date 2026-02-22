# Hook Template

Standard state management hook using useReducer.

```typescript
/**
 * use{FeatureName} Hook
 *
 * Manages all state and side effects for the {FeatureName} feature.
 * Follows TEA pattern: Model → Action → Update → View
 */
import { useReducer, useEffect, useCallback } from 'react'
import { Model, Action, createInitialModel, createDraftFromItem, Item, ItemDraft } from '../types'
import { parseItemListResponse, parseItemResponse, validateDraft } from '../schemas'

// =============================================================================
// Reducer
// =============================================================================

function reducer(model: Model, action: Action): Model {
  switch (action.type) {
    // API responses
    case 'LOAD_SUCCESS':
      return { type: 'Loaded', data: action.data }

    case 'LOAD_ERROR':
      return { type: 'Error', error: action.error }

    case 'SAVE_SUCCESS': {
      if (model.type !== 'Saving') return model
      // Update item in list
      const updatedData = model.data.map(item =>
        item.id === action.item.id ? action.item : item
      )
      return { type: 'Loaded', data: updatedData }
    }

    case 'SAVE_ERROR': {
      if (model.type !== 'Saving') return model
      return {
        type: 'SaveError',
        data: model.data,
        editingItem: model.editingItem,
        draft: model.draft,
        error: action.error,
      }
    }

    // User actions
    case 'START_EDIT': {
      if (!('data' in model)) return model
      return {
        type: 'Editing',
        data: model.data,
        editingItem: action.item,
        draft: createDraftFromItem(action.item),
      }
    }

    case 'UPDATE_DRAFT': {
      if (model.type !== 'Editing' && model.type !== 'SaveError') return model
      return {
        ...model,
        type: 'Editing', // Clear error on edit
        draft: { ...model.draft, [action.field]: action.value },
      }
    }

    case 'SAVE': {
      if (model.type !== 'Editing' && model.type !== 'SaveError') return model
      return {
        type: 'Saving',
        data: model.data,
        editingItem: model.editingItem,
        draft: model.draft,
      }
    }

    case 'CANCEL_EDIT': {
      if (!('data' in model)) return model
      return { type: 'Loaded', data: model.data }
    }

    case 'RETRY':
      return { type: 'Loading' }

    default:
      return model
  }
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchItems(teamSlug: string): Promise<Item[]> {
  const response = await fetch(`/a/${teamSlug}/feature/api/`)
  const json = await response.json()
  return parseItemListResponse(json)
}

async function saveItem(teamSlug: string, itemId: string, draft: ItemDraft): Promise<Item> {
  const csrfToken =
    document.querySelector<HTMLInputElement>('[name=csrfmiddlewaretoken]')?.value ||
    document.cookie.match(/csrftoken=([^;]+)/)?.[1] ||
    ''

  const response = await fetch(`/a/${teamSlug}/feature/api/${itemId}/`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrfToken,
    },
    body: JSON.stringify(draft),
  })

  const json = await response.json()
  return parseItemResponse(json)
}

// =============================================================================
// Hook
// =============================================================================

interface Use{FeatureName}Options {
  // Add any options here
}

interface Use{FeatureName}Result {
  model: Model
  dispatch: React.Dispatch<Action>
  actions: {
    startEdit: (item: Item) => void
    updateDraft: (field: keyof ItemDraft, value: string) => void
    save: () => Promise<void>
    cancelEdit: () => void
    retry: () => void
  }
  validation: {
    errors: Record<string, string>
    isValid: boolean
  }
}

export function use{FeatureName}(
  teamSlug: string,
  options: Use{FeatureName}Options = {}
): Use{FeatureName}Result {
  const [model, dispatch] = useReducer(reducer, null, createInitialModel)

  // ==========================================================================
  // Effects
  // ==========================================================================

  // Load data on mount
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchItems(teamSlug)
        if (!cancelled) {
          dispatch({ type: 'LOAD_SUCCESS', data })
        }
      } catch (error) {
        if (!cancelled) {
          dispatch({
            type: 'LOAD_ERROR',
            error: error instanceof Error ? error.message : 'Failed to load',
          })
        }
      }
    }

    load()
    return () => { cancelled = true }
  }, [teamSlug])

  // ==========================================================================
  // Validation
  // ==========================================================================

  const validation = useCallback(() => {
    if (model.type !== 'Editing' && model.type !== 'SaveError') {
      return { errors: {}, isValid: true }
    }

    const result = validateDraft(model.draft)
    if (result.success) {
      return { errors: {}, isValid: true }
    }
    return { errors: result.errors, isValid: false }
  }, [model])()

  // ==========================================================================
  // Actions
  // ==========================================================================

  const startEdit = useCallback((item: Item) => {
    dispatch({ type: 'START_EDIT', item })
  }, [])

  const updateDraft = useCallback((field: keyof ItemDraft, value: string) => {
    dispatch({ type: 'UPDATE_DRAFT', field, value })
  }, [])

  const save = useCallback(async () => {
    if (model.type !== 'Editing' && model.type !== 'SaveError') return
    if (!validation.isValid) return

    dispatch({ type: 'SAVE' })

    try {
      const item = await saveItem(teamSlug, model.editingItem.id, model.draft)
      dispatch({ type: 'SAVE_SUCCESS', item })
    } catch (error) {
      dispatch({
        type: 'SAVE_ERROR',
        error: error instanceof Error ? error.message : 'Failed to save',
      })
    }
  }, [model, teamSlug, validation.isValid])

  const cancelEdit = useCallback(() => {
    dispatch({ type: 'CANCEL_EDIT' })
  }, [])

  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' })
  }, [])

  return {
    model,
    dispatch,
    actions: {
      startEdit,
      updateDraft,
      save,
      cancelEdit,
      retry,
    },
    validation,
  }
}
```

## Key Patterns

1. **Reducer handles state transitions** - Pure function, no side effects
2. **Effects for async operations** - Load on mount, cleanup on unmount
3. **Actions wrap dispatch** - Callbacks with business logic
4. **Validation computed from state** - Real-time form validation
5. **Cancellation handling** - Prevents state updates after unmount

## Customize For Your Feature

1. Replace `Item` and `ItemDraft` with your data types
2. Update reducer cases to match your action types
3. Add/modify API functions for your endpoints
4. Add effects for additional async operations (WebSocket, polling, etc.)
5. Extend the result interface with feature-specific data
