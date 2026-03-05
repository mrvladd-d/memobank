---
description: Синхронизация Memory Bank после изменения: обновить индексы, RTM/backlog и changelog.
status: active
---
# /mb-sync — Memory Bank sync

Используй после любой значимой задачи.

Follow: `.memory-bank/workflows/mb-sync.md`

Минимальный чеклист:
- [ ] Обновить релевантные `.memory-bank/*` (WHY/WHERE, без псевдокода)
- [ ] Обновить `.memory-bank/index.md` и подпапочные роутеры
- [ ] Обновить RTM/REQ lifecycle в `.memory-bank/requirements.md`
- [ ] Если у EP/FT есть `lifecycle`, синхронизировать его отдельно от document `status`
- [ ] Обновить `.memory-bank/tasks/backlog.md`
- [ ] Записать changelog `.memory-bank/changelog.md`
- [ ] Для `/autonomous`: lint/link consistency — blocking gate, не optional
