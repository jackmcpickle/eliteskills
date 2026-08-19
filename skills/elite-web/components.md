# Components & Pages

## Page Pattern

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { SomeSection } from '@/modules/home';
---

<BaseLayout title="Page Title — SiteName" description="Meta description here.">
  <main>
    <SomeSection />
  </main>
</BaseLayout>
```

**Rules:**

- Every page wraps in `<BaseLayout>` with `title` and `description`
- Static pages use default prerender (static mode)
- SSR pages use `export const prerender = false`

## Base Layout Requirements

Must include:

- `<meta charset="utf-8">`, viewport, description
- `<link rel="canonical" ...>`
- Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image`)
- `<link rel="icon" ...>`
- `<ClientRouter />` for page transitions (not deprecated `ViewTransitions`)
- JSON-LD structured data (`<script is:inline type="application/ld+json">`)
- `<html lang="en">`

See existing [`BaseLayout.astro`](../../src/layouts/BaseLayout.astro) in this repo for the canonical pattern.

## Component Pattern

```astro
---
interface Props {
  title: string;
  highlight?: boolean;
}
const { title, highlight = false } = Astro.props;
---

<section class="px-4 py-28 sm:px-6">
  <div class="mx-auto max-w-5xl">
    <h2 class="font-display text-4xl tracking-tight md:text-5xl">
      {title}
    </h2>
  </div>
</section>
```

**Rules:**

- Props interface at top of frontmatter
- Destructure with defaults
- No unused variables (astro check catches these)
- Section padding: `px-4 py-28 sm:px-6`
- Content max-width: `max-w-5xl` for sections, `max-w-3xl` for text-heavy

## Client-Side Scripts

```astro
<script>
  const el = document.getElementById('my-element')!;
  el.addEventListener('click', () => { /* ... */ });
</script>
```

For JSON-LD and other `type="..."` scripts, add `is:inline`:

```astro
<script is:inline type="application/ld+json" set:html={jsonString} />
```

## Content Collections

Define in `src/content.config.ts`. Use `getCollection()` in pages. Content lives in `src/content/{collection}/`.

## Tailwind CSS 4

### global.css

```css
@import 'tailwindcss';

@theme {
    --color-ink: oklch(0.15 0.02 250);
    --color-surface: oklch(0.97 0.005 80);
}
```

Use `oklch()` for custom colours. Define in `@theme` block.

### Mobile-First Patterns

- Padding: `px-4 sm:px-6`
- Shadow room: `pr-[6px] pb-[6px] sm:pr-0 sm:pb-0` to prevent clipping
- Text sizes: `text-3xl md:text-5xl`
- Grid: `grid md:grid-cols-2 lg:grid-cols-3`

### Text Orphans

Use `&nbsp;` to prevent orphaned words at line ends.

### Animations

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
    .animate-fade-up {
        animation: none;
    }
}
```

## Accessibility

- Semantic HTML: `<article>`, `<section>`, `<main>`, `<nav>`, `<time>`
- Focus styles on interactive elements
- `<details>/<summary>` for expandable content with keyboard support
- Alt text on images; aria-labels where visible text is insufficient
- Tab order follows visual order
