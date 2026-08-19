#!/usr/bin/env bash
# Append handled keys to the PR state file so the next sweep skips them.
# Keys are comment ids (e.g. 12345) or CI keys (e.g. "ci:build@<sha>").
#
# Usage: mark-handled.sh <PR_NUMBER> <key> [<key> ...]
set -euo pipefail

PR="$1"; shift
[ $# -gt 0 ] || { echo "ERROR: need at least one key" >&2; exit 1; }
HANDLED="$(git rev-parse --git-dir)/pr-watch-${PR}-handled.txt"
for k in "$@"; do echo "$k" >> "$HANDLED"; done
echo "handled += $*"
