---
description: Декомпозиция feature contract в backlog/task graph без потери traceability.
status: active
---
# /prd-to-tasks — Contract → backlog

1) Прочитай `.memory-bank/product/features.json`.
2) Если task provider = `taskmaster`, можно использовать его для dependency-aware decomposition.
3) Canonical output всегда должен обновить:
- `.memory-bank/tasks/backlog.md`
- `.memory-bank/tasks/board.json`
4) Не передавай ownership task graph внешнему provider полностью — нормализуй его обратно в memobank.
