# Scope Gathering

Single source of truth for locating code changes before review, QA, or feature analysis.

## Determine scope from user input

```
- PR number/URL given → fetch with `gh pr diff`
- Files specified → read those files and their git diff
- "review/QA my changes" / "review my diff" → run `git diff` (staged + unstaged)
- Branch specified → `git diff main...{branch}`
- Feature area only (no diff) → grep/glob for feature name, routes, components; map all involved files
```

## Read completely

```
1. Read every changed or located file — do not guess from filenames
2. Read surrounding context for changed functions/classes (not just diff lines)
3. Identify intent: bug fix? new feature? refactor? config change?
4. Note scope: file count, subsystems, cross-cutting concerns
```

## Clarify if needed

If intent or user-facing impact is unclear from the diff and commit messages, ask the user before proceeding.
