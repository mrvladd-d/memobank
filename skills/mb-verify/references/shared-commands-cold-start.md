---
description: Единая точка входа — выбрать сценарий и запустить правильный флоу (PRD / map-codebase / skeleton-only).
status: active
---
# /cold-start — Bootstrap router (choose the right flow)

<objective>
Дать одну удобную команду “с чего начать”, которая:
- определяет сценарий (greenfield / brownfield / skeleton-only)
- запускает правильный следующий шаг
- не генерирует EP/FT/TASK без PRD
</objective>

<process>

## 0) Предусловия
Эта команда предполагает, что skeleton уже создан (есть `.memory-bank/`).
Если `.memory-bank/` отсутствует — сначала создай skeleton (например, запусти `init-mb.js`), затем вернись сюда.

## 1) Определи сценарий (не угадывай)
Проверь:
- Есть ли `prd.md`?
- Есть ли существенный код (например: `src/`, `package.json`, `go.mod`, `Cargo.toml`, `requirements.txt`)?

Выбор:
- **Если есть код** → это **brownfield** → запусти `/map-codebase`.
- **Если кода почти нет, но есть PRD** → это **greenfield** → запусти `/prd`.
- **Если есть и код, и PRD** → сначала `/map-codebase` (as-is baseline), потом `/prd` как delta.
- **Если нет кода и нет PRD** → это **skeleton-only**: попроси пользователя предоставить PRD (или хотя бы требования текстом) и остановись.

## 2) Правила (важно)
- Если **нет PRD**, ты **НЕ** создаёшь/заполняешь:
  - `.memory-bank/epics/*`
  - `.memory-bank/features/*`
  - `.memory-bank/tasks/backlog.md` содержимым waves/TASK-IDs
- Пустой skeleton допустим:
  - папки/файлы могут существовать после `mb-init` / `init-mb.js`
  - но roadmap-сущности и реальные TASK-IDs без PRD не создаются
- Если PRD есть, но пользователь временно недоступен:
  - фиксируй `Open questions` в `.protocols/PRD-BOOTSTRAP/decision-log.md`
  - **останавливайся и жди** (не выдумывай факты).

## 3) После запуска флоу
После `/prd` или `/map-codebase`:
- запусти `/review` (fresh context)
- interactive: выполняй задачи через `/execute` → `/verify` → `/mb-sync`
- backlog-only unattended: используй `/autopilot`
- full unattended (`PRD → done`): используй `/autonomous`
</process>
