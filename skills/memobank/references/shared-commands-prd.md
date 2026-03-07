---
description: Превращение PRD или change-intent в canonical memobank contract.
status: active
---
# /prd — PRD → canonical contract

<objective>
Превратить PRD в machine-readable и human-readable артефакты memobank v2.
</objective>

<process>

## 0) Определи provider path
Прочитай `.memory-bank/system/memobank.yaml`.
- если `providers.prd.name = bmad` → можно импортировать/синхронизировать BMAD артефакты
- иначе работай native memobank flow

## 1) Источник
Используй `prd.md` пользователя, вставленный текст или brownfield change intent.

## 2) Обнови canonical product layer
Заполни/обнови:
- `.memory-bank/product/brief.md`
- `.memory-bank/product/prd.md`
- `.memory-bank/product/requirements.md`
- `.memory-bank/product/features.json`

## 3) При необходимости поддержи детальные docs
Если есть отдельные epic/feature docs — синхронизируй:
- `.memory-bank/epics/*`
- `.memory-bank/features/*`

## 4) Обнови вопросы и assumptions
- `.memory-bank/knowledge/open-questions.md`
- `.memory-bank/knowledge/assumptions.md`

## 5) Не создавай tasks вслепую
Для детальной декомпозиции используй `/prd-to-tasks`.

## 6) Gate
- `/review`
- затем `/mb-sync`
</process>
