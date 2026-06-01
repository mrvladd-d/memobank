---
description: Синхронизация Memory Bank после изменения: обновить индексы, RTM/task records и changelog.
status: active
---
# /mb-sync — Memory Bank sync

Используй после любой значимой задачи.

Follow: `.memory-bank/workflows/mb-sync.md`

## Status ownership

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

- `/mb-sync` synchronizes Memory Bank docs, RTM/lifecycle notes, changelog, evidence links, and task-record consistency after a closure/failure/blocking decision already exists in the authoritative task record.
- `/mb-sync` does not independently decide task closure, failure, blocking, promotion, `planned -> ready`, dependent unblock, or dependent block.
- In `/autopilot` / `/autonomous`, the scheduler owns task status transitions, closure, failure handling, and dependent block/unblock. `/mb-sync` records already-written scheduler decisions and reports consistency problems.
- If a closure/failure/blocking decision is only present in the current agent/scheduler context and is not written to the indexed `.task.json`, `/mb-sync` must report a consistency gap and stop for an explicit scheduler or standalone owner decision.
- In standalone/manual mode, `/mb-sync` may sync a manual closure only if the explicit owner decision is already recorded in the task record or supplied as a direct instruction for this sync. Otherwise it must report a consistency gap and must not infer closure.
- `/mb-sync` must not silently claim scheduler ownership, become the closure owner, or advance dependents on its own.

Минимальный чеклист:
- [ ] Обновить релевантные `.memory-bank/*` (WHY/WHERE, без псевдокода)
- [ ] Если есть `.memory-bank/analysis/*`, синхронизировать durable Analysis artifacts как часть Memory Bank; если их нет, не создавать их автоматически
- [ ] Обновить `.memory-bank/index.md` и подпапочные роутеры
- [ ] Если менялись governance/workflow/routing/agent instructions/tier policy, проверить consistency с `.memory-bank/constitution.md`
- [ ] Обновить RTM/REQ lifecycle в `.memory-bank/requirements.md`
- [ ] Если у EP/FT есть `lifecycle`, синхронизировать его отдельно от document `status`
- [ ] Проверить, что task records не ссылаются на features с `clarification_status: pending|blocked`
- [ ] Reconcile authoritative task records in `.memory-bank/tasks/index.json` and indexed `*.task.json`; write/sync status only when an explicit standalone owner decision is already recorded or supplied as a direct instruction, or synchronize status already written by the scheduler
- [ ] Записать changelog `.memory-bank/changelog.md`
- [ ] Для `/autonomous` и `/autopilot`: `/mb-doctor --strict` после sync — blocking gate, не optional

Task synchronization rule:
- Analysis artifacts in `.memory-bank/analysis/` are durable Memory Bank artifacts, but optional.
- If `.memory-bank/analysis/product-brief.md` exists, keep downstream docs consistent with it or record explicit deltas / override notes.
- If brainstorming artifacts exist without a product brief, preserve them and warn that `/brief` is the expected bridge before `/prd` unless an existing PRD was intentionally used.
- When governance, workflow, routing, AGENTS.md, MBB, spec-index, invariants, task schema, or tier policy changes, compare affected docs with `.memory-bank/constitution.md`.
- If the change contradicts the Constitution, stop sync and require either a minimal doc correction or explicit `/constitution` amendment.
- Do not use `/mb-sync` to invent new governing principles; only reconcile documented changes and evidence.
- JSON task records are authoritative for task status, dependencies, tier, gates, verification targets, and evidence markers.
- Authoritative routing is only `task.tier`; the old `risk` / `risk.level` model is invalid and must not be used.
- RTM and changelog should be reconciled from JSON task records.
- During sync, validate and report whether scheduler-owned promotions/blocking changes would be legal; do not write `planned -> ready`, dependent unblock, or dependent block from `/mb-sync` alone.
- Report tasks whose `feature` points to `clarification_status: pending|blocked` as not promotion-eligible. Missing clarification metadata is allowed.
- Report tasks with failed/blocked upstream dependencies, open blocking bugs, or unresolved semantic concern decisions as not promotion-eligible.
- In scheduler mode, `T2` / `T3` tasks may close only when full protocol closure expectations are present. `T2` / `T3` require `/verify` `VERDICT: PASS` and `/red-verify` `SEMANTIC_VERDICT: semantic-pass`; `T3` also requires exact marker lines `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`.
- In manual mode, `/verify PASS` may close only `T0` / `T1` with explicit closure ownership; `T2` / `T3` require `/red-verify` `SEMANTIC_VERDICT: semantic-pass` before final closure/`/mb-sync`.
- `mb-doctor` is the readiness gate over `mb-lint`; in autonomous/autopilot runs, the scheduler may promote dependents only after strict doctor passes.
