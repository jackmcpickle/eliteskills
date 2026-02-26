---
name: feature
description: Analyze an existing feature to find gaps and improvement opportunities. Use when the user wants to evaluate a feature, find what's missing, or identify technical and business improvements. Triggers include "analyze feature", "review feature", "improve feature", "feature gaps", "what's missing", or pointing at a feature area and asking for enhancement ideas.
version: 1.0.0
---

# Feature Enhancement Skill

Analyze an existing feature in the codebase to surface gaps, risks, and improvement opportunities — both technical and business-oriented. Works in two phases: discovery then analysis.

## Workflow

### Phase 1: Discovery

Before analyzing, you MUST understand the feature. Ask the user targeted questions to build context. Do not skip this phase.

**Step 1 — Locate the feature**

If the user provided file paths, read them. Otherwise, search the codebase to find the relevant code:

```
1. Grep/Glob for the feature name, related keywords, route paths, component names
2. Map out all files involved: routes, components, services, models, tests, config
3. Read every relevant file — do not guess from filenames alone
```

**Step 2 — Ask discovery questions**

Ask questions from the categories below. Pick the most relevant 4-6 questions based on what you've read in the code. Do NOT dump all questions at once — be selective.

#### Purpose & Users
- What problem does this feature solve? Who is the primary user?
- What does success look like for this feature? How would you measure it?
- Are there user segments that use this differently?

#### Current State
- Is this feature complete, MVP, or work-in-progress?
- What are the known pain points or complaints?
- Are there workarounds users currently rely on?

#### Business Context
- How important is this feature to retention vs acquisition?
- Does this feature have a direct revenue impact?
- Are competitors doing this differently or better?

#### Boundaries & Constraints
- Are there performance requirements or SLAs?
- What integrations or dependencies does this touch?
- Are there planned changes that would affect this feature?

Wait for answers before proceeding to Phase 2.

### Phase 2: Analysis

After receiving answers, perform a thorough analysis across all dimensions below. Read every file involved in the feature before writing the report.

#### Technical Analysis

**Code Quality**
- Architecture: Is the code well-structured? Separation of concerns? Right abstractions?
- Error handling: Are failures handled gracefully? Are error messages helpful?
- Type safety: Are types complete and correct? Any `any` types or unsafe casts?
- Duplication: Is there repeated logic that should be extracted?

**Reliability**
- Edge cases: What happens with empty states, null values, boundary conditions?
- Race conditions: Are there concurrent operations that could conflict?
- Data integrity: Can the feature leave data in an inconsistent state?
- Failure modes: What happens when dependencies fail (API, DB, external services)?

**Performance**
- Query efficiency: N+1 queries? Missing indexes? Unnecessary data fetching?
- Rendering: Unnecessary re-renders? Large bundle impact? Lazy loading opportunities?
- Caching: Are there opportunities to cache expensive operations?
- Scalability: Will this break at 10x or 100x current usage?

**Security**
- Input validation: Is all user input validated and sanitized?
- Authorization: Are permissions checked at every layer?
- Data exposure: Is sensitive data properly protected in responses?

**Testing**
- Coverage: Are critical paths tested? What's missing?
- Edge cases: Are failure scenarios and boundary conditions tested?
- Integration: Are interactions with other features tested?

**Developer Experience**
- Readability: Can a new developer understand this feature quickly?
- Maintainability: How hard is it to modify or extend?
- Documentation: Are complex decisions explained?

#### Business Analysis

**User Experience**
- Friction points: Where do users get stuck or confused?
- Missing feedback: Are loading states, errors, and success states clear?
- Accessibility: Is the feature usable by all users (keyboard, screen reader, mobile)?
- Onboarding: Can a new user figure this out without documentation?

**Feature Completeness**
- Happy path gaps: What common scenarios aren't handled?
- Power user needs: What would advanced users want?
- Integration opportunities: Could this connect with other features for more value?
- Offline/degraded mode: Does the feature work with poor connectivity?

**Growth & Monetization**
- Conversion impact: Does this feature help convert free to paid users?
- Retention hooks: Does this create habits or switching costs?
- Viral potential: Could this feature drive word-of-mouth or sharing?
- Upsell opportunities: Are there natural premium extensions?

**Competitive Position**
- Table stakes: Is this at parity with competitors?
- Differentiators: What could make this feature a reason to choose this product?
- Future-proofing: Will this approach scale with the product roadmap?

### Output Format

Present findings in this structure:

```markdown
# Feature Analysis: {Feature Name}

## Summary
One paragraph overview of the feature's current state and the most important findings.

## Feature Map
List all files involved with a one-line description of each file's role.

## Critical Issues
Issues that need immediate attention — bugs, security risks, data loss potential.
Each item: description, affected files, severity (critical/high), suggested fix.

## Technical Improvements
Ranked by impact. Each item includes:
- **What**: Clear description of the improvement
- **Why**: What problem it solves
- **Where**: Specific files and lines
- **Effort**: S/M/L estimate

## Business Improvements
Ranked by potential impact. Each item includes:
- **What**: The improvement or new capability
- **Why**: Business value (retention, conversion, satisfaction, revenue)
- **How**: Brief implementation approach
- **Effort**: S/M/L estimate

## Quick Wins
Improvements that are small effort but meaningful impact (the low-hanging fruit).

## Strategic Recommendations
Longer-term suggestions that could transform the feature from good to great.
```

Save this report to `docs/feature-analysis-{feature-name}.md` (kebab-case the feature name) AND output it in the conversation.

## Rules

- ALWAYS read the actual code before analyzing. Never guess from file names.
- ALWAYS complete Phase 1 before Phase 2. Do not skip discovery.
- Be specific — reference exact files, line numbers, and code snippets.
- Prioritize findings by impact, not by how easy they are to spot.
- Be honest about trade-offs — not every improvement is worth doing.
- Frame business suggestions with concrete reasoning, not vague "could improve UX".
- If the feature is well-built, say so. Don't invent problems.

## Reference Documentation

- [discovery-questions.md](discovery-questions.md) — Full question bank organized by category
- [analysis-framework.md](analysis-framework.md) — Detailed scoring criteria and evaluation rubrics
