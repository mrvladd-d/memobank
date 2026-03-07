---
description: Синхронизация curated/generated/derived слоёв после изменения.
status: active
---
# /mb-sync — Memory Bank sync

Используй после любой значимой задачи.

Follow: `.memory-bank/workflows/mb-sync.md`

Минимальный чеклист:
- [ ] Обновить curated docs: `product/*`, `architecture/*`, `knowledge/*`, `tasks/backlog.md`
- [ ] Обновить `product/features.json`, если изменился feature contract
- [ ] Если был долгий run — выполнить `node .memory-bank/tools/mb-condense.mjs`
- [ ] Пересобрать derived indexes: `node .memory-bank/tools/mb-index.mjs`
- [ ] Проверить system drift: `node .memory-bank/tools/mb-doctor.mjs`
- [ ] Обновить `.memory-bank/system/sync-state.json`

Правило:
- curated → review/protect
- generated → replace
- derived → rebuild
- runtime → append/checkpoint/rotate
