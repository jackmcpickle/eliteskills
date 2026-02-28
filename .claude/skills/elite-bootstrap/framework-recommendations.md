# Framework Recommendations Reference

Quick-reference data for making tech stack recommendations. Use concrete numbers and real trade-offs — not hype.

## Web Frameworks

### Next.js (React)

- **GitHub stars:** ~130k | **npm weekly:** ~6M
- **Best for:** Full-stack web apps, SaaS products, e-commerce
- **Strengths:** SSR + SSG + API routes in one framework. Massive ecosystem. Vercel deployment is seamless. React Server Components for performance. Huge job market.
- **Weaknesses:** Complex mental model (server vs client components). Vercel lock-in pressure. Bundle size can creep. App Router has a learning curve. Opinionated about deployment.
- **Deploy:** Vercel (native), Cloudflare, AWS, Docker
- **Good pairing:** Prisma/Drizzle, Tailwind, shadcn/ui, Clerk/Auth.js, Vercel Postgres/Neon

### Astro

- **GitHub stars:** ~50k | **npm weekly:** ~400k
- **Best for:** Content-heavy sites, marketing sites, blogs, documentation
- **Strengths:** Ships zero JS by default. Island architecture — use React/Vue/Svelte where needed. Outstanding performance. Simple mental model. Content collections for structured content.
- **Weaknesses:** Not ideal for highly interactive SPAs. Smaller ecosystem than Next.js. Server-side interactivity requires adapters. Less job market demand.
- **Deploy:** Cloudflare, Vercel, Netlify, any static host
- **Good pairing:** Tailwind, any UI framework for islands, Cloudflare D1/Turso, MDX

### SvelteKit

- **GitHub stars:** ~20k (kit) + ~82k (svelte) | **npm weekly:** ~500k
- **Best for:** Web apps where performance and DX are top priority
- **Strengths:** Compiled — tiny runtime. Intuitive reactivity (no useState/useEffect). Less boilerplate than React. SSR + SPA + SSG. Form actions are elegant.
- **Weaknesses:** Smaller ecosystem and job market. Fewer UI component libraries. Svelte 5 runes are a paradigm shift. Fewer tutorials and Stack Overflow answers.
- **Deploy:** Vercel, Cloudflare, Netlify, Node
- **Good pairing:** Tailwind, Skeleton UI/shadcn-svelte, Drizzle, Lucia auth

### Remix / React Router v7

- **GitHub stars:** ~30k | **npm weekly:** ~500k
- **Best for:** Web apps with complex data flows, forms-heavy apps
- **Strengths:** Web standards-first (forms, headers, caching). Nested routing with parallel data loading. Progressive enhancement. Good error boundaries.
- **Weaknesses:** Merging with React Router created confusion. Smaller mindshare than Next.js. Fewer deployment-specific optimizations.
- **Deploy:** Any Node/edge host, Cloudflare, Vercel, Fly.io

### Nuxt (Vue)

- **GitHub stars:** ~56k | **npm weekly:** ~800k
- **Best for:** Teams that prefer Vue's template syntax, enterprise apps
- **Strengths:** Auto-imports. Excellent DX. Server routes built in. Nitro engine for universal deployment. Vue's ecosystem is mature.
- **Weaknesses:** Vue has less job market demand than React in US/UK. TypeScript support is good but was late. Composition API vs Options API split in community.
- **Deploy:** Vercel, Cloudflare, Netlify, any Node host

### Ruby on Rails

- **GitHub stars:** ~57k | **Gems downloads:** billions cumulative
- **Best for:** Rapid MVPs, CRUD-heavy apps, solo developers, startups
- **Strengths:** Convention over configuration. Incredibly productive for one developer. Mature, battle-tested. Hotwire/Turbo for modern UX without SPA complexity. Great ORM (Active Record). Generators for scaffolding.
- **Weaknesses:** Ruby performance is modest. Scaling requires care. Less trendy (but having a renaissance). Frontend story is opinionated (Hotwire vs React).
- **Deploy:** Render, Fly.io, Heroku, AWS, Docker

### Django

- **GitHub stars:** ~83k | **PyPI downloads:** ~15M/month
- **Best for:** Data-heavy apps, admin panels, APIs, ML-adjacent products
- **Strengths:** Batteries included (ORM, admin, auth, forms). Python ecosystem for data/ML. Extremely mature and secure. Django REST Framework for APIs. Excellent documentation.
- **Weaknesses:** Monolithic by default. Async support is improving but not native. Template engine is dated for complex UIs. Can feel heavy for simple APIs.
- **Deploy:** Any Python host, Docker, AWS, Railway, Render

### Laravel (PHP)

- **GitHub stars:** ~80k | **Packagist downloads:** billions
- **Best for:** Web apps, SaaS, teams familiar with PHP
- **Strengths:** Best-in-class developer experience for PHP. Eloquent ORM is elegant. Ecosystem (Forge, Vapor, Nova, Livewire, Inertia). Queues, events, scheduling built in.
- **Weaknesses:** PHP reputation (often unfair). Hosting is cheap but less trendy. Laravel-specific skills don't transfer to other ecosystems.
- **Deploy:** Laravel Forge, Vapor (serverless), any PHP host

---

## Mobile Frameworks

### React Native

- **GitHub stars:** ~120k | **npm weekly:** ~2.5M
- **Best for:** Teams with React/web experience, cross-platform apps
- **Strengths:** Share code with React web. Expo simplifies everything (builds, OTA updates, routing). Large ecosystem. Hot reloading. Big job market.
- **Weaknesses:** Performance gap vs native (narrowing). Complex native modules require Obj-C/Kotlin knowledge. Large app size. Debugging can be painful.
- **Good pairing:** Expo Router, NativeWind (Tailwind), Zustand/Jotai, React Query, Clerk/Supabase Auth

### Flutter

- **GitHub stars:** ~170k | **pub.dev packages:** 50k+
- **Best for:** Pixel-perfect custom UI across platforms, startups wanting one codebase
- **Strengths:** True cross-platform (iOS, Android, web, desktop). Custom rendering engine — identical UI everywhere. Hot reload. Dart is easy to learn. Material and Cupertino widgets built in.
- **Weaknesses:** Dart has small ecosystem outside Flutter. Web/desktop support is less mature. Large app size. Doesn't use native UI components (custom everything).
- **Good pairing:** Riverpod, GoRouter, Firebase, Supabase, Drift (SQLite)

### Swift / SwiftUI (iOS Native)

- **Best for:** iOS-only apps, apps needing deep OS integration
- **Strengths:** Best performance. Full access to iOS APIs. SwiftUI is declarative and modern. Xcode integration. App Clips, widgets, watchOS, visionOS.
- **Weaknesses:** iOS only. SwiftUI still has gaps (use UIKit for complex cases). Apple's annual breaking changes.
- **Good pairing:** Core Data/SwiftData, Combine/async-await, CloudKit, Firebase

### Kotlin / Jetpack Compose (Android Native)

- **Best for:** Android-only apps, apps needing deep Android integration
- **Strengths:** First-class Android support. Jetpack Compose is modern declarative UI. Full access to Android APIs. Coroutines for async. KMP for shared logic.
- **Weaknesses:** Android only (unless using KMP). Fragmentation across Android versions. Compose is relatively new.
- **Good pairing:** Room, Ktor, Hilt/Koin, Firebase, Retrofit

---

## Desktop Frameworks

### Tauri

- **GitHub stars:** ~90k | **Crate downloads:** Growing fast
- **Best for:** Lightweight desktop apps, web devs building desktop
- **Strengths:** Tiny binary size (uses OS webview). Rust backend is fast and secure. Use any web frontend. Cross-platform. Much smaller than Electron.
- **Weaknesses:** Webview inconsistencies across OS. Rust learning curve for plugins. Younger ecosystem. Mobile support is beta.
- **Deploy:** Direct download, Homebrew, app stores

### Electron

- **GitHub stars:** ~115k | **npm weekly:** ~3M
- **Best for:** Complex desktop apps, apps that need Chromium features
- **Strengths:** Mature and battle-tested (VS Code, Slack, Discord). Full Node.js access. Chromium guarantees consistency. Huge ecosystem.
- **Weaknesses:** Large binary (~100MB+). High memory usage. Security requires care (IPC). Users have "Electron fatigue."
- **Deploy:** electron-builder, Squirrel, auto-update

---

## Databases

### PostgreSQL + Neon/Supabase

- **Best for:** Most applications. The safe default.
- **Strengths:** Full SQL, JSON support, extensions, proven at scale. Neon has branching and serverless. Supabase adds auth, storage, realtime.

### SQLite + Turso/Cloudflare D1

- **Best for:** Edge-first apps, embedded apps, smaller projects
- **Strengths:** Zero latency (local), edge replication with Turso, no server to manage. D1 integrates natively with Cloudflare Workers.

### MongoDB Atlas

- **Best for:** Flexible schemas, document-oriented data, rapid prototyping
- **Strengths:** Schema flexibility, horizontal scaling, Atlas is managed. Good for data that doesn't fit neatly into tables.

### PlanetScale (MySQL)

- **Best for:** MySQL shops, apps needing non-blocking schema migrations
- **Strengths:** Branching workflow for schema changes, horizontal scaling, Vitess under the hood.

---

## Authentication

### Clerk

- **Best for:** Fastest time-to-auth, pre-built UI components
- **Pricing:** Free up to 10k MAU
- **Strengths:** Drop-in components, user management dashboard, webhook events, multi-tenant support.

### Auth.js (NextAuth)

- **Best for:** Next.js apps wanting self-hosted auth
- **Pricing:** Free (self-hosted)
- **Strengths:** Many providers, database adapters, full control. No vendor lock-in.

### Supabase Auth

- **Best for:** Projects already using Supabase for database
- **Pricing:** Free up to 50k MAU
- **Strengths:** Integrated with Supabase ecosystem, row-level security, social + email + phone auth.

### Firebase Auth

- **Best for:** Mobile apps, rapid prototyping
- **Pricing:** Free (generous limits)
- **Strengths:** Battle-tested at Google scale, anonymous auth, phone auth, multi-platform SDKs.

### Lucia

- **Best for:** Developers who want full control and minimal abstraction
- **Pricing:** Free (library)
- **Strengths:** Lightweight, database-agnostic, no magic. You own every line of auth code.

---

## CI/CD

### GitHub Actions

- **Best for:** Projects hosted on GitHub (most projects)
- **Pricing:** 2,000 free minutes/month
- **Strengths:** Native GitHub integration, marketplace of actions, matrix builds, caching.

### GitLab CI

- **Best for:** GitLab-hosted projects, self-hosted needs
- **Strengths:** Built into GitLab, powerful pipelines, container registry included.

---

## Hosting

### Vercel

- **Best for:** Next.js, frontend-heavy apps
- **Pricing:** Generous free tier, pay-per-use after
- **Strengths:** Zero-config for Next.js, preview deployments, edge functions, analytics.

### Cloudflare Pages/Workers

- **Best for:** Edge-first apps, cost-sensitive projects
- **Pricing:** Very generous free tier
- **Strengths:** Global edge network, D1 database, R2 storage, KV store. Extremely fast cold starts.

### Fly.io

- **Best for:** Docker-based apps, full-stack apps needing a real server
- **Pricing:** Free tier with limits
- **Strengths:** Deploy Docker anywhere, global distribution, built-in Postgres, simple scaling.

### Railway

- **Best for:** Backend services, databases, simple deployments
- **Pricing:** Usage-based, generous trial
- **Strengths:** Git push to deploy, managed databases, simple environment management.

---

## Monitoring

### Sentry

- **Best for:** Error tracking across all platforms
- **Pricing:** Free up to 5k errors/month
- **Strengths:** Source maps, breadcrumbs, release tracking, performance monitoring. Industry standard.

### PostHog

- **Best for:** Product analytics + feature flags + session replay
- **Pricing:** Generous free tier
- **Strengths:** Self-hostable, all-in-one product analytics, open source.

### LogRocket

- **Best for:** Frontend debugging with session replay
- **Strengths:** Session replay, error tracking, performance monitoring. See exactly what users experienced.
