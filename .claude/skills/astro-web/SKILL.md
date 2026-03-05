---
name: astro-web
description: Build and maintain Astro websites on Cloudflare. Use when creating pages, components, layouts, styles, or when asked to "add a page", "create a component", "update the site", "fix styles", or work on the web/frontend codebase. Covers project structure, component patterns, Tailwind CSS, accessibility, and deployment.
version: 1.0.0
---

# Astro Web Skill

Build production Astro sites on Cloudflare Workers with Tailwind CSS 4, strict TypeScript, and oxfmt.

## Stack

- **Astro 5** — static-first with per-route SSR opt-out
- **Cloudflare Workers** — hosting via `@astrojs/cloudflare` adapter
- **Tailwind CSS 4** — via `@tailwindcss/vite` plugin
- **TypeScript** — strict mode
- **oxfmt** — formatting
- **`astro check`** — type checking (replaces tsc for .astro files)
- **`@astrojs/sitemap`** — auto-generated sitemap
- **`@astrojs/check`** — dev dependency for type checking

## Project Structure

```
apps/web/
├── public/
│   ├── favicon.svg
│   ├── robots.txt
│   ├── llms.txt           # LLM-readable site documentation
│   └── .assetsignore       # Contains "_worker.js" for CF deploy
├── src/
│   ├── components/         # .astro components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── {Name}.astro
│   ├── layouts/
│   │   └── Base.astro      # HTML shell, meta, fonts, JSON-LD
│   ├── lib/
│   │   └── cn.ts           # clsx + tailwind-merge utility
│   ├── pages/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   └── {name}.astro
│   └── styles/
│       └── global.css      # Tailwind imports + custom properties
├── astro.config.mjs
├── wrangler.jsonc           # Cloudflare config (jsonc, not toml)
├── tsconfig.json
└── package.json
```

## Conventions

### Pages

```astro
---
import Base from '../layouts/Base.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---

<Base title="Page Title — SiteName" description="Meta description here.">
  <Header />
  <main>
    <!-- page content -->
  </main>
  <Footer />
</Base>
```

**Rules:**
- Every page wraps in `<Base>` layout with `title` and `description`
- `<Header />` and `<Footer />` on every page
- Static pages use `export const prerender = true` (default in static mode)
- SSR pages use `export const prerender = false`

### Base Layout

Must include:
- `<meta charset="utf-8">`
- `<meta name="viewport" ...>`
- `<meta name="description" ...>`
- `<link rel="canonical" ...>`
- Open Graph tags (`og:title`, `og:description`, `og:url`)
- `<link rel="icon" ...>`
- `<ClientRouter />` for page transitions (not deprecated `ViewTransitions`)
- JSON-LD structured data (`<script is:inline type="application/ld+json">`)
- `<html lang="en">`

```astro
---
import { ClientRouter } from 'astro:transitions';
interface Props {
  title: string;
  description?: string;
}
const { title, description = 'Default description' } = Astro.props;
const canonicalUrl = new URL(Astro.url.pathname, Astro.site);
---

<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonicalUrl} />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <title>{title}</title>

  <script is:inline type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "SiteName",
    "url": "https://example.com"
  })} />

  <ClientRouter />

  <style>
    @import '../styles/global.css';
  </style>
</head>
<body>
  <slot />
</body>
</html>
```

### Components

```astro
---
// Props interface
interface Props {
  title: string;
  highlight?: boolean;
}
const { title, highlight = false } = Astro.props;

// Data
const items = [
  { name: 'First', desc: 'Description' },
];
---

<section class="px-4 py-28 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <h2 class="font-display text-4xl tracking-tight md:text-5xl">
      {title}
    </h2>
    {items.map((item) => (
      <div>{item.name}</div>
    ))}
  </div>
</section>
```

**Rules:**
- Props interface at top of frontmatter
- Destructure with defaults
- No unused variables (astro check catches these)
- Section padding: `px-4 py-28 sm:px-6` (mobile-first, room for shadows)
- Content max-width: `max-w-5xl` for sections, `max-w-3xl` for text-heavy

### Client-Side Scripts

```astro
<script>
  // Runs in browser — no access to Astro.props
  const el = document.getElementById('my-element')!;
  el.addEventListener('click', () => { /* ... */ });
</script>
```

For JSON-LD and other `type="..."` scripts, add `is:inline`:

```astro
<script is:inline type="application/ld+json" set:html={jsonString} />
```

### Class Utility (cn)

Use `cn()` from `src/lib/cn.ts` for conditional classes:

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

Usage in components:

```astro
<div class={cn('base-class', highlight && 'text-accent')}>
```

## Tailwind CSS 4

### global.css

```css
@import 'tailwindcss';

@theme {
  --color-ink: oklch(0.15 0.02 250);
  --color-ink-muted: oklch(0.45 0.02 250);
  --color-surface: oklch(0.97 0.005 80);
  --color-scan: oklch(0.55 0.25 280);
  /* ... */
}
```

Use `oklch()` for all custom colours. Define in `@theme` block.

### Mobile-First Patterns

- **Padding**: `px-4 sm:px-6` — tighter on mobile
- **Shadow room**: Elements with box-shadows need `pr-[6px] pb-[6px] sm:pr-0 sm:pb-0` to prevent clipping on mobile
- **Text sizes**: `text-3xl md:text-5xl` — scale up on desktop
- **Grid**: `grid md:grid-cols-2 lg:grid-cols-3`

### Text Orphans

Use `&nbsp;` (or `\u00a0` in JS) to prevent orphaned words at line ends:

```astro
<p>Pay per model when you want the real AI knowledge&nbsp;check.</p>
```

### Animations

Define in component `<style>` blocks:

```astro
<style>
  @keyframes fade-up {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  .animate-fade-up {
    animation: fade-up 0.5s ease-out both;
  }
</style>
```

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up { animation: none; }
}
```

## SEO & AI Readiness

Every site should have:

1. **robots.txt** — allow AI crawlers (GPTBot, ClaudeBot, PerplexityBot)
2. **llms.txt** — structured markdown for LLM consumption
3. **sitemap.xml** — via `@astrojs/sitemap`
4. **JSON-LD** — Organization, FAQPage, WebApplication as appropriate
5. **Semantic HTML** — `<article>`, `<section>`, `<main>`, `<nav>`, `<time>`
6. **`<time>` elements** — for content freshness signals
7. **FAQ section** — `<details>/<summary>` with matching FAQPage schema
8. **Meta tags** — title, description, canonical, Open Graph

### robots.txt

```
User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: https://example.com/sitemap-index.xml
```

### llms.txt

```markdown
# SiteName

> One-line description of the site.

## About
Brief description.

## Features
- Feature 1
- Feature 2

## Related
- [Link](https://example.com)
```

## Wrangler Config

Use `wrangler.jsonc` (not `.toml`) for Astro sites:

```jsonc
{
  "name": "my-web",
  "account_id": "...",
  "compatibility_date": "2025-03-01",
  "main": "dist/_worker.js/index.js",

  "observability": {
    "enabled": true,
    "head_sampling_rate": 1,
    "traces": {
      "enabled": true,
      "head_sampling_rate": 1
    }
  },

  "vars": {
    "PUBLIC_API_URL": "https://api.example.com"
  },

  "assets": {
    "directory": "dist"
  }
}
```

### Deploy

```bash
pnpm build
echo "_worker.js" > dist/.assetsignore  # Required for CF Workers static
npx wrangler deploy
```

The `.assetsignore` containing `_worker.js` is **required** — without it, Wrangler errors on the worker entry file.

## Astro Config

```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://example.com',
  output: 'static',
  adapter: cloudflare(),
  integrations: [sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

## Type Checking

Run `astro check` (not `tsc`) for `.astro` files. Common issues:

- Unused variables → remove them
- `ViewTransitions` deprecated → use `ClientRouter`
- Scripts with `type=` attribute → add `is:inline`
- `define:vars` scripts → add `is:inline`

## Package Scripts

```json
{
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "check": "astro check",
  "fmt:check": "pnpm oxfmt --check",
  "fmt": "pnpm oxfmt"
}
```

## Formatting

Use **oxfmt** (not prettier). Single quotes, 4-space indent.

```json
{
  "fmt:check": "pnpm oxfmt --check",
  "fmt": "pnpm oxfmt"
}
```
