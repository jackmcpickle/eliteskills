# AI-Powered CI Automation

## Contents
- Auto-fix broken PRs
- PR review automation
- Test generation
- Changelog and docs generation
- Failure triage
- Security scanning
- Trust boundaries and guardrails

## Auto-Fix Broken PRs

LLM reads CI failure logs and generates fix commits for mechanical errors.

### What to Auto-Fix (safe)
- **Lint errors** — unused imports, missing semicolons, sort order
- **Format errors** — code style, whitespace, indentation
- **Type errors** — missing type annotations, incorrect generics (with high confidence)
- **Stale codegen** — re-run codegen and commit

### What NOT to Auto-Fix (needs human)
- **Test failures** — the fix might mask a real bug
- **Logic errors** — LLM doesn't understand business intent
- **Security issues** — requires context and judgment
- **Build failures** — often symptomatic of deeper problems

### Flow
```
1. CI fails on PR
2. Extract failure logs (lint output, type errors, format diff)
3. Send to LLM: "Fix these errors. Only change what's necessary."
4. LLM generates patch
5. Apply patch, run CI again
6. If CI passes → commit to PR branch with [autofix] tag
7. If CI still fails → comment on PR with diagnosis, don't commit
```

### Guardrails
- **Max 1 auto-fix attempt per CI run** — prevent loops
- **Only commit to PR branches** — never to main/production
- **Diff size limit** — if fix touches > 10 files, flag for human review
- **Tag commits** — `[autofix: lint]`, `[autofix: format]` so humans can see what was automated
- **Author attribution** — commit as `bot <ci-bot@example.com>`, not the PR author

## PR Review Automation

LLM reviews diffs and posts advisory comments. Supplement to human review, not replacement.

### What LLM Reviews Well
- **Code style consistency** — naming conventions, patterns, structure
- **Common bugs** — null checks, error handling, resource leaks
- **Security patterns** — SQL injection, XSS, auth bypass, secret leakage
- **Documentation** — missing docstrings, outdated comments
- **Complexity** — overly complex functions, deep nesting

### What LLM Reviews Poorly
- **Business logic correctness** — doesn't know the domain
- **Architecture decisions** — lacks codebase-wide context
- **Performance** — can't profile, only pattern-match
- **Team conventions** — unless explicitly told

### Flow
```
1. PR opened/updated
2. Extract diff
3. Send to LLM with project context (style guide, conventions)
4. LLM returns structured review: { comments: [{ file, line, severity, message }] }
5. Post as PR review comments
6. Severity: "suggestion" (non-blocking) or "warning" (attention needed)
7. Never block merge based on LLM review alone
```

### Context Management
The LLM needs context to give useful reviews:
- Project style guide / conventions document
- Previous review patterns (what was approved, what was flagged)
- File-level context (not just the diff, but surrounding code)
- Limit to changed files — don't review the entire codebase

## Test Generation

LLM generates test stubs for changed code. Human reviews and refines before merge.

### Flow
```
1. PR changes src/domain/billing.ts
2. LLM analyzes the changed functions
3. Generates test cases covering:
   - Happy path
   - Edge cases (empty, null, boundary)
   - Error cases
   - Identified business rules
4. Posts as PR comment or draft commit
5. Human reviews, adjusts, commits
```

### Quality Checks
- Generated tests must pass before committing
- Human must review assertions (LLM might assert implementation details)
- Generated tests should follow project's test patterns (use factories, naming conventions)

## Changelog and Docs Generation

### Changelog
LLM drafts changelog entries from PR diff and commit messages.

```
Input: PR diff + commit messages + PR title/description
Output:
  ## [Unreleased]
  ### Added
  - Support for bulk approval of registrations (#123)
  ### Fixed
  - Competition status could skip from draft to completed (#124)
```

**Human review required.** LLM drafts, human edits for accuracy and tone.

### Documentation Updates
LLM identifies docs that need updating based on code changes.

```
1. PR changes API endpoint signature
2. LLM detects: "POST /api/registration input schema changed"
3. Posts comment: "docs/api/registration.md may need updating — new field 'competitionId' added"
```

## Failure Triage

LLM categorizes CI failures to help developers prioritize.

### Categories
- **Flaky** — test passed on main, failed on this PR, no related code change
- **Infrastructure** — timeout, network error, service unavailable, OOM
- **Real bug** — test failure correlates with code change in same area
- **Dependency** — failure in a test for code this PR didn't touch (transitive break)
- **Configuration** — env variable missing, secret expired, wrong runtime version

### Flow
```
1. CI fails
2. Extract: failure logs, changed files, test history
3. LLM classifies failure and suggests action:
   - Flaky → "Retry. This test has failed 3 times this week on unrelated PRs."
   - Infra → "Network timeout. Retry or check CI runner status."
   - Real bug → "Test X fails after your change to Y. Likely related."
   - Config → "TURSO_AUTH_TOKEN expired. Rotate secret."
```

## Security Scanning

LLM-assisted review of security-sensitive changes.

### Triggers
- Changes to auth/permission files
- New dependencies added
- Environment variable changes
- API endpoint additions or modifications
- File permission changes

### Checks
```
- New dependency: check for known CVEs, assess maintenance status
- Auth changes: verify no permission bypass introduced
- API changes: check for missing auth middleware, input validation
- Secrets: scan for hardcoded tokens, API keys, passwords
- Permissions: flag overly broad access patterns
```

### Reporting
Post findings as PR review with severity:
- **Critical:** Hardcoded secret, auth bypass → block merge
- **High:** Missing input validation, new unauthed endpoint → require review
- **Medium:** Dependency with known CVE → advisory
- **Low:** Broad permissions, missing rate limiting → suggestion

## Trust Boundaries and Guardrails

### What to Automate Fully
- Format fixes (zero risk)
- Import sorting (zero risk)
- Changelog drafts (human reviews before release)
- Failure categorization (advisory only)

### What Needs Human Approval
- Any code change beyond formatting/linting
- Test modifications (might mask bugs)
- Security-related changes
- Configuration changes
- Dependency updates

### What Should Never Be Automated
- Merging to production branches
- Deploying to production
- Modifying CI pipeline configuration
- Changing access controls or permissions
- Deleting data or resources

### Rate Limiting
- Max auto-fix attempts per PR: 1
- Max auto-review comments per PR: 20
- Max auto-generated test lines per PR: 200
- Cooldown between auto-actions: 5 minutes
