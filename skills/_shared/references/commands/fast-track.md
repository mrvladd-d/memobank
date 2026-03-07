---
description: Быстрый bounded flow для маленькой фичи или фикса без тяжёлого planning-пайплайна.
status: active
---
# /fast-track — Fast lane for small changes

Используй этот flow только если задача:
- маленькая
- не меняет архитектуру поперёк всей системы
- не требует миграций / опасных операций
- имеет короткие acceptance criteria

## Flow
1. Кратко сформулируй scope и done criteria.
2. Открой или создай run: `node .memory-bank/tools/mb-run.mjs open-run`.
3. Если в `product/features.json` нет feature contract для этой работы — добавь минимальный entry.
4. Для Codex допустимо включить встроенный `/fast` во время реализации.
5. Реализуй только bounded diff.
6. Обязательно пройди `/verify`.
7. Выполни `/mb-sync`.

## Escalation rules
Немедленно эскалируй в обычный flow (`/discuss`, `/prd`, `/prd-to-tasks`, `/execute`), если появляется хотя бы один из сигналов:
- scope расползается
- нужны архитектурные решения
- затрагиваются несколько подсистем
- acceptance criteria перестают быть короткими
- верификация становится нетривиальной
