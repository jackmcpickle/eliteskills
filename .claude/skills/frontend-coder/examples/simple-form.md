# Simple Form Example

A settings form with validation, loading states, and error handling.

## Use Case

- User edits their profile settings
- Form validates on change
- Submit shows loading state
- Success/error feedback displayed

## File Structure

```
src/apps/users/assets/javascript/profile-settings/
├── index.tsx
├── ProfileSettings.tsx
├── types.ts
├── schemas.ts
└── hooks/
    └── useProfileSettings.ts
```

## types.ts

```typescript
export interface UserProfile {
  id: string
  name: string
  email: string
  timezone: string
}

export interface ProfileDraft {
  name: string
  timezone: string
}

export type Model =
  | { type: 'Loading' }
  | { type: 'Loaded'; profile: UserProfile; draft: ProfileDraft; isDirty: boolean }
  | { type: 'Saving'; profile: UserProfile; draft: ProfileDraft }
  | { type: 'Success'; profile: UserProfile; draft: ProfileDraft }
  | { type: 'Error'; profile: UserProfile; draft: ProfileDraft; error: string }

export type Action =
  | { type: 'LOAD_SUCCESS'; profile: UserProfile }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'UPDATE_FIELD'; field: keyof ProfileDraft; value: string }
  | { type: 'SAVE' }
  | { type: 'SAVE_SUCCESS'; profile: UserProfile }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'DISMISS_SUCCESS' }
```

## schemas.ts

```typescript
import { z } from 'zod'

export const ProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  timezone: z.string(),
})

export const ProfileDraftSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  timezone: z.string()
    .min(1, 'Timezone is required'),
})

export type UserProfile = z.infer<typeof ProfileSchema>
export type ProfileDraft = z.infer<typeof ProfileDraftSchema>

export function validateDraft(data: unknown) {
  const result = ProfileDraftSchema.safeParse(data)
  if (result.success) {
    return { success: true as const, data: result.data }
  }
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    errors[issue.path.join('.')] = issue.message
  }
  return { success: false as const, errors }
}
```

## hooks/useProfileSettings.ts

```typescript
import { useReducer, useEffect, useCallback, useMemo } from 'react'
import { Model, Action, UserProfile, ProfileDraft } from '../types'
import { validateDraft } from '../schemas'

function createDraft(profile: UserProfile): ProfileDraft {
  return { name: profile.name, timezone: profile.timezone }
}

function reducer(model: Model, action: Action): Model {
  switch (action.type) {
    case 'LOAD_SUCCESS': {
      const draft = createDraft(action.profile)
      return { type: 'Loaded', profile: action.profile, draft, isDirty: false }
    }

    case 'LOAD_ERROR':
      return { type: 'Error', profile: null as any, draft: null as any, error: action.error }

    case 'UPDATE_FIELD': {
      if (model.type === 'Loading') return model
      const newDraft = { ...model.draft, [action.field]: action.value }
      const isDirty = newDraft.name !== model.profile.name ||
                      newDraft.timezone !== model.profile.timezone
      return { type: 'Loaded', profile: model.profile, draft: newDraft, isDirty }
    }

    case 'SAVE':
      if (model.type !== 'Loaded' || !model.isDirty) return model
      return { type: 'Saving', profile: model.profile, draft: model.draft }

    case 'SAVE_SUCCESS': {
      const draft = createDraft(action.profile)
      return { type: 'Success', profile: action.profile, draft }
    }

    case 'SAVE_ERROR':
      if (model.type !== 'Saving') return model
      return { type: 'Error', profile: model.profile, draft: model.draft, error: action.error }

    case 'DISMISS_SUCCESS':
      if (model.type !== 'Success') return model
      return { type: 'Loaded', profile: model.profile, draft: model.draft, isDirty: false }

    default:
      return model
  }
}

export function useProfileSettings(teamSlug: string) {
  const [model, dispatch] = useReducer(reducer, { type: 'Loading' })

  // Load profile on mount
  useEffect(() => {
    let cancelled = false

    fetch(`/a/${teamSlug}/users/api/profile/`)
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          dispatch({ type: 'LOAD_SUCCESS', profile: data })
        }
      })
      .catch(err => {
        if (!cancelled) {
          dispatch({ type: 'LOAD_ERROR', error: err.message })
        }
      })

    return () => { cancelled = true }
  }, [teamSlug])

  // Validation
  const validation = useMemo(() => {
    if (model.type === 'Loading') return { errors: {}, isValid: true }
    return validateDraft(model.draft)
  }, [model])

  // Actions
  const updateField = useCallback((field: keyof ProfileDraft, value: string) => {
    dispatch({ type: 'UPDATE_FIELD', field, value })
  }, [])

  const save = useCallback(async () => {
    if (model.type !== 'Loaded' || !model.isDirty) return
    if (!validation.success) return

    dispatch({ type: 'SAVE' })

    try {
      const csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1] || ''
      const response = await fetch(`/a/${teamSlug}/users/api/profile/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        body: JSON.stringify(model.draft),
      })
      const data = await response.json()

      if (data.success) {
        dispatch({ type: 'SAVE_SUCCESS', profile: data.data })
      } else {
        dispatch({ type: 'SAVE_ERROR', error: data.error })
      }
    } catch (err) {
      dispatch({ type: 'SAVE_ERROR', error: 'Failed to save' })
    }
  }, [model, teamSlug, validation])

  const dismissSuccess = useCallback(() => {
    dispatch({ type: 'DISMISS_SUCCESS' })
  }, [])

  return {
    model,
    validation: validation.success ? { errors: {}, isValid: true } : validation,
    actions: { updateField, save, dismissSuccess },
  }
}
```

## ProfileSettings.tsx

```typescript
import React from 'react'
import { useProfileSettings } from './hooks/useProfileSettings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'

interface Props {
  teamSlug: string
}

export default function ProfileSettings({ teamSlug }: Props) {
  const { model, validation, actions } = useProfileSettings(teamSlug)

  if (model.type === 'Loading') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isSaving = model.type === 'Saving'
  const showSuccess = model.type === 'Success'
  const error = model.type === 'Error' ? model.error : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {showSuccess && (
          <div className="p-3 bg-green-50 text-green-800 rounded-md flex justify-between items-center">
            <span>Settings saved successfully!</span>
            <button onClick={actions.dismissSuccess} className="text-green-600 hover:text-green-800">
              Dismiss
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 text-red-800 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={model.draft.name}
            onChange={(e) => actions.updateField('name', e.target.value)}
            disabled={isSaving}
          />
          {validation.errors.name && (
            <p className="text-sm text-red-600">{validation.errors.name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            value={model.draft.timezone}
            onChange={(e) => actions.updateField('timezone', e.target.value)}
            disabled={isSaving}
          />
          {validation.errors.timezone && (
            <p className="text-sm text-red-600">{validation.errors.timezone}</p>
          )}
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={actions.save}
          disabled={isSaving || !model.isDirty || !validation.isValid}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  )
}
```

## Key Patterns Demonstrated

1. **Discriminated union states** - Loading, Loaded, Saving, Success, Error
2. **Dirty tracking** - Button disabled when no changes
3. **Real-time validation** - Errors shown as user types
4. **Success feedback** - Dismissible success message
5. **Loading skeleton** - Placeholder while fetching
6. **CSRF handling** - Token extracted from cookie
