#!/usr/bin/env bash
# Execution state (Σ) for elite-merge. Sufficient statistic for the next cycle.
#
# Usage:
#   state.sh init [PR]              create Σ if missing, print it
#   state.sh get [PR]               print current Σ
#   state.sh path [PR]              print state file path
#   state.sh observe [PR]           latest O (threads + checks + labels)
#   state.sh patch [PR]             apply JSON patch from stdin; overwrite Σ
#   state.sh summary [PR]           cycle summary derived from Σ
#   state.sh self-test              validate merge/gates without gh
#
# Path: $(git rev-parse --git-dir)/pr-watch-<PR>-state.json — not committed.
# Handled keys stay in pr-watch-<PR>-handled.txt (dedupe only).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

CMD="${1:-}"
shift || true

state_path() {
  local pr="$1"
  echo "$(git rev-parse --git-dir)/pr-watch-${pr}-state.json"
}

resolve_pr() {
  if [ -n "${1:-}" ]; then
    echo "$1"
  else
    gh pr view --json number -q .number
  fi
}

empty_state() {
  local pr="$1"
  jq -n --argjson pr "$pr" '{
    v: 1,
    pr: $pr,
    pr_state: "OPEN",
    head_sha: "",
    cycle: 0,
    needs_decision: false,
    hitl: [],
    open: { threads: [], comments: [], failed: [], pending: [] },
    pending_polls: {},
    review_bots: [],
    last_push_sha: null,
    counts: {
      auto_comments: 0,
      hitl: 0,
      ci_failed: 0,
      ci_fixed: 0,
      ci_escalated: 0,
      ci_pending: 0,
      pending_poll: 0,
      pushed_shas: []
    },
    ready_to_merge: false,
    merged: false,
    stop_reason: null
  }'
}

# Dictionary merge with null-deletion. Objects merge; arrays and scalars replace.
merge_patch() {
  jq -c --argjson patch "$1" '
    def merge(p):
      if (p | type) != "object" or (type) != "object" then p
      else
        reduce (p | keys_unsorted[]) as $k (.;
          if p[$k] == null then del(.[$k])
          else .[$k] = (.[$k] | merge(p[$k]))
          end)
      end;
    merge($patch)
  '
}

validate_state() {
  local msg
  msg="$(jq -r '
    def is_int: type == "number" and . == floor;
    def kinds: ["thread","comment","ci"];
    def criteria: ["design","ambiguous","high-blast-radius","disagree","flaky-ci","cant-reproduce","stuck-ci"];
    def stops: [null,"merged","hitl","not-open","stuck-ci"];
    def str_list: type == "array" and all(.[]; type == "string" or is_int);
    def hitl_ok:
      type == "array" and all(.[];
        (.id | type == "string" or is_int)
        and (.kind | IN(kinds[]))
        and (.criterion | IN(criteria[]))
        and (.locus | type == "string")
        and (.question | type == "string"));
    def polls_ok:
      type == "object" and all(to_entries[];
        (.value | type == "object")
        and (.value.count | is_int and . >= 0)
        and (.value.sha | type == "string"));
    if .v != 1 then "v must be 1"
    elif (.pr | is_int | not) then "pr must be an integer"
    elif (.pr_state | IN("OPEN","MERGED","CLOSED") | not) then "pr_state invalid"
    elif (.head_sha | type) != "string" then "head_sha must be a string"
    elif (.cycle | is_int and . >= 0 | not) then "cycle must be >= 0"
    elif (.needs_decision | type) != "boolean" then "needs_decision must be boolean"
    elif (.hitl | hitl_ok | not) then "hitl item missing id/kind/criterion/locus/question"
    elif (.open | type) != "object" then "open must be an object"
    elif (.open.threads | str_list | not) then "open.threads must be an id list"
    elif (.open.comments | str_list | not) then "open.comments must be an id list"
    elif (.open.failed | str_list | not) then "open.failed must be a name list"
    elif (.open.pending | str_list | not) then "open.pending must be a name list"
    elif (.pending_polls | polls_ok | not) then "pending_polls values must be {count, sha}"
    elif (.review_bots | type == "array" and all(.[]; type == "string") | not) then
      "review_bots must be a string array"
    elif (.last_push_sha != null and (.last_push_sha | type) != "string") then
      "last_push_sha must be string or null"
    elif (.counts | type) != "object" then "counts must be an object"
    elif ([.counts.auto_comments, .counts.hitl, .counts.ci_failed,
           .counts.ci_fixed, .counts.ci_escalated, .counts.ci_pending,
           .counts.pending_poll] | all(is_int and . >= 0) | not) then
      "counts numeric fields must be >= 0"
    elif (.counts.pushed_shas | type == "array" and all(.[]; type == "string") | not) then
      "counts.pushed_shas must be a string array"
    elif (.ready_to_merge | type) != "boolean" then "ready_to_merge must be boolean"
    elif (.merged | type) != "boolean" then "merged must be boolean"
    elif (.stop_reason | IN(stops[]) | not) then "stop_reason invalid"
    elif .ready_to_merge and (
        (.hitl | length) > 0
        or .needs_decision
        or (.review_bots | length) > 0
        or (.open.failed | length) > 0
        or (.open.pending | length) > 0
        or .pr_state != "OPEN"
        or .merged
      ) then "ready_to_merge blocked: HITL, needs-decision, review-bots, or CI not green"
    elif .merged and .stop_reason != "merged" then "merged requires stop_reason=merged"
    elif .ready_to_merge and (([.pending_polls | to_entries[] | .value.count] | max // 0) >= 3) then
      "ready_to_merge blocked: pending check stuck (>=3 polls)"
    else empty
    end
  ')" || {
    echo "ERROR: invalid state — not JSON" >&2
    return 1
  }
  if [ -n "$msg" ]; then
    echo "ERROR: invalid state — $msg" >&2
    return 1
  fi
}

write_state() {
  local path="$1" json="$2"
  printf '%s\n' "$json" | validate_state
  local tmp="${path}.tmp"
  printf '%s\n' "$json" | jq '.' >"$tmp"
  mv "$tmp" "$path"
}

cmd_init() {
  local pr path
  pr="$(resolve_pr "${1:-}")"
  path="$(state_path "$pr")"
  if [ ! -f "$path" ]; then
    write_state "$path" "$(empty_state "$pr")"
  else
    validate_state <"$path"
  fi
  jq '.' "$path"
}

cmd_get() {
  local pr path
  pr="$(resolve_pr "${1:-}")"
  path="$(state_path "$pr")"
  [ -f "$path" ] || { echo "ERROR: no state at $path — run state.sh init $pr" >&2; exit 1; }
  validate_state <"$path"
  jq '.' "$path"
}

cmd_path() {
  state_path "$(resolve_pr "${1:-}")"
}

cmd_observe() {
  local pr threads checks meta
  pr="$(resolve_pr "${1:-}")"
  threads="$(bash "$SCRIPT_DIR/pr-threads.sh" "$pr")"
  checks="$(bash "$SCRIPT_DIR/pr-checks.sh" "$pr")"
  meta="$(gh pr view "$pr" --json state,labels,headRefOid)"
  jq -n \
    --argjson threads "$threads" \
    --argjson checks "$checks" \
    --argjson meta "$meta" '
    def bot:
      test("greptile|bugbot|coderabbit|copilot review|copilot"; "i");
    {
      pr_state: $meta.state,
      labels: [ $meta.labels[]?.name ],
      head_sha: ($meta.headRefOid // $checks.head_sha),
      threads: $threads.threads,
      comments: $threads.comments,
      failed: $checks.failed,
      pending: $checks.pending,
      review_bots: [ $checks.pending[]?.name | select(bot) ]
    }'
}

cmd_patch() {
  local pr path current patch next
  pr="$(resolve_pr "${1:-}")"
  path="$(state_path "$pr")"
  [ -f "$path" ] || write_state "$path" "$(empty_state "$pr")"
  current="$(jq -c '.' "$path")"
  patch="$(cat)"
  [ -n "$patch" ] || { echo "ERROR: empty patch on stdin" >&2; exit 1; }
  jq -e . >/dev/null <<<"$patch" || { echo "ERROR: patch is not JSON" >&2; exit 1; }
  next="$(printf '%s\n' "$current" | merge_patch "$patch")"
  next="$(jq -c '
    .pending_polls //= {}
    | .open //= {threads:[],comments:[],failed:[],pending:[]}
    | .open.threads //= []
    | .open.comments //= []
    | .open.failed //= []
    | .open.pending //= []
    | .hitl //= []
    | .review_bots //= []
    | .counts //= {auto_comments:0,hitl:0,ci_failed:0,ci_fixed:0,ci_escalated:0,ci_pending:0,pending_poll:0,pushed_shas:[]}
  ' <<<"$next")"
  write_state "$path" "$next"
  jq '.' "$path"
}

cmd_summary() {
  local pr path
  pr="$(resolve_pr "${1:-}")"
  path="$(state_path "$pr")"
  [ -f "$path" ] || { echo "ERROR: no state at $path" >&2; exit 1; }
  validate_state <"$path"
  jq -r '
    def yn($b): if $b then "yes" else "no" end;
    def reason:
      if .ready_to_merge then "yes"
      elif .stop_reason == "hitl" or (.hitl | length) > 0 or .needs_decision then
        "no — HITL / needs-decision"
      elif .stop_reason == "not-open" then "no — PR \(.pr_state)"
      elif (.review_bots | length) > 0 then "no — review-bots pending"
      elif (.open.failed | length) > 0 then "no — CI failed"
      elif (.open.pending | length) > 0 then "no — CI pending"
      elif .stop_reason == "stuck-ci" then "no — CI/check stuck"
      elif .merged then "no — already merged"
      else "no"
      end;
    "PR #\(.pr) — cycle complete",
    "Ready to merge: \(reason)",
    "Merged: \(yn(.merged))",
    "Comments — auto-addressed: \(.counts.auto_comments) (pushed \(.counts.pushed_shas | join(" ") | if . == "" then "none" else . end)) · HITL: \(.counts.hitl)",
    "CI — failing: \(.counts.ci_failed) (fixed \(.counts.ci_fixed), escalated \(.counts.ci_escalated)) · pending: \(.counts.ci_pending) (poll \(.counts.pending_poll)/3)",
    "Review-bots pending: \(.review_bots | if length == 0 then "none" else join(", ") end)",
    "HITL awaiting decision:",
    (if (.hitl | length) == 0 then "  (none)"
     else .hitl | to_entries[] | "  \(.key + 1). [\(.value.criterion)] \(.value.locus) — \(.value.question)"
     end),
    (if .stop_reason == null and .merged == false then
        if .last_push_sha != null or (.open.pending | length) > 0
        then "Next poll in 30s."
        else "Next poll in 60s."
        end
     else empty end)
  ' "$path"
}

cmd_self_test() {
  local tmp pr=42 path ERR script
  script="$SCRIPT_DIR/state.sh"
  tmp="$(mktemp -d)"
  ERR="$(mktemp)"
  git init -q "$tmp"
  (
    cd "$tmp"
    path="$(git rev-parse --git-dir)/pr-watch-${pr}-state.json"
    bash "$script" init "$pr" >/dev/null
    [ -f "$path" ]

    echo '{"cycle":1,"head_sha":"abc","open":{"pending":["build"]}}' | bash "$script" patch "$pr" >/dev/null
    [ "$(jq -r '.cycle' "$path")" = "1" ]
    [ "$(jq -r '.open.pending[0]' "$path")" = "build" ]
    [ "$(jq -r '.pr_state' "$path")" = "OPEN" ]

    echo '{"last_push_sha":"def"}' | bash "$script" patch "$pr" >/dev/null
    echo '{"last_push_sha":null}' | bash "$script" patch "$pr" >/dev/null
    [ "$(jq -r '.last_push_sha' "$path")" = "null" ]

    expect_fail() {
      local msg="$1"
      if cat | bash "$script" patch "$pr" >/dev/null 2>"$ERR"; then
        echo "FAIL: accepted $msg" >&2
        exit 1
      fi
      grep -q "ready_to_merge blocked\\|invalid state\\|merged requires" "$ERR" \
        || { echo "FAIL: wrong error for $msg" >&2; cat "$ERR" >&2; exit 1; }
    }

    echo '{
      "hitl":[{"id":"1","kind":"thread","criterion":"design","locus":"a.ts:1","question":"api?"}],
      "ready_to_merge": true
    }' | expect_fail "ready_to_merge with HITL"

    echo '{"hitl":[],"review_bots":["Greptile"],"ready_to_merge":false}' | bash "$script" patch "$pr" >/dev/null
    echo '{"ready_to_merge":true}' | expect_fail "ready_to_merge with review-bots"

    echo '{"review_bots":[],"open":{"pending":["lint"]}}' | bash "$script" patch "$pr" >/dev/null
    echo '{"ready_to_merge":true}' | expect_fail "ready_to_merge with pending CI"

    echo '{"open":{"pending":[]},"pending_polls":{"lint":{"count":3,"sha":"abc"}}}' | bash "$script" patch "$pr" >/dev/null
    echo '{"ready_to_merge":true}' | expect_fail "ready_to_merge with stuck polls"

    echo '{
      "pending_polls": null,
      "open":{"threads":[],"comments":[],"failed":[],"pending":[]},
      "review_bots":[],
      "hitl":[],
      "needs_decision": false,
      "ready_to_merge": true
    }' | bash "$script" patch "$pr" >/dev/null
    [ "$(jq -r '.ready_to_merge' "$path")" = "true" ]
    bash "$script" summary "$pr" | grep -q "Ready to merge: yes"

    echo '{"ready_to_merge":false,"merged":true,"stop_reason":"merged"}' | bash "$script" patch "$pr" >/dev/null
    bash "$script" summary "$pr" | grep -q "Merged: yes"

    echo '{"merged":true,"stop_reason":"hitl"}' | expect_fail "merged with wrong stop_reason"
  )
  rm -rf "$tmp" "$ERR"
  echo "state.sh self-test ok"
}

case "$CMD" in
  init) cmd_init "${1:-}" ;;
  get) cmd_get "${1:-}" ;;
  path) cmd_path "${1:-}" ;;
  observe) cmd_observe "${1:-}" ;;
  patch) cmd_patch "${1:-}" ;;
  summary) cmd_summary "${1:-}" ;;
  self-test) cmd_self_test ;;
  *)
    echo "Usage: state.sh init|get|path|observe|patch|summary|self-test [PR]" >&2
    exit 1
    ;;
esac
