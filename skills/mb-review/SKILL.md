---
name: mb-review
description: >
  Run a fresh-context, multi-expert review of a repo's Memory Bank (.memory-bank):
  spawn up to 6 reviewer subagents (architecture, scope/RTM, plan/backlog, security, MBB compliance,
  and optionally code quality), store reports in .tasks/TASK-MB-REVIEW, and produce a prioritized fix list.
---

# mb-review — Multi-expert Memory Bank review

## Goal
Detect gaps, contradictions, broken traceability, and non-compliance early.

## Preconditions
- `.memory-bank/` exists.

## Process

### 1) Create review task folder
Create:
- `.tasks/TASK-MB-REVIEW/`

### 2) Spawn reviewers (fresh contexts)
Spawn these subagents in parallel (max 5–7):

1) Architect — `../_shared/agents/review-architect.md`
2) Scope/RTM — `../_shared/agents/review-scope.md`
3) Plan/backlog — `../_shared/agents/review-plan.md`
4) Security — `../_shared/agents/review-security.md`
5) MBB compliance — `../_shared/agents/mb-reviewer.md`
6) Code quality (conditional: if repo has code) — `../_shared/agents/review-code.md`

Each reviewer must:
- write a detailed report to `.tasks/TASK-MB-REVIEW/`
- return only a short summary + verdict to the orchestrator

### 3) Synthesize and decide
As orchestrator:
- combine findings
- deduplicate
- rank issues P0–P3
- produce a concrete fix plan

If the repo is preparing for `/autonomous`:
- treat unresolved P0/P1 issues as **blocking**
- do not allow batch execution until the final verdict is `APPROVE`

### 4) Gate
If any reviewer returns `REJECT`:
- fix MB
- re-run mb-review

## Definition of done
- `.tasks/TASK-MB-REVIEW/` contains the reviewer reports.
- Orchestrator produced an actionable prioritized fix list.
- Final verdict: APPROVE.
