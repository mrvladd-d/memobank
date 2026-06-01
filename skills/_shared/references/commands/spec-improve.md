---
description: Improve one feature's SDD design against the Design Specs Index before task decomposition.
status: active
---
# /spec-improve - Feature-level SDD design improvement

<objective>
Improve the minimum necessary spec surface for one feature before `/prd-to-tasks`.

`/spec-improve FT-<NNN>` checks existing specs first, finds gaps/contradictions, asks focused questions when needed, updates only necessary design artifacts, and marks the target feature with `spec_design_status`.
</objective>

<process>

## 0) Input
Expected `$ARGUMENTS`:
- `FT-<NNN>`

Run after `/prd` and mandatory `/spec-design`, before `/prd-to-tasks FT-<NNN>`.
Consume backbone specs as normative inputs instead of duplicating them.

If the argument is missing, ask the user to choose one feature.

Examples:
- `/spec-improve FT-001`
- `/spec-improve FT-012`

Canonical route:
`/write-prd -> /spec-init -> /prd -> /spec-design -> /spec-improve FT-<NNN> -> /prd-to-tasks FT-<NNN>`.

## 1) Read existing design surface first
Before creating any new spec:
1. Read `.memory-bank/spec-index.md`.
2. Confirm global backbone status is `complete`, or `minimal` with explicit `not_applicable` areas; if missing, bare `minimal`, or `blocked`, stop and route to `/spec-design`.
3. Read the target `.memory-bank/features/FT-<NNN>-*.md`.
4. Read linked epic, requirements, Constitution, backbone specs, and any existing specs routed by the index.
5. Search existing `.memory-bank/architecture/`, `.memory-bank/tech-specs/`, `.memory-bank/contracts/`, `.memory-bank/domains/`, `.memory-bank/states/`, `.memory-bank/adrs/`, `.memory-bank/testing/`, `.memory-bank/guides/`, and `.memory-bank/runbooks/` for overlapping decisions.

Rule: do not create a new spec before checking existing specs through the index.
If several features need the same missing domain/contract/state/API/security/data/runtime/testing decision, stop and route to `/spec-design` instead of creating duplicate feature-local specs.
If a task/feature interpretation conflicts with a backbone spec, stop with a blocker instead of choosing locally.

## 2) Decide required design depth
Classify what the feature needs:
- none: simple T0/T1-like work with no runtime, contract, state, data, security, migration, or cross-module design impact
- feature hub only: a small `.memory-bank/tech-specs/FT-<NNN>-<slug>.md` is enough
- linked specs: update or create specific architecture/contracts/domains/states/ADR/testing/runbook docs

If simple, mark the feature:

```yaml
spec_design_status: not_required
spec_design_links: []
```

Add a concise rationale in the feature doc and update `.memory-bank/spec-index.md`.

## 3) Problem scan
Before writing specs, explicitly look for:
- duplicate or conflicting existing specs
- inconsistent boundaries, contracts, state transitions, or data ownership
- hidden coupling or complexity growth
- unclear acceptance criteria that would make tasks unverifiable
- security/compliance/runtime risks
- places where tests could pass while substance remains wrong

Do not hide complexity growth. Report it and explain the tradeoff.

## 4) Interview gate
If design is blocked or multiple meaningful options exist, ask the user.

Rules:
- notify the user about the concrete problem first
- provide options with rationale, like `/write-prd`
- maximum 5 questions per pass
- ask only questions needed to make the spec truthful
- if contradiction or major complexity increase exists, stop until resolved

## 5) Write only necessary artifacts
Allowed artifacts:
- feature design hub: `.memory-bank/tech-specs/FT-<NNN>-<slug>.md`
- architecture notes: `.memory-bank/architecture/<topic>.md`
- contracts: `.memory-bank/contracts/<boundary>.md`
- domain/data model notes: `.memory-bank/domains/<domain>.md`
- states: `.memory-bank/states/<lifecycle>.md`
- ADRs for significant decisions: `.memory-bank/adrs/ADR-<NNN>-<slug>.md`
- frontend component guide: `.memory-bank/guides/frontend-component-guide.md` when UI component/design behavior is normative
- testing/runbooks when needed: `.memory-bank/testing/`, `.memory-bank/runbooks/`

Keep KISS:
- update existing specs when that is the natural home
- do not fork duplicate specs
- do not add schema, migration, hook, or governance machinery just for design routing
- write decisions, constraints, invariants, and verification targets only when grounded in PRD/user/spec evidence
- use backbone specs from `/spec-design` as primary normative inputs

## 6) Update routes and feature metadata
Update `.memory-bank/spec-index.md`:
- route the feature to linked specs
- mark statuses as authoritative/planned/candidate/unknown/not_applicable
- record gaps/open questions

Invariant for `spec_design_status: complete`:
- set `complete` only when every feature-relevant SDD design area either has a concrete linked spec file routed through `.memory-bank/spec-index.md` as an authoritative, evidence-backed source of truth, or is explicitly `not_applicable` for this feature
- do not set `complete` while any feature-relevant design area remains planned, candidate, unknown, conflicting, or otherwise unresolved
- if unresolved feature-relevant planned/candidate/unknown/conflicting areas remain, set `spec_design_status: blocked` or leave the feature without `complete`, and record the gap/open question in `.memory-bank/spec-index.md`

Update target feature frontmatter:

```yaml
spec_design_status: complete
spec_design_links:
  - .memory-bank/tech-specs/FT-<NNN>-<slug>.md
```

Allowed statuses:
- `complete`
- `not_required`
- `blocked`

Use `blocked` only when design cannot be made truthful without user or external evidence.

## 7) Handoff
Report:
- target feature
- `spec_design_status`
- linked specs
- gaps/open questions
- complexity or contradiction notes
- expected next command: `/prd-to-tasks FT-<NNN>`

</process>
