# Project Map For Agents

## Read First

Before changing this repository, reaad:

- `README.en.md`
- `package.json`
- `scripts/install-framework.mjs`
- `scripts/vendor-shared.mjs`
- `.github/workflows/release-check.yml`

If the task mentions schema-backed tasks, task records, task queues, scheduler, autopilot, or autonomous execution, also read `Optimisation.md` as planning context only. It is not automatically an implementation instruction.

## Core Invariant: Source-Only Skill Packaging

This fork intentionally does not commit generated package-local `shared-*` files.

Current source tree:

```text
skills/_shared/...        canonical shared source
skills/<skill>/SKILL.md   package skill entrypoints
skills/<skill>/shared-*   not committed in source-only form
```

Installation and CI generate the missing package-local copies in a temporary prepared repository:

```text
source-only repo
  -> scripts/install-framework.mjs
  -> temporary repo copy
  -> scripts/vendor-shared.mjs
  -> generated shared-* files for installable skills
  -> npx -y skills add <prepared-temp-repo> ...
```

Do not edit or commit generated `skills/*/{agents,references,scripts}/shared-*` files. If shared behavior needs to change, edit `skills/_shared/...`.

## File Ownership Map

Root documentation:

- `README.md`: canonical English user documentation and entrypoint.
- `README.en.md`: English mirror kept for explicit language links.
- `README.ru.md`: detailed Russian beginner guide and launch instructions.
- `PROJECT_MAP.md`: this file, intended as agent priming.
- `Optimisation.md`: future task-schema plan context, not standing instructions.

Packaging and install:

- `package.json`: package bin and scripts.
- `scripts/install-framework.mjs`: correct installer for this fork; no args starts the interactive one-command install/bootstrap flow, explicit `--skill ... --yes` preserves legacy install-only behavior, and every path prepares a temporary vendored repo before `skills add`.
- `scripts/vendor-shared.mjs`: generator that copies `skills/_shared` files into every installable skill package.
- `.github/workflows/release-check.yml`: CI source-only hygiene, syntax checks, install smoke, bootstrap smoke.

Canonical shared source:

- `skills/_shared/agents/*.md`: shared worker/reviewer prompts.
- `skills/_shared/references/commands/*.md`: command specs copied into generated Memory Bank skeletons.
- `skills/_shared/references/protocols/*.md`: protocol templates.
- `skills/_shared/references/structure-template.md`: Memory Bank structure reference.
- `skills/_shared/scripts/init-mb.js`: Memory Bank bootstrap/sync generator.

Installable skill entrypoints:

- `skills/cold-start/SKILL.md`
- `skills/mb-analysis/SKILL.md`
- `skills/mb-init/SKILL.md`
- `skills/mb-from-prd/SKILL.md`
- `skills/mb-map-codebase/SKILL.md`
- `skills/mb-execute/SKILL.md`
- `skills/mb-verify/SKILL.md`
- `skills/mb-red-verify/SKILL.md`
- `skills/mb-review/SKILL.md`
- `skills/mb-garden/SKILL.md`
- `skills/mb-harness/SKILL.md`

Skill-specific non-shared assets:

- `skills/mb-analysis/assets/*.md`: analysis index, brainstorming, and product brief templates.
- `skills/mb-garden/assets/mb-lint.mjs`: packaged deterministic Memory Bank structural/mechanical hygiene linter.
- `skills/mb-garden/assets/mb-doctor.mjs`: current packaged location for the deterministic workflow/autonomous readiness check over `mb-lint`.
- `skills/mb-garden/assets/memory-bank-lint.yml`: related lint config asset.
- `skills/mb-harness/assets/codex-config.toml`: Codex harness config template.
- `skills/mb-from-prd/references/*.md`: PRD decomposition templates.
- `skills/mb-map-codebase/references/*.md`: mapping/synthesis references.
- `skills/mb-verify/agents/verifier.md`: verifier-specific agent prompt.

## JSON Task Registry Work Hotspots

For updates that change the JSON-only task registry or indexed task record model, expect the main touch points to be:

- `skills/_shared/scripts/init-mb.js`
- `skills/_shared/references/structure-template.md`
- `skills/_shared/references/commands/write-prd.md`
- `skills/_shared/references/commands/clarify-feature.md`
- `skills/_shared/references/commands/prd-to-tasks.md`
- `skills/_shared/references/commands/autopilot.md`
- `skills/_shared/references/commands/autonomous.md`
- `skills/_shared/references/commands/execute.md`
- `skills/_shared/references/commands/verify.md`
- `skills/_shared/references/commands/mb-sync.md`
- `skills/mb-garden/assets/mb-lint.mjs` (packaged deterministic lint asset)
- `skills/mb-garden/assets/mb-doctor.mjs` (current packaged deterministic readiness asset)
- `.github/workflows/release-check.yml`
- `README.en.md`, `README.ru.md`

Task planning is JSON-only: `.memory-bank/tasks/index.json` indexes `.memory-bank/tasks/TASK-*.task.json` records, and commands must treat those records as the only task model.

## Verification Commands

Fast syntax/source-only check:

```bash
npm run check:syntax --silent
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
```

The second command should print `0` in the source-only working tree.

Install smoke without mutating the working repository:

```bash
node scripts/install-framework.mjs --skill '*' --yes
```

One-command bootstrap smoke:

```bash
tmpdir="$(mktemp -d)"; node scripts/install-framework.mjs --bootstrap --target "$tmpdir" --yes
test -f "$tmpdir/.memory-bank/tasks/index.json"
test -f "$tmpdir/AGENTS.md"
```

To inspect the generated temporary package tree during installer debugging:

```bash
MEMOBANK_KEEP_INSTALL_TMP=1 node scripts/install-framework.mjs --skill '*' --yes
```

## Dirty Worktree Rule

This repository may contain unrelated uncommitted changes. Do not revert or overwrite files you did not intentionally touch. Check `git status --short` before and after changes, and keep your write set explicit.
