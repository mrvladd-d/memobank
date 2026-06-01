# Как работает memobank

Это подробный справочник по `memobank`. README-файлы остаются дружелюбными точками входа, а здесь собрана механика: packaging, установка/bootstrap, workflows, task model, поведение scheduler, command reference и проверки.

Если вы только начинаете, сначала пройдите ручной workflow из README.

## 1. Что такое memobank

`memobank` - это source-only skill pack/framework для Codex CLI, Claude Code, OpenCode и совместимых agent runtimes.

Он устанавливает package skills в runtime, а затем bootstrap-ит целевой репозиторий в workspace Memory Bank:

```text
.memory-bank/  durable project knowledge и generated command specs
.protocols/   resumable execution и verification protocols
.tasks/       runtime evidence, reports и handoff material
```

Цель - дать агентам возможность работать от файлов и проверяемого состояния, а не полагаться на историю чата.

## 2. Source-only packaging

Этот fork намеренно не коммитит generated package-local файлы `shared-*`.

Canonical shared source:

```text
skills/_shared/agents/*
skills/_shared/references/commands/*
skills/_shared/references/workflows/*
skills/_shared/references/protocols/*
skills/_shared/scripts/init-mb.js
```

Generated package-local assets:

```text
skills/<skill>/agents/shared-*
skills/<skill>/references/shared-*
skills/<skill>/scripts/shared-*
```

В source tree generated файлы `shared-*` намеренно отсутствуют. Если `SKILL.md` или command spec ссылается на `shared-*`, эта ссылка становится валидной только после того, как vendoring/install подготовит временную installable copy.

Не устанавливайте этот source-only fork прямым flow `npx skills add <repo>`. Используйте wrapper ниже.

Правила разработки:

- меняйте shared behavior в `skills/_shared/`;
- не редактируйте и не коммитьте generated package-local `shared-*`;
- держите source tree чистым:

```bash
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
```

Ожидаемый результат для source tree: `0`.

## 3. Установка и bootstrap

Основной путь - интерактивный installer:

Запускайте из репозитория framework:

```bash
node scripts/install-framework.mjs
```

Wrapper:

1. Показывает folder picker: можно открыть папку по номеру, подняться вверх, выбрать открытую папку, ввести путь вручную или создать новую папку внутри открытой.
2. Проверяет target: существует ли директория, writable ли она, git status, наличие `.memory-bank/` и `AGENTS.md`.
3. Показывает предупреждения и один общий confirmation; если `.memory-bank/` уже есть, после подтверждения запускается sync/update generated assets.
4. Копирует текущий репозиторий во временную директорию.
5. Запускает `scripts/vendor-shared.mjs` внутри этой копии.
6. Генерирует package-local assets `shared-*` для каждого installable skill.
7. Вызывает `npx -y skills add <prepared-temp-repo> --skill '*' --yes` из target repo.
8. Запускает bootstrap script из prepared temp repo с `cwd=target`.
9. Удаляет временный репозиторий, если не задан `MEMOBANK_KEEP_INSTALL_TMP=1`.

Старый explicit install-only flow остается рабочим и не открывает interactive UI:

```bash
node scripts/install-framework.mjs --skill '*' --yes
```

Обычные опции `skills add` можно передавать дальше:

```bash
node scripts/install-framework.mjs --skill cold-start --global --yes
```

Чтобы посмотреть временно подготовленный репозиторий:

```bash
MEMOBANK_KEEP_INSTALL_TMP=1 node scripts/install-framework.mjs --skill '*' --yes
```

### Bootstrap целевого репозитория вручную

Если package skills уже установлены, целевой репозиторий можно инициализировать через установленный skill script:

```bash
node .agents/skills/mb-init/scripts/shared-init-mb.js
```

При работе напрямую из checkout этого framework целевой репозиторий также можно bootstrap-нуть исходным script:

```bash
node /path/to/memobank/skills/_shared/scripts/init-mb.js
```

Чтобы обновить generated command specs, proxy skills и runtime scripts в уже bootstrap-нутом целевом репозитории:

```bash
node .agents/skills/mb-init/scripts/shared-init-mb.js --sync
```

`--force` сейчас эквивалентен `--sync`.

Для CI/smoke без interactive UI installer поддерживает non-interactive bootstrap:

```bash
node scripts/install-framework.mjs --bootstrap --target /path/to/project --yes
```

Этот режим использует тот же source-only путь: temp copy -> `scripts/vendor-shared.mjs` -> `npx -y skills add <prepared-temp-repo> ...` -> bootstrap из prepared temp repo.

## 4. Generated bootstrap artifacts

`skills/_shared/scripts/init-mb.js` создает или обновляет workspace Memory Bank. По умолчанию он не перезаписывает существующие файлы; `--sync` обновляет generated command specs, proxy skills и runtime scripts.

Основные generated artifacts:

```text
.memory-bank/
  adrs/ADR-000-template.md
  agents/
  archive/
  architecture/
  bugs/
  commands/*.md
  commands/index.md
  constitution.md
  contracts/
  domains/
  epics/
  features/
  glossary.md
  guides/
  index.md
  invariants.md
  mbb/index.md
  product.md
  quality/
  requirements.md
  runbooks/
  schemas/task.schema.json
  skills/index.md
  spec-index.md
  states/
  tasks/index.json
  tasks/plans/
  tech-specs/
  testing/index.md
  workflows/autonomy-policy.md
  workflows/execute-loop.md
  workflows/mb-sync.md
  workflows/tier-policy.md
  changelog.md
.tasks/
.protocols/
scripts/mb-lint.mjs
scripts/mb-doctor.mjs
AGENTS.md
CLAUDE.md
GEMINI.md
.claude/skills/<command>/SKILL.md
.agents/skills/<command>/SKILL.md
```

`.memory-bank/commands/*.md` - source of truth для generated slash commands. `.claude/skills/*` и `.agents/skills/*` - тонкие proxy skills, которые говорят runtime читать соответствующий command spec.

## 5. Package skills

- `cold-start` - all-in-one bootstrap router для greenfield, idea-only и brownfield проектов.
- `mb-init` - генерация skeleton и создание command/proxy.
- `mb-analysis` - optional discovery до PRD: `/analysis`, `/brainstorm`, `/brief`.
- `mb-from-prd` - clarified PRD -> product, requirements, epics, features.
- `mb-map-codebase` - as-is mapping существующего codebase без roadmap speculation.
- `mb-execute` - implementation handoff для одного `TASK-*`.
- `mb-verify` - functional verification по AC/REQ и evidence.
- `mb-red-verify` - adversarial semantic verification.
- `mb-review` - fresh-context review Memory Bank.
- `mb-garden` - maintenance Memory Bank и packaged deterministic lint/readiness tool assets.
- `mb-harness` - deterministic commands, clean sessions и worktree guidance.

## 6. Workflows

### Сначала ручной workflow

Рекомендуемый путь для новичка:

```text
idea / rough draft
  -> /analysis или /brief, если направление нужно прояснить
  -> /constitution, если project principles еще не ratified|partial
  -> /write-prd
  -> /spec-init
  -> /prd
  -> /spec-design
  -> /spec-improve FT-001
  -> /prd-to-tasks FT-001
  -> /execute TASK-001
  -> /verify TASK-001
  -> /red-verify TASK-001 для T2/T3
  -> /mb-sync
  -> повторять feature/task loop
```

`/analysis` маршрутизирует discovery. `/brainstorm` может создать brainstorming report. `/brief` создает Product Brief как вход для `/constitution` и `/write-prd`. Ни один из этих discovery-шагов не создает runnable task records.

`/constitution` читает Product Brief, если он есть, и проводит короткое contextual interview по project principles, Definition of Done, автономности агентов, human checkpoints и non-negotiables. Это нормальный шаг перед `/write-prd`, когда principles еще не `ratified|partial`, но не hard-blocker: если пользователь явно пропускает его, flow продолжает идти с `project_principles: framework-default|skipped`, а Constitution можно ratify позже.

`/write-prd` нормализует вход в `.memory-bank/prd.md` с `type: prd`, `clarification_status: complete` и `constitution_checked: true`. `/spec-init` обновляет `.memory-bank/spec-index.md` как lightweight SDD route map по evidence из PRD/brief/existing specs: planned/candidate/unknown/not_applicable areas, gaps и expected locations, без architecture interview и без раннего выдумывания authoritative specs. `/prd` декомпозирует PRD в L1-L3 docs Memory Bank: product, requirements, epics и features. `/spec-design` является обязательным gate после `/prd`: он потребляет route map из `/spec-init`, для T0/T1 может записать minimal backbone и `not_applicable`, а для shared/T2/T3 фиксирует source-of-truth, boundaries, data/contracts/testing decisions или blockers. По умолчанию architecture остается в одном `architecture/system-architecture.md`; split architecture docs создаются только по выбранной стратегии или реальной сложности. `/spec-improve FT-001` завершает минимально нужный feature-level design или ставит `not_required` для простого T0/T1-like scope. `/prd-to-tasks` создает JSON task records только после появления feature docs и прохождения SDD design gate.

### Понятный PRD или concept

Если есть понятный concept, но нет PRD:

```text
/brief -> /constitution if principles are not ratified|partial -> /write-prd -> /spec-init -> /prd -> /spec-design -> /spec-improve FT-001 -> /prd-to-tasks FT-001
```

Если уже есть внешний PRD или PRD-like text:

```text
/constitution if principles are not ratified|partial -> /write-prd -> /spec-init -> /prd -> /spec-design -> /spec-improve FT-001 -> /prd-to-tasks FT-001
```

Если project principles уже `ratified` или `partial`, можно сразу продолжать с `/write-prd`.

### Brownfield

Для существующего codebase сначала соберите as-is baseline:

```text
/map-codebase -> /constitution if principles are not ratified|partial -> /write-prd --delta -> /spec-init -> /prd -> /spec-design -> /spec-improve FT-001 -> /prd-to-tasks FT-001
```

Можно использовать `/brief`, чтобы сформировать delta input, но route не должен обходить `/write-prd`; перед `/write-prd --delta` запускайте `/constitution`, если project principles еще не `ratified|partial`. Brownfield rule: без PRD/delta нельзя создавать roadmap epics, features или runnable task records. `/map-codebase` документирует текущую систему; он не придумывает план.

### Manual task loop

Interactive mode для одной задачи:

```text
/execute TASK-001 -> /verify TASK-001 -> /red-verify TASK-001 for T2/T3 -> /mb-sync
```

В manual mode T0/T1 task можно закрыть после `/verify PASS` только при явном closure owner и recorded evidence. Для T2/T3 `/verify PASS` не является финальным done: перед closure и `/mb-sync` нужен `/red-verify` с `SEMANTIC_VERDICT: semantic-pass`; для T3 сохраняются human/recovery markers.

### Scheduler mode: `/autopilot`

`/autopilot` - это scheduler/executor только для уже существующей JSON task queue.

Preconditions:

- `.memory-bank/tasks/index.json` содержит indexed task records;
- у каждой task есть обязательный `tier`;
- последний `/review` вернул `APPROVE`;
- `node scripts/mb-doctor.mjs --strict` проходит;
- ни одна task-linked feature не имеет pending или blocked clarification.

`/autopilot` не запускает `/write-prd`, `/prd`, `/prd-to-tasks` и не создает task queue.

### Full unattended mode: `/autonomous`

`/autonomous` - это полный unattended flow:

```text
PRD/Product Brief/delta
-> inspect constitution; use ratified|partial principles or record framework-default/skipped assumption
-> /write-prd
-> /spec-auto --init
-> /prd
-> /spec-design --all
-> /spec-auto --all
-> /review
-> /prd-to-tasks --all
-> task-planning review
-> strict doctor
-> scheduler loop
-> wave reviews
-> terminal state
```

Он строит SDD route map, L1-L3, feature-level design, JSON task queue по всем features, запускает scheduler loop, выполняет verification/red-verification по tier policy, запускает `/mb-sync`, проходит review gates и заканчивает явным terminal state: `SUCCESS`, `HALT_BLOCKING_QUESTIONS`, `HALT_CLARIFICATION_REQUIRED`, `HALT_REVIEW_REJECT`, `HALT_FAILURE_BUDGET`, `HALT_DEPENDENCY_DEADLOCK`, `HALT_POLICY_VIOLATION`, `HALT_QUALITY_GATES` или `HALT_BUDGET_EXCEEDED`.

## 7. Task model

Task registry является JSON-only:

```text
.memory-bank/tasks/index.json
.memory-bank/tasks/TASK-001.task.json
.memory-bank/schemas/task.schema.json
```

Fresh bootstrap создает:

```json
{
  "version": 1,
  "tasks": []
}
```

Fresh bootstrap не создает `.memory-bank/tasks/TASK-001.task.json` и не создает runnable task records. Task records появляются через `/spec-design` + `/spec-improve FT-001` + `/prd-to-tasks FT-001` или `/spec-design --all` + `/spec-auto --all` + `/prd-to-tasks --all`.

Минимальная форма task record:

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
  "gates": [],
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

Allowed `status`: `planned`, `ready`, `in_progress`, `blocked`, `done`, `failed`.

Allowed `tier`: `T0`, `T1`, `T2`, `T3`.

Legacy `risk` и `risk.level` удалены. Execution, verification, red-verification, scheduler routing и doctor checks должны использовать только `task.tier`.

## 8. Manual mode vs scheduler mode

Владение статусами отличается по mode.

Manual mode:

- `/execute` реализует task и записывает evidence/handoff;
- T0/T1 task можно закрыть после `/verify PASS` только при явном closure owner и recorded evidence;
- T2/T3 task нельзя считать финально `done` по одному `/verify PASS`; перед closure и `/mb-sync` нужен `/red-verify` с `SEMANTIC_VERDICT: semantic-pass`;
- `/mb-sync` синхронизирует Memory Bank, RTM, changelog и task records после уже записанного closure/failure/blocking decision; сам sync не выводит решение о закрытии.

Scheduler mode (`/autopilot`, `/autonomous`):

- scheduler владеет переходами `planned -> ready`, `ready -> in_progress`, `in_progress -> done|failed`, dependent block/unblock и terminal state;
- `/execute` не закрывает tasks;
- `/verify` не закрывает, не fail-ит и не promote-ит dependents;
- `/red-verify` не закрывает, не fail-ит и не promote-ит dependents;
- scheduler записывает closure/failure/blocking decision, final status и evidence links в authoritative `.task.json` до `/mb-sync`;
- `/mb-sync` только synchronizes/reconciles already-written task state и не принимает closure/promotion decisions сам;
- после `/mb-sync` и strict doctor scheduler выполняет отдельный promotion/dependent blocking pass.

Не смешивайте manual и scheduler mode внутри одного task run.

## 9. Tier policy

| Tier | Когда использовать | Protocol | Verification | Scheduler closure |
|---|---|---|---|---|
| `T0` | typo, links, formatting, safe docs-only | допустим compact `.protocols/TASK/run.md` | отдельный `/verify` обычно не нужен | compact evidence / functional PASS достаточно |
| `T1` | local code/local behavior с низким blast radius | compact допустим | local gates; `/verify` optional | compact evidence / functional PASS достаточно |
| `T2` | API, contracts, schema/state/data/domain, cross-module | full protocol required | `/verify` required; `/red-verify` required в scheduler | `VERDICT: PASS` + `SEMANTIC_VERDICT: semantic-pass` |
| `T3` | auth, security, secrets, prod/deploy, irreversible/data-loss, payments, compliance | full protocol required | `/verify` + `/red-verify` + human/recovery evidence | требования T2 + точные `HUMAN_CHECKPOINT: done` и `ROLLBACK_RECOVERY_NOTE: present` |

Если scope растет, поднимите tier перед передачей task дальше. Если сомневаетесь между двумя tiers, выбирайте более высокий.

## 10. Generated command reference

| Command | Purpose | Creates/updates | Does not do | Next step |
|---|---|---|---|---|
| `/cold-start` | Scenario router после skeleton creation | routing decision, next command recommendation | не создает EP/FT/TASK без PRD; не обходит `/write-prd` | `/analysis`, `/brief`, `/constitution`, `/write-prd`, `/map-codebase` или stop |
| `/mb` | Prime agent context из Memory Bank | обычно без writes; может создать `.protocols/<TASK>/plan.md` для unknowns | не реализует | выбранная task/workflow command |
| `/mb-init` | Initialize Memory Bank skeleton | `.memory-bank/`, `.tasks/`, `.protocols/`, agent files, proxy skills | не планирует roadmap/tasks | `/cold-start` |
| `/analysis` | Optional discovery router | `.memory-bank/analysis/index.md` | не создает brief, PRD, tasks, research | `/brainstorm`, `/brief`, `/constitution`, `/write-prd`, `/map-codebase`, `/clarify-feature` |
| `/brainstorm` | Facilitated ideation | `.memory-bank/analysis/brainstorming/BR-*.md`, analysis index | не создает PRD, Product Brief, tasks | `/brief` |
| `/brief` | Product Brief input contract | `.memory-bank/analysis/product-brief.md`, analysis index | не создает features/tasks; не заменяет PRD | `/write-prd` если principles `ratified|partial`; иначе `/constitution`, затем `/write-prd` |
| `/constitution` | Contextual interview for governing principles | `.memory-bank/constitution.md` | не добавляет Spec Kit hooks, governance engines или command aliases; не заменяет PRD | `/write-prd` или current workflow |
| `/write-prd` | Product Brief/context -> clarified PRD | `.memory-bank/prd.md` | не создает EP/FT/TASK; не обходит Constitution conflicts | `/spec-init` |
| `/spec-init` | Bootstrap lightweight SDD route map | `.memory-bank/spec-index.md` planned/candidate/unknown/not_applicable areas, gaps, expected locations | не проводит architecture interview; не создает authoritative specs или global backbone | `/prd` |
| `/prd` | Clarified PRD -> L1-L3 Memory Bank | product, requirements, epics, features, testing/index | не создает всю task queue вслепую | `/spec-design`, затем `/clarify-feature` если blocked и `/spec-improve FT-*` |
| `/spec-design` | Mandatory adaptive global SDD backbone | consumes lightweight spec-index; writes backbone status and SDD backbone specs as needed; defaults architecture to one `architecture/system-architecture.md` hub, with split architecture docs only by explicit strategy/complexity | не создает tasks/plans/feature-local tech-specs; не раздувает T0/T1 scope; не дублирует detailed API/state/message contracts в `architecture/*` | `/spec-improve FT-*` или `/spec-auto --all` |
| `/spec-improve` | Feature-level SDD design | needed tech-specs/architecture/contracts/domains/states/ADR/testing links, feature `spec_design_status` | не дублирует existing specs; не выдумывает decisions | `/prd-to-tasks FT-*` |
| `/spec-auto` | Autonomous SDD init/design | spec-index, feature design status, assumptions/blockers | не спрашивает пользователя; не игнорирует unsafe ambiguity | `/prd` или `/prd-to-tasks --all` |
| `/clarify-feature` | Resolve feature-level blockers | target `.memory-bank/features/FT-*.md` clarification metadata/answers | не назначает tier; не создает task records | `/spec-improve FT-*` |
| `/prd-to-tasks` | Feature -> implementation plan + JSON tasks | `.memory-bank/tasks/plans/IMPL-FT-*.md`, indexed `TASK-*.task.json` | не запускает execution; не проходит pending blockers or missing T2/T3 SDD specs | `/execute` вручную или `/review`/`/autopilot` |
| `/execute` | Implement one scoped task | `.protocols/<TASK>/...`, `.tasks/<TASK>/...`, code/docs в task scope | не закрывает task; не запускает verify/red-verify/mb-sync | `/verify` |
| `/verify` | Functional acceptance/evidence verification | verification protocol/evidence, task `verify` entries, possible bugs/follow-ups | в scheduler mode не закрывает/fail-ит/promote-ит | manual close или `/red-verify`/scheduler decision |
| `/red-verify` | Adversarial semantic verification | `.protocols/<TASK>/red-verification.md`, `.tasks/<TASK>/...`, bugs/follow-ups при необходимости | не дублирует `/verify`; в scheduler mode не закрывает | `/mb-sync` или scheduler decision |
| `/review` | Fresh-context Memory Bank/planning review | `.tasks/TASK-MB-REVIEW/*`, fix list/verdict | не является per-task semantic verification | исправить issues, `/prd-to-tasks`, `/autopilot` или continue |
| `/map-codebase` | Brownfield as-is mapping | `.memory-bank/*` baseline docs, `.tasks/TASK-MB-MAP/*` | не создает roadmap/tasks без PRD | `/write-prd --delta`, затем `/prd` |
| `/mb-sync` | Synchronize durable docs and task consistency | indexes, RTM/lifecycle, changelog, task consistency | не принимает scheduler closure/promotion decisions | `mb-doctor`, review, next task |
| `/mb-garden` | Maintain Memory Bank hygiene | cleanup/archive recommendations, hygiene findings | не меняет product scope; не является doctor workflow gate | исправить docs или rerun checks |
| `/mb-doctor` | Deterministic readiness gate over `mb-lint` | report only; optional JSON output | не заменяет `/review`, `/verify`, `/red-verify`; нет markdown task-card fallback | исправить findings или перейти к scheduler |
| `/mb-harness` | Set up deterministic agent-safe workflows | harness docs/config guidance, gates/worktree guidance | не реализует product tasks | запустить выбранный workflow с gates |
| `/autopilot` | Execute existing JSON task queue | task statuses, protocols, evidence, sync/review loop | не создает PRD/FT/TASK queue | terminal state или follow-up fixes |
| `/autonomous` | Full unattended PRD -> done flow | PRD/L1-L3/tasks/protocols/reviews/status | не спрашивает пользователя mid-run кроме terminal halt; не обходит hard stops | terminal state |
| `/discuss` | Clarify unknowns/contradictions before implementation | decision log/protocol notes when useful | не реализует; не создает tasks сам | resolved command, например `/write-prd`, `/execute` |
| `/add-tests` | Add useful unit/integration/e2e coverage | tests, `.memory-bank/testing/index.md`, evidence в `.tasks/` | не добавляет decorative/flaky tests | run tests, `/mb-sync` |
| `/find-skills` | Find relevant installed/marketplace skills | recommendation list | не устанавливает marketplace skills без confirmation | use/install selected skills |

## 11. Checks

Проверки framework/source repo:

```bash
npm run check:syntax --silent
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
node scripts/install-framework.mjs --skill '*' --yes
tmpdir="$(mktemp -d)"; node scripts/install-framework.mjs --bootstrap --target "$tmpdir" --yes
```

Команда `find` должна вывести `0`.

Проверки target repo после bootstrap:

```bash
node scripts/mb-lint.mjs
node scripts/mb-doctor.mjs
```

Используйте strict doctor только после появления реальной executable task queue:

```bash
node scripts/mb-doctor.mjs --strict
```

В fresh skeleton пустой `.memory-bank/tasks/index.json` валиден в default doctor mode и невалиден в strict mode, потому что executable queue отсутствует.

## 12. Documentation caveats

`PROJECT_MAP.md` упоминает `HANDOFF.md` и `Optimisation.md` как planning/context docs, но в текущем tree этих файлов нет. Этот файл говорит о них только как о caveat и не ссылается на них как на существующую документацию.

## License

MIT
