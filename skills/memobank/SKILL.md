---
name: memobank
description: >
  Set up memobank v2 in the current repository: canonical memory, runtime checkpoints, protocol contracts,
  and optional provider bridges.
---

# memobank — single public setup skill

- **What it does:** installs the memobank v2 skeleton into the current repository and generates only the project commands the user wants.
- **Use it when:** you want one public skill entrypoint on `skills.sh`, then work through repo-local commands inside the target project.
- **Input:** repository root plus either a preset / stack (`core`, `fast`, `greenfield-*`, `brownfield-*`, `execution-only`, `autonomous`, `experimental-github`) or a custom command list.
- **Output:** `.memory-bank/`, `.tasks/`, `.protocols/`, `AGENTS.md`, local helper tools, provider registry, and selected project commands exposed through `.claude/skills/*` and `.agents/skills/*`.

## Important distinction

- `memobank` is the **public package skill**.
- After setup, the day-to-day workflow happens through **generated project commands** like `/mb`, `/execute`, `/verify`, `/mb-status`, `/mb-resume`, `/mb-update`, `/mb-sync`, and `/fast-track`.
- External frameworks such as BMAD, GSD, OpenSpec, Taskmaster, TEA, and Spec Kit stay behind the **provider bridge layer**.
- Canonical truth remains in `.memory-bank/`.

## Presets / stacks

Primary stacks:
- `core`
- `fast`
- `greenfield-lite`
- `greenfield-standard`
- `greenfield-heavy`
- `brownfield-lite`
- `brownfield-standard`
- `brownfield-heavy`
- `execution-only`
- `autonomous`
- `experimental-github`

Backwards-compatible aliases:
- `greenfield` → `greenfield-standard`
- `brownfield` → `brownfield-standard`
- `execution` → `execution-only`

## Available command names for custom setup

`cold-start`, `mb`, `mb-init`, `prd`, `prd-to-tasks`, `mb-from-prd`, `execute`, `mb-execute`, `verify`, `mb-verify`, `autopilot`, `autonomous`, `map-codebase`, `mb-map-codebase`, `mb-sync`, `discuss`, `add-tests`, `review`, `mb-review`, `mb-garden`, `mb-harness`, `find-skills`, `find-skill`, `mb-status`, `mb-update`, `mb-resume`, `mb-checkpoint`, `mb-handoff`, `mb-doctor`, `fast-track`

## Process

### 1) Detect target repository

- Work from the repository root.
- If `.memory-bank/` already exists, treat this as an **update** and use `--sync`.

### 2) Ask the user what to generate

If the user already specified a preset or explicit commands, use that directly.

Otherwise ask for one of:
- `core`
- `fast`
- `greenfield-standard`
- `brownfield-standard`
- `execution-only`
- `autonomous`
- `custom`

If `custom`, ask for a comma-separated command list from the available names above.

### 3) Run the helper script

Fresh setup:

```bash
node ./scripts/shared-init-mb.js --preset greenfield-standard
```

Fast lane setup:

```bash
node ./scripts/shared-init-mb.js --preset fast
```

Custom command list:

```bash
node ./scripts/shared-init-mb.js --stack brownfield-standard --commands mb,map-codebase,execute,verify,review,mb-sync,mb-status,mb-resume,mb-update
```

Update existing setup:

```bash
node ./scripts/shared-init-mb.js --sync --preset brownfield-standard
```

Or sync only generated artifacts:

```bash
node ./scripts/shared-init-mb.js --sync --sync-scope generated --preset greenfield-standard
```

### 4) Tell the user the next command to run

- If `greenfield-*` is selected: start with `/cold-start` or `/prd`
- If `brownfield-*` is selected: start with `/cold-start` or `/map-codebase`
- If `fast` is selected: start with `/fast-track`
- If `execution-only` is selected: start with `/execute TASK-...`
- If `autonomous` is selected: start with `/autonomous`
- If `core` is selected: start with `/mb` or `/mb-status`

## Notes

- This setup skill does **not** replace the repo-local command system; it creates it.
- The command selection changes the generated project commands and proxies.
- `memobank v2` also writes:
  - `.memory-bank/system/memobank.yaml`
  - `.memory-bank/system/providers.lock.json`
  - `.memory-bank/system/commands.manifest.json`
  - `.memory-bank/system/provider-registry/*`
  - `.memory-bank/tools/*`
- Use `/mb-update` for explicit core/provider upgrades.
