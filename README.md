# memobank

`memobank` is a single public setup skill for **Codex CLI**, **Claude Code**, and similar agent runtimes.

It turns a repository into an agent-friendly workspace with:
- a durable **Memory Bank** in `.memory-bank/`
- resumable **protocols** in `.protocols/`
- runtime **artifacts** in `.tasks/`
- generated **project commands** such as `/prd`, `/execute`, `/autopilot`, and `/autonomous`

The point is straightforward: agents should be able to work for a long time without losing context, and humans should be able to review what happened without reverse-engineering a chat log.

The published package is self-contained: shared prompts, references, and scripts are sourced from `skills/_shared/` in the repo and vendored into the public `memobank` skill as flat companion files such as `agents/shared-*.md`, `references/shared-*.md`, and `scripts/shared-*.js` so `skills add` works end-to-end.

## What this pack includes

### Public package skill
- `memobank` — installs the Memory Bank skeleton and lets the user choose which project commands to generate

### Internal flow modules (source architecture)
- `cold-start`
- `mb-init`
- `mb-from-prd`
- `mb-map-codebase`
- `mb-execute`
- `mb-verify`
- `mb-review`
- `mb-garden`
- `mb-harness`

These remain in the repository as modular source docs, but they are no longer exposed as separate public package skills.

### Generated project commands
After the public setup skill runs inside a target repository, `memobank` generates:
- `/cold-start`
- `/mb`
- `/mb-init`
- `/prd`
- `/prd-to-tasks`
- `/execute`
- `/verify`
- `/review`
- `/autopilot`
- `/autonomous`
- `/mb-sync`
- `/map-codebase`
- `/find-skills`

These command specs live in `.memory-bank/commands/*.md` and are exposed to runtimes through:
- `.claude/skills/*`
- `.agents/skills/*`

## Supported runtimes

- **Codex CLI** — reads project skills from `.agents/skills/`
- **Claude Code** — reads project skills from `.claude/skills/`
- **OpenCode** — can read both

`.codex/` is for Codex project configuration. It is **not** where project skills live.

## Install from `skill.sh`

Install the public setup skill:

```bash
npx skills add mrvladd-d/memobank --skill memobank --global --yes
```

Then run `memobank` inside the target repository and choose either:
- a preset (`core`, `greenfield`, `brownfield`, `execution`, `autonomous`)
- or a custom command list

## Quick start

### 1) New repository with a PRD
Run the public package skill `memobank`, choose the `greenfield` preset, then continue with either the guided flow:

```text
/prd
/prd-to-tasks FT-001
/execute TASK-001
/verify TASK-001
/mb-sync
```

or the unattended flow:

```text
/autonomous
```

### 2) Existing repository without a PRD
Run `memobank` and choose the `brownfield` preset.

It will:
- create the Memory Bank skeleton
- map the current repository into `.memory-bank/` as **as-is documentation**
- stop at the right point for PRD or change-request planning

### 3) Existing backlog already prepared
If `FT-*`, `TASK-*`, and task cards already exist:

Run `memobank` and choose the `execution` or `autonomous` preset, depending on whether you want only execution commands or the full unattended set.

## Interactive and autonomous modes

### Interactive mode
Use this when you want to make decisions as the run progresses:
- one feature at a time
- one task at a time
- explicit review points

### Autonomous mode
Use this when you want one run to continue until it reaches a clear terminal state:

```text
/autonomous
```

This mode:
- reads the PRD
- records non-blocking gaps as explicit assumptions
- halts on blocking questions
- builds L1-L3 Memory Bank docs
- runs review gates
- decomposes features into task cards
- schedules independent tasks in parallel and dependent tasks sequentially
- runs `execute -> verify -> mb-sync`
- repeats wave by wave until the queue reaches a terminal state

Terminal states:
- `SUCCESS`
- `HALT_BLOCKING_QUESTIONS`
- `HALT_REVIEW_REJECT`
- `HALT_FAILURE_BUDGET`
- `HALT_DEPENDENCY_DEADLOCK`
- `HALT_POLICY_VIOLATION`
- `HALT_QUALITY_GATES`
- `HALT_BUDGET_EXCEEDED`

## Clean-session execution

Each `TASK-*` may run in its own clean CLI session.

### Codex
```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-123. Read AGENTS.md and .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement only scoped changes.'
```

### Claude
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-123. Read AGENTS.md and .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement only scoped changes.'
```

Independent tasks may run in parallel.  
Dependent tasks or tasks touching the same files should run sequentially.

## Testing philosophy

`memobank` is built around **deterministic verification**, not “it looks fine”.

Preferred order:
- unit tests for pure logic
- integration tests for boundaries such as DB, API, queues, and contracts
- browser automation for critical UI flows

### UI and browser testing
If an agent builds UI, static screenshots are not enough.

Prefer:
- **Playwright**
- **agent-browser**
- **CDP / browser automation tools**

Use them for:
- critical user flows
- screenshots and videos
- console and network inspection
- reproducible evidence stored in `.tasks/TASK-XXX/`

Rule of thumb:
- service or API work -> unit, integration, and contract tests
- UI work -> browser-driven verification with saved artifacts

## What `init-mb.js` does

`skills/_shared/scripts/init-mb.js`:
- creates `.memory-bank/`, `.tasks/`, and `.protocols/`
- writes `AGENTS.md`
- creates `CLAUDE.md` and `GEMINI.md`
- seeds `.memory-bank/commands/*.md`
- creates proxy skills in `.claude/skills/*` and `.agents/skills/*`

Usage:

```bash
node skills/_shared/scripts/init-mb.js
node skills/_shared/scripts/init-mb.js --sync
```

`--sync` refreshes generated command specs and proxy skills in an already initialized repository.  
You can combine it with `--preset ...` or `--commands ...` to change the generated command set.

## Repository structure

```text
skills/
  memobank/
    SKILL.md
  cold-start/
    FLOW.md
  mb-init/
    FLOW.md
  mb-from-prd/
    FLOW.md
  mb-map-codebase/
    FLOW.md
  mb-execute/
    FLOW.md
  mb-verify/
    FLOW.md
  mb-review/
    FLOW.md
  mb-garden/
    FLOW.md
  mb-harness/
    FLOW.md
  _shared/
```

`skills/_shared/` is the source of truth for shared assets. Before release, those assets are vendored into the public `memobank` skill as flat companion files under `agents/`, `references/`, and `scripts/` so package installs work without cross-skill dependencies.

## Notes for `skill.sh`

Based on current public `skill.sh` pages:
- the **repo README** is mainly your GitHub landing page
- each **skill page** is driven by that skill’s `SKILL.md`
- the short `description:` in `SKILL.md` is what matters for listings, discovery, and install prompts
- the rendered body of `SKILL.md` is what users actually read on the skill page

If you want cleaner marketplace cards, tighten the `description:` frontmatter in `skills/memobank/SKILL.md`.

## Documentation

- `skills/_shared/references/structure-template.md` — generated skeleton structure
- `skills/_shared/references/commands/*.md` — command specs used as the source of truth

## License

MIT — see `LICENSE`.
