# memobank

`memobank` is a single public setup skill for Codex CLI, Claude Code, and similar agent runtimes.

It turns a repository into a repo-local control plane:
- canonical memory in `.memory-bank/`
- resumable runtime memory in `.tasks/RUN-*`
- protocol memory in `.protocols/`
- generated repo commands in `.claude/skills/*` and `.agents/skills/*`
- provider bridges for BMAD, GSD, OpenSpec, Taskmaster, TEA, and Spec Kit

The public package is still one skill. Day-to-day work happens through generated repo-local commands.

## What v2 adds

Compared to the older flat file-based layout, v2 adds:
- `.memory-bank/system/memobank.yaml`
- `.memory-bank/system/providers.lock.json`
- `.memory-bank/system/commands.manifest.json`
- `.memory-bank/system/sync-state.json`
- `.memory-bank/system/provider-registry/*`
- `.tasks/RUN-*` runtime memory and checkpoints
- `.protocols/{claims,handoffs,verifications,stamps}`
- repo-local helper tools in `.memory-bank/tools/*`

## Requirements

- Node.js 20+
- `npm` / `npx`
- `uvx` only if you want managed `speckit`

## Two ways to use it

### 1. Use directly from this repo while developing memobank

Inside your target repository:

```bash
MEMOBANK="/absolute/path/to/memobank_work"
cd /absolute/path/to/your-repo
node "$MEMOBANK/skills/memobank/scripts/shared-init-mb.js" --preset greenfield-standard --doctor
node .memory-bank/tools/mb-update.mjs --execute
node .memory-bank/tools/mb-doctor.mjs --strict
```

### 2. Use as the installable single public skill

Inside your target repository:

```bash
npx -y skills add /absolute/path/to/memobank_work --skill memobank --yes
node .agents/skills/memobank/scripts/shared-init-mb.js --preset greenfield-standard --doctor
node .memory-bank/tools/mb-update.mjs --execute
node .memory-bank/tools/mb-doctor.mjs --strict
```

This is the closest to the real user flow.

## Presets / stacks

Supported stacks:
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
- `greenfield` -> `greenfield-standard`
- `brownfield` -> `brownfield-standard`
- `execution` -> `execution-only`

List them at any time:

```bash
node skills/_shared/scripts/init-mb.js --list-presets
node skills/_shared/scripts/init-mb.js --list-commands
```

## Recommended starting points

### Greenfield default

```bash
node skills/_shared/scripts/init-mb.js --preset greenfield-standard --doctor
node .memory-bank/tools/mb-update.mjs --execute
```

Then in Codex / Claude:

```text
/cold-start
/prd
/prd-to-tasks FT-001
/execute TASK-001
/verify
/mb-sync
```

### Brownfield default

```bash
node skills/_shared/scripts/init-mb.js --preset brownfield-standard --doctor
node .memory-bank/tools/mb-update.mjs --execute
```

Then:

```text
/cold-start
/map-codebase
/execute TASK-001
/verify
/mb-sync
```

### Fast bounded change

```bash
node skills/_shared/scripts/init-mb.js --preset fast --doctor
node .memory-bank/tools/mb-update.mjs --execute
```

Then:

```text
/fast-track
/verify
/mb-sync
```

## Provider model

Provider modes:
- `managed`
- `detect-import`
- `pattern-only`

Rules:
- `managed` means `provider-manager` / `mb-update` may install or initialize the provider.
- `detect-import` means memobank will not auto-install it; it only imports existing provider artifacts.
- `pattern-only` means logical bridge only, no install/import lifecycle.

Important defaults:
- `brownfield-standard` keeps `openspec` in `detect-import`
- `experimental-github` keeps `speckit` in `detect-import`

So for those stacks, `mb-update --execute` will skip provider install unless you explicitly override the mode.

## Forcing a provider into managed mode

### Managed OpenSpec in a brownfield repo

```bash
node skills/_shared/scripts/init-mb.js \
  --preset brownfield-standard \
  --provider-mode openspec=managed \
  --doctor

node .memory-bank/tools/mb-update.mjs --execute
```

### Managed Spec Kit in experimental-github

```bash
node skills/_shared/scripts/init-mb.js \
  --preset experimental-github \
  --provider-mode speckit=managed \
  --doctor

node .memory-bank/tools/mb-update.mjs --execute
```

## Provider behavior after fixes

- `bmad`: managed install works repo-locally
- `tea`: managed install works repo-locally
- `gsd`: managed install works repo-locally in `.codex/get-shit-done`
- `openspec`: managed install works with explicit repo init
- `taskmaster`: managed install works through noninteractive `npx -p task-master-ai ...`
- `speckit`: managed install works through noninteractive `uvx ... specify init --ai codex --force --no-git`

## Local helper tools

Setup copies these repo-local tools into `.memory-bank/tools/`:
- `init-mb.js`
- `provider-manager.mjs`
- `mb-lib.mjs`
- `mb-run.mjs`
- `mb-index.mjs`
- `mb-condense.mjs`
- `mb-doctor.mjs`
- `mb-update.mjs`

Useful commands:

```bash
node .memory-bank/tools/provider-manager.mjs status
node .memory-bank/tools/mb-update.mjs
node .memory-bank/tools/mb-update.mjs --execute
node .memory-bank/tools/mb-index.mjs
node .memory-bank/tools/mb-run.mjs status
node .memory-bank/tools/mb-doctor.mjs --strict
```

## Testing one provider in isolation

Example: OpenSpec only

```bash
node skills/_shared/scripts/init-mb.js \
  --preset core \
  --stack core \
  --providers spec=openspec \
  --provider-mode openspec=managed \
  --doctor

node .memory-bank/tools/provider-manager.mjs update --provider openspec --execute
node .memory-bank/tools/provider-manager.mjs status
node .memory-bank/tools/mb-doctor.mjs --strict
```

Example: Taskmaster only

```bash
node skills/_shared/scripts/init-mb.js \
  --preset core \
  --stack core \
  --providers tasks=taskmaster \
  --provider-mode taskmaster=managed \
  --doctor

node .memory-bank/tools/provider-manager.mjs update --provider taskmaster --execute
node .memory-bank/tools/mb-doctor.mjs --strict
```

## Daily workflow

After bootstrap:

```bash
codex -C /absolute/path/to/your-repo
```

Typical greenfield loop:
- `/cold-start`
- `/prd`
- `/prd-to-tasks FT-001`
- `/execute TASK-001`
- `/verify`
- `/mb-sync`

Typical brownfield loop:
- `/cold-start`
- `/map-codebase`
- `/execute TASK-001`
- `/verify`
- `/mb-sync`

Fast bounded loop:
- `/fast-track`
- `/verify`
- `/mb-sync`

## Validation

Always finish with:

```bash
node .memory-bank/tools/mb-doctor.mjs --strict
node .memory-bank/tools/provider-manager.mjs status
```

## Repo structure

```text
.memory-bank/
  system/
  product/
  architecture/
  knowledge/
  tasks/
  indexes/
  tools/
.tasks/
  RUN-0001/
.protocols/
  claims/
  handoffs/
  verifications/
  stamps/
```
