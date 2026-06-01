---
description: Автономный прогон JSON task queue (TASK-*) в чистых сессиях Codex/Claude.
status: active
---
# /autopilot — Run JSON task queue autonomously

## Важно
- Это **executor JSON task queue**, а не полный `PRD → done` orchestrator.
- Для полного unattended flow используй `/autonomous`.
- Запуск разрешён только если JSON task records уже декомпозированы и последний `/review` дал `APPROVE`.
- По умолчанию выполняй **строго последовательно**. Параллель — только для независимых задач без общих файлов.
- `/autopilot` не запускает `/prd-to-tasks` и не создает task queue; он только исполняет уже готовые JSON task records.

## Preconditions
- `.memory-bank/tasks/index.json` exists and lists task record files.
- `.memory-bank/schemas/task.schema.json` exists.
- Each indexed `.memory-bank/tasks/*.task.json` has at minimum:
  - `id`
  - `status: planned|ready|in_progress|blocked|done|failed`
  - `wave`
  - `feature`
  - `depends_on`
  - `touched_files`
  - `tier: T0|T1|T2|T3`
- Every task `feature` points to a `.memory-bank/features/FT-<NNN>-*.md` file that is not explicitly marked `clarification_status: pending|blocked`.
- Every `T2` / `T3` task has relevant SDD spec links in `source_artifacts`, `normative_inputs`, `constraints`, `invariants`, or `verification_targets`.
- `.memory-bank/spec-index.md` records mandatory `/spec-design` status `complete`, or `minimal` with explicit `not_applicable` areas.
- Authoritative routing is only `task.tier`; the old `risk` / `risk.level` model is invalid and must not be used.
- Нет unresolved blocking questions в `.protocols/AUTONOMOUS-RUN/status.md` или equivalent run protocol.
- `/mb-doctor --strict` passes before the run starts.

If there are no JSON task records, stop with an explicit error:
`HALT_DEPENDENCY_DEADLOCK: no schema-backed task records found in .memory-bank/tasks/index.json`.

If any indexed task record is missing `tier`, stop with `HALT_POLICY_VIOLATION`.
If any indexed task record is missing `feature`, references a missing feature file, or references a feature explicitly marked `clarification_status: pending|blocked`, stop with `HALT_CLARIFICATION_REQUIRED`.
If backbone status is missing/blocked, or any indexed `T2` / `T3` task lacks linked SDD specs, stop with `HALT_QUALITY_GATES` and route back to `/spec-design`, then `/spec-improve FT-<NNN>` or `/spec-auto --all`.
Read the task queue and task metadata only from JSON task records.
Before task selection and before progression after a task closes, run `/mb-doctor --strict` using the repository's documented command or `node scripts/mb-doctor.mjs --strict`. Treat a missing doctor command/script, non-zero exit, or readiness error as `HALT_QUALITY_GATES`. Explicit pending/blocked feature clarification and tasks linked to those features are readiness errors. `mb-doctor` runs `mb-lint` as its first gate; do not fall back to plain `mb-lint` for autonomous readiness.

## Протокол batch-run
Если `.protocols/AUTONOMOUS-RUN/status.md` ещё нет:
- создай его с разделами:
  - run metadata
  - review gate
  - blocking questions / assumptions
  - queue state
  - failure budget
  - terminal state

Во время прогона обновляй:
- queue state from JSON task records (`ready`, `in_progress`, `blocked`, `done`, `failed`)
- latest review verdict
- current failure budget
- terminal state

## Status ownership

Status transitions have two modes.

Scheduler mode:
- `/autopilot` is the scheduler for an already prepared JSON task queue.
- `/autopilot` owns `planned -> ready`, `ready -> in_progress`, `in_progress -> done`, `in_progress -> failed`, dependent block/unblock decisions, and terminal queue state.
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

## Selection rule
На каждой итерации reread `.memory-bank/tasks/index.json` and indexed `.task.json` records.

Сначала выполни promotion pass:
- `planned -> ready`, если все `depends_on` уже `done` и нет blockers / blocking review rejects / unresolved semantic-concern
- не продвигай задачу, если upstream failed/blocked, есть open blocking bug или task-level review reject
- запиши promotion в соответствующий `.task.json`

Затем выбирай только задачи, у которых:
- `status: ready`
- все `depends_on` уже `done`
- нет blocking bug / blocked upstream

Если после promotion pass `ready` пусто:
- и JSON task queue полностью закрыт → запусти финальный `/review`; `SUCCESS` разрешён только если final `/review` вернул `APPROVE`
- и остались `planned` / `blocked` → `HALT_DEPENDENCY_DEADLOCK`

## TASK loop
Для каждой выбранной задачи:
1) переведи в task record `status: ready -> in_progress`
2) перечитай `task.tier` из JSON record and route only by that value
3) выполни `/execute TASK-<ID>`
4) выполни `/verify TASK-<ID>` by tier:
   - `T0` / `T1`: compact protocol/evidence allowed according to tier policy
   - `T2` / `T3`: full path is required
   - `T3`: require exact marker lines `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`; no silent autonomous closure
5) run `/red-verify TASK-<ID>` if required by tier (`T2` / `T3`)
6) scheduler writes closure/failure/blocking decision, final task status, and evidence links to the authoritative indexed `.memory-bank/tasks/TASK-*.task.json`:
   - `T0` / `T1`: normal `done` allowed after compact evidence / functional `VERDICT: PASS`
   - `T2` / `T3`: `done` allowed only after `/verify` `VERDICT: PASS` evidence and `/red-verify` `SEMANTIC_VERDICT: semantic-pass`
   - `semantic-concern`: never normal `done`; write `blocked` or `in_progress` pending human review with owner/reason/follow-up evidence
   - `FAIL` or `semantic-fail`: write `status: failed`, create bug + follow-up task, and record failure budget impact
7) run `/mb-sync` to synchronize the already-written task state; if the task record does not contain the scheduler decision/status/evidence, `/mb-sync` reports a consistency gap and stops
8) run `node scripts/mb-lint.mjs`, then `/mb-doctor --strict`
9) apply a separate scheduler promotion/dependent blocking pass:
   - promote dependents через explicit `planned -> ready`, если все их deps закрыты и нет blockers / blocking review rejects / unresolved semantic-concern
   - block dependents if upstream is `failed` / blocking / unresolved `semantic-concern`
   - write every promotion/blocking result to the affected `.task.json` records

After `ready -> in_progress`, command order is exactly: `/execute` → `/verify` → `/red-verify` if required → scheduler writes final task decision/status/evidence to `.task.json` → `/mb-sync` → `node scripts/mb-lint.mjs` + `/mb-doctor --strict` → scheduler promotion/dependent blocking pass.

Новые follow-up задачи, созданные во время verify, должны подхватываться **в том же run** на следующей итерации.

## Concrete task-level commands
### Codex (fresh session per TASK)

```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  "TASK_ID=TASK-123. Read AGENTS.md, the indexed JSON task record, and the tier-selected protocol path. Route only by task.tier. Implement only scoped changes. Update compact run.md or full progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md."

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  "TASK_ID=TASK-123. Read the indexed JSON task record and linked acceptance criteria. Route only by task.tier: T0/T1 compact run.md; T2/T3 verify + red-verify; T3 exact markers HUMAN_CHECKPOINT: done and ROLLBACK_RECOVERY_NOTE: present. Run mb-doctor --strict before progression."
```

### Claude (fresh session per TASK)
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  "TASK_ID=TASK-123. Read AGENTS.md, the indexed JSON task record, and the tier-selected protocol path. Route only by task.tier. Implement only scoped changes. Update compact run.md or full progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md."

claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  "TASK_ID=TASK-123. Read the indexed JSON task record and linked acceptance criteria. Route only by task.tier: T0/T1 compact run.md; T2/T3 verify + red-verify; T3 exact markers HUMAN_CHECKPOINT: done and ROLLBACK_RECOVERY_NOTE: present. Run mb-doctor --strict before progression."
```

## Terminal states
- `SUCCESS`
- `HALT_BLOCKING_QUESTIONS`
- `HALT_CLARIFICATION_REQUIRED`
- `HALT_REVIEW_REJECT`
- `HALT_FAILURE_BUDGET`
- `HALT_DEPENDENCY_DEADLOCK`
- `HALT_POLICY_VIOLATION`
- `HALT_QUALITY_GATES`
- `HALT_BUDGET_EXCEEDED`
