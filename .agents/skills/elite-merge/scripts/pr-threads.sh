#!/usr/bin/env bash
# Fetch unresolved, unhandled PR review threads + general PR comments as JSON.
#
# Usage: pr-threads.sh [PR_NUMBER]
#   Defaults to the PR for the current branch.
#
# Output (stdout): {"state","threads":[...],"comments":[...]}
#   threads[]  = inline review threads (resolvable)
#   comments[] = general issue-level PR comments (not on a line, not resolvable)
#
# Filters out: resolved threads, threads/comments you (gh user) last authored,
#   and anything already recorded in the handled state file.
set -euo pipefail

PR="${1:-$(gh pr view --json number -q .number)}"
read -r OWNER REPO < <(gh repo view --json owner,name -q '.owner.login + " " + .name')
ME="$(gh api user -q .login)"
HANDLED="$(git rev-parse --git-dir)/pr-watch-${PR}-handled.txt"
touch "$HANDLED"
HANDLED_JSON="$(jq -R -s 'split("\n") | map(select(length > 0))' "$HANDLED")"

THREADS="$(gh api graphql -F owner="$OWNER" -F repo="$REPO" -F num="$PR" -f query='
query($owner:String!,$repo:String!,$num:Int!){
  repository(owner:$owner,name:$repo){
    pullRequest(number:$num){
      state
      reviewThreads(first:100){
        pageInfo{ hasNextPage }
        nodes{
        id isResolved isOutdated
        comments(first:50){ nodes{ databaseId author{login} body path line } }
      }}
    }
  }
}')"

if [ "$(jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage' <<<"$THREADS")" = "true" ]; then
  echo "WARNING: PR #$PR has >100 review threads; only the first 100 are processed." >&2
fi

ISSUE_COMMENTS="$(gh api "repos/$OWNER/$REPO/issues/$PR/comments" --paginate)"

jq -n \
  --argjson t "$THREADS" \
  --argjson c "$ISSUE_COMMENTS" \
  --argjson handled "$HANDLED_JSON" \
  --arg me "$ME" '
  ($t.data.repository.pullRequest) as $pr
  | {
    state: $pr.state,
    threads: [ $pr.reviewThreads.nodes[]
      | select(.isResolved | not)
      | { thread_id: .id, outdated: .isOutdated,
          root: .comments.nodes[0], last: .comments.nodes[-1] }
      | select((.root.databaseId | tostring) as $id | ($handled | index($id)) | not)
      | select(.last.author.login != $me)
      | { thread_id, outdated,
          comment_id: .root.databaseId,
          author: .root.author.login,
          path: .root.path, line: .root.line,
          body: .root.body } ],
    comments: [ $c[]
      | select((.id | tostring) as $id | ($handled | index($id)) | not)
      | select(.user.login != $me)
      | { comment_id: .id, author: .user.login, body: .body } ]
  }'
