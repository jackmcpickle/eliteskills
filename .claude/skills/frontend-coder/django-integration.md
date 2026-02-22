# Django Integration

How to integrate React apps as embedded islands in Django templates.

## Config Injection Pattern

React apps receive configuration from Django via JSON script tags. This keeps Django templates clean and provides type-safe props.

### Django View

```python
# views.py
import json
from django.views.generic import TemplateView

class FeatureView(TemplateView):
    template_name = 'feature/index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        # Build config for React
        config = {
            'teamSlug': self.request.team.slug,
            'userId': str(self.request.user.id),
            'items': [
                {'id': str(item.id), 'name': item.name}
                for item in Item.objects.filter(team=self.request.team)
            ],
        }

        context['config_json'] = json.dumps(config)
        return context
```

### Django Template

```html
{% extends "web/app/app_base.html" %}
{% load static %}

{% block page_head %}
<link rel="stylesheet" href="{% static 'css/site-tailwind.css' %}">
{% endblock %}

{% block app_content %}
<!-- Config injection - React reads this -->
<script type="application/json" id="feature-config">
{{ config_json|safe }}
</script>

<!-- Mount point -->
<div id="feature" class="h-full"></div>

<!-- Bundle -->
<script src="{% static 'js/feature-bundle.js' %}"></script>
{% endblock %}
```

### React Entry Point

```typescript
// index.tsx
import React from "react"
import { createRoot } from "react-dom/client"
import Feature from "./Feature"

interface FeatureConfig {
  teamSlug: string
  userId: string
  items: Array<{ id: string; name: string }>
}

const container = document.querySelector('#feature')
if (container) {
  const configElement = document.getElementById('feature-config')
  const config: FeatureConfig = configElement
    ? JSON.parse(configElement.textContent || '{}')
    : {}

  const root = createRoot(container)
  root.render(<Feature {...config} />)
}
```

## CSRF Token Handling

Django requires CSRF tokens for POST/PUT/DELETE requests. Extract the token from:
1. Hidden form input (if in a Django form)
2. Cookie (always available)

### CSRF Utility Function

```typescript
// utils/csrf.ts
export function getCSRFToken(): string {
  // Try hidden input first (more reliable if present)
  const inputToken = document.querySelector<HTMLInputElement>(
    '[name=csrfmiddlewaretoken]'
  )?.value

  if (inputToken) return inputToken

  // Fall back to cookie
  const cookieMatch = document.cookie.match(/csrftoken=([^;]+)/)
  return cookieMatch?.[1] || ''
}
```

### Using in Fetch Requests

```typescript
import { getCSRFToken } from './utils/csrf'

async function submitForm(data: FormData): Promise<Result> {
  const response = await fetch('/a/team-slug/feature/api/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCSRFToken(),
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}
```

### Alternative: Using js-cookie

If already using js-cookie in the project:

```typescript
import Cookies from 'js-cookie'

const csrfToken = Cookies.get('csrftoken') || ''
```

## API Endpoint Conventions

### URL Patterns

```python
# urls.py
from django.urls import path
from . import views

app_name = 'feature'

urlpatterns = [
    # Page (serves Django template with React)
    path('feature/', views.FeatureView.as_view(), name='index'),

    # API endpoints (JSON)
    path('feature/api/', views.FeatureAPIView.as_view(), name='api'),
    path('feature/api/<str:item_id>/', views.FeatureDetailAPIView.as_view(), name='api_detail'),
]
```

### Standard URL Structure

```
/a/{team_slug}/feature/              # Page view
/a/{team_slug}/feature/api/          # List/Create API
/a/{team_slug}/feature/api/{id}/     # Detail/Update/Delete API
/a/{team_slug}/feature/ajax/         # AJAX endpoints (return HTML)
```

### API Response Format

```python
# views.py
from django.http import JsonResponse

class FeatureAPIView(View):
    def post(self, request):
        try:
            data = json.loads(request.body)
            # Process data...
            item = Item.objects.create(**data)

            return JsonResponse({
                'success': True,
                'data': {
                    'id': str(item.id),
                    'name': item.name,
                },
            })

        except ValidationError as e:
            return JsonResponse({
                'success': False,
                'error': str(e),
            }, status=400)

        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': 'An unexpected error occurred',
            }, status=500)
```

### TypeScript Response Handling

```typescript
import { z } from 'zod'

// Match the Django response format
const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    name: z.string(),
  }),
})

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
})

const ResponseSchema = z.discriminatedUnion('success', [
  SuccessSchema,
  ErrorSchema,
])

async function createItem(name: string) {
  const response = await fetch('/a/team/feature/api/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCSRFToken(),
    },
    body: JSON.stringify({ name }),
  })

  const json = await response.json()
  const result = ResponseSchema.safeParse(json)

  if (!result.success) {
    throw new Error('Invalid server response')
  }

  if (!result.data.success) {
    throw new Error(result.data.error)
  }

  return result.data.data
}
```

## Webpack Configuration

### Adding a New Entry Point

Edit `webpack.config.js`:

```javascript
module.exports = {
  entry: {
    // Existing entries
    'site-base': './src/apps/web/assets/site-base.js',
    'workspace-chat': './src/apps/chat/assets/javascript/workspace/index.tsx',

    // Add your new entry
    'feature-name': './src/apps/appname/assets/javascript/feature/index.tsx',
  },

  output: {
    path: path.resolve(__dirname, 'static'),
    filename: 'js/[name]-bundle.js',
    library: ["SiteJS", "[name]"],
  },

  // ... rest of config
}
```

### Build Commands

```bash
# Development with watch
npm run dev-watch

# Production build
npm run build

# Type checking
npm run type-check
```

### Output Location

Bundles are output to:
```
static/js/{entry-name}-bundle.js
```

Reference in templates as:
```html
<script src="{% static 'js/feature-name-bundle.js' %}"></script>
```

## Path Aliases

Available in both webpack and TypeScript:

| Alias | Path |
|-------|------|
| `@/components` | `src/apps/utils/assets/javascript/shadcn/components` |
| `@/utilities` | `src/apps/utils/assets/javascript/utilities` |
| `@chat` | `src/apps/chat/assets/javascript` |
| `@web` | `src/apps/web/assets/javascript` |
| `@utils` | `src/apps/utils/assets/javascript` |
| `@` | `src/apps` |

### Usage

```typescript
// Import shadcn components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Import utilities
import { cn } from "@/utilities/shadcn"

// Import from other apps
import { someUtil } from "@utils/shared"
```

## Complete Integration Example

### 1. Create the files

```
src/apps/tickets/assets/javascript/quick-create/
├── index.tsx
├── QuickCreate.tsx
├── types.ts
├── schemas.ts
└── hooks/
    └── useQuickCreate.ts
```

### 2. Add webpack entry

```javascript
// webpack.config.js
entry: {
  'ticket-quick-create': './src/apps/tickets/assets/javascript/quick-create/index.tsx',
}
```

### 3. Create Django view

```python
# apps/tickets/views.py
class QuickCreateView(TeamAccessMixin, TemplateView):
    template_name = 'tickets/quick-create.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['config_json'] = json.dumps({
            'teamSlug': self.request.team.slug,
            'categories': list(Category.objects.values('id', 'name')),
        })
        return context
```

### 4. Add URL

```python
# apps/tickets/urls.py
path('quick-create/', views.QuickCreateView.as_view(), name='quick_create'),
```

### 5. Create template

```html
{% extends "web/app/app_base.html" %}
{% load static %}

{% block app_content %}
<script type="application/json" id="quick-create-config">
{{ config_json|safe }}
</script>
<div id="quick-create"></div>
<script src="{% static 'js/ticket-quick-create-bundle.js' %}"></script>
{% endblock %}
```

### 6. Build and test

```bash
npm run dev-watch
# Visit /a/{team}/tickets/quick-create/
```
