---
description: Декомпозиция фичи в implementation plan и атомарные задачи (waves).
status: active
---
# /prd-to-tasks — Feature → Implementation plan → JSON tasks

<objective>
Взять конкретную фичу (FT-XXX) и превратить её в:
- Implementation Plan
- schema-backed JSON task records (waves)
- критерии done + тесты + verify
</objective>

<process>

## 0) Вход
Ожидается `$ARGUMENTS`:
- `FT-<NNN>` для одной фичи
- `--all` для декомпозиции всех `FT-*` по приоритету

Если аргумент не дан:
- interactive → попроси выбрать фичу
- autonomous → используй `--all`

## 1) Decomposition preflight
Перед созданием или обновлением implementation plan и JSON task records проверь, что feature can be decomposed.
`/prd-to-tasks` does not require feature clarification metadata. The normal path is `/write-prd` → `/spec-init` → `/prd` → `/spec-design` → `/spec-improve FT-<NNN>` → `/prd-to-tasks FT-<NNN>`.

Для `FT-<NNN>`:
1. Найди `.memory-bank/features/FT-<NNN>-*.md`.
2. Прочитай frontmatter.
3. Block only if the feature explicitly says clarification is not complete:

```yaml
clarification_status: pending|blocked
```

Missing clarification metadata does not block decomposition.
`clarification_status: complete` is allowed but not required.

Block if relevant unresolved markers appear in behavior / acceptance / data / contracts / security / UX / operations / verification sections:
- `NEEDS CLARIFICATION`
- `TBD`
- `TODO`
- `???`

Do not block on those words in unrelated notes, changelog-like text, or historical context unless they affect task decomposition or verification.

If blocked:
- interactive mode: report the feature and tell the user to run `/clarify-feature FT-<NNN>` or resolve the marker directly
- autonomous mode: set terminal state `HALT_CLARIFICATION_REQUIRED`
- stop immediately before decomposition
- do not create or update implementation plans
- do not create, update, or index task records

For `--all`:
- resolve the full targeted feature set first
- if any targeted feature is missing, has `clarification_status: pending|blocked`, or has blocking unresolved markers, halt before creating or updating task records for any feature
- report all blocked feature IDs and their blockers

`/clarify-feature` does not assign tier. Tier remains mandatory here and is assigned during task decomposition.

## 1.1) SDD design preflight
Before decomposition, read `.memory-bank/spec-index.md` and the target feature doc.
Block before task generation unless the global backbone status is `complete` or `minimal` with explicit `not_applicable` areas. If backbone status is missing or `blocked`, route to `/spec-design` and stop.

Feature frontmatter may include:

```yaml
spec_design_status: complete|not_required|blocked
spec_design_links:
  - .memory-bank/tech-specs/FT-<NNN>-<slug>.md
```

Rules:
- `spec_design_status: blocked` always blocks task decomposition.
- `spec_design_status: not_required` is allowed only for simple T0/T1-like features with a concise rationale in the feature doc.
- `spec_design_status: complete` requires at least one concrete linked spec when the feature implies T2/T3 work.
- missing or incomplete `spec_design_status` does not always block immediately; first estimate the likely task tiers from feature scope.
- If decomposition reveals any T2/T3 task would be needed and `spec_design_status` is missing, `blocked`, `not_required`, or `complete` without linked specs, stop and route to `/spec-improve FT-<NNN>` (or `/spec-auto FT-<NNN>` in autonomous flow).
- If multiple targeted features need the same missing shared domain/contract/state/API/security/data/runtime decision, stop and route to `/spec-design` before `/spec-improve`.
- Do not create new specs here. This command only consumes the design surface and routes to `/spec-improve` when needed.
- Design specs are normative source of truth for task cards. If feature/task interpretation conflicts with linked SDD specs, stop with a blocker instead of resolving locally.

T2/T3 indicators include:
- cross-module behavior
- API/contract/schema/state/data/domain model changes
- migrations or persistence behavior
- security/auth/secrets/compliance/payments
- deploy/runtime/production impact
- changes where tests can pass while the substance is wrong

For `--all`, resolve the full targeted feature set first. If any targeted feature would need T2/T3 tasks without complete linked SDD specs, halt before creating or updating task records for any feature and report all blocked features.

## 2) Создай протокол фичи
- `.protocols/FT-<NNN>/plan.md`
- `.protocols/FT-<NNN>/decision-log.md`

Do not remove the current `.protocols/FT-<NNN>/decision-log.md` behavior; the no-extra-protocol-files rule applies to `/clarify-feature`.

## 3) Прочитай контекст
- `.memory-bank/features/FT-<NNN>-*.md`
- соответствующий epic
- requirements RTM
- `.memory-bank/constitution.md`, если есть
- `.memory-bank/spec-index.md`, если есть
- linked SDD design specs from the feature and spec-index, if any
- `.memory-bank/workflows/tier-policy.md`, если есть

## 4) Напиши Implementation Plan
Создай `.memory-bank/tasks/plans/IMPL-FT-<NNN>.md`:
- цели
- short `Constitution Check`: relevant principles, conflicts/blockers, and tier-policy consistency
- шаги
- expected touched files
- тесты
- гейты качества
- UAT steps

Если в feature doc уже есть richer spec-driven inputs, **предпочитай** включить их в план:
- `Source Artifacts`
- `Normative Inputs`
- `Constraints`
- `Invariants`
- `Verification Targets`
- `spec_design_links`

Если этих секций нет:
- не считай это ошибкой
- используй классический вход: feature doc + epic + RTM + duo docs

Constitution Check rules:
- Keep the check short; it is a planning gate, not a copy of the Constitution.
- If the feature or proposed implementation conflicts with `.memory-bank/constitution.md`, stop and report the blocker before creating or updating task records.
- Do not add `.memory-bank/constitution.md` to every task `normative_inputs` automatically.
- Add Constitution to a task `normative_inputs` only when a specific principle is materially relevant to execution or verification of that task.
- Do not introduce alternatives to the required `tier: T0|T1|T2|T3` routing model.

## 5) Нарежь на schema-backed tasks (waves)
JSON task records are the source of truth:
- `.memory-bank/schemas/task.schema.json`
- `.memory-bank/tasks/index.json`
- `.memory-bank/tasks/TASK-<NNN>.task.json`

Создай или обнови отдельные `.task.json` файлы:
- Wave 1: T0/T1 foundation
- Wave 2: core logic
- Wave 3: integration & polish

Правила:
- каждая задача должна быть достаточно маленькой (обычно 1–2 часа)
- каждая задача описывает:
  - что сделать
  - какие файлы трогаем
  - какие тесты написать
  - как проверить
  - какие MB документы обновить (Docs First)

Минимальный JSON record (обязательно для `/autopilot` и `/autonomous`):
```json
{
  "id": "TASK-001",
  "title": "Short task title",
  "status": "planned",
  "wave": "W1",
  "feature": "FT-001",
  "reqs": ["REQ-001"],
  "depends_on": [],
  "touched_files": [],
  "tier": "T1",
  "gates": [
    {
      "name": "unit tests",
      "command": "npm test",
      "required": true
    }
  ],
  "verify": [],
  "docs": [],
  "evidence_required": [],
  "source_artifacts": [],
  "normative_inputs": [],
  "constraints": [],
  "invariants": [],
  "verification_targets": []
}
```

Required enums:
- `status`: `planned|ready|in_progress|blocked|done|failed`
- `tier`: `T0|T1|T2|T3`

Tier is mandatory. Do not create or index a task record without `tier`.
Authoritative execution, verification, red-verification, and autonomous routing are determined only by `task.tier`.
The old `risk` / `risk.level` model is invalid and removed.

Tier assignment:
- `T0`: trivial docs-only or formatting/link fixes with no runtime, contract, state, data, security, or test impact.
- `T1`: local code or local behavior with low blast radius.
- `T2`: cross-module, API/contract/schema/state/data/migration/domain behavior, or changes where tests can pass while the substance is wrong.
- `T3`: auth, security, secrets, deploy/runtime/production impact, irreversible/data-loss, payments, compliance, or other critical changes.
- If uncertain between two tiers, choose the higher tier.
- If scope grows during planning, update `tier` before handing the task to execution.

Эти ключи обязательны в task records; когда есть достаточно evidence и это реально помогает downstream deterministic execution, заполняй их содержимым:
- `source_artifacts`
- `normative_inputs`
- `constraints`
- `invariants`
- `verification_targets`

Важно:
- ключи обязательны, но значения могут быть пустыми массивами, если evidence нет
- не выдумывай содержимое без evidence из PRD / feature docs / baseline docs / contracts / states / runbooks
- for `T2` / `T3`, include relevant linked SDD specs from `spec_design_links` and `spec-index.md` in `source_artifacts`, `normative_inputs`, `constraints`, `invariants`, or `verification_targets`
- include relevant backbone specs from `spec-index.md` whenever they constrain source of truth, module boundaries, runtime data model, API behavior, events/messages, frontend component behavior, invariants, or testing gates
- if a planned `T2` / `T3` task has no relevant linked SDD spec to include, stop and route back to `/spec-improve FT-<NNN>` instead of creating a weak task record

Обнови `.memory-bank/tasks/index.json` только ссылками:
```json
{
  "version": 1,
  "tasks": [
    {
      "id": "TASK-001",
      "file": "TASK-001.task.json"
    }
  ]
}
```

Правила ready-state:
- foundation tasks без deps могут стартовать как `ready`
- downstream tasks по умолчанию `planned`
- `planned -> ready` происходит явно, когда все prerequisites/dependencies уже `done` или отсутствуют, и нет blockers / blocking review rejects
- dependent task может быть `ready`, если все её dependencies уже `done`

## 6) Gate
Перед `execute`:
- проверь что acceptance criteria из FT покрыты задачами
- обнови RTM при необходимости
- если richer fields были добавлены, проверь что они не противоречат feature doc и RTM

Если используется `--all`:
- пройдись по всем `FT-*` в порядке приоритета
- после каждой фичи перечитай `tasks/index.json` и избегай дублирования `TASK-*`
- не запускай execution отсюда; только готовь autonomous-ready JSON task queue
</process>
