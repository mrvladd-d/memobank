---
description: Алиас флоу “PRD → Memory Bank”. Используй /prd.
status: active
---
# /mb-from-prd — Alias

<objective>
Синоним для “загрузить PRD и заполнить Memory Bank (L1–L3)”.
</objective>

<process>
Используй `/prd`.

Дальше (если нужно):
- задачи (TASK-*) делай **per feature** через `/prd-to-tasks FT-<NNN>`
- выполнение: `/execute TASK-<ID>` → `/verify` → `/mb-sync`
- backlog-only автономно: `/autopilot`
- full unattended: `/autonomous`
</process>
