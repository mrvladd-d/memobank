# memobank v2 — implemented changes

## What was added

### 1. Control-plane system layer
- `.memory-bank/system/memobank.yaml`
- `.memory-bank/system/providers.lock.json`
- `.memory-bank/system/commands.manifest.json`
- `.memory-bank/system/sync-state.json`
- `.memory-bank/system/schemas/*`
- `.memory-bank/system/provider-registry/*`

### 2. Runtime / protocol layer
- `.tasks/templates/RUN-TEMPLATE/*`
- `.protocols/claims/`
- `.protocols/handoffs/`
- `.protocols/verifications/`
- `.protocols/stamps/`
- `.protocols/templates/*`

### 3. Repo-local helper tools
- `.memory-bank/tools/init-mb.js`
- `.memory-bank/tools/provider-manager.mjs`
- `.memory-bank/tools/mb-lib.mjs`
- `.memory-bank/tools/mb-run.mjs`
- `.memory-bank/tools/mb-index.mjs`
- `.memory-bank/tools/mb-condense.mjs`
- `.memory-bank/tools/mb-doctor.mjs`
- `.memory-bank/tools/mb-update.mjs`

### 4. New command surface
Added memobank-native commands:
- `/mb-status`
- `/mb-update`
- `/mb-resume`
- `/mb-checkpoint`
- `/mb-handoff`
- `/mb-doctor`
- `/fast-track`

### 5. New presets / stacks
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

Aliases preserved:
- `greenfield`
- `brownfield`
- `execution`

### 6. Provider bridge registry
Added provider manifests, import maps, and install docs for:
- BMAD
- TEA
- GSD
- OpenSpec
- Taskmaster
- Spec Kit

### 7. Fast lane
Added first-class fast-lane flow:
- `skills/mb-fast/FLOW.md`
- `/fast-track`
- `.codex/config.toml` defaults updated to GPT-5.4 with `fast-lane` and `deep-review` profiles

### 8. CI
Updated / added:
- `.github/workflows/release-check.yml`
- `.github/workflows/providers-fixtures.yml`
- `.github/workflows/providers-canary.yml`
- `.github/fixtures/providers/*`

## What changed in docs
- `README.md`
- `MEMOBANK_CURRENT_ARCHITECTURE_RU.md`
- `skills/memobank/SKILL.md`
- core flow docs (`cold-start`, `mb-execute`, `mb-harness`)
- main command templates and workflow docs

## What was tested locally
- syntax check for all new shared scripts
- source init smoke: `--preset fast`, `--preset greenfield-standard`
- shared/public init smoke via `skills/memobank/scripts/shared-init-mb.js`
- `mb-doctor --strict`
- `mb-run resume`
- `mb-run checkpoint`
- `mb-condense`
- `mb-index`
- `provider-manager import --provider openspec`

## Important note
The provider bridge lifecycle is implemented as a real local control layer, but actual upstream provider installation/update still depends on the external tools being available in the target environment. That part is intentionally explicit and opt-in via `/mb-update` / `provider-manager.mjs`.
