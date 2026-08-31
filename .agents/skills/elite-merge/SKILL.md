---
name: elite-merge
description: Merge PRs after reviews and green CI. Use when asked to watch a PR, babysit review comments, fix failing CI, or merge when green.
version: 1.1.0
---

# Elite Merge

Poll a PR for review comments and CI. Classify each item as **auto** or **HITL**. Fix auto. Escalate HITL. When agent **review-bots** have posted and CI is **green**, **merge** — unless any HITL remains.

**Hard rule:** never merge when HITL is open. `needs-decision` on the PR means stop and hand back.

**Core principle:** only auto-fix what is unambiguous and low-risk. When in doubt, HITL.

## Execution — A_t = (P, Σ_t, O_t)

Each cycle prompt is only these three. Intermediate reasoning and previous observations are discarded after a validated state patch (SKILL.state). Bounded context — not summarization, not "state plus transcript".

|         | What                                                   | Load   |
| ------- | ------------------------------------------------------ | ------ |
| **P**   | This file (immutable)                                  | Always |
| **Σ_t** | `bash scripts/state.sh get [PR]`                       | Always |
| **O_t** | This cycle's `bash scripts/state.sh observe [PR]` only | Always |

After `state.sh patch`, discard R and O. **Do not** paste prior cycle summaries, prior observe/pr-threads/pr-checks dumps, or CI logs into later turns. Σ is sufficient. Chat recaps are optional one-liners for the human — not next-loop context.

Open [REFERENCE.md](REFERENCE.md) only for script flags or gh API. Do not load it every cycle.

Auto-fix: name **elite-backend** / **elite-react** / **elite-web** / **elite-testing** and load only the file that fix needs. Do not pull those skills wholesale. The merge loop stays on this P+Σ+O.

### Σ — sufficient statistic

Path: `$(git rev-parse --git-dir)/pr-watch-<PR>-state.json` (not committed). Overwrite each cycle.

Handled keys stay in `pr-watch-<PR>-handled.txt` — comment/CI **dedupe only**, not Σ. Existing `pr-threads.sh` / `pr-checks.sh` / `pr-reply.sh` / `mark-handled.sh` still use that file.

```json
{
    "v": 1,
    "pr": 0,
    "pr_state": "OPEN",
    "head_sha": "",
    "cycle": 0,
    "needs_decision": false,
    "hitl": [
        {
            "id": "1",
            "kind": "thread",
            "criterion": "design",
            "locus": "a.ts:1",
            "question": "…"
        }
    ],
    "open": { "threads": [], "comments": [], "failed": [], "pending": [] },
    "pending_polls": { "<check>": { "count": 0, "sha": "" } },
    "review_bots": [],
    "last_push_sha": null,
    "counts": {
        "auto_comments": 0,
        "hitl": 0,
        "ci_failed": 0,
        "ci_fixed": 0,
        "ci_escalated": 0,
        "ci_pending": 0,
        "pending_poll": 0,
        "pushed_shas": []
    },
    "ready_to_merge": false,
    "merged": false,
    "stop_reason": null
}
```

`kind`: `thread` | `comment` | `ci`. `criterion`: `design` | `ambiguous` | `high-blast-radius` | `disagree` | `flaky-ci` | `cant-reproduce` | `stuck-ci`. `stop_reason`: `null` | `merged` | `hitl` | `not-open` | `stuck-ci`.

`open.*` holds **ids/names only** — bodies live in O and die with O. `hitl[]` is what remains after a reply is marked handled (threads vanish from the next observe).

Patch: `state.sh patch [PR] <<< '{"cycle":1,…}'`. Null deletes a key (required objects reset to empty). Objects merge; arrays replace. The script **rejects** `ready_to_merge: true` when HITL, `needs_decision`, `review_bots`, unhandled `open.threads`/`open.comments`, failed/pending CI, or a pending check at ≥3 polls remains.

Print the cycle summary from `state.sh summary [PR]` — derived from Σ, not history.

## Quick start

```bash
SKILL=.claude/skills/elite-merge
bash $SKILL/scripts/state.sh init 1234      # Σ
bash $SKILL/scripts/state.sh observe 1234   # O_t
bash $SKILL/scripts/pr-merge.sh             # squash-merge only if the gate passes
```

`pr-threads.sh` / `pr-checks.sh` still work; `observe` is the one-shot O. Requires `gh` (authenticated) and `jq`.

## Watch loop

Create a TodoWrite item per cycle step. Run until **merged**, **HITL hand-back**, or PR is not `OPEN`.

1. **Load** — P (this file) + `state.sh get [PR]` (init if missing). Nothing else from prior cycles.
2. **Sync** — `git fetch origin`. If the branch is behind `origin/main` or conflicted, rebase then `git push --force-with-lease` (CI re-runs → cycle is not done). Patch `last_push_sha`. Rebase conflicts you cannot resolve → HITL and stop.
3. **Observe** — `state.sh observe [PR]` → O_t only. Discard the previous observe.
4. **Stop check** — if O `.pr_state != "OPEN"`, patch `stop_reason: "not-open"`, summary, exit.
5. **Classify** every new comment and failed check (see HITL). Patch `open`, `hitl`, `pending_polls`, `review_bots`, `needs_decision`, `counts`. Same pending name + same sha → increment `pending_polls.<name>.count`; new sha → reset to 1.
6. **Auto** — fix → verify → commit → push → reply/resolve or `mark-handled`. Patch `last_push_sha` and counts. A push re-runs CI — keep looping.
7. **HITL** — post the breakdown, add `needs-decision`, patch `hitl` + `stop_reason: "hitl"`. Do not merge.
8. **Commit Σ** — `state.sh patch` with ΔΣ. Discard reasoning and O.
9. **Summary** — `state.sh summary [PR]` (from Σ).
10. **Exit** — if the **merge** gate passes, run `pr-merge.sh`, then patch `merged: true` + `stop_reason: "merged"`. If HITL remains, hand back and stop. Otherwise sleep (`30s` after a push or while `open.pending` is non-empty; else `60s`) and go to step 1 with a **fresh** A_t.

`threads[]` are inline review threads (resolvable). `comments[]` are general PR comments — reply, cannot resolve. `failed[]` needs a new commit, not a reply.

**review-bot:** a pending check that _posts_ a review (Greptile, Bugbot, Copilot Review, CodeRabbit, Cursor Bugbot). `observe` tags these in `review_bots`. Pending review-bot → review has not happened. Do not merge. Do not call the cycle complete.

## Merge gate

Run `bash scripts/pr-merge.sh [PR]` only when ALL hold:

- PR `OPEN`
- no unhandled `threads[]` or `comments[]`
- `failed[]` empty and `pending[]` empty (includes review-bots)
- no HITL this cycle (`Σ.hitl` empty, `needs_decision` false)
- PR has no `needs-decision` label

`pr-merge.sh` squash-merges and deletes the branch. It exits non-zero if any gate fails — trust the script; do not `gh pr merge` around it.

HITL remaining is **not** ready to merge. Print the HITL summary and stop. Do not poll waiting on a human.

**Stuck pending:** after 3 polls with no state change on the same check name + sha, escalate HITL (`stuck-ci`) and stop blocking on it.

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

Before writing a fix, name the matching skill (**elite-backend**, **elite-react**, **elite-web**, or **elite-testing**) and load **only** the file that fix needs. Do not load those skills wholesale.

1. Failed check: reproduce (`gh pr checks`, `gh run view <id> --log-failed`), then run that step locally. Can't reproduce → HITL. Treat that log as O for this step only; do not carry it into the next cycle.
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
3. Patch Σ.hitl (id, kind, criterion, locus, question). `pr-reply` marks the id handled — the next observe will omit it. Σ.hitl is what blocks merge.

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

Use `state.sh summary [PR]`. Shape (for the human, not for the next prompt):

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
- Replaying prior observe dumps, cycle summaries, or CI logs as next-cycle context
- Loading REFERENCE.md or other skills wholesale every cycle

## Reference

Script flags, state file, and gh API: [REFERENCE.md](REFERENCE.md).
