---
description: Обновить core и provider-bridge слой через явный lifecycle, без тихих автоапдейтов.
status: active
---
# /mb-update — Explicit update flow

По умолчанию покажи dry-run план. Не обновляй ничего молча.

1. Прочитай `.memory-bank/system/memobank.yaml`, `providers.lock.json`, `commands.manifest.json`.
2. Если пользователь не указал иное, покажи:
   - что обновится в core
   - какие providers подключены
   - какие команды будут выполнены
3. Для реального обновления используй:
   - `node .memory-bank/tools/mb-update.mjs --core`
   - `node .memory-bank/tools/mb-update.mjs --providers`
   - `node .memory-bank/tools/mb-update.mjs --provider <name>`
4. После обновления:
   - `node .memory-bank/tools/mb-index.mjs`
   - `node .memory-bank/tools/mb-doctor.mjs --strict`

Обновление делается только по явной команде пользователя.
