---
description: Показать состояние memobank v2: stack, providers, runs, claims, sync drift.
status: active
---
# /mb-status — System status

Выполни `node .memory-bank/tools/mb-run.mjs status` и используй вывод как источник истины.

Что показать:
- stack / repo_mode
- provider modes + locked versions
- latest RUN-*
- active claim / latest handoff
- outdated generated or derived artifacts

Если каких-то system files нет, предложи `/mb-update --core` или `/mb-doctor`.
