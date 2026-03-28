---
name: elite-review
description: Perform a thorough code review. Use when the user says "review code", "code review", "review this PR", "review changes", "review my diff", "check this code", "DDD review", "domain review", "review domain model", or asks for feedback on code they've written or changed.
version: 1.0.0
---

# Code Review Skill

Systematic code review based on Google's engineering practices, Sandi Metz's 99 Bottles principles, and clean code fundamentals. Works in two phases: understand the change, then review it across all dimensions.

## Workflow

### Phase 1: Understand

Before reviewing, build context on what changed and why. Do not skip this phase.

**Step 1 — Gather the diff**

Determine what code to review based on user input:

```
- If PR number/URL given → fetch with `gh pr diff`
- If files specified → read those files and their git diff
- If "review changes" / "review my diff" → run `git diff` (staged + unstaged)
- If branch specified → `git diff main...{branch}`
```

**Step 2 — Read and understand**

```
1. Read the full diff — every changed file, every line
2. Read surrounding context for changed functions/classes (not just the diff lines)
3. Identify the intent: bug fix? new feature? refactor? config change?
4. Note the scope: how many files, what subsystems, any cross-cutting concerns?
```

**Step 3 — Load specialized resources if needed**

If the user requested a DDD review, domain review, or architecture review through a DDD lens, read `DDD.md` from this skill directory and follow its workflow instead of Phase 2.

**Step 4 — Clarify if needed**

If the intent of the change is unclear from the diff and commit messages, ask the user before proceeding. Otherwise move directly to Phase 2.

### Phase 2: Review

Review every changed line systematically across all dimensions below. Not every dimension applies to every change — skip what's irrelevant.

#### Design

- Does this change belong in this part of the codebase?
- Does the architecture make sense? Is it the right level of abstraction?
- How does it integrate with the rest of the system?
- Is now the right time for this change, or does it depend on something not yet built?
- Single Responsibility: does each new class/module have one clear reason to change?
- Are SOLID principles respected (dependency inversion, interface segregation, open/closed)?
- Are abstractions earned through repeated concrete examples, or imposed speculatively?
- Could this be simpler and more concrete without sacrificing changeability?

#### Functionality

- Does the code do what the author intended?
- Are there edge cases that aren't handled (empty inputs, nulls, boundaries, overflow)?
- Could this cause problems for end users?
- Are there concurrency issues (race conditions, deadlocks, unsafe shared state)?
- Are nested conditionals encapsulated into well-named functions?

#### Complexity & Clean Code

- Can a reader understand the code without excessive effort?
- Is anything over-engineered for the current need?
- Are there premature abstractions or unnecessary indirection layers?
- Would a simpler approach work equally well? (KISS)
- Are there magic numbers or hard-coded values that should be named constants?
- Is there duplicated logic that violates DRY?
- Do functions do one thing and do it well? Are any doing too much?
- Are functions small enough to understand at a glance?
- **Shameless Green check** — Is this the simplest concrete solution, or has the author reached for abstractions too early?
- **Wrong abstraction detection** — Is duplicated code being tolerated because the right abstraction hasn't emerged yet? (Duplication > wrong abstraction)
- **DRY cost/benefit** — Does extracting this duplication reduce change cost more than it increases comprehension cost?
- **Incomprehensible conciseness** — Is overly terse code hiding duplication or unnamed domain concepts?
- **Speculative generality** — Is complexity added "just in case" without a concrete current need?
- **Value/Cost lens** — Is the code easy to write, understand, AND change?

#### Tests

- Are new/changed behaviors covered by tests?
- Do the tests actually assert the right things (not just "it doesn't throw")?
- Are edge cases and failure modes tested?
- Will these tests break for the wrong reasons (brittle tests)?
- Are test names descriptive of the scenario they cover?

#### Naming

- Are variable, function, class, and file names clear and descriptive?
- Do names match what the thing actually does?
- Does each name tell you why it exists, what it does, and how it's used?
- Is naming consistent with the surrounding codebase?
- Does naming follow language-specific conventions (camelCase, snake_case, etc.)?
- Do names reflect domain concepts rather than implementation details?
- Would a future change require renaming because the name is tied to current behavior?

#### Comments

- Do comments explain _why_, not _what_?
- Are there complex sections that need a comment but don't have one?
- Are there stale comments that no longer match the code?
- Are there redundant comments that just restate the code?
- Would a TODO be more appropriate than a comment explaining a known issue?
- Could better naming eliminate the need for a comment?

#### Style & Consistency

- Does the code follow the project's style conventions?
- Does it follow language-specific coding standards?
- Is it consistent with surrounding code in the same file/module?
- Are there formatting issues the linter wouldn't catch (logical grouping, ordering)?

#### Documentation

- Do public APIs have adequate documentation?
- Are breaking changes documented?
- Do READMEs or guides need updating?

#### Broader Impact

- Could this change break other parts of the system?
- Does it affect performance, bundle size, or load time?
- Does it introduce new dependencies? Are they justified?
- Does the change improve or degrade overall code health?
- Does it leave the codebase cleaner than before? (Boy Scout Rule)

### Output Format

Present findings in this structure:

```markdown
# Code Review: {brief description of change}

## Summary

One paragraph: what this change does, overall quality assessment, and whether it's ready to merge.

## Critical

Issues that must be fixed before merging — bugs, security vulnerabilities, data loss risks, broken functionality.

Each item:

- **File:line** — description of the issue
- Why it's critical
- Suggested fix

## Warnings

Issues that should be fixed — logic errors, missing edge cases, poor error handling, test gaps.

Each item:

- **File:line** — description
- Suggested fix

## Nits

Minor suggestions — naming, style, simplification opportunities. Prefixed with "Nit:" per convention.

Each item:

- **File:line** — Nit: description

## Good Stuff

Call out things done well — clean abstractions, good test coverage, thoughtful error handling, clever solutions. Be specific.

## Verdict

One of:

- **Approve** — no critical/warning issues, good to merge
- **Request Changes** — critical or warning issues must be addressed
- **Needs Discussion** — design-level concerns that need alignment before proceeding
```

## Rules

- ALWAYS read every changed line. Never skim.
- ALWAYS read surrounding context, not just the diff. Changes make more sense with context.
- Be specific — reference exact files, line numbers, and code snippets.
- Acknowledge good work. Don't only point out problems.
- Be constructive — suggest fixes, don't just flag issues.
- Distinguish severity clearly. Not everything is critical.
- Don't nitpick style that a linter/formatter would catch — focus on what tools miss.
- Don't suggest rewrites of working code just because you'd write it differently.
- If the change is good and clean, say so briefly. Don't invent problems.
- Frame feedback as suggestions, not commands: "Consider..." / "Could this...?" not "You must..."

## Resources

- [DDD.md](DDD.md) - DDD architecture review (bounded contexts, aggregates, tactical patterns)
