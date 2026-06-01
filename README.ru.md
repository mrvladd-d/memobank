# memobank

Язык: [English](README.md) | **Русский**

![Схема MEMOBANK в стиле Lego](MEMOBANK.png)

`memobank` - это набор skills и workflow для агентной разработки в Codex CLI,
Claude Code, OpenCode и совместимых рантаймах.

Главная идея простая: важный контекст проекта должен жить в файлах
репозитория, а не только в истории чата. Тогда агент может открыть проект в
новой сессии, прочитать Memory Bank, понять текущее состояние и продолжить
работу без ручного пересказа.

## Кому это нужно

`memobank` полезен, если:

- проект будет развиваться дольше одной короткой сессии;
- требования, архитектура, задачи и проверки должны быть зафиксированы;
- вы хотите запускать агентов в чистых сессиях без потери контекста;
- над проектом работают разные агенты или разные люди;
- нужно связать PRD, спецификации, задачи, реализацию и verification;
- вы хотите сначала работать вручную, а потом безопасно включать automation.

Не стоит начинать с полного autonomous режима, если идея продукта еще сырая.
Сначала пройдите ручной цикл: так проще понять, какие файлы создаются и за что
отвечает каждая команда.

## Что создается в проекте

После установки в целевом репозитории появляется рабочее пространство Memory
Bank:

```text
.memory-bank/
  product.md              краткое описание продукта
  requirements.md         требования и ограничения
  constitution.md         принципы проекта и non-negotiables
  spec-index.md           карта SDD/specification документов
  epics/                  EP-* крупные части продукта
  features/               FT-* feature specs
  tasks/index.json        индекс JSON-задач
  tasks/TASK-*.task.json  task records и статус выполнения
  commands/               generated specs для slash-команд

.protocols/
  TASK-*/                 план, прогресс, verification и handoff по задаче

.tasks/
  TASK-*/                 evidence, отчеты, артефакты выполнения

scripts/
  mb-lint.mjs             deterministic lint Memory Bank
  mb-doctor.mjs           проверка готовности к autonomous/autopilot
```

Сам репозиторий `memobank` устроен как source-only skill pack:

```text
skills/_shared/           общий источник agents, command specs, scripts
skills/<skill>/SKILL.md   входные точки installable skills
scripts/install-framework.mjs
scripts/vendor-shared.mjs
```

В исходном дереве не коммитятся generated файлы вида
`skills/<skill>/**/shared-*`. Они создаются только во временной копии во время
установки. Это уменьшает дублирование и делает обновление skills безопаснее.

## Быстрая установка

Склонируйте репозиторий `memobank`, перейдите в его папку и запустите:

```bash
node scripts/install-framework.mjs
```

Интерактивный установщик:

1. покажет список папок и позволит выбрать проект;
2. проверит, есть ли в проекте `.memory-bank/`, `AGENTS.md` и git changes;
3. подготовит временную installable copy `memobank`;
4. развернет `shared-*` assets во временной копии;
5. установит skills через `skills add`;
6. создаст или обновит Memory Bank в выбранном проекте.

Если нужно установить без интерактивного выбора папки:

```bash
node scripts/install-framework.mjs --bootstrap --target /path/to/project --yes
```

Если нужно только проверить установку skill pack:

```bash
node scripts/install-framework.mjs --skill '*' --yes
```

## Самый понятный ручной workflow

Начинайте с ручного режима. Он показывает всю механику и не требует доверять
автоматике с первого запуска.

```text
идея или черновик
  -> /analysis или /brief
  -> /constitution
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
  -> следующая feature или task
```

Что происходит на каждом шаге:

1. `/analysis`, `/brainstorm`, `/brief`

   Когда идея сырая, эти команды помогают превратить ее в понятный вход для
   PRD. Они не создают runnable tasks.

2. `/constitution`

   Фиксирует принципы проекта: Definition of Done, ограничения автономности,
   human checkpoints, non-negotiables. Если вы явно пропустили интервью,
   workflow может идти дальше, но лучше вернуться к Constitution позже.

3. `/write-prd`

   Создает или нормализует PRD: цели, scope, требования, ограничения, открытые
   вопросы.

4. `/spec-init`

   Создает легкую карту SDD: какие specs нужны, какие области известны, где
   есть gaps. На этом шаге агент не должен придумывать архитектуру заранее.

5. `/prd`

   Разбивает PRD на Memory Bank документы: product, requirements, epics,
   features.

6. `/spec-design`

   Обязательный gate после `/prd`. Для простых T0/T1 задач он может создать
   минимальный backbone и отметить лишние области как `not_applicable`. Для
   T2/T3 или shared concerns фиксирует архитектурные решения, contracts,
   states, testing/runbook expectations.

7. `/spec-improve FT-001`

   Доделывает feature-level design для конкретной feature. Для простой feature
   может записать, что отдельный дизайн не нужен.

8. `/prd-to-tasks FT-001`

   Создает JSON task records: `.memory-bank/tasks/TASK-*.task.json` и индекс
   `.memory-bank/tasks/index.json`.

9. `/execute TASK-001`

   Реализует одну задачу из task record. Задача должна быть узкой и проверяемой.

10. `/verify TASK-001`

    Проверяет результат по acceptance criteria, требованиям и evidence.

11. `/red-verify TASK-001`

    Для T2/T3 добавляет adversarial semantic verification: не просто "тесты
    прошли", а "решение действительно корректно по смыслу".

12. `/mb-sync`

    Синхронизирует Memory Bank: индексы, lifecycle notes, changelog, task
    status, ссылки на evidence.

## Схема процесса

```text
Discovery
  raw idea
    -> /analysis or /brief
    -> /constitution
    -> /write-prd

Design
  /spec-init
    -> /prd
    -> /spec-design
    -> /spec-improve FT-001

Planning
  /prd-to-tasks FT-001
    -> TASK-001.task.json
    -> TASK-002.task.json

Execution
  /execute TASK-001
    -> /verify TASK-001
    -> /red-verify TASK-001 for T2/T3
    -> /mb-sync
```

## Когда использовать greenfield и brownfield

Greenfield - когда проекта еще нет или есть только идея:

```text
/analysis -> /constitution -> /write-prd -> /spec-init -> /prd
```

Brownfield - когда код уже существует:

```text
/map-codebase -> /constitution -> /write-prd --delta -> /spec-init -> /prd
```

Для brownfield важно сначала описать фактическое состояние проекта. Без этого
агент может начать строить roadmap поверх неполной картины.

## Automation

Automation использует те же файлы и task records, что и ручной workflow.

- `/autopilot` выполняет уже готовую JSON task queue.
- `/autonomous` ведет более длинный unattended flow от PRD/Product Brief до
  terminal state.
- `/mb-doctor --strict` проверяет, готов ли Memory Bank к autonomous запуску.

Включайте automation только когда PRD, features, task records и quality gates
достаточно ясны. Если агенту нужно угадывать требования, лучше остановиться и
уточнить Memory Bank вручную.

## Проверка самого framework

Перед публикацией изменений в `memobank` запустите:

```bash
npm run check:syntax --silent
find skills -path 'skills/_shared' -prune -o -type f -name 'shared-*' -print | wc -l
node scripts/install-framework.mjs --skill '*' --yes
```

Команда с `find` должна вывести `0`. Это значит, что source tree не содержит
generated `shared-*` файлов.

Проверка bootstrap в пустую папку:

```bash
tmpdir="$(mktemp -d)"
node scripts/install-framework.mjs --bootstrap --target "$tmpdir" --yes
test -f "$tmpdir/.memory-bank/tasks/index.json"
test -f "$tmpdir/AGENTS.md"
```

## Где читать подробнее

- [English README](README.md)
- [Подробная механика](howItWorks.md)
- [Карта проекта для агентов](PROJECT_MAP.md)
