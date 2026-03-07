---
description: Brownfield mapping в as-is/project-context/knowledge без speculative roadmap.
status: active
---
# /map-codebase — Brownfield mapping

<objective>
Собрать as-is documentation и project context по существующему репозиторию без подмены этого planning-доками.
</objective>

<process>

1) Прочитай `.memory-bank/system/memobank.yaml` и проверь brownfield stack.
2) Создай или открой RUN для mapping.
3) Синтезируй canonical docs:
- `.memory-bank/architecture/as-is.md`
- `.memory-bank/architecture/project-context.md`
- `.memory-bank/knowledge/facts.md`
- `.memory-bank/knowledge/evidence.md`
- `.memory-bank/knowledge/open-questions.md`

4) PRD-less rule (non-negotiable):
если нет PRD/change intent, не изобретай roadmap как будто он уже утверждён.

5) Если подключён `openspec` в detect-import mode:
- можно импортировать existing proposal/design/tasks artifacts
- но SSOT остаётся в `.memory-bank/`

6) Финал:
- `/review`
- `/mb-sync`
</process>
