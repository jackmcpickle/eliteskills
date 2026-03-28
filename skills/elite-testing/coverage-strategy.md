# Coverage Strategy

## Contents
- What to measure
- Setting thresholds
- Ratchet pattern
- Mutation testing
- What not to cover
- Reporting in CI

## What to Measure

**Line coverage** — which lines executed. Baseline metric, easy to game.

**Branch coverage** — which conditional branches taken. More valuable than line coverage. Catches untested `else` paths.

**Function coverage** — which functions called. Useful for spotting dead code.

**Critical path coverage** — manual audit of which business-critical flows have tests. The most important metric and the hardest to automate.

Priority: critical path > branch > line > function.

## Setting Thresholds

Start where you are. Don't set 80% on a codebase at 30%.

| Codebase State | Target | Strategy |
|---|---|---|
| Greenfield | 80% branch | Enforce from day one |
| Existing, untested | Current + 5% | Ratchet up over time |
| Legacy, fragile | Critical paths only | Test what breaks, not everything |

**Per-directory thresholds** are more useful than global:
- `domain/` — 90%+ (pure logic, easy to test)
- `routes/` — 70%+ (integration tests cover most)
- `utils/` — 80%+ (pure functions)
- `generated/` — 0% (exclude from coverage)

## Ratchet Pattern

Coverage can only go up. Never down.

1. Record current coverage after each CI run
2. On the next PR, compare new coverage to recorded baseline
3. If new coverage < baseline → fail CI
4. If new coverage > baseline → update baseline

This prevents coverage decay without requiring unrealistic targets upfront.

```
// CI pseudocode
const baseline = readFile(".coverage-baseline");
const current = runCoverage();
if (current.branch < baseline.branch) {
  fail(`Branch coverage dropped: ${baseline.branch}% → ${current.branch}%`);
}
writeFile(".coverage-baseline", current); // commit back
```

## Mutation Testing

Coverage tells you code was *executed*. Mutation testing tells you the tests actually *catch bugs*.

**How it works:**
1. Mutate source code (flip conditions, change operators, remove lines)
2. Run tests against each mutation
3. If tests still pass → the "mutant survived" → gap in test quality

**Interpretation:**
- Mutation score > 80% → strong test suite
- Survived mutants in domain logic → high priority to fix
- Survived mutants in error logging → low priority

**When to use:** Periodically (weekly CI job), not on every PR. Mutation testing is slow.

## What Not to Cover

Exclude from coverage metrics:
- **Generated code** — API clients, ORM types, codegen output
- **Configuration files** — env loading, constants
- **Third-party wrappers** — thin wrappers around external SDKs
- **Type definitions** — interfaces, type aliases (no runtime code)
- **Test files themselves** — obvious but sometimes misconfigured

## Reporting in CI

**PR comments:** Post coverage diff on every PR. Show which files gained/lost coverage.

**Badges:** Display current coverage in README. Signals project health.

**Trends:** Track coverage over time. A downward trend is a red flag even if you're above threshold.

**Failure messages:** When coverage gate fails, show exactly which new lines are uncovered. Don't just say "coverage dropped" — show the developer where to add tests.
