---
description: Верификация через evidence, feature contract и verification protocol.
status: active
---
# /verify — Verify scoped work

1) Прочитай:
- `.memory-bank/product/features.json`
- `.memory-bank/tasks/backlog.md`
- актуальный `RUN-*`
- handoff / claim при наличии

2) Проверь:
- tests
- acceptance criteria
- touched files соответствуют scope
- нет несогласованных assumptions

3) Запиши результат:
- `.protocols/verifications/VER-*.md`
- `.protocols/stamps/STP-*.json`
- evidence в `.tasks/RUN-*/evidence/`

4) Если verify-provider = `tea`, добавь:
- traceability
- risks
- quality gate verdict

5) Не продвигай candidate updates в curated docs без review.
