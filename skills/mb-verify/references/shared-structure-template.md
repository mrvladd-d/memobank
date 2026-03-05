# Memory Bank structure templates

Use these templates to initialize a repo.

> Note: Templates are intentionally **short** and **structural**.
> The Memory Bank will be expanded by the agent based on PRD/codebase.

---

## 1) `AGENTS.md` (repo root)

Keep it ~100 lines. It must be a **map**, not an encyclopedia.

```markdown
# Agent Operating Guide (Project Map)

## Prime before work
1. Read `.memory-bank/index.md` (table of contents)
2. Read `.memory-bank/mbb/index.md` (rules)
3. Follow annotated links for deeper context

## Docs First
After finishing a meaningful unit of work:
1) Update `.memory-bank/` (WHY/WHERE + navigation)
2) Then commit code changes

## Runtime vs durable memory
- Durable knowledge base: `.memory-bank/`
- Operational artifacts: `.tasks/` (NOT part of Memory Bank)
- Long-running plans/logs: `.protocols/`

## Subagents (orchestrator → workers)
When a task requires reading many files or producing long output:
- spawn subagents (max depth = 2)
- each subagent writes details into `.tasks/TASK-XXX/`
- orchestrator reads only short summaries

## Clean context (recommended)
- If running in **Claude Code**: execute each `TASK-XXX` in a **fresh Claude session** using `.protocols/TASK-XXX/{context,plan,progress}` as the primary state.
- If running in **Codex**: you can run each `TASK-XXX` in a fresh session via `codex exec` (see `/execute`).
- Sequencing: independent tasks may run in parallel clean sessions; dependent/shared-file tasks must run sequentially.

Codex (fresh session):
- `codex exec --ephemeral --full-auto -m gpt-5.2-high 'TASK_ID=TASK-123. Read AGENTS.md + .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement. Update progress. Report → .tasks/TASK-123/…'`

Claude (fresh session):
- `claude -p --no-session-persistence --permission-mode acceptEdits --model opus 'TASK_ID=TASK-123. Read AGENTS.md + .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement. Update progress. Report → .tasks/TASK-123/…'`

## Two modes (interactive vs autonomous)
- **Interactive**: run `/prd` → pick one `FT-<NNN>` → `/prd-to-tasks FT-<NNN>` → execute tasks one-by-one with `/execute TASK-<ID>` and review after each wave.
- **Autonomous (batch)**: use `/autonomous` for full `PRD → done`, or `/autopilot` if backlog already exists. See: `.memory-bank/workflows/execute-loop.md` and `.memory-bank/workflows/autonomy-policy.md`.

`.tasks/` naming:
- Folder per process: `.tasks/TASK-<ID>/`
- Files: `TASK-<ID>-S-<STAGE>-final-report-<code|docs>-<NN>.md`
- Keep each report to ≤ 3–5 files worth of analysis to avoid context overflow

## Quality gates (before merge)
- lint / typecheck / build
- unit tests
- e2e tests (if UI/flow)

## Memory Bank entry points
- `/cold-start` → `.memory-bank/commands/cold-start.md`
- `/mb` → `.memory-bank/commands/mb.md`
- `/mb-init` → `.memory-bank/commands/mb-init.md` *(alias; skeleton bootstrap)*
- `/prd` → `.memory-bank/commands/prd.md`
- `/mb-from-prd` → `.memory-bank/commands/mb-from-prd.md` *(alias to `/prd`)*
- `/prd-to-tasks` → `.memory-bank/commands/prd-to-tasks.md`
- `/mb-execute` → `.memory-bank/commands/mb-execute.md` *(alias to `/execute`)*
- `/execute` → `.memory-bank/commands/execute.md`
- `/verify` → `.memory-bank/commands/verify.md`
- `/mb-verify` → `.memory-bank/commands/mb-verify.md` *(alias to `/verify`)*
- `/autopilot` → `.memory-bank/commands/autopilot.md`
- `/autonomous` → `.memory-bank/commands/autonomous.md`
- `/map-codebase` → `.memory-bank/commands/map-codebase.md`
- `/mb-map-codebase` → `.memory-bank/commands/mb-map-codebase.md` *(alias to `/map-codebase`)*
- `/mb-sync` → `.memory-bank/commands/mb-sync.md`
- `/discuss` → `.memory-bank/commands/discuss.md`
- `/add-tests` → `.memory-bank/commands/add-tests.md`
- `/review` → `.memory-bank/commands/review.md`
- `/mb-review` → `.memory-bank/commands/mb-review.md` *(alias to `/review`)*
- `/mb-garden` → `.memory-bank/commands/mb-garden.md`
- `/mb-harness` → `.memory-bank/commands/mb-harness.md`
- `/find-skills` → `.memory-bank/commands/find-skills.md`
- `/find-skill` → `.memory-bank/commands/find-skill.md` *(alias)*

> Keep this file small. Deep docs live under `.memory-bank/`.
```

Create symlinks (or copies if symlink not supported):
- `CLAUDE.md` → `AGENTS.md`
- `GEMINI.md` → `AGENTS.md` *(optional)*

### Native skills (proxy commands for all runtimes)

Create thin proxy skills so commands work natively across tools:

| Directory | Runtime |
|-----------|---------|
| `.claude/skills/<name>/SKILL.md` | Claude Code + OpenCode |
| `.agents/skills/<name>/SKILL.md` | Codex CLI + OpenCode |

> Note: `.codex/` is **not** a skills directory. It is used for Codex **project configuration** (e.g. `.codex/config.toml`).

Each `SKILL.md` follows this pattern:
```yaml
---
name: <command-name>
description: <what it does>
---

Read and follow the instructions in `.memory-bank/commands/<command-name>.md`
```

This keeps `.memory-bank/commands/` as SSOT while giving each runtime native integration:
- Claude Code: `/command-name` in autocomplete
- Codex CLI: `$command-name` or via `/skills` browser
- OpenCode: `/command-name` in TUI (reads both `.claude/` and `.agents/`)

The `init-mb.js` script creates both sets automatically.

---

## 2) `.memory-bank/index.md`

```markdown
---
description: Главная карта знаний проекта (table of contents) для агентов.
status: active
---
# Memory Bank Index

Этот файл — **главная точка входа**. Он должен оставаться коротким.

## Навигация

- [.memory-bank/mbb/index.md](mbb/index.md): Правила ведения Memory Bank (MBB).
- [.memory-bank/product.md](product.md): Продукт, аудитория, core value (C4 L1).
- [.memory-bank/requirements.md](requirements.md): Требования (REQ-IDs) + RTM.
- [.memory-bank/epics/](epics/): Эпики (C4 L2).
- [.memory-bank/features/](features/): Фичи (C4 L3).
- [.memory-bank/tasks/backlog.md](tasks/backlog.md): План работ (waves + tasks).

- [.memory-bank/architecture/](architecture/): Duo (WHAT/WHY).
- [.memory-bank/guides/](guides/): Duo (HOW).
- [.memory-bank/adrs/](adrs/): ADR-решения.

- [.memory-bank/contracts/](contracts/): Контракты API/ивенты (если применимо).
- [.memory-bank/runbooks/](runbooks/): Runbooks (setup, dev, deploy).
- [.memory-bank/testing/index.md](testing/index.md): Стратегия тестирования.

- [.memory-bank/skills/index.md](skills/index.md): Реестр скиллов.

## Known gaps
- TBD
```

---

## 3) `.memory-bank/mbb/index.md`

```markdown
---
description: Memory Bank Bible — правила, инварианты и стандарты документации.
status: active
---
# Memory Bank Bible (MBB)

## SSOT pyramid
- **Code**: WHAT/HOW — implementation truth.
- **Docstrings**: contracts + `@docs` pointers.
- **Memory Bank**: WHY/WHERE — boundaries, invariants, navigation.

## Hard rules
1. Every `.memory-bank/**/*.md` file MUST have frontmatter with `description:`.
2. If a folder has >3 docs, add an `index.md` router.
3. Use annotated links: `[.memory-bank/path](rel-path): короткое описание`.
4. Atomic docs: one concept per doc; keep ~≤500 lines.
5. Duo docs: `architecture/` (WHAT/WHY) + `guides/` (HOW), cross-link both ways.
6. C4 layering: L1 product → L2 epics → L3 features → L4 plans/tasks.
7. Docs First: update MB immediately after finishing a task.
8. Refactor MB every 5–10 updates (split, merge, archive).
9. Separate facts from interpretations: mark hypotheses explicitly ("предположительно", "требует проверки").
10. After merge/rebase conflicts: re-check MB consistency.
11. MB-SYNC after each wave/significant change (see `workflows/mb-sync.md`).

## Forbidden
- Copy-paste implementation details / pseudocode
- Duplicating configs (timeouts, constants) instead of linking to source
- Speculative claims without evidence from code/metrics/tests

## Allowed / encouraged
- Invariants (MUST/NEVER)
- Contracts at boundaries
- Decision rationale + pointers
- Runbooks and verification procedures
```

---

## 4) `.memory-bank/product.md`

```markdown
---
description: Product brief (C4 L1): что это, для кого, core value, ограничения.
status: draft
---
# Product

## What this is
<!-- 2–3 предложения словами пользователя -->

## Core value
<!-- 1 thing that MUST work -->

## Audience

## Primary user flow

## Constraints
- Tech stack:
- Timeline:
- Non-goals:

## Key decisions
| Decision | Rationale | Status |
|---|---|---|
| | | pending |
```

---

## 5) `.memory-bank/requirements.md`

```markdown
---
description: Требования (REQ-IDs) + traceability matrix (RTM).
status: draft
---
# Requirements

## REQ list
- (fill from PRD; do not invent requirements without evidence)

## Out of scope
- ...

## Traceability (RTM)
| REQ | Epic | Feature | Test | Lifecycle |
|---|---|---|---|---|
| REQ-XXX | EP-XXX | FT-XXX | test:... | planned |
```

---

## 6) `.memory-bank/tasks/backlog.md`

```markdown
---
description: Backlog и execution plan (waves) для реализации.
status: draft
---
# Backlog

> PRD-less rule: an empty backlog skeleton is OK, but do NOT create waves/TASK-IDs until you have PRD (or explicit human instruction).

## Conventions
Each task should include:
- goal
- touched files (expected)
- tests
- verification steps
- docs-first update

## Task state model
- `Status: planned|ready|in_progress|blocked|done|failed`
- `Wave: W1|W2|W3|...`
- `Depends on: TASK-... | none`

## Task card template
### TASK-001 — short title
- Status: ready
- Wave: W1
- Feature: FT-001
- REQs: REQ-001, REQ-002
- Depends on: none
- Touched files: `src/...`, `tests/...`
- Tests: `npm test -- foo`
- Verify: API/manual/UAT steps
- Docs: product/requirements/feature/changelog/index
```

Optional (but recommended) plans folder:
- `.memory-bank/tasks/plans/` — IMPL plans like `IMPL-FT-XXX.md`

---

## 7) `.memory-bank/testing/index.md`

```markdown
---
description: Стратегия тестирования и верификации (quality gates, anti-cheat, UI/e2e).
status: active
---
# Testing & Verification

## Quality gates
- lint / typecheck
- unit tests
- integration tests (if applicable)
- e2e tests for critical user flows

## UI verification
- Prefer Playwright / agent-browser / CDP for UI flows when available
- Store screenshots/videos/traces in `.tasks/TASK-XXX/`
- In Memory Bank keep only links + short conclusions

## Anti-cheat
- Don’t "green" failing tests by weakening assertions without approval.
- If a test reveals a bug: log it (and fix only with explicit scope).

## Artifacts
- Put screenshots/logs/videos in `.tasks/TASK-XXX/`
- In Memory Bank store only links + short conclusions
```

---

## 8) `.memory-bank/skills/index.md`

```markdown
---
description: Реестр доступных скиллов (когда применять) в этом репозитории.
status: active
---
# Skills

## Installed
- cold-start

## When to use
- Bootstrap / memory: cold-start, mb-init
- PRD decomposition: mb-from-prd
- Codebase mapping: mb-map-codebase
- Execution: mb-execute
- Verification (UAT): mb-verify
- Review: mb-review
- Maintenance: mb-garden
- Harness: mb-harness
```

---

## 9) `.memory-bank/changelog.md`

```markdown
---
description: Лог изменений Memory Bank.
status: active
---
# Changelog

## [YYYY-MM-DD] Initial setup
- Created Memory Bank skeleton
- Seeded core docs (product, requirements, testing, backlog)
```

---

## 10) `.memory-bank/workflows/mb-sync.md`

```markdown
---
description: Чеклист синхронизации Memory Bank после wave/изменений.
status: active
---
# MB-SYNC Checklist

- [ ] Duo docs consistent (architecture ↔ guides)
- [ ] RTM up to date (requirements.md)
- [ ] Feature statuses updated
- [ ] Backlog tasks marked done
- [ ] Changelog entry added
- [ ] index.md links valid
- [ ] Lint passes (0 errors)
```
