---
title: Web
description: Astro module sites on Cloudflare. Pages, layouts, Tailwind v4, SEO, and assets deploy — production patterns from this stack.
icon: Globe
order: 10
released: true
isNew: true
highlights:
    - Feature modules under src/modules/{feature}/
    - BaseLayout with SEO, Open Graph, and JSON-LD
    - Tailwind CSS 4 with @theme tokens and mobile-first patterns
    - Content collections and static page composition
    - Cloudflare assets deploy via wrangler.jsonc
structure:
    - SKILL.md
    - project-structure.md
    - components.md
    - seo-deploy.md
    - completion.md
examples:
    - label: New page
      command: 'Add a /about page with BaseLayout, hero section, and team grid using our module conventions'
    - label: Feature module
      command: 'Create a testimonials module with a carousel component and barrel export'
    - label: SEO setup
      command: 'Add robots.txt, llms.txt, and sitemap config for this Astro site'
bestPractices:
    - Compose pages from module components — keep src/pages/ thin
    - Run astro check (not tsc) before considering work done
    - Use @/ path aliases consistently across layouts and modules
    - For distinctive visual redesigns, invoke elite-style instead
---
