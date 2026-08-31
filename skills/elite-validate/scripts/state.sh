#!/usr/bin/env bash
# Execution state (Σ) for elite-validate. Sufficient statistic for the next step.
#
# Usage:
#   state.sh init                   create Σ if missing, print it
#   state.sh get                    print current Σ
#   state.sh path                   print state file path
#   state.sh patch                  apply JSON patch from stdin; overwrite Σ
#   state.sh summary                phase summary derived from Σ
#   state.sh self-test              validate phase gates
#
# Path: $(git rev-parse --git-dir)/elite-validate-state.json — not committed.
# If not in a git repo: ${VALIDATE_STATE:-.elite-validate-state.json} (do not commit).
set -euo pipefail

CMD="${1:-}"
shift || true

state_path() {
  if git rev-parse --git-dir >/dev/null 2>&1; then
    echo "$(git rev-parse --git-dir)/elite-validate-state.json"
  else
    echo "${VALIDATE_STATE:-.elite-validate-state.json}"
  fi
}

empty_state() {
  jq -n '{
    v: 1,
    phase: "prerequisites",
    approved: false,
    persona: { name: null, role: null, tenant: null, source: null },
    stories: [],
    e2e_root: null,
    slug: null,
    base_url: "http://localhost:3000",
    headed: true,
    pm: null,
    playwright_dep: false,
    chromium: false,
    start_cmd: null,
    app_ok: false,
    seed_cmd: null,
    seed_ran: false,
    helpers_path: null,
    artifacts_ignored: false,
    story_index: 0,
    last_capture: null,
    passed: null,
    error: null,
    presentation: null,
    results_json: null,
    last_screenshot: null,
    blockers: [],
    stop_reason: null
  }'
}

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
    def phases: ["prerequisites","discovery","environment","author","run","share","done","blocked"];
    def sources: [null,"seed","env","none"];
    def stops: [null,"blocked","done","aborted"];
    def str_or_null: . == null or type == "string";
    def bool_or_null: . == null or type == "boolean";
    def story_ok:
      type == "object"
      and (.id | is_int)
      and (.title | type == "string")
      and (.status | IN("pending","authored","passed","failed"));
    if .v != 1 then "v must be 1"
    elif (.phase | IN(phases[]) | not) then "phase invalid"
    elif (.approved | type) != "boolean" then "approved must be boolean"
    elif (.persona | type) != "object" then "persona must be an object"
    elif (.persona.name | str_or_null | not) then "persona.name must be string or null"
    elif (.persona.role | str_or_null | not) then "persona.role must be string or null"
    elif (.persona.tenant | str_or_null | not) then "persona.tenant must be string or null"
    elif (.persona.source | IN(sources[]) | not) then "persona.source invalid"
    elif (.stories | type == "array" and all(.[]; story_ok) | not) then
      "stories must be [{id, title, status}]"
    elif (.e2e_root | str_or_null | not) then "e2e_root must be string or null"
    elif (.slug | str_or_null | not) then "slug must be string or null"
    elif (.base_url | type) != "string" then "base_url must be a string"
    elif (.headed | type) != "boolean" then "headed must be boolean"
    elif (.pm | str_or_null | not) then "pm must be string or null"
    elif (.playwright_dep | type) != "boolean" then "playwright_dep must be boolean"
    elif (.chromium | type) != "boolean" then "chromium must be boolean"
    elif (.start_cmd | str_or_null | not) then "start_cmd must be string or null"
    elif (.app_ok | type) != "boolean" then "app_ok must be boolean"
    elif (.seed_cmd | str_or_null | not) then "seed_cmd must be string or null"
    elif (.seed_ran | type) != "boolean" then "seed_ran must be boolean"
    elif (.helpers_path | str_or_null | not) then "helpers_path must be string or null"
    elif (.artifacts_ignored | type) != "boolean" then "artifacts_ignored must be boolean"
    elif (.story_index | is_int and . >= 0 | not) then "story_index must be >= 0"
    elif (.last_capture | str_or_null | not) then "last_capture must be string or null"
    elif (.passed | bool_or_null | not) then "passed must be boolean or null"
    elif (.error | str_or_null | not) then "error must be string or null"
    elif (.presentation | str_or_null | not) then "presentation must be string or null"
    elif (.results_json | str_or_null | not) then "results_json must be string or null"
    elif (.last_screenshot | str_or_null | not) then "last_screenshot must be string or null"
    elif (.blockers | type == "array" and all(.[]; type == "string") | not) then
      "blockers must be a string array"
    elif (.stop_reason | IN(stops[]) | not) then "stop_reason invalid"
    elif .approved and (
        (.persona.name | type != "string" or length == 0)
        or (.stories | length) == 0
      ) then "approved requires persona.name and at least one story"
    elif (.phase | IN("environment","author","run","share","done")) and (
        .pm == null
        or .playwright_dep != true
        or .chromium != true
        or .e2e_root == null
        or .artifacts_ignored != true
        or .approved != true
      ) then "phase \(.phase) blocked: prerequisites + user approval required"
    elif (.phase | IN("author","run","share","done")) and (.slug == null or .slug == "") then
      "phase \(.phase) blocked: slug required"
    elif (.phase | IN("author","run","share","done")) and .app_ok != true then
      "phase \(.phase) blocked: environment not verified (app_ok)"
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
  local path
  path="$(state_path)"
  if [ ! -f "$path" ]; then
    write_state "$path" "$(empty_state)"
  else
    validate_state <"$path"
  fi
  jq '.' "$path"
}

cmd_get() {
  local path
  path="$(state_path)"
  [ -f "$path" ] || { echo "ERROR: no state at $path — run state.sh init" >&2; exit 1; }
  validate_state <"$path"
  jq '.' "$path"
}

cmd_path() {
  state_path
}

cmd_patch() {
  local path current patch next
  path="$(state_path)"
  [ -f "$path" ] || write_state "$path" "$(empty_state)"
  current="$(jq -c '.' "$path")"
  patch="$(cat)"
  [ -n "$patch" ] || { echo "ERROR: empty patch on stdin" >&2; exit 1; }
  jq -e . >/dev/null <<<"$patch" || { echo "ERROR: patch is not JSON" >&2; exit 1; }
  next="$(printf '%s\n' "$current" | merge_patch "$patch")"
  next="$(jq -c '
    .persona //= {name:null,role:null,tenant:null,source:null}
    | .stories //= []
    | .blockers //= []
  ' <<<"$next")"
  write_state "$path" "$next"
  jq '.' "$path"
}

cmd_summary() {
  local path
  path="$(state_path)"
  [ -f "$path" ] || { echo "ERROR: no state at $path" >&2; exit 1; }
  validate_state <"$path"
  jq -r '
    def yn($b): if $b == true then "yes" elif $b == false then "no" else "—" end;
    "elite-validate — \(.phase)",
    "Approved: \(yn(.approved))",
    "Persona: \(.persona.name // "—") (\(.persona.role // "—"), \(.persona.tenant // "—"))",
    "Stories: \(.stories | length) (current index \(.story_index))",
    "e2e-root/slug: \(.e2e_root // "—")/\(.slug // "—")",
    "BASE_URL: \(.base_url)  headed: \(yn(.headed))  pm: \(.pm // "—")",
    "Playwright: dep \(yn(.playwright_dep))  chromium \(yn(.chromium))",
    "App: \(.start_cmd // "—") responding \(yn(.app_ok))",
    "Seed: \(.seed_cmd // "none") ran \(yn(.seed_ran))",
    "Last capture: \(.last_capture // "—")",
    "Pass/fail: \(yn(.passed))\(.error | if . then " — \(.)" else "" end)",
    "Presentation: \(.presentation // "—")",
    "Last screenshot: \(.last_screenshot // "—")",
    "Blockers: \(.blockers | if length == 0 then "none" else join("; ") end)",
    (if .stop_reason != null then "Stop: \(.stop_reason)" else empty end)
  ' "$path"
}

cmd_self_test() {
  local tmp path ERR script
  script="$(cd "$(dirname "$0")" && pwd)/state.sh"
  tmp="$(mktemp -d)"
  ERR="$(mktemp)"
  git init -q "$tmp"
  (
    cd "$tmp"
    path="$(git rev-parse --git-dir)/elite-validate-state.json"
    bash "$script" init >/dev/null
    [ -f "$path" ]
    [ "$(jq -r '.phase' "$path")" = "prerequisites" ]

    echo '{"pm":"pnpm","playwright_dep":true,"chromium":true,"e2e_root":"e2e","artifacts_ignored":true}' \
      | bash "$script" patch >/dev/null

    if echo '{"phase":"author"}' | bash "$script" patch >/dev/null 2>"$ERR"; then
      echo "FAIL: author before approval" >&2
      exit 1
    fi
    grep -q "prerequisites + user approval" "$ERR"

    if echo '{"approved":true}' | bash "$script" patch >/dev/null 2>"$ERR"; then
      echo "FAIL: approved without persona/stories" >&2
      exit 1
    fi
    grep -q "approved requires" "$ERR"

    echo '{
      "persona":{"name":"member","role":"member","tenant":"acme","source":"seed"},
      "stories":[{"id":1,"title":"login","status":"pending"}],
      "approved": true,
      "phase": "discovery"
    }' | bash "$script" patch >/dev/null

    if echo '{"phase":"author"}' | bash "$script" patch >/dev/null 2>"$ERR"; then
      echo "FAIL: author without slug" >&2
      exit 1
    fi
    grep -q "slug required" "$ERR"

    echo '{"slug":"login-member"}' | bash "$script" patch >/dev/null
    if echo '{"phase":"author"}' | bash "$script" patch >/dev/null 2>"$ERR"; then
      echo "FAIL: author before environment" >&2
      exit 1
    fi
    grep -q "environment not verified" "$ERR"

    echo '{"phase":"environment","app_ok":true,"start_cmd":"pnpm dev"}' | bash "$script" patch >/dev/null
    echo '{"phase":"author"}' | bash "$script" patch >/dev/null
    [ "$(jq -r '.phase' "$path")" = "author" ]

    echo '{"phase":"run","story_index":0,"last_capture":"01-login"}' | bash "$script" patch >/dev/null
    echo '{"passed":false,"error":"timeout","last_screenshot":"e2e/login-member/artifacts/screenshots/01-login.png"}' \
      | bash "$script" patch >/dev/null
    bash "$script" summary | grep -q "Pass/fail: no — timeout"

    if echo '{"phase":"environment","approved":false}' | bash "$script" patch >/dev/null 2>"$ERR"; then
      echo "FAIL: environment without approval" >&2
      exit 1
    fi
    grep -q "prerequisites + user approval" "$ERR"
  )
  rm -rf "$tmp" "$ERR"
  echo "state.sh self-test ok"
}

case "$CMD" in
  init) cmd_init ;;
  get) cmd_get ;;
  path) cmd_path ;;
  patch) cmd_patch ;;
  summary) cmd_summary ;;
  self-test) cmd_self_test ;;
  *)
    echo "Usage: state.sh init|get|path|patch|summary|self-test" >&2
    exit 1
    ;;
esac
