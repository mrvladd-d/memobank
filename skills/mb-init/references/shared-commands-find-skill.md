---
description: Поиск подходящего скилла для задачи: сначала установленные в проекте, затем marketplace.
status: active
---
# /find-skill — Find a skill (project-first)

<objective>
Найти подходящий skill для текущей задачи, **не устанавливая лишнего**:
сначала используем то, что уже установлено в проекте; затем (при необходимости) предлагаем внешние skills.
</objective>

<process>

1) Сформулируй задачу в 1–2 строках и выпиши ключевые слова (testing, CI, migrations, UI automation, docs, security, etc).

2) Проверь, какие skills уже доступны в проекте:
- `.claude/skills/*/SKILL.md` (Claude Code + OpenCode)
- `.agents/skills/*/SKILL.md` (Codex CLI + OpenCode)

3) Сопоставь задачу с `name/description` и предложи 1–3 релевантных skills (как последовательность).

4) Если нужного нет — предложи внешние skills:
- skills.sh / marketplace
- официальный набор Vercel skills

5) Прежде чем добавлять новый skill:
- убедись, что он не конфликтует с MBB
- после установки добавь/обнови `.memory-bank/skills/index.md` (registry)
</process>
