---
name: mb-harness
description: >
  Set up a deterministic harness for coding agents: local tools, quality gates, fast-lane profile, and repo-level configs.
---

# mb-harness — harness engineering for memobank v2

## Goal
Make the repository safe and repeatable for long-running agent work.

## What the harness should provide
- `.codex/config.toml` with GPT-5.4 defaults
- a `fast-lane` profile for bounded work
- a `deep-review` profile for tougher passes
- deterministic build / lint / test commands in `AGENTS.md`
- repo-local helper tools in `.memory-bank/tools/`
- protocol discipline for claims / handoffs / verification

## Required checks
- build / lint / typecheck / tests are documented
- browser verification path exists for UI projects
- runtime evidence is stored in `.tasks/RUN-*`
- `mb-doctor` and `mb-index` can run locally

## Notes
This flow is about the harness around the repo, not about turning provider frameworks into truth.
