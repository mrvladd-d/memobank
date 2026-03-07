---
description: Review gate по scope, architecture, quality и protocol consistency.
status: active
---
# /review — Review gate

1) Смотри не только diff, но и protocol consistency:
- claims
- handoffs
- verification stamps
- run summary

2) Обязательно сравни:
- код
- `features.json`
- relevant `REQ-*` / `FT-*`
- `project-context.md`

3) Вердикт должен быть один из:
- APPROVE
- APPROVE_WITH_NOTES
- REQUEST_CHANGES

4) Если проблема только в missing memory updates — отправь на `/mb-sync`, а не на полную переделку.
