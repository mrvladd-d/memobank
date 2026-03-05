---
description: Multi-expert ревью Memory Bank (fresh context) с артефактами в .tasks/TASK-MB-REVIEW/.
status: active
---
# /review — Multi-expert Memory Bank review

<objective>
Поймать противоречия и дрейф **до** выполнения работ:
- MBB compliance (frontmatter/links/duo/anti-patterns)
- архитектура (C4, границы, ADR)
- scope/RTM (REQ → EP → FT)
- планирование (backlog/waves/качество TASK)
- security risks
</objective>

<process>

## 0) Артефакты
Создай:
- `.tasks/TASK-MB-REVIEW/`
- `.tasks/TASK-MB-REVIEW/REQUEST.md` (что ревьюим, какой режим, какие blocking concerns)

Каждый reviewer пишет отчёт в:
- `.tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-<STAGE_ID>-final-report-docs-01.md`

## 1) Запусти reviewers (fresh context)
STAGE_IDs (рекомендуемо):
- `S-01` Architect (C4 + boundaries + ADR)
- `S-02` Scope/RTM (REQ→EP→FT)
- `S-03` Plan/backlog (waves/tasks/gates)
- `S-04` Security
- `S-05` MBB compliance

Если есть код — опционально добавь code-quality reviewer.

Для `S-03` reviewer обязательно проверь:
- у task cards есть `Status / Wave / Depends on / Touched files / Tests / Verify / Docs`
- только dependency-free задачи помечены `ready`
- нет “слепого” backlog, который нельзя безопасно запускать автономно

## 2) Decision rule
- Если хотя бы один reviewer даёт `REJECT` → зафиксируй fix-list и повтори ревью после исправлений.
- Если все `APPROVE` → можно двигаться дальше (или запускать `/autopilot`/`/execute`).
- Для `/autonomous`: старт batch execution разрешён только если нет blocking `REJECT` и нет открытых P0/P1 issues.

## 3) Concrete commands (fresh sessions)

### Codex (one reviewer per fresh session)
```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-01. Review .memory-bank/ architecture (C4), duo docs, dependencies, and missing ADR. Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-01-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-02. Review .memory-bank/requirements.md RTM coverage REQ→EP→FT and missing links. Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-02-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-03. Review .memory-bank/tasks/backlog.md and per-feature plans quality (waves, gates, touched files, verify). Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-03-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-04. Review security risks implied by requirements/architecture/runbooks (auth, secrets, OWASP). Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-04-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-05. Review MBB compliance across .memory-bank/** (frontmatter, links, routers, duo, no .tasks leakage). Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-05-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'
```

### Claude CLI (one reviewer per fresh session)
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-01. Review .memory-bank/ architecture (C4), duo docs, dependencies, and missing ADR. Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-01-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'
```
</process>
