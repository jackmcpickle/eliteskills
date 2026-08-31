# Reference — gh API and script behaviour

## Scripts

### `scripts/state.sh`

Execution state (Σ). Path: `$(git rev-parse --git-dir)/pr-watch-<PR>-state.json` — not committed.

```bash
state.sh init [PR]          # create Σ if missing, print it
state.sh get [PR]           # print Σ
state.sh path [PR]          # print file path
state.sh observe [PR]       # latest O: threads + checks + labels + review_bots
state.sh patch [PR]         # JSON patch on stdin; validate; overwrite Σ
state.sh summary [PR]       # cycle summary derived from Σ
state.sh self-test          # gate checks without gh
```

Patch is a dictionary merge with null-deletion (objects merge, arrays replace). Nulling a required object (`pending_polls`, `open`, `counts`) resets it to empty. The script rejects `ready_to_merge: true` when HITL, `needs_decision`, review-bots, failed/pending CI, or a check at ≥3 polls remains.

Schema and cycle rules live in SKILL.md — do not load this file every cycle.

`observe` shells out to `pr-threads.sh` + `pr-checks.sh` + `gh pr view`. Those scripts still work on their own.

### `scripts/pr-threads.sh [PR]`

Emits one JSON object per call:

```json
{
    "state": "OPEN",
    "threads": [
        {
            "thread_id": "PRRT_...",
            "outdated": false,
            "comment_id": 123,
            "author": "reviewer",
            "path": "src/foo.py",
            "line": 42,
            "body": "..."
        }
    ],
    "comments": [{ "comment_id": 456, "author": "reviewer", "body": "..." }]
}
```

- `threads` = inline review threads (resolvable). `comments` = general PR comments (not resolvable).
- Filtered out: resolved threads, anything you (the gh user) authored last, anything in the handled state file.
- `state` drives the loop: stop when it is not `OPEN` (`MERGED` / `CLOSED`).

### `scripts/pr-checks.sh [PR]`

```json
{
    "head_sha": "abc123",
    "failed": [
        {
            "name": "test",
            "conclusion": "FAILURE",
            "url": "...",
            "workflow": "CI"
        }
    ],
    "pending": [{ "name": "build", "url": "..." }]
}
```

- Normalizes GitHub Actions check-runs and external status contexts.
- `failed[]` excludes any check whose `ci:<name>@<head_sha>` key is in the handled file.
- Fixing a failed check = push a new commit (new sha → CI re-runs).
- Dig into a failure: `gh pr checks <PR>`, then `gh run view <run-id> --log-failed`.

### `scripts/mark-handled.sh <PR> <key>...`

Appends handled keys (comment ids, or `ci:<name>@<sha>`) to the state file so the next sweep skips them. Use after auto-fixing a CI check.

### `scripts/pr-reply.sh`

```bash
# Auto: reply + resolve
pr-reply.sh thread <PR> <comment_id> "Fixed in <sha> — <what>. Local checks pass." --resolve --thread-id <thread_id>
# HITL: reply, leave open, label the PR
pr-reply.sh thread <PR> <comment_id> "<breakdown>" --thread-id <thread_id> --label needs-decision
# General PR comment (auto or HITL — cannot be resolved)
pr-reply.sh issue <PR> <comment_id> "<reply>"
pr-reply.sh issue <PR> <comment_id> "<breakdown>" --label needs-decision
```

`--label` creates the label if missing, then adds it to the PR.

Every successful reply appends the comment id to the handled file.

### `scripts/pr-merge.sh [PR]`

Squash-merges and deletes the branch only when ALL hold:

- PR `OPEN`
- no `needs-decision` label
- `pr-threads.sh` returns empty `threads[]` and `comments[]`
- `pr-checks.sh` returns empty `failed[]` and `pending[]`

Exits non-zero otherwise. Do not call `gh pr merge` if this script refuses.

## State files

Two files, both under `.git/`, never committed:

| File                        | Role                                                              |
| --------------------------- | ----------------------------------------------------------------- |
| `pr-watch-<PR>-state.json`  | Σ — sufficient statistic for the next cycle (`state.sh`)          |
| `pr-watch-<PR>-handled.txt` | Dedupe only — one key per line (`mark-handled.sh`, `pr-reply.sh`) |

- Handled keys: comment ids or `ci:<name>@<sha>`. `pr-threads.sh` / `pr-checks.sh` skip them.
- To re-process a comment, remove its id from the handled file.
- HITL replies are marked handled (so they leave the next observe) but stay in `Σ.hitl` until the human decides. That is why Σ, not the handled file, blocks merge from the agent's side. `pr-merge.sh` still keys off the `needs-decision` label + empty threads/checks.

## Raw gh API equivalents

```bash
# PR state + labels
gh pr view <PR> --json state,labels

# Review threads (resolvable, inline) — GraphQL
gh api graphql -F owner=O -F repo=R -F num=PR -f query='query($owner:String!,$repo:String!,$num:Int!){repository(owner:$owner,name:$repo){pullRequest(number:$num){reviewThreads(first:100){nodes{id isResolved comments(first:50){nodes{databaseId author{login} body path line}}}}}}}'

# Reply inline (REST) — in_reply_to is a root review-comment databaseId
gh api repos/O/R/pulls/PR/comments -f body="..." -F in_reply_to=<id>

# Resolve a thread (GraphQL) — threadId is the node id (PRRT_...)
gh api graphql -F threadId=<gid> -f query='mutation($threadId:ID!){resolveReviewThread(input:{threadId:$threadId}){thread{isResolved}}}'

# General PR (issue-level) comment
gh api repos/O/R/issues/PR/comments -f body="..."

# Merge
gh pr merge <PR> --squash --delete-branch
```

## Notes

- Inline review comments use `repos/.../pulls/.../comments`; general PR comments use `repos/.../issues/.../comments`.
- `in_reply_to` must be a **root** comment id, not a nested reply.
- Only review **threads** can be resolved; general comments cannot — just reply.
- Requires `gh` authenticated and `jq` installed.
