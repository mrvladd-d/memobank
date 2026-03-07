---
description: Выполнение одной задачи или маленькой фичи через run/checkpoint protocol и provider routing.
status: active
---
# /execute — Execute work item

<objective>
Выполнять scoped работу через run store и protocol memory так, чтобы изменения были resumable, auditable и reviewable.
</objective>

<process>

## 0) Определи режим
- Если задача маленькая и bounded — можно использовать `/fast-track`.
- Иначе оставайся в обычном execution flow.

## 1) Открой активный контекст
- `/mb`
- `/mb-resume`
- `.memory-bank/product/features.json`
- `.memory-bank/tasks/backlog.md`
- нужные `FT-*`, `REQ-*`, `ADR-*`

## 2) Открой или создай RUN
Запусти `node .memory-bank/tools/mb-run.mjs open-run --task "$ARGUMENTS"`.
Это создаст/обновит:
- `.tasks/RUN-XXX/meta.json`
- `.tasks/RUN-XXX/events.jsonl`
- `.tasks/RUN-XXX/active-memory.json`
- `.tasks/RUN-XXX/context-snapshot.md`

## 3) Claims / ownership
Если scope пересекается с другими агентами:
- создай claim
- зафиксируй owned files
- не работай одновременно по одним и тем же файлам без изоляции

## 4) Реализация
- используй provider hints из `.memory-bank/system/memobank.yaml`
- для small bounded work в Codex допустим built-in `/fast`
- фиксируй checkpoint’ы через `/mb-checkpoint`
- артефакты клади в `.tasks/RUN-XXX/evidence/`

## 5) Верификация
- `/verify`
- при verify-provider = `tea` используй risk/traceability mindset
- verdict и evidence должны быть записаны до sync

## 6) Финал
- `/mb-handoff`, если работа передаётся дальше
- `/mb-sync`
</process>
