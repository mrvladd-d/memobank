---
description: Проверить целостность memobank v2: manifests, commands, proxies, providers, schemas.
status: active
---
# /mb-doctor — Integrity check

Запусти `node .memory-bank/tools/mb-doctor.mjs --strict`.

Обязательно проверь:
- `.memory-bank/system/*`
- `.memory-bank/tools/*`
- `.memory-bank/commands/*`
- `.claude/skills/*` и `.agents/skills/*`
- `.tasks/` и `.protocols/` layout
- provider lock / registry drift

Если есть FAIL — предложи точечный fix, а не общие рассуждения.
