# SEO & Deploy

## SEO Checklist

Every site should have:

1. **robots.txt** — allow AI crawlers (GPTBot, ClaudeBot, PerplexityBot)
2. **llms.txt** — structured markdown for LLM consumption
3. **sitemap.xml** — via `@astrojs/sitemap`
4. **JSON-LD** — Organization, FAQPage, WebApplication as appropriate
5. **Semantic HTML** — `<article>`, `<section>`, `<main>`, `<nav>`, `<time>`
6. **Meta tags** — title, description, canonical, Open Graph on every page

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

> One-line description.

## About

Brief description.

## Features

- Feature 1

## Related

- [Link](https://example.com)
```

## Astro Config (this repo)

No Cloudflare adapter — static build only:

```javascript
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://example.com',
    integrations: [sitemap()],
    vite: { plugins: [tailwindcss()] },
});
```

## Wrangler Config (assets deploy)

Use `wrangler.jsonc` (not `.toml`):

```jsonc
{
    "name": "my-site",
    "compatibility_date": "2026-02-21",
    "routes": [{ "pattern": "example.com", "custom_domain": true }],
    "assets": {
        "binding": "ASSETS",
        "directory": "./dist",
    },
    "observability": {
        "enabled": true,
        "tracing": { "enabled": true },
    },
}
```

See [`wrangler.jsonc`](../../wrangler.jsonc) in this repo.

### Deploy

```bash
pnpm build
npx wrangler deploy
```

No `.assetsignore` needed for assets-only deploy (unlike Workers adapter pattern).

## Monorepo Variant with CF Adapter

If using `@astrojs/cloudflare` adapter in a monorepo:

```javascript
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
    output: 'static',
    adapter: cloudflare(),
    // ...
});
```

Then `echo "_worker.js" > dist/.assetsignore` before deploy.
