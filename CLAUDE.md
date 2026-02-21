# CLAUDE.md

In all interaction and commit messages be extremely concise and sacrifice grammar for the sake of concision.

## Commands

```bash
# Development
pnpm dev                  # Start dev server on port 3000
pnpm build               # Production build (vite + tsc)
pnpm preview             # Preview production build

# Testing & Quality
pnpm test                # Run style check + lint
pnpm lint                # oxlint with type checking
pnpm lint                # TypeScript type checking - DO NOT npx tsc --notEmit
pnpm style               # Prettier check
pnpm style-fix           # Prettier fix

```

## Architecture

This an Astro website for Selling of AI Skills. Using Astro + React 19 + TypeScript.

### Key Stack

- **Routing**: TanStack Router (file-based, auto-generates `routeTree.gen.ts`)
- **Data fetching**: TanStack Query
- **Forms**: TanStack Form
- **Tables**: TanStack Table
- **Styling**: Tailwind CSS 4
- **Components**: Shadcn/ui pattern via `@superit/ui-core` workspace package

## React Style Rules

- Each component should be in its own file named with the same name as the component in PascalCase
- Use named exports over default exports
- for types use `satisfies` over `as` or :Type annotations on object literals
- Never `import * as React` or `import React from 'react'`
- Always `import { useState, useEffect } from 'react'`
- Use `import type` for types when using verbatimModuleSyntax
- Use @/ prefix for internal imports
- Remove all unused imports
- Use `pnpm lint` to check for all errors
- Write function declarations with explicit return types
- Never use React.\* APIs - import hooks/types directly
- Always add ReactElement return type on React Components
- Always add explicit parameter types (no implicit any)
- Prefix unused parameters with underscore
- For useMutation custom hooks postfix the `mutation` name
- Methods passed to method props should be prefixed with handle[method name] and the method props themselves should be prefixed with on[method name] Eg <form onSubmit={handleSubmit} />

## Tailwind Css

- use size-x when added both h-x and w-x that are the same

### Project Structure

```
- src/
    └─ [components/] - Components specific to this app
    └─ [modules/] - Modules specific to this app - pages should be composed of modules
        └─ [module-name/]
        └─ [index.ts] - Barrel exports for public API (REQUIRED)
        └─ [components/] - Components specific to this module
        └─ [hooks/] - Custom hooks specific to this module
        └─ [schemas/] - Zod validation schemas
        └─ [providers/] - React context providers
        └─ [utils/] - Utility functions specific to this module
        └─ constants.ts - Constants specific to this module
        └─ types.ts - Types specific to this module
    └─ [libs/] - Custom hooks specific to this app
        └─ [api/] - API calls specific to this app
    └─ [utils/] - Utility functions specific to this app
    └─ [pages/] - Page components for routing
    └─ [tests/] - Unit and integration tests for this app
    └─ constants.ts - Constants specific to this module
    └─ types.ts - Types specific to this module
```

### API calls.

All apis calls to the backend should be via the @superit/ui-superit-api workspace package. DO NOT use fetch(VITE_BACKEND_API_ENDPOINT) directly. Use the provided API client.

### Imports

- Use `@/` alias for local imports


### Environment Variables

Use Astro env defintions in `astro.config.ts`. Access via:

```tsx
import { TURNSTILE_SITE_KEY } from 'astro:env/client';
```


## Deployment

- Builds are deployed to Cloudflare Workers via `pnpm deploy`
- Configuration in `wrangler.jsonc` (Workers config, KV bindings)
- Server-side functions handle API routes and dynamic content
- Static assets served via Cloudflare Workers Assets binding
- Requires SESSION KV namespace for admin authentication sessions
