---
description: Deterministic Memory Bank readiness gate over mb-lint for autonomous/autopilot execution.
status: active
---
# /mb-doctor — Memory Bank readiness doctor

## Objective
Answer one question:

```text
Can autonomous/autopilot execution continue safely from the current Memory Bank state?
```

`mb-doctor` is a readiness gate over `mb-lint`. It does not replace `/review`, `/verify`, or `/red-verify`.

## Command
Use the repository-provided script:

```bash
node scripts/mb-doctor.mjs
node scripts/mb-doctor.mjs --strict
node scripts/mb-doctor.mjs --json
node scripts/mb-doctor.mjs --strict --json
```

If the repository exposes another documented wrapper for the same script, use that wrapper.

## Modes
- Default mode: health report for humans and interactive work. A fresh skeleton with an empty `.memory-bank/tasks/index.json` is valid and reports `TASK_INDEX_EMPTY` as `info`.
- Strict mode: post-queue autonomous/autopilot readiness gate. Empty `.memory-bank/tasks/index.json` is an error because there is no executable task queue.
- JSON mode: machine-readable report for schedulers and agents.

Default mode may emit warnings for incomplete scheduler readiness evidence that should be fixed before unattended execution. These warnings do not invalidate KISS manual closure. Strict mode promotes those readiness gaps to errors where autonomous/autopilot progression would be unsafe.

Use `--strict` before `/autopilot` or the scheduler phase of `/autonomous`, before each task-selection pass, and after each `/mb-sync` before promoting dependents or declaring success.

Status transitions have two modes. In scheduler mode, `/autopilot` and `/autonomous` own closure/failure/blocking decisions, T2/T3 scheduler closure requires `VERDICT: PASS` plus `SEMANTIC_VERDICT: semantic-pass`, and T3 scheduler closure also requires exact `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`. In manual mode, `/verify PASS` may close only T0/T1 with explicit closure ownership; T2/T3 require `/red-verify` `SEMANTIC_VERDICT: semantic-pass` before final closure/`/mb-sync`.

## Required checks
`mb-doctor` must check only readiness-critical conditions:

- `mb-lint` passes first. A lint error is a doctor error.
- Feature docs under `.memory-bank/features/FT-*.md` may have optional clarification metadata: `clarification_status`, `last_clarified`, and `clarification_questions`.
- Explicit `clarification_status: pending|blocked` is not allowed for autonomous/autopilot readiness or task-linked features.
- Indexed task records do not exist for features that are pending, missing, or otherwise not clarified.
- `.memory-bank/tasks/index.json` is valid JSON and has a valid task list.
- Every indexed `.memory-bank/tasks/TASK-*.task.json` exists and is valid JSON.
- Every indexed task record has `tier: T0|T1|T2|T3`.
- Authoritative routing uses only `task.tier`; legacy `risk` / `risk.level` is invalid.
- Task dependencies reference known task IDs and do not create cycles or execution deadlock.
- Task status, dependency, and tier policy allow safe scheduler decisions.
- `in_progress` `T0` / `T1` tasks have a `.protocols/<TASK_ID>/` directory.
- `T2` / `T3` `planned` / `ready` tasks do not require protocol files yet.
- `T2` / `T3` `in_progress` tasks have full protocol files: `context.md`, `plan.md`, `progress.md`, `verification.md`, and `handoff.md`.
- `T0` / `T1` `done` tasks have compact `.protocols/<TASK_ID>/run.md` evidence appropriate for their tier.
- In `--strict`, `T2` / `T3` `done` tasks have full protocol files, `PASS` verification evidence/verdict in `task.verify` or protocol/artifacts, and closure-eligible red-verify evidence with `SEMANTIC_VERDICT: semantic-pass`.
- In `--strict`, `T3` `done` tasks also have exact standalone marker lines: `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`.
- `T2` / `T3` `failed` tasks have full protocol files and `FAIL` / `error` evidence/verdict in `task.verify` or protocol/artifacts.
- In `--strict`, `.memory-bank/spec-index.md` records mandatory `/spec-design` status `complete`, or `minimal` with explicit `not_applicable` areas. `blocked`, `unknown`, or missing backbone status is not autonomous-ready.
- Other `done` / `failed` tasks have the minimum evidence/protocol basis required by their tier and mode.
- `failed` tasks have either a bug doc in `.memory-bank/bugs/` mentioning the task id or an indexed follow-up task depending on/referencing the failed task.
- Direct dependents of failed tasks are marked `blocked`.
- `T1` / `T2` / `T3` tasks have concrete `REQ-*` and `FT-*` linkage. Placeholder values such as `REQ-XXX` and `FT-XXX` do not count.
- `T2` / `T3` tasks have relevant SDD spec links in `source_artifacts`, `normative_inputs`, `constraints`, `invariants`, or `verification_targets`.
- `guides/*` may count as linked SDD specs when the guide is the normative source for frontend component behavior or operating procedure; guides alone do not replace required T2/T3 architecture/contract/domain/state/testing specs when those concerns are in scope.
- Default mode reports missing T2/T3 SDD spec links as warnings; `--strict` reports readiness errors.
- When `.memory-bank/requirements.md` exists, referenced `REQ-*` IDs appear in it.
- When `.memory-bank/features/` contains markdown files, referenced `FT-*` IDs have a matching `.memory-bank/features/FT-<NNN>*.md` file.
- Obsolete `.memory-bank/tasks/backlog.md` is absent. If present, report `TASK_BACKLOG_MD_PRESENT` as an error.

## Findings
Errors block autonomous/autopilot progression:

- `MB_LINT_SCRIPT_MISSING` in `--strict`
- `MB_LINT_FAILED`
- `FEATURE_CLARIFICATION_METADATA_MISSING` in `--strict`
- `FEATURE_CLARIFICATION_PENDING` in `--strict`
- `TASKS_FROM_UNCLARIFIED_FEATURE` in `--strict`
- `TASK_INDEX_INVALID`
- `TASK_INDEX_EMPTY` in `--strict`
- `TASK_RECORD_MISSING`
- `TASK_RECORD_INVALID`
- `TASK_READY_DEP_NOT_DONE`
- `TASK_QUEUE_DEADLOCK` in `--strict`
- `TASK_IN_PROGRESS_WITHOUT_PROTOCOL` in `--strict`
- `TASK_FULL_PROTOCOL_MISSING` in `--strict`
- `TASK_COMPACT_ONLY_PROTOCOL` in `--strict`
- `TASK_COMPACT_RUN_MISSING` for `T1` in default mode and for `T0` / `T1` in `--strict`
- `TASK_COMPACT_RUN_UNREADABLE`
- `TASK_COMPACT_VERDICT_MISSING` in `--strict`
- `TASK_COMPACT_EVIDENCE_MISSING` in `--strict`
- `TASK_DONE_EVIDENCE_MISSING` in `--strict`
- `TASK_FAILED_EVIDENCE_MISSING` in `--strict`
- `TASK_RED_VERIFY_EVIDENCE_MISSING` in `--strict`
- `TASK_RED_VERIFY_VERDICT_MISSING` in `--strict`
- `TASK_T3_CHECKPOINT_MISSING` in `--strict`
- `TASK_T3_ROLLBACK_MISSING` in `--strict`
- `FAILED_BUG_OR_FOLLOWUP_MISSING` in `--strict`
- `TASK_FAILED_DEPENDENTS_NOT_BLOCKED`
- `TASK_FEATURE_LINK_MISSING` in `--strict`
- `TASK_REQUIREMENT_LINK_MISSING` in `--strict`
- `TASK_REQUIREMENT_NOT_FOUND` in `--strict`
- `TASK_FEATURE_FILE_MISSING` in `--strict`
- `TASK_SDD_SPEC_LINK_MISSING` in `--strict`
- `TASK_BACKLOG_MD_PRESENT`

Structural lint details such as invalid legacy `risk`, dependency cycles, and schema-level task field violations are surfaced through `MB_LINT_FAILED` with captured `mb-lint` output.

Warnings identify non-blocking quality risks in default mode:

- `MB_LINT_SCRIPT_MISSING`
- `FEATURE_CLARIFICATION_METADATA_MISSING`
- `FEATURE_CLARIFICATION_PENDING`
- `TASKS_FROM_UNCLARIFIED_FEATURE`
- `TASK_IN_PROGRESS_WITHOUT_PROTOCOL`
- `TASK_FULL_PROTOCOL_MISSING`
- `TASK_COMPACT_ONLY_PROTOCOL`
- `TASK_COMPACT_RUN_MISSING` for `T0`
- `TASK_COMPACT_EVIDENCE_MISSING`
- `TASK_DONE_EVIDENCE_MISSING`
- `TASK_FAILED_EVIDENCE_MISSING`
- `TASK_RED_VERIFY_EVIDENCE_MISSING`
- `TASK_RED_VERIFY_VERDICT_MISSING`
- `TASK_T3_CHECKPOINT_MISSING`
- `TASK_T3_ROLLBACK_MISSING`
- `FAILED_BUG_OR_FOLLOWUP_MISSING`
- `TASK_FEATURE_LINK_MISSING`
- `TASK_REQUIREMENT_LINK_MISSING`
- `TASK_REQUIREMENT_NOT_FOUND`
- `TASK_FEATURE_FILE_MISSING`
- `TASK_SDD_SPEC_LINK_MISSING`
- `TASK_PLANNED_READY_CANDIDATE`
- `TASK_BLOCKED_BY_UPSTREAM`
- `TASK_QUEUE_NO_EXECUTABLE_READY`

Info findings may include `MB_LINT_PASSED`, fresh-skeleton state such as `TASK_INDEX_EMPTY` in default mode, and `TASK_QUEUE_SUMMARY`.

## JSON Output
JSON mode preserves this stable top-level shape:

```json
{
  "status": "pass",
  "summary": {
    "errors": 0,
    "warnings": 0,
    "infos": 0
  },
  "findings": []
}
```

Implementations may include extra metadata such as `version`, `tool`, `strict`, or legacy count fields, but schedulers should rely on `status`, `summary`, and `findings`.

## Out of scope
- No LLM semantic review.
- No markdown task-card parsing.
- No migration from old task models.
- No fallback to `.memory-bank/tasks/backlog.md`.
- No replacement for `/review`, `/verify`, or `/red-verify`.
