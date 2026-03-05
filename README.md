# memobank

`memobank` is a skill pack for **Codex CLI**, **Claude Code**, and similar agent runtimes.

It turns a repository into an agent-friendly workspace with:
- a durable **Memory Bank** in `.memory-bank/`
- resumable **protocols** in `.protocols/`
- runtime **artifacts** in `.tasks/`
- generated **project commands** such as `/prd`, `/execute`, `/autopilot`, and `/autonomous`

The point is straightforward: agents should be able to work for a long time without losing context, and humans should be able to review what happened without reverse-engineering a chat log.

## What this pack includes

### Package skills
- `cold-start` — full bootstrap for greenfield and brownfield repositories
- `mb-init` — skeleton only
- `mb-from-prd` — `PRD -> product -> requirements -> epics -> features`
- `mb-map-codebase` — map an existing repository into an as-is Memory Bank
- `mb-execute` — execute one `TASK-*` with a protocol
- `mb-verify` — verify one `TASK-*` against acceptance criteria
- `mb-review` — fresh-context multi-expert review
- `mb-garden` — lint and maintain the Memory Bank
- `mb-harness` — document deterministic gates, worktrees, and agent-safe workflows

### Generated project commands
After `cold-start` or `mb-init` runs inside a target repository, `memobank` generates:
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

Install only what you need:

```bash
npx skills add mrvladd-d/memobank --skill cold-start --global --yes
npx skills add mrvladd-d/memobank --skill mb-init --global --yes
npx skills add mrvladd-d/memobank --skill mb-from-prd --global --yes
```

If you want the full package skill set:

```bash
npx skills add mrvladd-d/memobank --skill '*' --global --yes
```

In practice, most users start with:
- `cold-start` for the all-in-one entry point
- or `mb-init` plus `mb-from-prd` / `mb-map-codebase` for a modular workflow

## Quick start

### 1) New repository with a PRD
Run the package skill `cold-start`, then continue with either the guided flow:

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
Run `cold-start`.

It will:
- create the Memory Bank skeleton
- map the current repository into `.memory-bank/` as **as-is documentation**
- stop at the right point for PRD or change-request planning

### 3) Existing backlog already prepared
If `FT-*`, `TASK-*`, and task cards already exist:

```text
/autopilot
```

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

## Repository structure

```text
skills/
  cold-start/
  mb-init/
  mb-from-prd/
  mb-map-codebase/
  mb-execute/
  mb-verify/
  mb-review/
  mb-garden/
  mb-harness/
  _shared/
```

## Notes for `skill.sh`

Based on current public `skill.sh` pages:
- the **repo README** is mainly your GitHub landing page
- each **skill page** is driven by that skill’s `SKILL.md`
- the short `description:` in `SKILL.md` is what matters for listings, discovery, and install prompts
- the rendered body of `SKILL.md` is what users actually read on the skill page

If you want cleaner marketplace cards, tighten the `description:` frontmatter in the top-level package skills.

## Documentation

- `skills/_shared/references/structure-template.md` — generated skeleton structure
- `skills/_shared/references/commands/*.md` — command specs used as the source of truth

## License

MIT — see `LICENSE`.
