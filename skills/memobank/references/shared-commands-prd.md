---
description: Превращение PRD в Memory Bank — product brief, требования, эпики, фичи, RTM.
status: active
---
# /prd — PRD → Memory Bank

<objective>
Превратить PRD (`prd.md` или текст пользователя) в:
- продуктовый бриф (L1)
- требования (REQ-IDs) + RTM
- эпики (L2)
- фичи (L3)
- базовую стратегию тестирования
- обновлённый индекс Memory Bank

Важно:
- `/prd` **не создаёт задачи** (TASK-IDs) автоматически.
- Декомпозиция в задачи делается **точечно по фиче** через `/prd-to-tasks FT-<NNN>` (это снижает риск спекулятивной генерации “валом”).
</objective>

<process>

## 0) Протокол
Создай (если нет):
- `.protocols/PRD-BOOTSTRAP/plan.md`
- `.protocols/PRD-BOOTSTRAP/decision-log.md`

Режимы:
- **interactive** (по умолчанию): можно ждать пользователя между раундами вопросов
- **autonomous** (если вызвано из `/autonomous`): non-blocking пробелы оформляй как `Assumption`, blocking пробелы переводят run в `HALT_BLOCKING_QUESTIONS`

## 1) Прочитай PRD
- Если файла нет — попроси пользователя вставить PRD текст.

## 2) Deep Questioning (раундами)
- 3–5 вопросов за раунд.
- После раунда:
  - коротко суммируй
  - обнови `decision-log.md`
  - покажи следующий раунд вопросов.

Если пользователь временно недоступен (ты “ушёл”):
- зафиксируй список `Open questions` в `decision-log.md`,
- в **interactive** режиме — **остановись и жди**
- в **autonomous** режиме:
  - non-blocking gaps → зафиксируй как assumptions и продолжай
  - blocking gaps → остановись с terminal state `HALT_BLOCKING_QUESTIONS`

## 3) Обнови product.md
Заполни `.memory-bank/product.md`:
- what this is
- core value
- audience
- primary user flow
- constraints/non-goals

## 4) Требования и трассируемость
Обнови `.memory-bank/requirements.md`:
- REQ-001…
- Out of scope
- RTM: REQ → Epic → Feature → Test

## 5) Создай epics/
Для каждого эпика:
- `.memory-bank/epics/EP-<NNN>-<slug>.md`
- value, success metrics, acceptance criteria
 - `status: draft` по умолчанию (переводи в active после закрытия Open questions)

## 6) Создай features/
Для каждой фичи:
- `.memory-bank/features/FT-<NNN>-<slug>.md`
- use cases
- acceptance criteria
- edge cases & failure modes
- test strategy pointers
 - `status: draft` по умолчанию

## 7) Testing index
Обнови `.memory-bank/testing/index.md`:
- quality gates
- unit/integration/e2e
- анти-чит правила

## 8) Index
Обнови `.memory-bank/index.md`:
- добавить аннотированные ссылки

## 9) Gate
Запусти `mb-review` (fresh context).

## 10) Что дальше
- interactive: выбери одну фичу и запусти `/prd-to-tasks FT-<NNN>`
- autonomous end-to-end: запусти `/autonomous`
</process>
