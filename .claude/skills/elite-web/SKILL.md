---
name: elite-web
description: Astro module sites on Cloudflare. Use when adding pages, components, layouts, or working on the Astro frontend. Not for TanStack React or distinctive redesigns.
version: 1.0.0
---

# Elite Web Skill

Build production Astro sites with feature **module**s, Tailwind CSS 4, and assets deploy to Cloudflare.

For distinctive visual design, user invokes elite-style. For React islands in a TanStack monorepo, use elite-react.

## Stack

Astro 5, Tailwind v4 (`@tailwindcss/vite`), strict TypeScript, oxfmt, `astro check`, `@astrojs/sitemap`.

## Workflow

1. **Locate** — find or create **module** under `src/modules/{feature}/`
2. **Implement** — page + components following conventions
3. **Verify** — run completion checklist

## Reference Files

| Topic                                  | Read                                         |
| -------------------------------------- | -------------------------------------------- |
| Project layout, scripts, type checking | [project-structure.md](project-structure.md) |
| Pages, components, Tailwind, a11y      | [components.md](components.md)               |
| SEO, wrangler, deploy                  | [seo-deploy.md](seo-deploy.md)               |
| Done-when checklist                    | [completion.md](completion.md)               |

## Module Checklist

```
src/modules/{feature}/
├── index.ts              # Public exports
└── components/
    └── {Name}.astro
```

Pages in `src/pages/` compose **module** components via `@/` imports.

**Done when:** [completion.md](completion.md) checklist passes.
