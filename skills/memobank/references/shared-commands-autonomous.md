---
description: Полный unattended loop с run/checkpoint memory и quality gates.
status: active
---
# /autonomous — Full unattended loop

Используй только если system manifest и feature contracts достаточно зрелые.

Flow:
1. `/mb`
2. `/mb-resume`
3. `/prd` или `/map-codebase` при необходимости
4. `/prd-to-tasks`
5. execute waves through `RUN-*`
6. `/verify`
7. `/review`
8. `/mb-sync`

Hard stops описаны в `.memory-bank/workflows/autonomy-policy.md`.
