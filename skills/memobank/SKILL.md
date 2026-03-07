---
name: memobank
description: >
  Set up a repo-local Memory Bank and let the user choose which project commands to generate.
---

# memobank — single public setup skill

- **What it does:** installs the Memory Bank skeleton into the current repository and generates only the project commands the user wants.
- **Use it when:** you want one public skill entrypoint on `skills.sh`, then work through repo-local commands inside the target project.
- **Input:** repository root plus either a preset (`core`, `greenfield`, `brownfield`, `execution`, `autonomous`) or a custom command list.
- **Output:** `.memory-bank/`, `.tasks/`, `.protocols/`, `AGENTS.md`, and selected project commands exposed through `.claude/skills/*` and `.agents/skills/*`.

## Important distinction

- `memobank` is the **public package skill**.
- After setup, the real day-to-day workflow happens through **generated project commands** like `/cold-start`, `/prd`, `/execute`, `/verify`, `/review`, `/autonomous`, and `/mb-sync`.
- Internal flow modules remain in the repository source, but they are not published as separate installable skills.

## Presets

- `core` — minimal command set for syncing, review, and skill discovery
- `greenfield` — PRD-first product flow
- `brownfield` — existing codebase mapping flow
- `execution` — implementation and verification only
- `autonomous` — unattended full-flow command set
- `all` — every supported project command

## Available command names for custom setup

`cold-start`, `mb`, `mb-init`, `prd`, `prd-to-tasks`, `mb-from-prd`, `execute`, `mb-execute`, `verify`, `mb-verify`, `autopilot`, `autonomous`, `map-codebase`, `mb-map-codebase`, `mb-sync`, `discuss`, `add-tests`, `review`, `mb-review`, `mb-garden`, `mb-harness`, `find-skills`, `find-skill`

## Process

### 1) Detect target repository

- Work from the repository root.
- If `.memory-bank/` already exists, treat this as an **update** and use `--sync`.

### 2) Ask the user what to generate

If the user already specified a preset or explicit commands, use that directly.

Otherwise ask for one of:
- `core`
- `greenfield`
- `brownfield`
- `execution`
- `autonomous`
- `custom`

If `custom`, ask for a comma-separated command list from the available names above.

### 3) Run the helper script

Fresh setup:

```bash
node ./scripts/shared-init-mb.js --preset greenfield
```

Custom command list:

```bash
node ./scripts/shared-init-mb.js --commands prd,prd-to-tasks,execute,verify,review,mb-sync
```

Update existing setup:

```bash
node ./scripts/shared-init-mb.js --sync --preset brownfield
```

or

```bash
node ./scripts/shared-init-mb.js --sync --commands execute,verify,review,mb-sync
```

### 4) Tell the user the next command to run

- If `greenfield` is selected: start with `/cold-start` or `/prd`
- If `brownfield` is selected: start with `/cold-start` or `/map-codebase`
- If `execution` is selected: start with `/execute TASK-...`
- If `autonomous` is selected: start with `/autonomous`
- If `core` is selected: start with `/mb` or `/review`

## Notes

- This setup skill does **not** replace the repo-local command system; it creates it.
- The command selection changes only the generated project commands and proxies.
- The internal Memory Bank logic, templates, protocols, and workflows remain the same.
