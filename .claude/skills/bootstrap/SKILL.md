---
name: bootstrap
description: "Bootstrap a new application from scratch. Guides users through audience, platform, features, and tech stack decisions, then generates a detailed staged implementation plan with CI/CD, testing, and deployment. Use when someone wants to start a new project, choose a tech stack, or scaffold an app."
version: 1.0.0
---

# App Bootstrap

You help users go from zero to a fully planned (and optionally scaffolded) application. You gather requirements through a structured conversation, recommend a tech stack with detailed reasoning, and produce a staged implementation plan.

The output is a comprehensive plan document saved to `BOOTSTRAP-PLAN.md` in the project root, plus an optional `CLAUDE.md` for ongoing Claude Code context.

## Workflow

### Phase 1: Discovery (Conversational)

Walk through each section below **one at a time**. Don't dump all questions at once. Summarize what you've captured after each section and confirm before moving on.

#### 1.1 Audience & Purpose

- Who is the target user? (consumers, businesses, developers, internal team)
- What problem does this solve for them?
- What's the scale expectation? (hobby project, startup MVP, enterprise)
- Is this greenfield or replacing something existing?

#### 1.2 Platform

Ask which platform(s) they're targeting:

| Platform | Follow-up questions |
|----------|-------------------|
| **Web app** | SPA vs SSR vs static? Real-time features needed? |
| **Website / marketing site** | CMS needed? Blog? Dynamic content? |
| **iOS app** | Native Swift or cross-platform? Minimum iOS version? |
| **Android app** | Native Kotlin or cross-platform? Minimum API level? |
| **Cross-platform mobile** | React Native or Flutter preference? Offline-first? |
| **Desktop app** | Which OS(es)? Electron, Tauri, or native? |
| **CLI tool** | Language preference? Distribution method (npm, brew, binary)? |
| **API / backend service** | Who consumes it? Expected load? |

If they mention multiple platforms, ask about priority order — which ships first?

#### 1.3 Key Features

- What are the 3-5 must-have features for V1?
- Which of these is the hardest or riskiest?
- Does it need authentication? What kind? (email/password, social login, SSO, magic link)
- Does it need payments/subscriptions?
- Does it need real-time features? (chat, notifications, live updates)
- What data does it store? (helps inform database choice)
- Does it need file uploads, media processing, or search?
- Any third-party integrations required?

#### 1.4 Point of Difference

- What existing solutions do users have today? (competitors or workarounds)
- What makes this better/different?
- What's the one thing users will remember about this product?

#### 1.5 Team & Constraints

- Solo developer or team? How many people?
- Experience level with the relevant platforms? (beginner, intermediate, expert)
- Budget for infrastructure? (free tier, modest, enterprise)
- Timeline pressure? (hackathon, MVP in weeks, long-term product)
- Any hard tech constraints? (must use X language, must run on Y, compliance requirements)
- Open source or proprietary?

---

### Phase 2: Recommendations

Based on discovery answers, recommend a complete tech stack. Present **2-3 options** ranging from simplest to most scalable. For each option, cover every layer:

#### Stack Layers to Recommend

1. **Framework / runtime** — The core framework (Next.js, Astro, SvelteKit, Rails, Django, Swift, Kotlin, Flutter, etc.)
2. **Language** — TypeScript, Python, Swift, Kotlin, Dart, Rust, Go, etc.
3. **UI / component library** — shadcn/ui, Tailwind, Material UI, Tamagui, SwiftUI, Jetpack Compose, etc.
4. **Database** — PostgreSQL, SQLite, MySQL, MongoDB, Supabase, PlanetScale, Turso, etc.
5. **ORM / data layer** — Drizzle, Prisma, SQLAlchemy, Core Data, Room, etc.
6. **Authentication** — Clerk, Auth.js, Supabase Auth, Firebase Auth, Lucia, custom, etc.
7. **Hosting / deployment** — Vercel, Cloudflare, AWS, Fly.io, Railway, App Store, Play Store, etc.
8. **CI/CD** — GitHub Actions, GitLab CI, Bitbucket Pipelines, Xcode Cloud, Fastlane, etc.
9. **Testing** — Vitest, Playwright, Jest, pytest, XCTest, Detox, etc.
10. **Monitoring** — Sentry, LogRocket, Datadog, PostHog, Crashlytics, etc.
11. **API approach** — REST, GraphQL, tRPC, gRPC (if applicable)
12. **Payments** — Stripe, Lemon Squeezy, RevenueCat, in-app purchases (if applicable)

#### How to Present Each Recommendation

For each stack option, provide:

```
### Option [N]: [Name] — [one-line summary]

**Best for:** [who/when this option shines]

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | X | ... |
| Database | Y | ... |
| ... | ... | ... |

**Popularity & ecosystem:**
- [GitHub stars, npm downloads, community size, job market — concrete numbers]
- [Notable companies using it]

**Pros:**
- [specific advantage tied to their requirements]
- ...

**Cons:**
- [honest trade-off]
- ...

**Estimated complexity:** [Low / Medium / High]
```

After presenting options, give a clear recommendation with reasoning: *"For your situation, I'd recommend Option N because..."*

Wait for the user to choose before proceeding to Phase 3.

---

### Phase 3: Implementation Plan

Generate a detailed, staged plan. Each stage should be completable and deployable independently (progressive delivery). Save this to `BOOTSTRAP-PLAN.md`.

#### Stage 0: Project Setup & DevEx

- Repository initialization (git, .gitignore, README)
- Package manager setup (lock files, workspace config if monorepo)
- Linting & formatting (ESLint/oxlint/Biome, Prettier, language-specific linters)
- Editor config (.editorconfig, VS Code settings, recommended extensions)
- Pre-commit hooks (husky + lint-staged or equivalent)
- Generate a minimal `CLAUDE.md` with **only CLI commands** (dev, build, test, lint, format, migrate, deploy). No descriptions, no architecture, no conventions — just commands.
- Explain every tool choice

#### Stage 1: CI/CD & Deployment Pipeline

Set this up **before** writing application code so every subsequent stage deploys automatically.

- CI pipeline: lint, type-check, test on every PR
- CD pipeline: auto-deploy to staging on merge to main
- Environment management (dev, staging, production)
- Secret management approach
- Preview deployments (Vercel preview, Cloudflare preview, TestFlight, etc.)
- Explain the pipeline architecture and why early setup matters

#### Stage 2: Test Harness

- Unit test framework setup with a passing example test
- Integration test framework setup
- E2E test framework setup with a smoke test (app loads, critical path works)
- Test coverage configuration and thresholds
- CI integration (tests block merge if failing)
- Explain testing strategy and what to test at each level

#### Stage 3: Application Foundation

- Project scaffolding (create-next-app, create-astro, flutter create, etc.)
- Core layout / navigation structure
- Design system / theme setup (colors, typography, spacing tokens)
- Database schema and migrations setup
- Authentication flow (if applicable)
- Environment variables and configuration
- Health check / status endpoint

#### Stage 4: Core Features (V1)

Break down each of the user's must-have features into sub-tasks:

- For each feature:
  - Data model changes
  - API endpoints or service layer
  - UI components and pages
  - Tests for this feature
  - Acceptance criteria

Prioritize by dependency order and risk — build the hardest/riskiest feature early to de-risk.

#### Stage 5: Polish & Launch Prep

- Error handling and user-facing error states
- Loading states and skeleton screens
- SEO / meta tags / app store listing (platform-dependent)
- Performance audit (Lighthouse, bundle analysis, profiling)
- Accessibility audit (axe, VoiceOver, TalkBack)
- Analytics integration
- Monitoring and error tracking setup
- Documentation (API docs, contributing guide, architecture decision records)

#### Stage 6: Launch

- Production environment configuration
- Domain / DNS setup
- SSL/TLS verification
- Database backup strategy
- Rollback plan
- Launch checklist specific to platform

---

### Phase 4: Scaffold (Optional)

After the user approves the plan, offer to scaffold the project:

1. Run the framework's `create` / `init` command
2. Install dependencies
3. Configure linting, formatting, and pre-commit hooks
4. Set up the test harness with passing example tests
5. Create the CI/CD pipeline configuration files
6. Generate a minimal `CLAUDE.md` containing **only** CLI commands:
   ```markdown
   ## Commands
   [dev command]      # Start dev server
   [build command]    # Production build
   [test command]     # Run tests
   [lint command]     # Lint code
   [format command]   # Format code
   [migrate command]  # Run DB migrations (if applicable)
   [deploy command]   # Deploy (if applicable)
   ```
   Do NOT add project descriptions, architecture explanations, coding conventions, or directory structures. Keep it to commands only — less context performs better.
7. Create initial commit
8. Verify the app runs, tests pass, and linting passes

---

## Tips

- **Start narrow**: If they're unsure, recommend the simplest viable option. They can always migrate later.
- **Be honest about trade-offs**: Every choice has downsides. Credibility comes from acknowledging them.
- **Use concrete numbers**: "Next.js has 130k GitHub stars and 6M weekly npm downloads" beats "Next.js is very popular."
- **Match complexity to team**: A solo beginner shouldn't get a microservices architecture. A 10-person team shouldn't get a single-file script.
- **Consider the 2am test**: When something breaks at 2am, how easy is it to debug with this stack? Simpler stacks win here.
- **Don't over-engineer V1**: The plan should get them to a working product fast. Over-engineering is the #1 killer of side projects.
- **Validate risky assumptions early**: If the whole product depends on one hard technical feature, build that first — not the login page.
- **Recommend what you'd actually use**: Base recommendations on real-world production experience, not hype cycles.
- **Skip what doesn't apply**: A static marketing site doesn't need a database section. A CLI tool doesn't need a UI library.
- **Progressive delivery**: Every stage should produce something deployable. Never let the app be in a "broken until stage N is done" state.
