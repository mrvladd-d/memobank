# memobank

Language: **English** | [Русский](README.ru.md)

![MEMOBANK Lego-style workflow diagram](MEMOBANK.png)

`memobank` is a source-only skill pack and workflow framework for AI-first
software development in Codex CLI, Claude Code, OpenCode, and compatible agent
runtimes.

It keeps project context in repository files instead of fragile chat history.
An agent can read those files, understand the current project state, continue a
task in a later session, and leave evidence for the next run.

## When to use it

Use `memobank` when:

- a project will take more than one short chat session;
- requirements, architecture, or task status must survive context resets;
- several agents or fresh sessions need the same source of truth;
- you want PRD, specifications, tasks, implementation, and verification to stay
  connected;
- you want manual control first, then optional automation later.

Do not start with automation if the product idea is still unclear. Start with
the manual workflow and let the files become the shared project memory.

## What it creates

After bootstrap, the target repository gets a Memory Bank workspace:

```text
.memory-bank/
  product.md              product summary and intent
  requirements.md         requirements and constraints
  constitution.md         project principles and non-negotiables
  spec-index.md           map of SDD/specification documents
  epics/                  EP-* product slices
  features/               FT-* feature specs
  tasks/index.json        JSON task registry
  tasks/TASK-*.task.json  task records and execution state
  commands/               generated command specs

.protocols/
  TASK-*/                 resumable plans, progress, verification notes

.tasks/
  TASK-*/                 runtime evidence, reports, handoff files

scripts/
  mb-lint.mjs             deterministic Memory Bank lint
  mb-doctor.mjs           autonomous-readiness checks
```

The framework repository itself is source-only:

```text
skills/_shared/           canonical shared agents, commands, scripts
skills/<skill>/SKILL.md   installable skill entrypoints
```

Generated `skills/<skill>/**/shared-*` files are not committed. The installer
creates them only inside a temporary prepared copy during installation.

## Install

Clone this repository and run the installer from the repository root:

```bash
node scripts/install-framework.mjs
```

The interactive installer lets you choose a target project directory. It then:

1. checks whether the target is writable and whether it already has
   `.memory-bank/` or `AGENTS.md`;
2. prepares a temporary installable copy of `memobank`;
3. vendors shared assets into that temporary copy;
4. runs `skills add` for the supported agent runtimes;
5. bootstraps or syncs the target project's Memory Bank files.

For non-interactive installation into a known project:

```bash
node scripts/install-framework.mjs --bootstrap --target /path/to/project --yes
```

For install-only skill packaging smoke checks:

```bash
node scripts/install-framework.mjs --skill '*' --yes
```

## Beginner path

The safest way to learn `memobank` is to run the manual workflow first.

```text
idea or rough draft
  -> /analysis or /brief
  -> /constitution
  -> /write-prd
  -> /spec-init
  -> /prd
  -> /spec-design
  -> /spec-improve FT-001
  -> /prd-to-tasks FT-001
  -> /execute TASK-001
  -> /verify TASK-001
  -> /red-verify TASK-001 for T2/T3 work
  -> /mb-sync
  -> repeat for the next feature or task
```

In plain English:

- `/analysis`, `/brainstorm`, and `/brief` turn a rough idea into usable input.
- `/constitution` records project principles, Definition of Done, autonomy
  limits, and human checkpoints.
- `/write-prd` creates or normalizes the PRD.
- `/spec-init` creates a lightweight SDD route map.
- `/prd` decomposes the PRD into product, requirements, epics, and features.
- `/spec-design` creates the required architecture/specification backbone.
- `/spec-improve FT-001` completes the minimum design needed for one feature.
- `/prd-to-tasks FT-001` creates JSON task records for that feature.
- `/execute TASK-001` implements one task.
- `/verify TASK-001` checks the result against acceptance criteria.
- `/red-verify TASK-001` adds adversarial semantic verification for T2/T3 work.
- `/mb-sync` updates Memory Bank indexes, lifecycle notes, and task state.

## Workflow diagram

```text
Discovery
  idea -> /analysis or /brief -> /constitution -> /write-prd

Design
  /spec-init -> /prd -> /spec-design -> /spec-improve FT-001

Execution
  /prd-to-tasks FT-001 -> /execute TASK-001 -> /verify TASK-001

Quality
  T2/T3 -> /red-verify TASK-001 -> /mb-sync
  T0/T1 -> /mb-sync
```

## Automation

Automation uses the same JSON task records and verification gates as the manual
flow.

- `/autopilot` runs an existing JSON task queue.
- `/autonomous` runs a longer unattended flow from PRD or Product Brief toward a
  terminal state.
- `/mb-doctor --strict` is the readiness gate for autonomous runs.

Use automation after the PRD, features, task records, and quality gates are
clear enough for the agent to proceed without guessing.

## Validate this repository

Run these checks before publishing changes to the framework:

```bash
npm run check:syntax --silent
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
node scripts/install-framework.mjs --skill '*' --yes
```

The `find ... | wc -l` command must print `0` in the source tree.

Bootstrap smoke test:

```bash
tmpdir="$(mktemp -d)"
node scripts/install-framework.mjs --bootstrap --target "$tmpdir" --yes
test -f "$tmpdir/.memory-bank/tasks/index.json"
test -f "$tmpdir/AGENTS.md"
```

## More documentation

- [Russian beginner guide](README.ru.md)
- [Detailed mechanics](howItWorks.md)
- [Project map for agents](PROJECT_MAP.md)
