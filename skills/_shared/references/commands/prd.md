---
description: Decompose a clarified PRD into Memory Bank product, requirements, epics, and features.
status: active
---
# /prd - Clarified PRD -> Memory Bank

<objective>
Turn an already clarified `.memory-bank/prd.md` into Memory Bank L1-L3 artifacts:
- `.memory-bank/product.md`
- `.memory-bank/requirements.md` with REQ IDs and RTM
- `.memory-bank/epics/EP-*.md`
- `.memory-bank/features/FT-*.md`
- `.memory-bank/testing/index.md`
- `.memory-bank/index.md`

`/prd` does not write the PRD, ask Deep Questioning questions, create TASK records, create implementation plans, or require feature-level clarification.
`/prd` requires `.memory-bank/spec-index.md` as the lightweight SDD route map and reads only relevant existing authoritative specs routed by that index before deriving L1-L3.
</objective>

<process>

## 0) Required PRD input
Require `.memory-bank/prd.md` and `.memory-bank/spec-index.md`.

Its frontmatter must include:

```yaml
type: prd
clarification_status: complete
constitution_checked: true
```

If `.memory-bank/prd.md` is missing, stop and tell the user to run `/write-prd`.
If `clarification_status` is `pending` or `blocked`, stop and continue `/write-prd`.
If `constitution_checked` is not `true`, stop and run `/write-prd` or resolve the Constitution gate.
If the PRD contains unresolved `NEEDS CLARIFICATION` blockers in decomposition-relevant sections, stop and run `/write-prd`.

Read `.memory-bank/constitution.md` before writing derived docs. If the PRD conflicts with the Constitution, stop and ask for explicit resolution or `/constitution` amendment.

### SDD route map gate
`.memory-bank/spec-index.md` is a required lightweight SDD route map for `/prd` after `/spec-init`.

Before writing derived docs:
- read `.memory-bank/spec-index.md` as a route map, not as a substitute for the specs;
- stop and run `/spec-init` if `.memory-bank/spec-index.md` is missing, stale, placeholder-only, ambiguous, has broken links, or cannot safely identify relevant existing specs and planned/candidate/unknown/not_applicable areas;
- determine relevance from PRD sections, affected product areas, requirements, actors, data/domain model, contracts/APIs, states/lifecycles, security/compliance, runtime/operations, and verification strategy;
- resolve and read only the relevant authoritative spec files routed by `.memory-bank/spec-index.md`;
- do not load every SDD spec by default; leave non-relevant authoritative specs closed unless the index routes them into the current PRD/decomposition scope;
- if a relevant authoritative spec conflicts with the PRD, stop and ask for explicit resolution through a spec or PRD amendment instead of silently overriding either source.

## 1) Protocol
Создай (если нет):
- `.protocols/PRD-BOOTSTRAP/plan.md`
- `.protocols/PRD-BOOTSTRAP/decision-log.md`

Режимы:
- **interactive**: write derived docs and report the next feature to decompose.
- **autonomous**: write derived docs non-interactively; if the PRD gate fails, set terminal state `HALT_BLOCKING_QUESTIONS`.

## 2) Update product.md
Заполни `.memory-bank/product.md`:
- what this is
- core value
- audience
- primary user flow
- constraints/non-goals

## 3) Requirements and traceability
Обнови `.memory-bank/requirements.md`:
- REQ-001…
- Out of scope
- RTM: REQ → Epic → Feature → Test

## 4) Create epics/
Для каждого эпика:
- `.memory-bank/epics/EP-<NNN>-<slug>.md`
- value, success metrics, acceptance criteria
- optional, if grounded in evidence: `Source artifacts`, `Normative inputs`, `Constraints / invariants`
 - `status: draft` по умолчанию (переводи в active после закрытия Open questions)

## 5) Create features/
Для каждой фичи:
- `.memory-bank/features/FT-<NNN>-<slug>.md`
- use cases
- acceptance criteria
- edge cases & failure modes
- test strategy pointers
- optional, if grounded in evidence: `Source artifacts`, `Normative inputs`, `Constraints / invariants`, `Verification targets`
 - `status: draft` по умолчанию
- write a `## SDD Design Gate` section into every new feature: run `/spec-improve FT-<NNN>` before `/prd-to-tasks FT-<NNN>`; when `/spec-improve` sets `spec_design_status: complete`, linked specs go in `spec_design_links`; `not_required` needs a short rationale; `blocked` must record the blocker
- if existing SDD specs apply, add `spec_design_links` to those specs and set `spec_design_status: complete` only when the design is already authoritative and sufficient for task decomposition
- otherwise omit `spec_design_status`; `/spec-improve FT-<NNN>` or `/spec-auto` owns the feature-level design gate and may establish only `complete`, `not_required`, or `blocked`
- add an SDD Design Gate note that `/spec-design` is the mandatory global gate before per-feature `/spec-improve`; if the feature set is simple T0/T1-only, `/spec-design` records a minimal backbone with irrelevant areas `not_applicable`

Do not set every new feature to `clarification_status: pending`.
Only add feature clarification metadata when the PRD explicitly leaves a feature-level decomposition blocker:

```yaml
clarification_status: pending|blocked
last_clarified: null
clarification_questions: 0
```

When a feature is already clear enough for task decomposition, omit clarification metadata.

## 6) Testing index
Обнови `.memory-bank/testing/index.md`:
- quality gates
- unit/integration/e2e
- анти-чит правила

## 7) Index
Обнови `.memory-bank/index.md`:
- добавить аннотированные ссылки

## 8) Gate
Запусти `mb-review` (fresh context).

## 9) What next
- interactive: run `/spec-design`; then choose one feature and run `/spec-improve FT-<NNN>`, then `/prd-to-tasks FT-<NNN>`
- optional: run `/clarify-feature FT-<NNN>` only if that feature is explicitly pending/blocked or has decomposition-affecting unresolved markers
- autonomous end-to-end: запусти `/autonomous`; it will run/require `/spec-design --all`, then `/spec-auto --all` before `/prd-to-tasks --all`

Do not create TASK records from `/prd`.
</process>
