---
name: mb-execute
description: >
  Implementation handoff skill for one TASK-* using tier-selected protocol files,
  local gates, evidence, and explicit verification/sync handoff.
---

# mb-execute - Implementation Handoff

## Purpose
`mb-execute` implements one scoped JSON task. It is not a mini-scheduler and it
does not own task closure. Flow: read task -> minimal preflight -> protocol ->
implement -> local gates -> evidence -> handoff.

## Status Transition Modes

Status transitions have two modes.

Scheduler mode:
- `/autopilot` and `/autonomous` own task status transitions.
- Scheduler decides closure/failure/blocking eligibility.
- `/execute` returns scoped implementation handoff; it does not close tasks.
- `/verify` gives functional verdict/evidence; in scheduler mode it does not close/fail/block/promote.
- `/red-verify` gives semantic verdict for T2/T3; in scheduler mode it does not close/fail/block/promote.
- Scheduler must write the closure/failure/blocking decision, final task status, and evidence links to the authoritative indexed `.memory-bank/tasks/TASK-*.task.json` record before `/mb-sync`.
- `/mb-sync` records/reconciles already-written task state. It does not decide closure/failure/blocking/promotion and must not sync a decision that exists only in scheduler context.
- T0/T1 scheduler closure may use compact evidence / functional PASS according to tier policy.
- T2/T3 scheduler closure requires `VERDICT: PASS` plus `SEMANTIC_VERDICT: semantic-pass` before scheduler marks `done`.
- T3 scheduler closure also requires exact markers `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`.

Manual mode:
- Expected T0/T1 simple flow: `/execute -> /verify` for one TASK.
- Manual closure is allowed only when an explicit closure owner exists.
- `explicit standalone owner` means either the user directly asked the current top-level agent to close the task, or the top-level agent/orchestrator explicitly runs a manual workflow for one TASK and records that it owns closure. Subagents/worker prompts do not silently become closure owners.
- `/verify PASS` may mark `T0` / `T1` `status: done` only when explicit closure ownership is present and completed evidence has been written to the task record `verify` field and the compact/full protocol required by tier.
- If explicit closure owner is absent, `/verify` records `VERDICT: PASS`, evidence, and a closure recommendation, leaves `status` unchanged, and tells the scheduler/owner to close.
- `T2` / `T3` manual closure requires `/verify PASS` plus `/red-verify` / `mb-red-verify` `SEMANTIC_VERDICT: semantic-pass` before `status: done` or `/mb-sync`; if semantic-pass is absent, leave closure pending or blocked, not done.
- `semantic-concern` in manual mode means do not trust the existing `done` state without human review / follow-up.
- Do not mix scheduler mode and manual mode inside one task run.
- No persisted `mode` field is used.

## Inputs
- `TASK_ID`, for example `TASK-123`
- `.memory-bank/tasks/index.json`
- indexed `.memory-bank/tasks/<TASK_ID>.task.json`
- task `tier: T0|T1|T2|T3`
- feature or epic docs referenced by the task
- `.memory-bank/requirements.md` / REQ IDs when relevant
- `.memory-bank/spec-index.md` and all linked authoritative SDD specs when the
  task record or linked feature contains SDD spec links, for any tier
- richer task fields when present: `source_artifacts`, `normative_inputs`,
  `constraints`, `invariants`, `verification_targets`

Authoritative SDD spec links are links to `.memory-bank/spec-index.md`,
`.memory-bank/tech-specs/`, `.memory-bank/architecture/`,
`.memory-bank/contracts/`, `.memory-bank/domains/`, `.memory-bank/states/`,
`.memory-bank/adrs/`, `.memory-bank/testing/`, or `.memory-bank/runbooks/`.

Missing richer fields or absent SDD spec links do not block classic `T0` /
`T1` tasks; fall back to referenced docs.
For `T2` / `T3`, missing linked SDD specs are a blocker for serious work.

## Minimal Preflight
Stop with an explicit handoff error if:
- task record/indexed file is missing
- the record `id` does not match `TASK_ID`
- `tier` is missing or is not `T0|T1|T2|T3`
- task `status` is `blocked`, `failed`, or `done`
- any `depends_on` task is missing or is not `done`
- `tier` is `T2` / `T3` and neither task richer fields nor linked feature
  `spec_design_links` include relevant SDD spec links

Do not block `T0` / `T1` only because SDD spec links are absent.
Route only by `task.tier`. Do not use legacy `risk` / `risk.level`.

## Protocol Routing
Create `.tasks/<TASK_ID>/` for runtime artifacts.

`T0` / `T1`: use compact protocol:
- `.protocols/<TASK_ID>/run.md`; record tier, goal, context, plan, changes,
  gates, evidence, and handoff notes
- `VERDICT: PASS|FAIL|BLOCKED` is a local evidence marker only, not task closure

`T2` / `T3`: use full protocol:
- `.protocols/<TASK_ID>/context.md`, `plan.md`, `progress.md`,
  `verification.md`, `handoff.md`

`T3`: exact marker lines are closure requirements:
- `HUMAN_CHECKPOINT: done`
- `ROLLBACK_RECOVERY_NOTE: present`

Record whether these markers are present or still needed; do not close the task.

## Implementation Rules
- Keep scope bounded to the task and its acceptance criteria.
- For any tier, if the task record or linked feature contains authoritative SDD
  spec links, read `.memory-bank/spec-index.md` and all linked authoritative SDD
  specs before editing; treat them as normative inputs.
- Record goal, non-goals, constraints, touched areas, and gates before broad edits.
- If fan-out is needed, use narrow non-overlapping worker scopes.
- Preserve unrelated changes and do not rewrite generated `shared-*` files.
- Keep protocol notes factual: what changed, what was checked, where evidence is.

## Local Gates
Run relevant local gates from project instructions: lint/typecheck, unit tests,
and integration/e2e checks only when relevant.

If a gate cannot run or fails, record command, result, evidence path, and the
blocker in the protocol/handoff. Do not convert that into final task status.

## Output / Handoff Contract
Finish with:
- changed files summary
- protocol file paths
- local gates run and results
- evidence paths under `.tasks/<TASK_ID>/`
- verification targets and risk notes for verifier/reviewer
- MB-SYNC handoff notes: what should be synchronized and by whom
- recommended next owner: scheduler, verifier, red-verifier, explicit standalone owner, or human

## Non-Ownership Rules
`mb-execute` never:
- closes tasks
- writes final task status
- runs `/mb-sync`
- runs `/verify` or `/red-verify`
- promotes, blocks, or unblocks dependents
- performs scheduler transitions such as in-progress, failed, or done

Schedulers (`/autopilot`, `/autonomous`) or an explicit standalone owner perform
verification orchestration, final status decisions, MB-SYNC, and dependent
promotion/blocking.
