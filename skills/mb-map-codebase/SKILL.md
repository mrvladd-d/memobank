---
name: mb-map-codebase
description: >
  Reverse-document (map) an existing codebase into a Memory Bank:
  spawn scoped repo-scanner subagents, store reports in .tasks/TASK-MB-MAP,
  then fan-in (merge + resolve contradictions) and synthesize **as-is** `.memory-bank/` docs
  (product, architecture, runbooks, contracts, testing, index). Ends with MB-SYNC + changelog.
  PRD-less mode MUST NOT generate roadmap entities (epics/features/backlog tasks).
---

# mb-map-codebase — Brownfield: Repo → Memory Bank

## Preconditions
- You are in the repo root.
- `.memory-bank/` skeleton exists (if not, run `mb-init`).

## Process

### 1) Start a protocol + task folder
Create:
- `.protocols/MAP-CODEBASE/plan.md`
- `.protocols/MAP-CODEBASE/progress.md`
- `.protocols/MAP-CODEBASE/verification.md` (mapping completeness + evidence)
- `.protocols/MAP-CODEBASE/handoff.md`
- `.protocols/MAP-CODEBASE/decision-log.md` (optional)

Create:
- `.tasks/TASK-MB-MAP/`

Plan MUST include MB-SYNC (link `.memory-bank/workflows/mb-sync.md`).

### 2) Spawn scanning subagents (parallel)
Use `../_shared/agents/repo-scanner.md` as the base worker prompt.

Rules:
- Max 5–7 parallel subagents.
- Non-overlapping scopes (to avoid conflicts).
- Smart calling: each worker validates that its globs match real files.

Suggested scopes:
- S-01 tooling/CI
- S-02 backend/services
- S-03 frontend/UI
- S-04 data layer
- S-05 tests/quality

Each subagent writes:
- `.tasks/TASK-MB-MAP/TASK-MB-MAP-S-0X-final-report-<code|docs>-01.md`

### 3) Fan-in (mandatory)
Before writing final docs:
- read all worker reports
- merge into a single outline
- resolve contradictions (or record them as “needs verification”)
- write a short fan-in note into `.protocols/MAP-CODEBASE/progress.md` with:
  - which reports were used
  - what conflicted and how resolved
  - open questions

### 4) Synthesize Memory Bank (**as-is**)
Using the fan-in view, create/update:
- product brief (`.memory-bank/product.md`)
- architecture overview (`.memory-bank/architecture/`)
- runbooks (`.memory-bank/runbooks/`)
- contracts (`.memory-bank/contracts/`)
- testing strategy (`.memory-bank/testing/index.md`)
- index (`.memory-bank/index.md`)

Use `references/synthesis-checklist.md`.

> **PRD-less rule (non-negotiable)**: if there is **no `prd.md`**, you MUST NOT create or populate:
> - `.memory-bank/epics/*`
> - `.memory-bank/features/*`
> - `.memory-bank/tasks/backlog.md` with waves/tasks
>
> Empty skeleton files/folders are OK if they were created by bootstrap.
>
> Mapping is documentation of the current system, not planning.

In overview docs, explicitly separate:
- Facts (evidence: paths/commands/logs/tests)
- Inferences (hypotheses, explicitly marked)

### 5) Ask for PRD delta
Once baseline MB exists:
- ask the user for a `prd.md` describing what to change/add.
- then run `mb-from-prd` to plan the delta on top of baseline.

### 6) Review gate
Run `mb-review` in fresh context.

### 7) MB-SYNC
Follow `.memory-bank/workflows/mb-sync.md` and append a changelog entry.

## Definition of done
- `.tasks/TASK-MB-MAP/` contains scoped reports.
- `.memory-bank/` describes the system “as-is” with evidence.
- Contradictions and open questions are recorded.
- User has been asked for PRD delta.
