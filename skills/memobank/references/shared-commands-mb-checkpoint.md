---
description: Создать checkpoint текущего RUN и append-only event.
status: active
---
# /mb-checkpoint — Write checkpoint

1. Убедись, что есть активный `RUN-*`.
2. Сформулируй кратко:
   - цель
   - что изменено
   - какие файлы затронуты
   - какие риски остались
3. Запусти `node .memory-bank/tools/mb-run.mjs checkpoint --notes "$ARGUMENTS"`.
4. Не записывай checkpoint прямо в curated docs.
