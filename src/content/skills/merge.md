---
title: Merge
description: Watch a PR for agent reviews and CI, fix auto-addressable feedback, escalate HITL, and squash-merge only when green with no human decisions open.
icon: GitMerge
order: 12
released: true
isNew: true
highlights:
    - Poll unresolved review threads and general PR comments
    - Classify each item as auto-fix or HITL
    - Wait for review-bots (Greptile, Bugbot, Copilot) to post
    - Wait for CI to go green — failed and pending empty
    - Squash-merge only when the merge gate passes
    - Never auto-merge when needs-decision / HITL is open
    - gh scripts for threads, checks, replies, and the merge gate
    - SKILL.state — each cycle is skill spec + JSON state + latest observe only
structure:
    - REFERENCE.md
    - SKILL.md
    - scripts/
    - scripts/mark-handled.sh
    - scripts/pr-checks.sh
    - scripts/pr-merge.sh
    - scripts/pr-reply.sh
    - scripts/pr-threads.sh
    - scripts/state.sh
examples:
    - label: Watch this PR
      command: 'This PR'
    - label: Babysit reviews
      command: 'PR 42'
    - label: Fix failing CI
      command: 'PR 42, CI is currently red'
    - label: Do not merge HITL
      command: 'This PR, do not merge'
bestPractices:
    - Never merge when HITL is open or the PR has the needs-decision label
    - A pending review-bot means the review has not happened yet — keep polling
    - One commit per auto-fix; run the project pre-flight before every push
    - Use pr-merge.sh — do not call gh pr merge around a failed gate
    - Rebase onto main before fixing if the branch is stale or conflicted
    - Stop after three unchanged pending-check polls and escalate HITL
    - Next cycle is SKILL.md + state.json + latest observe — do not replay dumps
---
