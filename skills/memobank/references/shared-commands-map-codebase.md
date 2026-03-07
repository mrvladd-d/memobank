---
description: Маппинг существующего репозитория в Memory Bank (brownfield → baseline docs).
status: active
---
# /map-codebase — Brownfield mapping

<objective>
Построить baseline Memory Bank по существующему репозиторию.
</objective>

<process>

1) Создай `.tasks/TASK-MB-MAP/`.
2) Запусти сабагентов по зонам (до 5–7 параллельно):
- tooling/CI
- backend
- frontend
- data
- tests

Каждый сабагент:
- smart calling (глобы должны матчиться)
- пишет отчёт в `.tasks/TASK-MB-MAP/...`

3) Синтезируй `.memory-bank/` по чеклисту:
- product
- architecture (C4)
- runbooks
- contracts
- testing
- index

> **PRD-less rule (non-negotiable)**: если **нет `prd.md`**, запрещено генерировать roadmap сущности:
> - `.memory-bank/epics/*`
> - `.memory-bank/features/*`
> - `.memory-bank/tasks/backlog.md` (waves/tasks)
>
> Маппинг = **as-is документация** по evidence, а не планирование.

4) Сделай fan-in:
- сведи отчёты сабагентов
- устрани противоречия (или запиши как “needs verification”)
- раздели facts vs inferences

5) Попроси у пользователя PRD delta (что хотим изменить).
6) Запусти `mb-review`.
</process>
