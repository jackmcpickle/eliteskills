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
structure:
    - SKILL.md
    - REFERENCE.md
    - scripts/pr-threads.sh
    - scripts/pr-checks.sh
    - scripts/pr-reply.sh
    - scripts/mark-handled.sh
    - scripts/pr-merge.sh
examples:
    - label: Watch this PR
      command: 'Watch this PR, address review comments, and merge when green'
    - label: Babysit reviews
      command: 'Babysit PR 42 until agent reviews land and CI is green, then merge'
    - label: Fix failing CI
      command: 'The PR build is red — fix what you can and keep polling'
    - label: Do not merge HITL
      command: 'Handle review feedback on this PR but do not merge if anything needs a human decision'
bestPractices:
    - Never merge when HITL is open or the PR has the needs-decision label
    - A pending review-bot means the review has not happened yet — keep polling
    - One commit per auto-fix; run the project pre-flight before every push
    - Use pr-merge.sh — do not call gh pr merge around a failed gate
    - Rebase onto main before fixing if the branch is stale or conflicted
    - Stop after three unchanged pending-check polls and escalate HITL
---
