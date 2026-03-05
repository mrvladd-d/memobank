---
description: Выполнение одной задачи (TASK-XXX) по протоколу: plan → build → gates → verify → MB-SYNC.
status: active
---
# /execute — Execute one TASK (protocol-driven)

<objective>
Выполнять задачи последовательно или волнами так, чтобы:
- работа была параллельной, но без конфликтов
- результаты были верифицируемы
- Memory Bank обновлялся сразу
</objective>

<process>

## 0) Вход
Ожидается `$ARGUMENTS`:
- `TASK-<ID>`

## 1) Прочитай источники
Открой минимум:
- `.memory-bank/tasks/backlog.md` (строка с `TASK-<ID>`)
- соответствующие спеки (например `.memory-bank/features/FT-*` / `.memory-bank/requirements.md`)

## 2) Создай протокол выполнения
Создай:
- `.protocols/TASK-<ID>/context.md`
- `.protocols/TASK-<ID>/plan.md`
- `.protocols/TASK-<ID>/progress.md`
- `.protocols/TASK-<ID>/verification.md`
- `.protocols/TASK-<ID>/handoff.md`
Если в проекте есть шаблоны протоколов (из `mb-execute`), используй их, иначе создай минимальные файлы вручную.

Если задача выполняется внутри `/autopilot` или `/autonomous`, синхронизируй task state в backlog:
- перед стартом: `ready -> in_progress`
- после PASS: `in_progress -> done`
- после FAIL: `in_progress -> failed`

## 3) Реализация (fan-out опционально)
### 3.1 Изоляция (без конфликтов)
- Разведи зоны по файлам (чтобы сабагенты не трогали одно и то же).
- Если пересечения неизбежны: worktree/branch per agent.

### 3.2 Сабагенты
Если задача нетривиальная:
- запусти до 5–7 сабагентов параллельно
- каждый сабагент работает в fresh context
- артефакты (логи/скрины/диффы/заметки) кладёт в `.tasks/TASK-<ID>/`

Роли (опционально):
- implementer: узкий исполнитель, который меняет только код/тесты в своём scope
- secretary: протоколист, который синхронно ведёт `progress.md` и артефакты

### 3.2.1 Fresh Codex session per TASK (optional, clean context)
Если хочешь максимально “чистый контекст” для реализации, запусти отдельную сессию через shell:

```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-<ID>. Read AGENTS.md and .protocols/TASK-<ID>/{context,plan,progress}.md. Keep context.md updated (loaded docs + commands). Implement only scoped changes. Write report to .tasks/TASK-<ID>/TASK-<ID>-S-IMPL-final-report-code-01.md. Update progress.md.'
```

### 3.2.2 Fresh Claude session per TASK (required when working in Claude Code)
Если ты работаешь в **Claude Code**, для чистого контекста делай так:
1) Оркестратор готовит `.protocols/TASK-<ID>/{context,plan,progress}.md` и папку `.tasks/TASK-<ID>/`.
2) Запусти новую “чистую” сессию через shell:

```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-<ID>. Read AGENTS.md, .protocols/TASK-<ID>/{context,plan,progress}.md, and acceptance criteria docs. Keep context.md updated (loaded docs + commands). Implement only scoped changes. Update progress.md. Write report to .tasks/TASK-<ID>/TASK-<ID>-S-IMPL-final-report-code-01.md.'
```

3) Для верификации — отдельная свежая сессия:

```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-<ID>. Read .protocols/TASK-<ID>/{context,plan,progress}.md + acceptance criteria. Keep context.md updated. Fill .protocols/TASK-<ID>/verification.md and store evidence in .tasks/TASK-<ID>/. VERDICT: PASS/FAIL/NEEDS-CLARIFICATION.'
```

### 3.3 Gates
После реализации:
- lint/typecheck
- unit tests
- e2e (если применимо)

### 3.4 Параллельно vs последовательно (dependencies)
- Если задачи **независимы** (нет наследования/зависимостей и не трогают одни и те же файлы) — можно запускать в отдельных чистых сессиях параллельно.
- Если есть **наследование** (TASK-B зависит от результатов TASK-A) — запускай **строго последовательно**: сначала TASK-A (implement + verify + mb-sync), потом TASK-B.
- Если есть пересечение по файлам/модулям — считай задачи зависимыми (или изолируй worktree/branch).

## 4) Верификация
- передай `TASK-<ID>` в `/verify` (или `mb-verify`) для заполнения `verification.md`

## 5) MB-SYNC (обязательный финал)
Запусти `/mb-sync`:
- обнови `.memory-bank/` (WHY/WHERE + навигация)
- обнови RTM/backlog статусы
- добавь запись в `.memory-bank/changelog.md`
- если задача failed и есть dependents — пометь их `blocked`
</process>
