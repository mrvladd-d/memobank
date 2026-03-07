---
description: Создать formal handoff packet между агентами/сессиями.
status: active
---
# /mb-handoff — Structured handoff

1. Убедись, что контекст уже есть в `RUN-*`.
2. Создай handoff через `node .memory-bank/tools/mb-run.mjs handoff --notes "$ARGUMENTS"`.
3. Проверь, что handoff включает:
   - scope
   - what changed / what did not change
   - owned files
   - evidence
   - risks
   - open questions
   - suggested next action
4. Если handoff нужен к конкретной задаче, укажи `TASK-*` в заметках.
