---
description: Прайминг агента через memobank v2: system manifest, active context, durable docs.
status: active
---
# /mb — Prime context

<objective>
Собрать минимальный high-signal контекст перед работой, а не грузить весь банк целиком.
</objective>

<process>

1) Прочитай `.memory-bank/system/memobank.yaml`.
2) Прочитай `.memory-bank/index.md` и `.memory-bank/mbb/index.md`.
3) Если задача продолжается — сначала запусти `/mb-resume` и используй `.tasks/RUN-*/context-snapshot.md`.
4) Открой только релевантные документы:
- `product/brief.md`
- `product/requirements.md`
- `product/features.json`
- `architecture/project-context.md`
- нужные `epics/*`, `features/*`, `adrs/*`
- последний handoff, если он есть
5) Сформулируй коротко:
- цель
- критерии done
- quality gates
- нужен ли fast-lane или обычный flow

Если `$ARGUMENTS` переданы, используй их как фокус для отбора memory blocks.
</process>
