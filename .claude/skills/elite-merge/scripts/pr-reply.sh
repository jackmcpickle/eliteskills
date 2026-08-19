#!/usr/bin/env bash
# Reply to a PR review thread or general PR comment, mark it handled, and
# optionally add a PR label (for HITL escalation).
#
# Usage:
#   pr-reply.sh thread <PR> <root_comment_id> <body> [--resolve] [--thread-id <GID>] [--label <name>]
#       Reply inline on a review thread. --resolve closes it (GraphQL; needs --thread-id).
#   pr-reply.sh issue  <PR> <comment_id> <body> [--label <name>]
#       Reply to a general PR comment (posts a new issue comment; cannot be resolved).
#
# --label adds a PR-level label (creating it if missing). Use for HITL comments,
#   e.g. --label needs-decision.
# Every reply records the comment id in the handled state file so the next
#   pr-threads.sh sweep skips it.
set -euo pipefail

KIND="$1"; PR="$2"
read -r OWNER REPO < <(gh repo view --json owner,name -q '.owner.login + " " + .name')
HANDLED="$(git rev-parse --git-dir)/pr-watch-${PR}-handled.txt"
mark_handled() { echo "$1" >> "$HANDLED"; }
add_label() {  # best-effort: create label if missing, then add to PR
  [ -n "$1" ] || return 0
  gh label create "$1" --color C5DEF5 --description "Awaiting human decision" 2>/dev/null || true
  gh pr edit "$PR" --add-label "$1" >/dev/null
}

case "$KIND" in
  thread)
    ROOT="$3"; BODY="$4"; shift 4
    RESOLVE=false; THREAD_ID=""; LABEL=""
    while [ $# -gt 0 ]; do
      case "$1" in
        --resolve) RESOLVE=true ;;
        --thread-id) THREAD_ID="$2"; shift ;;
        --label) LABEL="$2"; shift ;;
      esac
      shift
    done
    gh api "repos/$OWNER/$REPO/pulls/$PR/comments" \
      -f body="$BODY" -F in_reply_to="$ROOT" >/dev/null
    if $RESOLVE; then
      [ -n "$THREAD_ID" ] || { echo "ERROR: --resolve needs --thread-id" >&2; exit 1; }
      gh api graphql -F threadId="$THREAD_ID" -f query='
        mutation($threadId:ID!){ resolveReviewThread(input:{threadId:$threadId}){ thread{ isResolved } } }' >/dev/null
    fi
    add_label "$LABEL"
    mark_handled "$ROOT"
    $RESOLVE && RESOLVED_NOTE=" (resolved)" || RESOLVED_NOTE=""
    echo "replied to thread root $ROOT${RESOLVED_NOTE}${LABEL:+ (label: $LABEL)}"
    ;;
  issue)
    CID="$3"; BODY="$4"; shift 4
    LABEL=""
    while [ $# -gt 0 ]; do
      case "$1" in --label) LABEL="$2"; shift ;; esac
      shift
    done
    gh api "repos/$OWNER/$REPO/issues/$PR/comments" -f body="$BODY" >/dev/null
    add_label "$LABEL"
    mark_handled "$CID"
    echo "replied to comment $CID${LABEL:+ (label: $LABEL)}"
    ;;
  *)
    echo "ERROR: first arg must be 'thread' or 'issue'" >&2; exit 1 ;;
esac
