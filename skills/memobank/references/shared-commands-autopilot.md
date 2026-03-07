---
description: Автономный прогон backlog задач (TASK-*) в чистых сессиях Codex/Claude.
status: active
---
# /autopilot — Run backlog autonomously

## Важно
- Это **executor backlog-а**, а не полный `PRD → done` orchestrator.
- Для полного unattended flow используй `/autonomous`.
- Запуск разрешён только если backlog уже декомпозирован и последний `/review` дал `APPROVE`.
- По умолчанию выполняй **строго последовательно**. Параллель — только для независимых задач без общих файлов.

## Preconditions
- `.memory-bank/tasks/backlog.md` использует **task cards**, а не просто список `TASK-*`.
- Каждая задача имеет минимум:
  - `Status: planned|ready|in_progress|blocked|done|failed`
  - `Wave: W1|W2|W3|...`
  - `Depends on: ...`
  - `Touched files: ...`
- Нет unresolved blocking questions в `.protocols/AUTONOMOUS-RUN/status.md` или equivalent run protocol.

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
- queue state (`ready`, `in_progress`, `blocked`, `done`, `failed`)
- latest review verdict
- current failure budget
- terminal state

## Selection rule
На каждой итерации reread backlog и выбирай только задачи, у которых:
- `Status: ready`
- все зависимости из `Depends on` уже `done`
- нет blocking bug / blocked upstream

Если `ready` пусто:
- и backlog полностью закрыт → `SUCCESS`
- и остались `planned` / `blocked` → `HALT_DEPENDENCY_DEADLOCK`

## TASK loop
Для каждой выбранной задачи:
1) переведи `Status: ready -> in_progress`
2) выполни `/execute TASK-<ID>`
3) выполни `/verify TASK-<ID>`
4) если `PASS`:
   - `Status: done`
   - `/mb-sync`
   - разблокируй dependents, если все их deps закрыты
5) если `FAIL`:
   - `Status: failed`
   - создай bug + follow-up task
   - downstream dependents → `blocked`
   - проверь failure budget

Новые follow-up задачи, созданные во время verify, должны подхватываться **в том же run** на следующей итерации.

## Concrete task-level commands
### Codex (fresh session per TASK)

```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  "TASK_ID=TASK-123. Read AGENTS.md, .protocols/TASK-123/{context,plan,progress}.md and linked FT/REQ specs. Keep context.md updated. Implement only scoped changes. Update progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md."

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  "TASK_ID=TASK-123. Read .protocols/TASK-123/{context,plan,progress}.md and linked acceptance criteria. Keep context.md updated. Fill verification.md. If PASS: mark task done and run MB-SYNC. If FAIL: create BUG + follow-up TASK and block dependents."
```

### Claude (fresh session per TASK)
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  "TASK_ID=TASK-123. Read AGENTS.md, .protocols/TASK-123/{context,plan,progress}.md and linked FT/REQ specs. Keep context.md updated. Implement only scoped changes. Update progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md."

claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  "TASK_ID=TASK-123. Read .protocols/TASK-123/{context,plan,progress}.md and linked acceptance criteria. Keep context.md updated. Fill verification.md. If PASS: mark task done and run MB-SYNC. If FAIL: create BUG + follow-up TASK and block dependents."
```

## Terminal states
- `SUCCESS`
- `HALT_BLOCKING_QUESTIONS`
- `HALT_REVIEW_REJECT`
- `HALT_FAILURE_BUDGET`
- `HALT_DEPENDENCY_DEADLOCK`
- `HALT_POLICY_VIOLATION`
- `HALT_QUALITY_GATES`
