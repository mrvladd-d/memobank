# MB-SYNC — Memory Bank synchronization workflow

## Когда запускать
- После завершения каждой wave в `/execute`.
- После `/verify` (обновление статусов).
- После значимых рефакторингов или архитектурных изменений.
- Перед `/review` (чтобы reviewer видел актуальное состояние).
- При ощущении drift между кодом и документацией.

## Чеклист

### 1) Duo docs consistency
- [ ] Каждый `architecture/<concept>.md` имеет парный `guides/<concept>.md` (и наоборот).
- [ ] Взаимные ссылки между duo docs актуальны.

### 2) RTM (traceability)
- [ ] `requirements.md` RTM таблица отражает реальный `Lifecycle` (planned/implemented/verified).
- [ ] Нет REQ без привязки к Epic/Feature.
- [ ] Нет Feature без привязки к REQ.

### 3) Entity lifecycle vs document status
- [ ] У feature/epic **document `status`** остаётся в допустимой таксономии (`draft|active|deprecated|archived`).
- [ ] У feature/epic **`lifecycle`** отражает реальную стадию реализации (`planned|implemented|verified`).
- [ ] Acceptance criteria не расходятся с реализацией.

### 4) Backlog
- [ ] `tasks/backlog.md` — выполненные задачи отмечены.
- [ ] Новые задачи (из багов, из новых требований) добавлены.

### 5) Changelog
- [ ] `.memory-bank/changelog.md` содержит запись о текущей wave/change.
- [ ] Формат: `## [YYYY-MM-DD] Wave N / описание` → список изменений.

### 6) Lint
- [ ] `node scripts/mb-lint.mjs` — 0 errors.
- [ ] Все `.memory-bank/**/*.md` имеют frontmatter.
- [ ] Ссылки не битые.

### 7) Index
- [ ] `.memory-bank/index.md` содержит аннотированные ссылки на все новые/изменённые документы.
- [ ] Router-индексы в папках с >3 документами присутствуют.

## Формат changelog

```markdown
---
description: Лог изменений Memory Bank.
status: active
---
# Changelog

## [YYYY-MM-DD] Wave N — краткое описание
- Added: ...
- Updated: ...
- Fixed: ...
- Removed: ...
```

## Если что-то не проходит
1. Исправь проблему немедленно (пока контекст свеж).
2. Если исправление нетривиально — создай задачу в backlog.
3. В interactive режиме можно отметить partial sync в `changelog.md`.
4. В autonomous режиме partial sync недопустим: остановись с `HALT_QUALITY_GATES`.
