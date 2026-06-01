---
description: Tier policy for TASK routing, protocol depth, verification, and MB-SYNC.
status: active
---
# Tier Policy

Task records route execution by a single required field:

```json
"tier": "T0"
```

Allowed values: `T0`, `T1`, `T2`, `T3`.

Do not use a separate risk model in task records. If scope grows during execution, update the task to the higher tier and follow the higher-tier policy.

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
- `T2` / `T3` manual closure requires `/red-verify` `SEMANTIC_VERDICT: semantic-pass` after `/verify PASS`; if semantic issues are found, the scheduler or explicit owner may reopen/block/fail or create follow-up work.
- `semantic-concern` in manual mode means do not trust the existing `done` state without human review / follow-up.
- Do not mix scheduler mode and manual mode inside one task run.
- No persisted `mode` field is used.

Tier summary:
- T0/T1: compact allowed.
- T2/T3: verify + red-verify before scheduler marks done.
- T3: human checkpoint + rollback/recovery before scheduler marks done.
- Manual mode: T0/T1 may close on /verify PASS only with explicit closure ownership; T2/T3 require /red-verify semantic-pass before closure.

## T0 - trivial / docs-only

Use for typos, formatting, broken links, or safe documentation changes with no runtime, contract, state, data, security, or test impact.

- Protocol: compact allowed. Full protocol not required.
- Scheduler mode: `/verify TASK` is the ordered verification step; compact protocol/evidence may be enough.
- Manual mode: separate `/verify` is not required; it may be skipped if compact evidence is enough.
- `/red-verify`: not required
- Evidence: `VERDICT: PASS` or clear compact evidence accepted by current lint/doctor policy
- MB-SYNC: only if durable Memory Bank docs/state changed

## T1 - local code / local behavior

Use for one local function, one small component, a local unit test, or a contained behavior change with low blast radius.

- Protocol: compact allowed. Full protocol not required.
- Checks: relevant local lint/typecheck/unit tests when available
- Scheduler mode: `/verify TASK` is the ordered verification step; compact protocol/evidence may be enough.
- Manual mode: separate `/verify` is optional; it may be skipped if compact evidence is enough.
- `/red-verify`: not required
- Evidence: `VERDICT: PASS` or clear compact evidence accepted by current lint/doctor policy
- MB-SYNC: only if durable Memory Bank docs/state changed

## T2 - cross-module / API / state / data / domain

Use for APIs, contracts, events, schemas, state machines, lifecycle changes, data behavior, migrations, multiple modules, or meaningful domain logic.

- Protocol: full protocol files are required
- Compact-only protocol: invalid
- `/verify`: required
- Scheduler mode: verify + red-verify before scheduler marks done; semantic-pass required
- Manual mode: T2 requires explicit closure ownership plus `/red-verify` semantic-pass before closure
- Evidence: store substantive artifacts under `.tasks/<TASK_ID>/`
- MB-SYNC: required

## T3 - critical / security / production / irreversible

Use for auth, permissions, secrets, security-sensitive behavior, deploy/runtime or production impact, irreversible migration, data loss, payments, compliance, or destructive operations.

- Protocol: full protocol files are required
- Compact-only protocol: invalid
- `/verify`: required
- Scheduler mode: verify + red-verify before scheduler marks done; semantic-pass required
- T3: human checkpoint + rollback/recovery before scheduler marks done
- Required scheduler marker lines are exact standalone lines: `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`
- Manual mode: T3 requires explicit closure ownership, `/red-verify` semantic-pass, and human/recovery markers before closure
- MB-SYNC: required

## Assignment Rules

- Docs-only and safe -> `T0`
- Local, contained, low blast radius -> `T1`
- API, contracts, state, data, migration, domain logic, or multiple modules -> at least `T2`
- Auth, security, deploy/runtime, production, irreversible/data-loss, payments, or compliance -> `T3`
- If unsure between two tiers, choose the higher tier
