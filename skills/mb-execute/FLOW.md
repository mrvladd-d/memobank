---
name: mb-execute
description: >
  Execute one scoped work item through memobank v2 runtime checkpoints, verification, and sync.
---

# mb-execute — run/checkpoint execution loop

## Goal
Turn a scoped feature or task into a reproducible, resumable change with:
- explicit run state
- evidence-backed verification
- durable memory sync

## Required state
- canonical contract in `.memory-bank/product/features.json`
- backlog entry in `.memory-bank/tasks/backlog.md` if applicable
- active `RUN-*` in `.tasks/`
- verification + handoff artifacts in `.protocols/`

## Process
1. Prime with `/mb` and `/mb-resume`.
2. Open or resume a run.
3. Optionally claim file ownership when multiple agents work in parallel.
4. Implement the scoped change.
5. Write checkpoints during long runs.
6. Verify through `/verify`.
7. Create handoff if work continues elsewhere.
8. Finish with `/mb-sync`.

## Fast lane
For very small bounded changes, the generated command `/fast-track` can shortcut planning overhead.
Codex built-in `/fast` is allowed only inside that bounded implementation window.

## Model posture
- Default coding / review target: GPT-5.4
- Deep review: GPT-5.4 with `xhigh` reasoning effort via Codex config profile
