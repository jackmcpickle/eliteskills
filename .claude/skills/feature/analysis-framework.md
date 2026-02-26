# Analysis Framework

Detailed evaluation criteria for Phase 2 analysis. Use this to ensure consistency and thoroughness.

## Scoring Guide

Rate each dimension on impact and effort:

| Impact | Description |
|--------|-------------|
| Critical | Causes data loss, security vulnerability, or system failure |
| High | Significant user pain, lost revenue, or major technical debt |
| Medium | Noticeable friction, moderate debt, or missed opportunity |
| Low | Minor polish, nice-to-have, or preventive improvement |

| Effort | Description |
|--------|-------------|
| S | < 1 day. Config change, small refactor, simple addition |
| M | 1-3 days. New component, API changes, moderate refactor |
| L | 3+ days. Architecture change, new system, major feature |

## Technical Evaluation Rubric

### Code Quality

| Check | What to look for |
|-------|-----------------|
| Single responsibility | Does each file/function do one thing? |
| Abstraction level | Are functions at a consistent level of abstraction? |
| Naming | Are names descriptive and consistent? |
| Dead code | Unused imports, unreachable branches, commented-out code? |
| Magic values | Hardcoded strings, numbers without explanation? |
| Consistency | Does the code follow the project's established patterns? |

### Reliability

| Check | What to look for |
|-------|-----------------|
| Null/undefined handling | Are optional values checked before use? |
| Empty states | What renders when there's no data? |
| Boundary conditions | Max length, zero, negative, overflow? |
| Concurrent access | Can two users/requests conflict? |
| Transaction safety | Are multi-step operations atomic? |
| Retry/timeout | Do network calls have timeouts and retry logic? |
| Graceful degradation | What happens when a dependency is down? |

### Performance

| Check | What to look for |
|-------|-----------------|
| Query efficiency | N+1 queries, missing WHERE clauses, SELECT * |
| Index coverage | Are filtered/sorted columns indexed? |
| Pagination | Are large lists paginated? |
| Caching | Are repeated expensive operations cached? |
| Bundle impact | Large imports, missing tree-shaking, unoptimized assets? |
| Render efficiency | Unnecessary re-renders, missing memoization? |
| Lazy loading | Are non-critical resources deferred? |

### Security

| Check | What to look for |
|-------|-----------------|
| Input validation | All user inputs validated on server side? |
| Output encoding | HTML/SQL/URL encoding where needed? |
| Auth checks | Permission verified at API layer, not just UI? |
| Data exposure | Sensitive fields excluded from API responses? |
| Rate limiting | Are abuse-prone endpoints rate limited? |
| CSRF/XSS | Are forms and dynamic content protected? |

### Testing

| Check | What to look for |
|-------|-----------------|
| Happy path coverage | Are the main flows tested? |
| Error path coverage | Are failure scenarios tested? |
| Edge cases | Boundary values, empty inputs, concurrent operations? |
| Integration tests | Are cross-feature interactions tested? |
| Test quality | Are tests testing behavior, not implementation? |

### Developer Experience

| Check | What to look for |
|-------|-----------------|
| Onboarding clarity | Can a new dev understand the feature in 15 minutes? |
| Change confidence | Can you modify this without fear of breaking something? |
| Debug-ability | Are errors traceable to their source? |
| Documentation | Are non-obvious decisions explained? |

## Business Evaluation Rubric

### User Experience

| Check | What to look for |
|-------|-----------------|
| Task completion | Can users accomplish their goal without confusion? |
| Error recovery | Can users recover from mistakes easily? |
| Loading states | Is feedback provided during async operations? |
| Empty states | Do empty screens guide users on what to do? |
| Responsive design | Does it work on all target devices/viewports? |
| Accessibility | Keyboard navigation, screen readers, color contrast? |
| Consistency | Does the UX match the rest of the product? |

### Feature Completeness

| Check | What to look for |
|-------|-----------------|
| CRUD completeness | Can users create, read, update, AND delete? |
| Bulk operations | Can users act on multiple items at once? |
| Search/filter | Can users find what they need as data grows? |
| Export/import | Can users get their data in/out? |
| Undo/history | Can users reverse actions? |
| Notifications | Are users informed of relevant changes? |

### Growth & Monetization

| Check | What to look for |
|-------|-----------------|
| Conversion friction | Are there unnecessary barriers to upgrading? |
| Value demonstration | Does the feature show its worth before paywalling? |
| Sharing mechanics | Can users share outputs or invite others? |
| Habit formation | Does the feature encourage regular use? |
| Lock-in value | Does continued use make switching harder? |

### Competitive Position

| Check | What to look for |
|-------|-----------------|
| Feature parity | Does this match what competitors offer? |
| Unique advantages | What can this do that competitors can't? |
| Speed to value | Is the time-to-value faster than alternatives? |
| Integration ecosystem | Does this connect with tools users already use? |

## Report Writing Guidelines

- Lead with the most impactful finding, not the most obvious
- Be specific: "The `getUserSkills` query on line 47 of `skills.ts` fetches all columns including `content` (avg 50KB) when the list view only needs `name` and `price`" beats "Query could be optimized"
- Quantify when possible: "This adds ~200ms to page load" or "Affects ~30% of user sessions"
- Always include the "so what": why should someone care about this finding?
- Group related findings — don't list the same root cause three times
- For business suggestions, tie to metrics: "Could improve trial-to-paid conversion by reducing friction in the first-run experience"
