---
name: elite-qa
description: Generate manual QA test plans for human testers. Use when the user says "QA plan", "test plan", "manual testing", "QA checklist", "what should I test", "how to test this", "verify changes", "QA this PR", "QA this feature", or asks what a human tester should verify.
version: 1.0.0
---

# Manual QA Test Plan Skill

Generate actionable, click-by-click QA test plans that a non-developer can follow to manually verify user-facing behavior. Distinct from code review (quality) and automated testing (test code) — this is what a human does in a browser/app.

## Workflow

### Phase 1: Gather Changes

Build understanding of what changed and what's affected.

**Step 1 — Determine scope**

```
- If PR number/URL given → fetch with `gh pr diff`
- If files specified → read those files and their git diff
- If "QA my changes" / "QA this diff" → run `git diff` (staged + unstaged)
- If branch specified → `git diff main...{branch}`
- If feature area specified (no diff) → explore that area:
  read routes, components, services, and data models to build understanding
```

**Step 2 — Read and trace to user-facing behavior**

```
1. Read every changed file completely
2. Read surrounding context — parent components, route definitions, API callers
3. Trace each change to what the user sees or does:
   - UI component changed → which page, which interaction?
   - API endpoint changed → which frontend calls it, what does the user trigger?
   - Data model changed → which views display this data?
   - Config changed → which behavior is affected?
4. Identify the URLs, page names, and navigation paths involved
5. Note actual button labels, field names, and menu items from the code
```

**Step 3 — Clarify if needed**

If the user-facing impact is unclear, ask the user before proceeding. Otherwise move to Phase 2.

### Phase 2: Analyze Impact

Categorize changes and determine testing scope.

**Step 1 — Classify each change**

```
Categories:
- UI: component, layout, styling, copy changes
- API: endpoint behavior, request/response shape, status codes
- Data: model, schema, migration, query changes
- Config: environment, feature flags, permissions
- Logic: business rules, validation, state management
- Style: CSS-only, theme, visual-only changes
```

**Step 2 — Assess risk and priority**

```
High risk (MUST-TEST):
- Changes to payment, auth, data mutation, or user-facing forms
- New features or new pages
- Changes touching multiple subsystems
- Database migrations or schema changes

Medium risk (SHOULD-TEST):
- Changes to existing UI flows
- API response shape changes
- Validation rule changes
- Error handling changes

Low risk (NICE-TO-TEST):
- Style-only changes
- Copy/text updates
- Internal refactors with no behavior change
- Dev tooling changes
```

**Step 3 — Load resources conditionally**

```
- If UI/form changes detected → read qa-checklist.md from this skill directory
- If any change type detected → read edge-cases.md from this skill directory
  and include relevant edge case patterns for the change types found
```

**Step 4 — Identify regression candidates**

```
1. What existing flows touch the same components/endpoints?
2. What could break if this change has a bug?
3. What related features share data or state?
```

### Phase 3: Generate QA Plan

Produce the test plan using the output format below.

**Writing test steps — click-by-click style:**

Every test scenario must have literal, prescriptive steps. A non-developer follows these without guessing.

Good:

```
1. Go to `/settings/profile`
2. In the **Display Name** field, type `Test User`
3. Click the **Save** button in the bottom-right panel
4. Expected: A green toast appears top-right saying "Profile updated"
5. Refresh the page (Cmd+R / F5)
6. Expected: The **Display Name** field still shows `Test User`
```

Bad:

```
1. Go to settings
2. Update the profile
3. Verify it works
```

**Step rules:**

- Specify WHERE on the page: "in the sidebar", "bottom panel", "top-right corner"
- Reference form fields by their visible label
- Include exact test data values — never "enter a value" or "type something"
- Describe visual cues when ambiguous: "the red Delete button below the form"
- State expected results after each significant action, not just at the end
- Include the URL path for every page navigation
- Note keyboard shortcuts where relevant

### Output Format

```markdown
# QA Test Plan: {description}

## Summary

What changed, which user-facing areas are affected, overall risk assessment
(high/medium/low), and how many scenarios to test.

## Prerequisites

- Environment: which env to test on (local, staging, preview URL)
- Accounts: what test accounts or roles are needed
- Test data: any data that must exist before testing
- Browsers: specific browser requirements (or "any modern browser")
- Setup steps: anything the tester needs to do first

## Test Scenarios

### {Feature Area 1}

#### Scenario 1: {descriptive name} [MUST-TEST]

**Context:** Brief explanation of what this tests and why it matters.

**Steps:**

1. Go to `{url}`
2. {click-by-click instruction with visual location}
3. Expected: {what the tester should see}
4. {next action}
5. Expected: {result}

**Edge cases:**

- {variation to also try, with specific values}

#### Scenario 2: {descriptive name} [SHOULD-TEST]

...

### {Feature Area 2}

...

## Regression Checks

Quick checks for flows that should still work. Checkbox format.

- [ ] {Flow description} — navigate to {url}, verify {specific thing}
- [ ] {Flow description} — {action}, confirm {expected result}

## Accessibility Checks

Only include if UI changes are present. Skip entirely for non-UI changes.

- [ ] Tab through {area} — focus ring visible on all interactive elements
- [ ] Screen reader: {element} announces as "{expected announcement}"
- [ ] {modal/dialog}: focus trapped, Escape closes it
- [ ] Color contrast: {specific elements} meet WCAG AA (4.5:1 text, 3:1 large)

## Environment Matrix

Only include if cross-browser/device testing is relevant.

| Scenario | Chrome | Firefox | Safari | Mobile Safari | Mobile Chrome |
| -------- | ------ | ------- | ------ | ------------- | ------------- |
| {name}   | -      | -       | -      | -             | -             |

## Notes for Tester

- Context the tester needs (related tickets, known limitations, recent changes)
- What automated tests already cover (so testers can skip those paths)
- Areas of uncertainty or "pay extra attention to..."
```

**File output:** If the user asks to save the plan, write it to `docs/qa-plans/{YYYY-MM-DD}-{slug}.md`. Create the directory if needed.

## Rules

- ALWAYS read every changed file completely. Never generate steps from file names alone.
- ALWAYS trace changes to user-facing behavior. If a change has no user-facing impact, say so and skip it.
- ALWAYS use actual URLs, button labels, field names, and menu items from the code — never guess.
- ALWAYS include exact test data values. Never "enter a valid email" — say `test@example.com`.
- Steps must be click-by-click with visual location context. Never "test the form" or "verify it works".
- Tag every scenario: [MUST-TEST], [SHOULD-TEST], or [NICE-TO-TEST].
- Don't pad with generic filler scenarios. Every scenario must trace to an actual change or realistic regression risk.
- Skip accessibility and responsive sections for non-UI changes.
- Skip environment matrix for simple changes.
- Reference existing automated test coverage so testers know what's already covered.
- If the change is trivial (typo fix, comment update), say so — don't manufacture a 20-scenario plan.
- Keep scenarios focused. One scenario = one user flow. Don't combine unrelated flows.

## Resources

- [qa-checklist.md](qa-checklist.md) — Common QA dimensions for UI/form changes
- [edge-cases.md](edge-cases.md) — Edge case patterns by change type
