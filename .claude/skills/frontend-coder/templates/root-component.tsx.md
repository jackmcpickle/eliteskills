# Root Component Template

Standard root component structure with state management hook.

```typescript
/**
 * {FeatureName} Root Component
 *
 * Main entry component that coordinates state and renders UI.
 */
import React from "react"
import { use{FeatureName} } from "./hooks/use{FeatureName}"
import { isLoaded, isError } from "./types"

// Components
import { LoadingSkeleton } from "./components/LoadingSkeleton"
import { ErrorMessage } from "./components/ErrorMessage"
import { {FeatureName}Form } from "./components/{FeatureName}Form"

interface {FeatureName}Props {
  teamSlug: string
  // Add props from config
}

export default function {FeatureName}({
  teamSlug,
}: {FeatureName}Props) {
  const { model, dispatch, actions } = use{FeatureName}(teamSlug)

  // Render based on model state
  if (model.type === 'Loading') {
    return <LoadingSkeleton />
  }

  if (model.type === 'Error') {
    return (
      <ErrorMessage
        message={model.error}
        onRetry={actions.retry}
      />
    )
  }

  if (model.type === 'Loaded') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">{FeatureName}</h1>
        </header>

        <main>
          <{FeatureName}Form
            data={model.data}
            onSubmit={actions.submit}
            isSubmitting={model.type === 'Submitting'}
          />
        </main>
      </div>
    )
  }

  // Exhaustive check - TypeScript will error if we miss a state
  const _exhaustive: never = model
  return null
}
```

## Key Patterns

1. **State-driven rendering** - Switch on `model.type` to render appropriate UI
2. **Thin component** - Delegates logic to `use{FeatureName}` hook
3. **Exhaustive check** - Ensures all states are handled
4. **Prop drilling** - Pass specific data/callbacks to child components

## Placeholders to Replace

| Placeholder | Example | Description |
|-------------|---------|-------------|
| `{FeatureName}` | `QuickCreate` | PascalCase component name |
