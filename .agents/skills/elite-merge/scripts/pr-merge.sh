#!/usr/bin/env bash
# Squash-merge a PR only when reviews are in, CI is green, and no HITL.
#
# Usage: pr-merge.sh [PR_NUMBER]
#   Defaults to the PR for the current branch.
#
# Exits 0 after a successful squash merge + branch delete.
# Exits non-zero if any merge-gate check fails — do not merge around this.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PR="${1:-$(gh pr view --json number -q .number)}"

META="$(gh pr view "$PR" --json state,labels)"
STATE="$(jq -r '.state' <<<"$META")"
if [ "$STATE" != "OPEN" ]; then
  echo "ERROR: PR #$PR is $STATE — not merging" >&2
  exit 1
fi

if jq -e '.labels | map(.name) | index("needs-decision")' <<<"$META" >/dev/null; then
  echo "ERROR: PR #$PR has needs-decision (HITL) — not merging" >&2
  exit 1
fi

THREADS="$(bash "$SCRIPT_DIR/pr-threads.sh" "$PR")"
THREAD_N="$(jq '.threads | length' <<<"$THREADS")"
COMMENT_N="$(jq '.comments | length' <<<"$THREADS")"
if [ "$THREAD_N" -gt 0 ] || [ "$COMMENT_N" -gt 0 ]; then
  echo "ERROR: PR #$PR has unhandled review comments (threads=$THREAD_N comments=$COMMENT_N) — not merging" >&2
  exit 1
fi

CHECKS="$(bash "$SCRIPT_DIR/pr-checks.sh" "$PR")"
FAILED="$(jq '.failed | length' <<<"$CHECKS")"
PENDING="$(jq '.pending | length' <<<"$CHECKS")"
if [ "$FAILED" -gt 0 ] || [ "$PENDING" -gt 0 ]; then
  echo "ERROR: PR #$PR is not green (failed=$FAILED pending=$PENDING) — not merging" >&2
  exit 1
fi

gh pr merge "$PR" --squash --delete-branch
echo "merged PR #$PR (squash)"
