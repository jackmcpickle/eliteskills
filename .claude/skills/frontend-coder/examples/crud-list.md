# CRUD List Example

A list of items with create, edit, and delete operations.

## Use Case

- Display list of items
- Create new items via modal
- Edit items inline or via modal
- Delete with confirmation
- Optimistic updates for responsiveness

## File Structure

```
src/apps/inventory/assets/javascript/item-manager/
├── index.tsx
├── ItemManager.tsx
├── types.ts
├── schemas.ts
├── hooks/
│   └── useItemManager.ts
└── components/
    ├── ItemList.tsx
    ├── ItemRow.tsx
    ├── ItemForm.tsx
    └── DeleteConfirmDialog.tsx
```

## types.ts

```typescript
export interface Item {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface ItemDraft {
  name: string
  description: string
  status: 'active' | 'inactive'
}

// Modal state - only one modal open at a time
export type ModalState =
  | { type: 'Closed' }
  | { type: 'Creating'; draft: ItemDraft; saving: boolean; error: string | null }
  | { type: 'Editing'; item: Item; draft: ItemDraft; saving: boolean; error: string | null }
  | { type: 'Deleting'; item: Item; deleting: boolean; error: string | null }

// Main model
export type Model =
  | { type: 'Loading' }
  | { type: 'Error'; error: string }
  | { type: 'Loaded'; items: Item[]; modal: ModalState }

// Actions
export type Action =
  // Data loading
  | { type: 'LOAD_SUCCESS'; items: Item[] }
  | { type: 'LOAD_ERROR'; error: string }
  // Create flow
  | { type: 'OPEN_CREATE' }
  | { type: 'CREATE_SUBMIT' }
  | { type: 'CREATE_SUCCESS'; item: Item }
  | { type: 'CREATE_ERROR'; error: string }
  // Edit flow
  | { type: 'OPEN_EDIT'; item: Item }
  | { type: 'EDIT_SUBMIT' }
  | { type: 'EDIT_SUCCESS'; item: Item }
  | { type: 'EDIT_ERROR'; error: string }
  // Delete flow
  | { type: 'OPEN_DELETE'; item: Item }
  | { type: 'DELETE_CONFIRM' }
  | { type: 'DELETE_SUCCESS'; itemId: string }
  | { type: 'DELETE_ERROR'; error: string }
  // Shared
  | { type: 'UPDATE_DRAFT'; field: keyof ItemDraft; value: string }
  | { type: 'CLOSE_MODAL' }
```

## hooks/useItemManager.ts

```typescript
import { useReducer, useEffect, useCallback } from 'react'
import { Model, Action, Item, ItemDraft, ModalState } from '../types'

const emptyDraft: ItemDraft = { name: '', description: '', status: 'active' }

function draftFromItem(item: Item): ItemDraft {
  return { name: item.name, description: item.description, status: item.status }
}

function reducer(model: Model, action: Action): Model {
  switch (action.type) {
    case 'LOAD_SUCCESS':
      return { type: 'Loaded', items: action.items, modal: { type: 'Closed' } }

    case 'LOAD_ERROR':
      return { type: 'Error', error: action.error }

    case 'OPEN_CREATE':
      if (model.type !== 'Loaded') return model
      return {
        ...model,
        modal: { type: 'Creating', draft: emptyDraft, saving: false, error: null },
      }

    case 'OPEN_EDIT':
      if (model.type !== 'Loaded') return model
      return {
        ...model,
        modal: {
          type: 'Editing',
          item: action.item,
          draft: draftFromItem(action.item),
          saving: false,
          error: null,
        },
      }

    case 'OPEN_DELETE':
      if (model.type !== 'Loaded') return model
      return {
        ...model,
        modal: { type: 'Deleting', item: action.item, deleting: false, error: null },
      }

    case 'UPDATE_DRAFT': {
      if (model.type !== 'Loaded') return model
      const { modal } = model
      if (modal.type !== 'Creating' && modal.type !== 'Editing') return model
      return {
        ...model,
        modal: { ...modal, draft: { ...modal.draft, [action.field]: action.value } },
      }
    }

    case 'CREATE_SUBMIT':
      if (model.type !== 'Loaded' || model.modal.type !== 'Creating') return model
      return { ...model, modal: { ...model.modal, saving: true, error: null } }

    case 'CREATE_SUCCESS':
      if (model.type !== 'Loaded') return model
      return {
        ...model,
        items: [action.item, ...model.items], // Add to top
        modal: { type: 'Closed' },
      }

    case 'CREATE_ERROR':
      if (model.type !== 'Loaded' || model.modal.type !== 'Creating') return model
      return { ...model, modal: { ...model.modal, saving: false, error: action.error } }

    case 'EDIT_SUBMIT':
      if (model.type !== 'Loaded' || model.modal.type !== 'Editing') return model
      return { ...model, modal: { ...model.modal, saving: true, error: null } }

    case 'EDIT_SUCCESS':
      if (model.type !== 'Loaded') return model
      return {
        ...model,
        items: model.items.map(i => i.id === action.item.id ? action.item : i),
        modal: { type: 'Closed' },
      }

    case 'EDIT_ERROR':
      if (model.type !== 'Loaded' || model.modal.type !== 'Editing') return model
      return { ...model, modal: { ...model.modal, saving: false, error: action.error } }

    case 'DELETE_CONFIRM':
      if (model.type !== 'Loaded' || model.modal.type !== 'Deleting') return model
      return { ...model, modal: { ...model.modal, deleting: true, error: null } }

    case 'DELETE_SUCCESS':
      if (model.type !== 'Loaded') return model
      return {
        ...model,
        items: model.items.filter(i => i.id !== action.itemId),
        modal: { type: 'Closed' },
      }

    case 'DELETE_ERROR':
      if (model.type !== 'Loaded' || model.modal.type !== 'Deleting') return model
      return { ...model, modal: { ...model.modal, deleting: false, error: action.error } }

    case 'CLOSE_MODAL':
      if (model.type !== 'Loaded') return model
      return { ...model, modal: { type: 'Closed' } }

    default:
      return model
  }
}

export function useItemManager(teamSlug: string) {
  const [model, dispatch] = useReducer(reducer, { type: 'Loading' })

  // Load items
  useEffect(() => {
    fetch(`/a/${teamSlug}/inventory/api/items/`)
      .then(res => res.json())
      .then(data => dispatch({ type: 'LOAD_SUCCESS', items: data.items }))
      .catch(err => dispatch({ type: 'LOAD_ERROR', error: err.message }))
  }, [teamSlug])

  // CSRF helper
  const getCSRF = () => document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''

  // Actions
  const openCreate = useCallback(() => dispatch({ type: 'OPEN_CREATE' }), [])
  const openEdit = useCallback((item: Item) => dispatch({ type: 'OPEN_EDIT', item }), [])
  const openDelete = useCallback((item: Item) => dispatch({ type: 'OPEN_DELETE', item }), [])
  const closeModal = useCallback(() => dispatch({ type: 'CLOSE_MODAL' }), [])

  const updateDraft = useCallback((field: keyof ItemDraft, value: string) => {
    dispatch({ type: 'UPDATE_DRAFT', field, value })
  }, [])

  const submitCreate = useCallback(async () => {
    if (model.type !== 'Loaded' || model.modal.type !== 'Creating') return

    dispatch({ type: 'CREATE_SUBMIT' })

    try {
      const response = await fetch(`/a/${teamSlug}/inventory/api/items/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRF() },
        body: JSON.stringify(model.modal.draft),
      })
      const data = await response.json()

      if (data.success) {
        dispatch({ type: 'CREATE_SUCCESS', item: data.data })
      } else {
        dispatch({ type: 'CREATE_ERROR', error: data.error })
      }
    } catch {
      dispatch({ type: 'CREATE_ERROR', error: 'Failed to create item' })
    }
  }, [model, teamSlug])

  const submitEdit = useCallback(async () => {
    if (model.type !== 'Loaded' || model.modal.type !== 'Editing') return

    dispatch({ type: 'EDIT_SUBMIT' })

    try {
      const response = await fetch(`/a/${teamSlug}/inventory/api/items/${model.modal.item.id}/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCSRF() },
        body: JSON.stringify(model.modal.draft),
      })
      const data = await response.json()

      if (data.success) {
        dispatch({ type: 'EDIT_SUCCESS', item: data.data })
      } else {
        dispatch({ type: 'EDIT_ERROR', error: data.error })
      }
    } catch {
      dispatch({ type: 'EDIT_ERROR', error: 'Failed to update item' })
    }
  }, [model, teamSlug])

  const confirmDelete = useCallback(async () => {
    if (model.type !== 'Loaded' || model.modal.type !== 'Deleting') return

    dispatch({ type: 'DELETE_CONFIRM' })

    try {
      const response = await fetch(`/a/${teamSlug}/inventory/api/items/${model.modal.item.id}/`, {
        method: 'DELETE',
        headers: { 'X-CSRFToken': getCSRF() },
      })
      const data = await response.json()

      if (data.success) {
        dispatch({ type: 'DELETE_SUCCESS', itemId: model.modal.item.id })
      } else {
        dispatch({ type: 'DELETE_ERROR', error: data.error })
      }
    } catch {
      dispatch({ type: 'DELETE_ERROR', error: 'Failed to delete item' })
    }
  }, [model, teamSlug])

  return {
    model,
    actions: {
      openCreate,
      openEdit,
      openDelete,
      closeModal,
      updateDraft,
      submitCreate,
      submitEdit,
      confirmDelete,
    },
  }
}
```

## components/ItemList.tsx

```typescript
import React from 'react'
import { Item } from '../types'
import { ItemRow } from './ItemRow'
import { Button } from '@/components/ui/button'

interface Props {
  items: Item[]
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
  onCreateClick: () => void
}

export function ItemList({ items, onEdit, onDelete, onCreateClick }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Items ({items.length})</h2>
        <Button onClick={onCreateClick}>Add Item</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No items yet. Click "Add Item" to create one.
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {items.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              onEdit={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

## components/DeleteConfirmDialog.tsx

```typescript
import React from 'react'
import { Item } from '../types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  item: Item
  isDeleting: boolean
  error: string | null
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmDialog({ item, isDeleting, error, onConfirm, onCancel }: Props) {
  return (
    <Dialog open onOpenChange={() => !isDeleting && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Item</DialogTitle>
        </DialogHeader>

        <p>Are you sure you want to delete "{item.name}"? This action cannot be undone.</p>

        {error && (
          <div className="p-3 bg-red-50 text-red-800 rounded-md">{error}</div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

## ItemManager.tsx (Root Component)

```typescript
import React from 'react'
import { useItemManager } from './hooks/useItemManager'
import { ItemList } from './components/ItemList'
import { ItemForm } from './components/ItemForm'
import { DeleteConfirmDialog } from './components/DeleteConfirmDialog'

interface Props {
  teamSlug: string
}

export default function ItemManager({ teamSlug }: Props) {
  const { model, actions } = useItemManager(teamSlug)

  if (model.type === 'Loading') {
    return <div className="p-4">Loading...</div>
  }

  if (model.type === 'Error') {
    return <div className="p-4 text-red-600">Error: {model.error}</div>
  }

  const { items, modal } = model

  return (
    <div className="p-4">
      <ItemList
        items={items}
        onEdit={actions.openEdit}
        onDelete={actions.openDelete}
        onCreateClick={actions.openCreate}
      />

      {/* Create Modal */}
      {modal.type === 'Creating' && (
        <ItemForm
          title="Create Item"
          draft={modal.draft}
          isSaving={modal.saving}
          error={modal.error}
          onUpdateField={actions.updateDraft}
          onSubmit={actions.submitCreate}
          onCancel={actions.closeModal}
        />
      )}

      {/* Edit Modal */}
      {modal.type === 'Editing' && (
        <ItemForm
          title={`Edit: ${modal.item.name}`}
          draft={modal.draft}
          isSaving={modal.saving}
          error={modal.error}
          onUpdateField={actions.updateDraft}
          onSubmit={actions.submitEdit}
          onCancel={actions.closeModal}
        />
      )}

      {/* Delete Confirmation */}
      {modal.type === 'Deleting' && (
        <DeleteConfirmDialog
          item={modal.item}
          isDeleting={modal.deleting}
          error={modal.error}
          onConfirm={actions.confirmDelete}
          onCancel={actions.closeModal}
        />
      )}
    </div>
  )
}
```

## Key Patterns Demonstrated

1. **Modal state as discriminated union** - Only one modal open at a time
2. **Nested state** - ModalState inside Model
3. **Optimistic list updates** - Items updated immediately on success
4. **Delete confirmation** - Separate dialog with loading state
5. **Error handling per operation** - Errors scoped to modal, not global
6. **Form reuse** - Same ItemForm for create and edit
