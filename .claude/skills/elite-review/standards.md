# Review Standards

Extended design principles for Phase 2. Read when reviewing non-trivial changes.

## Design

- Does this change belong in this part of the codebase?
- Does the architecture make sense? Is it the right level of abstraction?
- How does it integrate with the rest of the system?
- Is now the right time for this change, or does it depend on something not yet built?
- Single Responsibility: does each new class/module have one clear reason to change?
- Are SOLID principles respected (dependency inversion, interface segregation, open/closed)?
- Are abstractions earned through repeated concrete examples, or imposed speculatively?
- Could this be simpler and more concrete without sacrificing changeability?

## Complexity & Clean Code

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

## Functionality

- Does the code do what the author intended?
- Are there edge cases that aren't handled (empty inputs, nulls, boundaries, overflow)?
- Could this cause problems for end users?
- Are there concurrency issues (race conditions, deadlocks, unsafe shared state)?
- Are nested conditionals encapsulated into well-named functions?

## Tests

- Are new/changed behaviors covered by tests?
- Do the tests actually assert the right things (not just "it doesn't throw")?
- Are edge cases and failure modes tested?
- Will these tests break for the wrong reasons (brittle tests)?
- Are test names descriptive of the scenario they cover?

## Naming

- Are variable, function, class, and file names clear and descriptive?
- Do names match what the thing actually does?
- Does each name tell you why it exists, what it does, and how it's used?
- Is naming consistent with the surrounding codebase?
- Does naming follow language-specific conventions (camelCase, snake_case, etc.)?
- Do names reflect domain concepts rather than implementation details?
- Would a future change require renaming because the name is tied to current behavior?

## Comments

- Do comments explain _why_, not _what_?
- Are there complex sections that need a comment but don't have one?
- Are there stale comments that no longer match the code?
- Are there redundant comments that just restate the code?
- Would a TODO be more appropriate than a comment explaining a known issue?
- Could better naming eliminate the need for a comment?

## Broader Impact

- Could this change break other parts of the system?
- Does it affect performance, bundle size, or load time?
- Does it introduce new dependencies? Are they justified?
- Does the change improve or degrade overall code health?
- Does it leave the codebase cleaner than before? (Boy Scout Rule)
