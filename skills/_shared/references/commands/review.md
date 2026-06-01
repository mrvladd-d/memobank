---
description: Multi-expert ревью Memory Bank (fresh context) с артефактами в .tasks/TASK-MB-REVIEW/.
status: active
---
# /review — Multi-expert Memory Bank review

<objective>
Поймать противоречия и дрейф **до** выполнения работ:
- MBB compliance (frontmatter/links/doc coverage/anti-patterns)
- Constitution compliance (governing principles, no contradictions with routed docs)
- архитектура (C4, границы, ADR)
- scope/RTM (REQ → EP → FT)
- SDD Design Specs routing (`spec-index`, mandatory `/spec-design`, `spec_design_status`, linked specs for T2/T3)
- lightweight Analysis Quality, only when `.memory-bank/analysis/product-brief.md` exists
- планирование (JSON task records/index/waves/качество TASK)
- security risks

Это **не** per-task adversarial semantic verification. Для вопроса "решение по существу правильное?" используй `/red-verify TASK-<ID>`.
</objective>

<process>

## 0) Артефакты
Создай:
- `.tasks/TASK-MB-REVIEW/`
- `.tasks/TASK-MB-REVIEW/REQUEST.md` (что ревьюим, какой режим, какие blocking concerns)

Каждый reviewer пишет отчёт в:
- `.tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-<STAGE_ID>-final-report-docs-01.md`

## 1) Запусти reviewers (fresh context)
Canonical STAGE_ID table:

| STAGE_ID | Reviewer |
| --- | --- |
| `S-01` | Architect (C4 + boundaries + ADR) |
| `S-02` | Scope/RTM (REQ→EP→FT) |
| `S-03` | Plan/tasks (JSON records/index/waves/gates) |
| `S-04` | Security |
| `S-05` | MBB compliance |
| `S-06` | Code quality (optional, if code exists) |

Constitution checks are blocking:
- If `.memory-bank/constitution.md` exists, reviewers must flag contradictions between the Constitution and Memory Bank docs, task records, workflow routing, implementation plans, or proposed execution.
- A Constitution violation is a blocking finding and must result in `REJECT` until fixed or explicitly resolved through `/constitution`.
- Do not treat missing domain-specific principles as a violation unless another normative source requires them.

Analysis Quality checks are conditional:
- If `.memory-bank/analysis/product-brief.md` exists, include a lightweight pass in `S-02` or `S-05`.
- Do not fail a project merely because Analysis artifacts are absent; Analysis before PRD is optional.
- If a product brief exists, check that PRD / requirements / epics / features are traceable to it or explicitly document deltas.
- Check that the brief is not blocked / no-go / not ready with unresolved blocking questions unless `/prd` recorded an explicit user override.
- If brainstorming artifacts exist without a product brief, report a warning unless an existing PRD was intentionally used as the upstream source.
- Confirm there is no route from Analysis or Product Brief directly to `/prd-to-tasks` without `/write-prd`, `/spec-init`, `/prd`, `/spec-design`, and `/spec-improve`; `/clarify-feature` is optional and only for explicit feature blockers.
- Confirm shared T2/T3 design concerns are not duplicated across feature-local specs when `/spec-design` should have produced a common authoritative backbone.

Для `S-03` reviewer обязательно проверь:
- `.memory-bank/tasks/index.json` содержит только ссылки на `.memory-bank/tasks/*.task.json`
- task records содержат `status / wave / depends_on / touched_files / gates / verify / docs`
- `ready` помечены только задачи без dependencies или задачи, у которых все dependencies уже `done`
- нет `ready` задач с blockers / blocking review rejects / unresolved semantic-concern
- task `tier` usage and task `normative_inputs` do not contradict Constitution or tier policy
- T2/T3 task records include relevant linked SDD specs in `source_artifacts`, `normative_inputs`, `constraints`, `invariants`, or `verification_targets`
- feature `spec_design_status` is compatible with task tier: `not_required` only for T0/T1-like scope; T2/T3 require `complete` and linked specs
- `.memory-bank/spec-index.md` routes existing specs and does not encourage duplicate specs
- shared domain/contract/state/API/security/data/runtime concerns have backbone specs or recorded gaps before per-feature task planning
- `/mb-doctor` findings from the reviewed surface are addressed; for autonomous/autopilot readiness, `/mb-doctor --strict` must pass before `APPROVE` for batch execution
- нет “слепой” JSON task queue, которую нельзя безопасно запускать автономно

## 2) Decision rule
- Если хотя бы один reviewer даёт `REJECT` → зафиксируй fix-list и повтори ревью после исправлений.
- Если все `APPROVE` → можно двигаться дальше (или запускать `/autopilot`/`/execute`).
- Для `/autonomous` и `/autopilot`: старт batch execution разрешён только если нет blocking `REJECT`, нет открытых P0/P1 issues, и `/mb-doctor --strict` проходит.

## 3) Concrete commands (fresh sessions)

### Codex (one reviewer per fresh session)
```bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-01. Review .memory-bank/constitution.md, .memory-bank/spec-index.md, architecture (C4), duo docs or equivalent SDD spec-driven support docs, dependencies, and missing ADR. Flag Constitution contradictions and duplicate/conflicting specs as blocking. Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-01-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-02. Review .memory-bank/constitution.md, .memory-bank/prd.md, .memory-bank/requirements.md RTM coverage REQ→EP→FT and missing links. If .memory-bank/analysis/product-brief.md exists, also do lightweight Analysis Quality checks: brief→PRD/REQ/EP/FT traceability, explicit deltas, blocked-brief override evidence, and no Analysis/Product Brief bypass to /prd-to-tasks without /write-prd, /spec-init, /prd, /spec-design, and /spec-improve. Flag Constitution contradictions as blocking. Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-02-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-03. Review .memory-bank/constitution.md, .memory-bank/spec-index.md, feature spec_design_status/spec_design_links, .memory-bank/tasks/index.json, indexed .memory-bank/tasks/*.task.json records, mb-doctor readiness findings, and per-feature plans quality (waves, gates, touched files, verify, tier routing, SDD spec links, normative_inputs). Flag Constitution contradictions and T2/T3 tasks without linked SDD specs as blocking. Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-03-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-04. Review .memory-bank/constitution.md and security risks implied by requirements/architecture/runbooks (auth, secrets, OWASP). Flag Constitution contradictions as blocking. Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-04-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-05. Review .memory-bank/constitution.md and MBB compliance across .memory-bank/** (frontmatter, links, routers, documentation coverage, no .tasks leakage). Flag stale or contradictory Constitution references as blocking when they affect governance. Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-05-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'
```

### Claude CLI (one reviewer per fresh session)
```bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \
  'TASK_ID=TASK-MB-REVIEW. STAGE_ID=S-01. Review .memory-bank/constitution.md, .memory-bank/spec-index.md, architecture (C4), duo docs or equivalent SDD spec-driven support docs, dependencies, and missing ADR. Flag Constitution contradictions and duplicate/conflicting specs as blocking. Write report to .tasks/TASK-MB-REVIEW/TASK-MB-REVIEW-S-01-final-report-docs-01.md. VERDICT: APPROVE/REJECT.'
```
</process>
