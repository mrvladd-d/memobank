---
name: cold-start
description: >
  Bootstrap memobank v2 for a new or existing repository, then route into greenfield, brownfield, or fast-lane workflows.
---

# Cold Start — memobank v2 bootstrap

> `cold-start` is an internal source flow module.
> The public install entrypoint is still `memobank`, which generates repo-local commands.

## What it sets up
- `.memory-bank/` as canonical memory
- `.tasks/RUN-*` runtime model
- `.protocols/` contracts for handoff / verification / claims
- `.memory-bank/system/*` manifests and provider registry
- `.memory-bank/tools/*` local helper tools
- native proxy commands in `.claude/skills/*` and `.agents/skills/*`

## Decision tree
- **greenfield** → `/prd`
- **brownfield** → `/map-codebase`
- **small bounded change** → `/fast-track`
- **continuation of existing work** → `/mb-resume`

## Non-negotiables
1. `.memory-bank/` stays SSOT.
2. `.tasks/` is runtime memory, not curated truth.
3. `.protocols/` is the inter-agent contract.
4. External frameworks remain providers, not canonical docs.
5. Updates happen explicitly through `/mb-update`.

## Codex / Claude posture
- Default Codex harness target is GPT-5.4.
- Use built-in Codex `/fast` only for small bounded implementation work.
- Keep verification and sync in the standard flow.
