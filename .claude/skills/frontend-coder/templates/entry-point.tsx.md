# Entry Point Template

Standard `index.tsx` for mounting a React app in a Django template.

```typescript
/**
 * {FeatureName} React Entry Point
 *
 * Mounts the {FeatureName} component to the DOM.
 * Expects config data in a JSON script tag with id="{feature-id}-config"
 */
import React from "react"
import { createRoot } from "react-dom/client"
import {FeatureName} from "./{FeatureName}"

interface {FeatureName}Config {
  teamSlug: string
  // Add props from Django template config
}

const container = document.querySelector('#{feature-id}')
if (container) {
  const configElement = document.getElementById('{feature-id}-config')
  const config: {FeatureName}Config = configElement
    ? JSON.parse(configElement.textContent || '{}')
    : {}

  const root = createRoot(container)
  root.render(<{FeatureName} {...config} />)
}
```

## Placeholders to Replace

| Placeholder | Example | Description |
|-------------|---------|-------------|
| `{FeatureName}` | `QuickCreate` | PascalCase component name |
| `{feature-id}` | `quick-create` | kebab-case DOM element ID |

## Matching Django Template

```html
<script type="application/json" id="{feature-id}-config">
{{ config_json|safe }}
</script>
<div id="{feature-id}"></div>
<script src="{% static 'js/{feature-name}-bundle.js' %}"></script>
```
