---
description: Собрать compact active context из последнего RUN и durable memory.
status: active
---
# /mb-resume — Build active context

1. Запусти `node .memory-bank/tools/mb-run.mjs resume`.
2. Прочитай:
   - `.tasks/RUN-*/context-snapshot.md`
   - `.tasks/RUN-*/active-memory.json`
3. Используй только high-signal blocks, а не весь Memory Bank.
4. Если run не найден — создай новый run через `node .memory-bank/tools/mb-run.mjs open-run`.
