---
description: Adversarial semantic verification задачи (TASK-XXX) для поиска "дисциплинированно, но по существу неверно".
status: active
---
# /red-verify — Adversarial semantic verification

<objective>
Проверить, что реализованная задача правильна **по существу**, а не только по process/evidence surface.

Этот проход должен ловить ситуации:
- acceptance criteria формально выполнены, но решена не та проблема
- локально всё выглядит корректно, но решение вредит системе целиком
- реализация переоптимизирована под локальную task interpretation и игнорирует соседние ограничения
- появляются drift, state inconsistency, operational risks или скрытая стоимость сопровождения

Разделение ролей:
- `/verify` → "выполнено ли по AC/REQ и есть ли evidence?"
- `/review` → "достаточно ли качественен сам Memory Bank / planning surface?"
- `/red-verify` → "это вообще хорошее и правильное решение в substance?"
- scheduler (`/autopilot` / `/autonomous`) → task status transitions, closure, failure handling, and dependent block/unblock in scheduler mode
</objective>

<when-to-use>
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
- `T2` / `T3` manual closure requires `/verify PASS` plus `/red-verify` `SEMANTIC_VERDICT: semantic-pass` before `status: done` or `/mb-sync`; if semantic-pass is absent, leave closure pending or blocked, not done.
- `semantic-concern` in manual mode means do not trust the existing `done` state without human review / follow-up.
- Do not mix scheduler mode and manual mode inside one task run.
- No persisted `mode` field is used.

Required by tier and mode:
- In scheduler mode, `T2` and `T3` tasks must run `/red-verify` before scheduler marks `done`.
- In manual mode, `/red-verify` is required for `T2` / `T3` before final closure/`/mb-sync`; `T0` / `T1` usually do not need it unless their real scope grew beyond the recorded tier.
- `T0` and `T1` tasks usually do not need `/red-verify` unless their real scope grew beyond the recorded tier; in that case update `task.tier` first.

Status ownership:
- `/red-verify` owns semantic evidence and `SEMANTIC_VERDICT: semantic-pass|semantic-concern|semantic-fail`.
- In scheduler mode (`/autopilot` / `/autonomous`), `/red-verify` must not independently close the task, write `status: done`, write `status: failed`, block dependents, or promote dependents. It returns the semantic verdict and recommended next status to the scheduler.
- In standalone/manual mode, `/red-verify` may change `done -> blocked`, `done -> failed`, or create/recommend a bug/follow-up task when semantic issues are found only under explicit closure ownership.

Особенно полезно, если:
- менялись `contracts/*`, `states/*`, миграции, схемы, data behavior
- задача затрагивает несколько feature/module boundaries
- меняется runtime/API behavior
- задача доменно-нагруженная или business-rule-heavy
- AC можно выполнить узко и при этом промахнуться мимо true intent
- изменение архитектурно рискованное или может создать скрытую future cost
</when-to-use>

<when-not-to-use>
Обычно не нужно для:
- typo-only изменений
- formatting-only изменений
- изолированных механических рефакторингов без behavioral impact
</when-not-to-use>

<process>

0) Вход
Ожидается `$ARGUMENTS`:
- `TASK-<ID>`

1) Не anchor слишком рано на full spec surface
Сначала прочитай в таком порядке:
- task intent из `.memory-bank/tasks/TASK-<ID>.task.json` через `.memory-bank/tasks/index.json`
- linked FT/REQ и `.protocols/TASK-<ID>/plan.md`
- `.protocols/TASK-<ID>/progress.md`
- `.protocols/TASK-<ID>/verification.md`, если уже есть
- реальный change surface:
  - изменённые файлы / diff
  - тесты
  - логи, screenshots, traces и другие artifacts в `.tasks/TASK-<ID>/`

Только после этого подтягивай:
- `.memory-bank/spec-index.md` and linked SDD specs for `T2` / `T3`
- релевантные `contracts/*`
- `states/*`
- `guides/*` when a guide is normative for frontend/component behavior or operating procedure
- `runbooks/*`
- `invariants.md`
- `requirements.md`
- другие spec docs, если они нужны для reconciliation

Важно:
- if the task record has no `tier`, stop with an explicit error
- authoritative red-verification routing is only `task.tier`; the old `risk` / `risk.level` model is invalid and must not be used
- if `task.tier` is `T2` or `T3` and no linked SDD specs are present in task richer fields, feature `spec_design_links`, or `spec-index.md`, stop with a blocker; semantic verification must not bless serious work against AC alone
- if the task record, implementation, or verify verdict conflicts with linked SDD specs or the global backbone, stop with `semantic-concern` or `semantic-fail` instead of choosing locally
- не начинай с предположения, что task record и verify verdict уже доказывают correctness
- сначала сформируй независимую hostile модель риска
- затем сравни её со specs и кодом

2) Построй hostile hypothesis list
Проверь как минимум:
- решена ли реальная задача, а не её удобная локальная интерпретация
- нет ли local optimization с системным вредом
- не нарушены ли implicit boundaries, invariants, contracts, state transitions
- не стал ли код хрупче, сложнее или дороже в сопровождении без достаточной причины
- не создаёт ли решение ложную уверенность за счёт слишком узких тестов/AC

3) Проверь cross-boundary substance
Отдельно оцени:
- cross-feature/module impact
- architectural drift
- state/data consistency
- operational behavior (retries, observability, migrations, failure modes)
- future maintenance cost

Для `T3` обязательно добавь отдельную проверку:
- critical/security concerns
- deploy/runtime/production failure modes
- irreversible/data-loss, compliance, payments, or secrets exposure concerns when relevant
- exact marker `ROLLBACK_RECOVERY_NOTE: present` is present and credible
- exact marker `HUMAN_CHECKPOINT: done` is present before autonomous closure

4) Заполни `.protocols/TASK-<ID>/red-verification.md`
Используй шаблон проекта, если он есть.
Отчёт должен быть коротким, но содержать:
- semantic verdict
- top substance risks
- hidden assumptions
- cross-boundary impact
- architectural concerns
- state/data consistency concerns
- operational concerns
- future maintenance cost
- "how this could still be wrong"
- counterproposal / escalation path

5) Сохрани короткий артефакт в `.tasks/TASK-<ID>/`
Например:
- `.tasks/TASK-<ID>/<TASK_ID>-S-RED-VERIFY-final-report-docs-01.md`

6) Вердикт
- `semantic-pass`:
  - substantive concerns не обнаружены
  - scheduler closure-eligible for normal `done` when `/verify` also has `PASS`
  - manual `T2` / `T3` closure is eligible when `/verify` also has `PASS`; voluntary `T0` / `T1` red-verify does not make their normal verify-based closure stricter
  - recommend `/mb-sync` and closure by the scheduler or explicit standalone owner

- `semantic-concern`:
  - есть серьёзные сомнения или hidden assumptions, но не доказан прямой semantic break
  - scheduler mode: not closure-eligible for normal `done`
  - manual mode: do not trust the existing `done` state without human review / follow-up
  - до продолжения wave требуется явное решение by scheduler/explicit standalone owner: block task/dependents, reopen from `done`, or leave task `in_progress` pending human review
  - если human review принимает concern, зафиксируй owner/reason, обнови work/evidence as needed и повтори `/red-verify`; scheduler normal `done` разрешён только после `semantic-pass`
  - если выбран follow-up, recommend or create it only according to the active workflow ownership
  - recommend not promoting dependents until the task receives `semantic-pass`

- `semantic-fail`:
  - решение по существу неверно, вредно или слишком рискованно
  - заведи or recommend bug doc в `.memory-bank/bugs/BUG-<short>.md` according to active workflow ownership
  - recommend follow-up task as JSON task record
  - scheduler mode: recommend current task `status: failed`
  - manual mode: may change `done -> failed` or create a bug/follow-up task according to the explicit local workflow and closure ownership
  - recommend downstream dependents remain unpromoted/blocked by scheduler

7) Место в normal loop
Рекомендуемый порядок:
- `/execute TASK-<ID>`
- `/verify TASK-<ID>`
- `/red-verify TASK-<ID>` для `T2` / `T3`
- `/mb-sync`

</process>
