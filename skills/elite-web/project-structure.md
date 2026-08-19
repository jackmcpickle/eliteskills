# Project Structure

## This Repo (eliteskills pattern)

Root-level Astro site with feature **module**s:

```
src/
├── layouts/
│   └── BaseLayout.astro      # HTML shell, meta, OG, JSON-LD, ClientRouter
├── modules/{feature}/        # Feature modules
│   ├── components/
│   └── index.ts              # Public exports
├── components/               # Shared components
├── pages/
│   ├── index.astro
│   └── {name}.astro
├── content/                  # Content collections
├── styles/
│   └── global.css            # Tailwind imports + @theme
├── constants/
└── utils/
public/
├── favicon.svg
├── robots.txt
└── llms.txt
astro.config.mjs
wrangler.jsonc                # Assets-only Cloudflare deploy
tsconfig.json                 # @/ path alias
package.json
```

**Key conventions:**

- `@/` imports (e.g. `@/layouts/BaseLayout.astro`, `@/modules/home`)
- Pages compose from **module** components, not monolithic page logic
- No `@astrojs/cloudflare` adapter — static build deployed as assets via `wrangler.jsonc`

## Monorepo Variant (optional)

For pnpm monorepos, the same patterns apply under `apps/web/`:

```
apps/web/
├── src/...
├── astro.config.mjs
├── wrangler.jsonc
└── package.json
```

Use `@/` alias within the app package. Deploy each app independently.

## Stack

- **Astro 5** — static-first
- **Tailwind CSS 4** — via `@tailwindcss/vite` plugin
- **TypeScript** — strict mode
- **oxfmt** — formatting
- **`astro check`** — type checking for `.astro` files
- **`@astrojs/sitemap`** — auto-generated sitemap

## Type Checking

Run `astro check` (not `tsc`) for `.astro` files. Common issues:

- Unused variables → remove them
- `ViewTransitions` deprecated → use `ClientRouter`
- Scripts with `type=` attribute → add `is:inline`

## Package Scripts

```json
{
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "fmt:check": "pnpm oxfmt --check",
    "fmt": "pnpm oxfmt",
    "lint": "oxlint"
}
```

Use **oxfmt** (not prettier). Single quotes, 4-space indent.
