---
name: elite-merge
description: Merge PRs after reviews and green CI. Use when asked to watch a PR, babysit review comments, fix failing CI, or merge when green.
version: 1.0.0
---

# Elite Merge

Poll a PR for review comments and CI. Classify each item as **auto** or **HITL**. Fix auto. Escalate HITL. When agent **review-bots** have posted and CI is **green**, **merge** — unless any HITL remains.

**Hard rule:** never merge when HITL is open. `needs-decision` on the PR means stop and hand back.

**Core principle:** only auto-fix what is unambiguous and low-risk. When in doubt, HITL.

## Quick start

```bash
SKILL=.claude/skills/elite-merge
bash $SKILL/scripts/pr-threads.sh          # unhandled review comments
bash $SKILL/scripts/pr-checks.sh           # failed + pending CI
bash $SKILL/scripts/pr-merge.sh            # squash-merge only if the gate passes
```

Target a PR: `bash $SKILL/scripts/pr-threads.sh 1234`

Requires `gh` (authenticated) and `jq`.

## Watch loop

Create a TodoWrite item per cycle step. Run until **merged**, **HITL hand-back**, or PR is not `OPEN`.

1. **Sync** — `git fetch origin`. If the branch is behind `origin/main` or conflicted, rebase then `git push --force-with-lease` (CI re-runs → cycle is not done). Rebase conflicts you cannot resolve → HITL and stop.
2. **Comments** — `bash scripts/pr-threads.sh [PR]` → `{state, threads[], comments[]}`.
3. **CI** — `bash scripts/pr-checks.sh [PR]` → `{head_sha, failed[], pending[]}`.
4. **Stop check** — if `.state != "OPEN"`, report and exit.
5. **Classify** every comment and failed check (see HITL).
6. **Auto** — fix → verify → commit → push → reply/resolve or `mark-handled`. A push re-runs CI — keep looping.
7. **HITL** — post the breakdown, add `needs-decision`, do not merge.
8. **Summary** — print the cycle template.
9. **Exit** — if the **merge** gate passes, run `pr-merge.sh`. If HITL remains, hand back and stop. Otherwise sleep (`30s` after a push or while `pending[]` is non-empty; else `60s`) and go to step 1.

`threads[]` are inline review threads (resolvable). `comments[]` are general PR comments — reply, cannot resolve. `failed[]` needs a new commit, not a reply.

**review-bot:** a pending check that _posts_ a review (Greptile, Bugbot, Copilot Review, CodeRabbit, Cursor Bugbot). Pending review-bot → review has not happened. Do not merge. Do not call the cycle complete.

## Merge gate

Run `bash scripts/pr-merge.sh [PR]` only when ALL hold:

- PR `OPEN`
- no unhandled `threads[]` or `comments[]`
- `failed[]` empty and `pending[]` empty (includes review-bots)
- no HITL this cycle
- PR has no `needs-decision` label

`pr-merge.sh` squash-merges and deletes the branch. It exits non-zero if any gate fails — trust the script; do not `gh pr merge` around it.

HITL remaining is **not** ready to merge. Print the HITL summary and stop. Do not poll waiting on a human.

**Stuck pending:** after 3 polls with no state change on the same check name, escalate HITL ("CI/check stuck") and stop blocking on it.

## HITL — classify

A **comment** is HITL if ANY hold:

- **Design** — different approach, trade-off, or scope change
- **Ambiguous** — unclear ask or multiple valid readings
- **High blast-radius** — security, auth, migrations, public API, many consumers
- **Disagree** — you verified the suggestion is wrong or risky

A **failed check** is HITL if ANY hold:

- **Flaky / infra** — not caused by this PR's diff
- **Can't reproduce** — local pre-flight is green, CI is red
- **Design change** — green requires new behavior or many consumers

Everything else is **auto**: typos, renames, lint, docs, localized no-behavior refactors; lint/format/type failures; a test this diff broke.

## Auto

One commit per item.

Before writing a fix, invoke the repo's matching skill: **elite-backend**, **elite-react**, **elite-web**, or **elite-testing**.

1. Failed check: reproduce (`gh pr checks`, `gh run view <id> --log-failed`), then run that step locally. Can't reproduce → HITL.
2. Smallest correct fix.
3. **Verify** — the project's pre-flight (format, types, lint, tests). Do not skip.
4. Commit: `fix(scope): <what> — address review / fix CI`
5. Push (re-runs CI).
6. Close the loop:
    - thread: `pr-reply.sh thread <PR> <comment_id> "<reply>" --resolve --thread-id <thread_id>`
    - comment: `pr-reply.sh issue <PR> <comment_id> "<reply>"`
    - CI: `mark-handled.sh <PR> "ci:<check_name>@<head_sha>"`

Replies state evidence: the change and that local checks passed. No "should pass".

## HITL procedure

Do not change code. For each HITL item:

1. Read the code or CI log. Fill the template.
2. Reply and leave open, with `--label needs-decision`:
    - thread: `pr-reply.sh thread <PR> <comment_id> "<breakdown>" --thread-id <thread_id> --label needs-decision`
    - comment: `pr-reply.sh issue <PR> <comment_id> "<breakdown>" --label needs-decision`
    - CI: `pr-reply.sh issue <PR> "ci:<name>@<sha>" "<breakdown>" --label needs-decision`
3. Add it to the cycle summary.

### HITL template

```
**Needs your call.** <one-line restatement>

- **Why HITL:** <design | ambiguous | high-blast-radius | I-disagree | flaky-CI | cant-reproduce>
- **What it touches:** <files / check + log link>
- **Options:**
  1. <option> — <trade-off>
  2. <option> — <trade-off>
- **My recommendation:** <pick + why>
- **Question:** <the single decision>
```

## Cycle summary

```
PR #<n> — cycle complete
Ready to merge: <yes | no — reason>
Merged: <yes | no>
Comments — auto-addressed: <k> (pushed <shas>) · HITL: <m>
CI — failing: <f> (fixed <x>, escalated <y>) · pending: <p> (poll <n>/3)
Review-bots pending: <names | none>
HITL awaiting decision:
  1. [<criterion>] <file:line | check> — <question>
Next poll in <interval>.
```

Omit "Next poll" when merged, HITL-stopped, or PR not OPEN.

## Red flags — STOP

- Merging with HITL open or `needs-decision` on the PR
- Calling the cycle complete while a review-bot is still pending
- Merging around `pr-merge.sh`
- Auto-fixing design / ambiguous / high-risk comments
- Auto-fixing flaky CI or a failure you cannot reproduce
- Pushing without pre-flight
- Resolving a HITL thread before the human decides
- Declaring done right after a push without re-polling CI
- Busy-looping a stuck pending check past 3 polls

## Reference

Script flags, state file, and gh API: [REFERENCE.md](REFERENCE.md).
