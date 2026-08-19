#!/usr/bin/env bash
# Fetch failing + pending CI checks for a PR as JSON, filtering checks already
# handled for the current head commit.
#
# Usage: pr-checks.sh [PR_NUMBER]   (defaults to current branch's PR)
#
# Output (stdout):
#   { "head_sha": "...",
#     "failed":  [ {name, conclusion, url, workflow} ],   # actionable
#     "pending": [ {name, url} ] }                          # still running
#
# A failed check is filtered out once "ci:<name>@<head_sha>" is in the handled
# state file (see mark-handled.sh), so the same failure isn't re-processed
# before a new commit re-runs CI.
set -euo pipefail

PR="${1:-$(gh pr view --json number -q .number)}"
SHA="$(gh pr view "$PR" --json headRefOid -q .headRefOid)"
HANDLED="$(git rev-parse --git-dir)/pr-watch-${PR}-handled.txt"
touch "$HANDLED"
HANDLED_JSON="$(jq -R -s 'split("\n") | map(select(length > 0))' "$HANDLED")"

gh pr view "$PR" --json statusCheckRollup \
| jq --arg sha "$SHA" --argjson handled "$HANDLED_JSON" '
  def norm:
    { name: (.name // .context),
      status: (.status // (if (.state == "PENDING") then "IN_PROGRESS" else "COMPLETED" end)),
      conclusion: (.conclusion // .state),
      url: (.detailsUrl // .targetUrl // null),
      workflow: (.workflowName // null) };
  ["FAILURE","TIMED_OUT","CANCELLED","ACTION_REQUIRED","STARTUP_FAILURE","ERROR"] as $fail
  | [ (.statusCheckRollup // [])[] | norm ] as $all
  | { head_sha: $sha,
      failed: [ $all[]
        | select(.conclusion as $c | $fail | index($c))
        | select(("ci:" + .name + "@" + $sha) as $k | ($handled | index($k)) | not)
        | {name, conclusion, url, workflow} ],
      pending: [ $all[]
        | select(.status != "COMPLETED")
        | select(.conclusion as $c | ($fail | index($c)) | not)
        | {name, url} ] }'
