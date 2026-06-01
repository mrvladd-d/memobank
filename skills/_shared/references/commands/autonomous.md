---
description: Полный автономный прогон PRD → FT → TASKs → execute/verify/review до terminal state.
status: active
---
# /autonomous — End-to-end autonomous run

<objective>
Запустить **полный автономный цикл** без ожидания пользователя:
- intake Product Brief / PRD / delta
- SDD Design Specs initialization, mandatory adaptive backbone, and feature design
- построение L1–L3
- PRD-level ambiguity closure
- декомпозиция всех FT в schema-backed JSON TASK records
- execution + verification + MB-SYNC
- промежуточные и финальные review-гейты
- завершение в явном terminal state
</objective>

<process>

## 0) Когда использовать
Используй эту команду, когда:
- есть `prd.md` или явный PRD-текст пользователя,
- нужен режим “запустил и ушёл”,
- разрешены автономные code-edit сессии через Codex / Claude CLI,
- не требуется ручной выбор одной фичи за раз.

Если нужен **только JSON task queue executor**, а PRD → FT → TASK уже готовы, используй `/autopilot`.

## 1) Протокол автономного запуска
Создай:
- `.protocols/AUTONOMOUS-RUN/plan.md`
- `.protocols/AUTONOMOUS-RUN/status.md`
- `.protocols/AUTONOMOUS-RUN/decision-log.md`
- `.tasks/TASK-AUTONOMOUS/`

`status.md` должен содержать минимум:
- run metadata
- review gate
- blocking questions / assumptions
- queue state (`ready`, `in_progress`, `blocked`, `done`, `failed`)
- failure budget
- terminal state + reason

## 2) Preflight (не пропускай)
Проверь:
- `.memory-bank/` существует; если нет — сначала `/mb-init`
- доступен `prd.md` или PRD-текст
- есть хотя бы один исполнитель (`codex` или `claude`)
- есть policy-гейт: `.memory-bank/workflows/autonomy-policy.md`

Default pre-queue health check:
- до создания executable JSON task queue запусти `node scripts/mb-lint.mjs`, затем plain `/mb-doctor` using the repository's documented command or `node scripts/mb-doctor.mjs`
- pre-queue `/mb-doctor` is a health check only and must not require executable task records / ready queue
- не запускай `/mb-doctor --strict` до того, как `/prd-to-tasks --all` создаст queue

Если в репозитории уже есть существенный код:
- сначала построй/обнови baseline через `/map-codebase`
- только потом накладывай PRD delta

Запреты по умолчанию:
- не устанавливай новые skills из marketplace без явного подтверждения
- не делай deploy / prod writes / secret reads
- не трогай инфраструктуру вне репозитория без явного allowlist

## 3) Intake PRD в автономном режиме
1) Если PRD упоминает tools / skills / CLIs:
   - запусти `/find-skills`
   - **автоиспользуй только уже установленные project skills**
   - отсутствующие skills только зафиксируй как рекомендацию
2) Before `/write-prd`, inspect `.memory-bank/constitution.md` frontmatter/value `project_principles`.
   - If `project_principles` is `ratified` or `partial`, use the Constitution as the current project principles.
   - If it is anything else (`framework-default`, `skipped`, missing, or unclear), do not run an interactive `/constitution` interview in autonomous mode.
   - Continue with framework defaults or an explicit skipped/default assumption, and record that marker in `.protocols/AUTONOMOUS-RUN/decision-log.md` and `.protocols/AUTONOMOUS-RUN/status.md`.
   - This is not a hard blocker unless the PRD itself creates a blocking governance conflict.
3) Если `.memory-bank/prd.md` отсутствует или не имеет `clarification_status: complete` + `constitution_checked: true`, запусти `/write-prd`.
4) Запусти `/spec-auto --init` after `/write-prd` and before `/prd`.
5) Построй L1–L3 через `/prd`.
6) Запусти `/spec-design --all`. For simple independent T0/T1-only features it must record a minimal backbone and mark irrelevant areas `not_applicable`; for unsafe unresolved decisions it must record blockers and stop downstream.
7) Запусти `/spec-auto --all` before `/prd-to-tasks --all`.
8) Если есть пробелы:
   - **non-blocking** → зафиксируй в `.protocols/AUTONOMOUS-RUN/decision-log.md` как `Assumption`
   - **blocking** (security/compliance/payments/external contract/data loss) → поставь terminal state `HALT_BLOCKING_QUESTIONS` и остановись

## 4) Review gate после PRD
Сразу после L1–L3 запусти `/review`.

Правило:
- если есть `REJECT` с P0/P1 → исправь и повтори review
- если после 2–3 циклов всё ещё `REJECT` → terminal state `HALT_REVIEW_REJECT`
- batch execution разрешён **только после `APPROVE`**

## 5) Feature preflight перед декомпозицией
Перед `/prd-to-tasks --all` проверь targeted features.
Missing feature clarification metadata is valid and must not block decomposition by itself.
`/spec-design --all` must have produced global backbone status `complete` or `minimal` before `/spec-auto --all`.
`/spec-auto --all` must already have assigned each targeted feature `spec_design_status: complete|not_required|blocked`.

Block `/prd-to-tasks --all` when any targeted feature has:
- explicit `clarification_status: pending|blocked`
- `spec_design_status: blocked`
- missing or `blocked` global backbone status
- likely T2/T3 work with missing/incomplete `spec_design_status` or missing linked SDD specs
- unresolved markers that affect decomposition, acceptance criteria, dependencies, verification, security/compliance, external contracts, data migration, or data-loss risk

Правила:
- не придумывай product decisions
- не создавай task records для pending/blocked features or features with decomposition-affecting unresolved markers
- if feature blocker preflight finds blockers, record them in `.protocols/AUTONOMOUS-RUN/status.md`, set terminal state `HALT_CLARIFICATION_REQUIRED`, and stop
- never invoke `/clarify-feature` automatically in autonomous mode; it is a manual or explicit follow-up command for feature blockers
- missing clarification metadata is not a blocker
- do not bypass `/spec-auto`; if T2/T3 work lacks linked SDD specs, record the blocker and stop before `/prd-to-tasks --all`
- do not bypass `/spec-design`; missing or blocked backbone status stops before `/prd-to-tasks --all`
- продолжай только когда no targeted feature is explicitly pending/blocked and no unresolved marker blocks decomposition

## 6) Декомпозиция всех фич
После feature preflight запусти:
- `/prd-to-tasks --all`

Требование:
- `.memory-bank/tasks/index.json` must list schema-backed task records
- each indexed `.memory-bank/tasks/TASK-<NNN>.task.json` must contain:
  - `id`
  - `title`
  - `status: planned|ready|in_progress|blocked|done|failed`
  - `wave`
  - `feature`
  - `reqs`
  - `depends_on`
  - `touched_files`
  - `tier: T0|T1|T2|T3`
  - `gates`
  - `verify`
  - `docs`
- Authoritative routing is only `task.tier`; the old `risk` / `risk.level` model is invalid and must not be used.
- T2/T3 task records must include relevant SDD spec links in `source_artifacts`, `normative_inputs`, `constraints`, `invariants`, or `verification_targets`.

## 6.1) Review gate по JSON task records
Сразу после `/prd-to-tasks --all` и до scheduler execution запусти `/review` именно по task planning surface:
- `.memory-bank/tasks/index.json`
- all indexed `.memory-bank/tasks/*.task.json`
- per-feature implementation plans

Правило:
- если review даёт blocking `REJECT` по task records / waves / gates / dependencies / verify surface → исправь JSON task records и повтори `/review`
- если после 2–3 циклов всё ещё blocking `REJECT` → terminal state `HALT_REVIEW_REJECT`
- scheduler execution разрешён только после `APPROVE` или после явного решения, что оставшиеся non-blocking замечания не мешают запуску

## 6.2) Readiness gate
Перед scheduler execution запусти `node scripts/mb-lint.mjs`, затем `/mb-doctor --strict` using the repository's documented command or `node scripts/mb-doctor.mjs --strict`.

Правило:
- strict doctor is a post-queue gate: запускай его только после того, как `/prd-to-tasks --all` создал `.memory-bank/tasks/index.json` и indexed task records
- если doctor command/script отсутствует, падает, или возвращает readiness errors → terminal state `HALT_QUALITY_GATES`
- after task queue exists, required ordering is `node scripts/mb-lint.mjs` + `mb-doctor --strict`; do not replace strict doctor with plain lint
- explicit pending/blocked feature clarification or tasks linked to such features are readiness errors
- T2/T3 tasks without linked SDD specs are readiness errors
- strict doctor должен быть зелёным до первого task selection pass

## 7) Scheduler loop
Работай по `.memory-bank/tasks/index.json` и indexed `.task.json` records.
If JSON task records are missing or empty, set terminal state `HALT_DEPENDENCY_DEADLOCK` with reason `no schema-backed task records`.
If any indexed task record is missing `tier`, set terminal state `HALT_POLICY_VIOLATION` and stop.
If any indexed `T2` / `T3` task lacks linked SDD specs, set terminal state `HALT_QUALITY_GATES` and route back to `/spec-auto --all`.
Read the task queue and task metadata only from JSON task records.
Before task selection and before progression after each closed task, run `node scripts/mb-lint.mjs`, then `/mb-doctor --strict` using the repository's documented command or `node scripts/mb-doctor.mjs --strict`. Treat doctor absence, non-zero exit, or readiness errors as `HALT_QUALITY_GATES`.

### Status ownership

Status transitions have two modes.

Scheduler mode:
- `/autonomous` is the scheduler for the end-to-end run.
- `/autonomous` owns `planned -> ready`, `ready -> in_progress`, `in_progress -> done`, `in_progress -> failed`, dependent block/unblock decisions, terminal queue state, and final run status.
- `/execute` returns scoped implementation handoff; it does not close tasks.
- `/verify` gives functional verdict/evidence; in scheduler mode it does not close/fail/block/promote.
- `/red-verify` gives semantic verdict for T2/T3; in scheduler mode it does not close/fail/block/promote.
- Scheduler must write the closure/failure/blocking decision, final task status, and evidence links to the authoritative indexed `.memory-bank/tasks/TASK-*.task.json` record before `/mb-sync`.
- `/mb-sync` records/reconciles already-written task state. It does not decide closure/failure/blocking/promotion and must not sync a decision that exists only in scheduler context.
- T0/T1 scheduler closure may use compact evidence / functional PASS according to tier policy.
- T2/T3 scheduler closure requires `VERDICT: PASS` plus `SEMANTIC_VERDICT: semantic-pass` before scheduler marks `done`.
- T3 scheduler closure also requires exact markers `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`.

Manual mode:
- Expected T0/T1 simple flow: `/execute -> /verify`.
- Manual closure is allowed only when an explicit closure owner exists.
- T0/T1 may be marked `done` after functional `VERDICT: PASS` and completed evidence.
- T2/T3 must not treat `/verify PASS` alone as final `done`; run `/red-verify` and require `SEMANTIC_VERDICT: semantic-pass` before final closure/`/mb-sync`.
- If `/red-verify` is run later and finds semantic issues, it may change status `done -> blocked`, `done -> failed`, or create a bug/follow-up task.
- `semantic-concern` in manual mode means do not trust the existing `done` state without human review / follow-up.
- Do not mix scheduler mode and manual mode inside one task run.
- No persisted `mode` field is used.

Перед каждым selection pass выполни promotion pass:
- `planned -> ready`, если все `depends_on` уже `done` и нет blockers / blocking review rejects / unresolved semantic-concern
- не продвигай задачу, если upstream failed/blocked, есть open blocking bug или task-level review reject
- запиши promotion в соответствующий `.task.json`

Выбирай только задачи, у которых:
- `status: ready`
- все `depends_on` уже `done`
- нет blocking bug / blocking review reject

Если после promotion pass `ready` пусто:
- и JSON task queue полностью закрыт → переходи к финальному review/success evaluation
- и остались `planned` / `blocked` → `HALT_DEPENDENCY_DEADLOCK` только после фиксации, какие dependencies/blockers/review rejects/semantic-concern помешали promotion

Правила очереди:
- независимые задачи (нет deps и shared files) можно запускать параллельно
- зависимые или shared-file задачи — только последовательно
- follow-up task, добавленная по итогам verify, должна попасть в **следующую итерацию того же run**

## 8) Execution loop per TASK
Для каждого выбранного `TASK-*`:
1) scheduler writes `ready -> in_progress`
2) `/execute TASK-<ID>`
3) `/verify TASK-<ID>` by `task.tier` from the JSON record:
   - `T0` / `T1`: compact protocol/evidence allowed according to tier policy
   - `T2` / `T3`: full protocol path is required
   - `T3`: require exact marker lines `HUMAN_CHECKPOINT: done` and `ROLLBACK_RECOVERY_NOTE: present`; no silent autonomous closure
4) run `/red-verify TASK-<ID>` if required by tier (`T2` / `T3`)
5) scheduler records the closure/failure/blocking decision, final task status, and evidence links in the authoritative indexed `.memory-bank/tasks/TASK-*.task.json`
6) run `/mb-sync` to synchronize the already-written task state; if the task record does not contain the scheduler decision/status/evidence, `/mb-sync` reports a consistency gap and stops
7) run `node scripts/mb-lint.mjs`, then `/mb-doctor --strict`
8) scheduler performs a separate promotion/dependent blocking pass and writes any `planned -> ready` / downstream `blocked` changes to their `.task.json` records

After `ready -> in_progress`, command order is exactly: `/execute` → `/verify` → `/red-verify` if required → scheduler writes final task decision/status/evidence to `.task.json` → `/mb-sync` → `node scripts/mb-lint.mjs` + `/mb-doctor --strict` → scheduler promotion/dependent blocking pass.

Переходы состояния:
- `ready -> in_progress`
- `in_progress -> done` for `T0` / `T1` при compact evidence / functional `VERDICT: PASS`
- `in_progress -> done` for `T2` / `T3` only after `/verify` `VERDICT: PASS` evidence and `/red-verify` `SEMANTIC_VERDICT: semantic-pass`
- `in_progress -> failed` при `VERDICT: FAIL` или `SEMANTIC_VERDICT: semantic-fail`
- `SEMANTIC_VERDICT: semantic-concern` is never normal `done`: set the task/dependents to `blocked` or require human review, and record owner/reason/follow-up evidence
- после `semantic-concern` не закрывай задачу и не продвигай dependents until a subsequent `/red-verify` returns `SEMANTIC_VERDICT: semantic-pass`
- downstream dependents → `blocked`, если upstream failed/blocking

Все переходы записывай в соответствующий `.task.json`. Queue state в `.protocols/AUTONOMOUS-RUN/status.md` должен ссылаться на task record paths, а не дублировать authoritative state.

## 9) Wave review
После завершения каждой wave:
- убедись, что все `semantic-concern` этой wave имеют явное решение (blocked status, human review required, or follow-up); без subsequent `semantic-pass` affected tasks are not closed
- обнови `.protocols/AUTONOMOUS-RUN/status.md`
- запусти `node scripts/mb-lint.mjs`, затем `/mb-doctor --strict`; если gate падает, не закрывай wave и не переходи к следующей wave
- запусти `/review`

Если доступны **оба** движка:
- prefer engine A for execution
- prefer engine B for final wave/final review
- не ревьюй критичный результат тем же freshest writer-context, если есть альтернатива

Если review после wave даёт blocking `REJECT`:
- исправь и повтори
- если budget исчерпан → `HALT_REVIEW_REJECT`

## 10) Failure budgets
Зафиксируй и соблюдай:
- `max_retries_per_task`
- `max_consecutive_failures`
- `max_open_blockers`
- `max_files_changed_per_task`

При превышении любого лимита:
- terminal state `HALT_FAILURE_BUDGET`

## 11) Terminal states
Финал должен быть **явным** в `.protocols/AUTONOMOUS-RUN/status.md`:

- `SUCCESS`
- `HALT_BLOCKING_QUESTIONS`
- `HALT_CLARIFICATION_REQUIRED`
- `HALT_REVIEW_REJECT`
- `HALT_FAILURE_BUDGET`
- `HALT_DEPENDENCY_DEADLOCK`
- `HALT_POLICY_VIOLATION`
- `HALT_QUALITY_GATES`
- `HALT_BUDGET_EXCEEDED`

## 12) Success condition
Считай run завершённым только если:
- в JSON task records не осталось `ready` / `in_progress`
- все обязательные REQ/AC имеют `Lifecycle: verified`
- нет открытых blocking bugs / blockers
- latest `/review` = `APPROVE`
- latest `node scripts/mb-lint.mjs` + `/mb-doctor --strict` pass without readiness errors
</process>
