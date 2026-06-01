---
description: Bootstrap the lightweight SDD Design Specs Index route map before PRD decomposition.
status: active
---
# /spec-init - Lightweight SDD route map bootstrap

<objective>
Create or update the minimal `.memory-bank/spec-index.md` skeleton / route map after a clarified `/write-prd` and before `/prd`.

`/spec-init` is a pre-PRD bootstrap/preflight, not a design phase. It identifies only evidence-backed or explicitly uncertain design areas, expected spec locations, gaps, and open questions. It does not run an architecture interview, design architecture, define source-of-truth hierarchy, set backbone status, write OpenAPI policy, create diagrams, or create authoritative architecture, contracts, states, data, or domain specs.

Real SDD backbone design belongs to `/spec-design` after `/prd`. Feature-level design belongs to `/spec-improve FT-<NNN>`.
</objective>

<process>

## 0) Position in workflow
Run after clarified `/write-prd` and before `/prd`.

Canonical manual chain:
`/analysis -> /brief -> /constitution -> /write-prd -> /spec-init -> /prd -> /spec-design -> /spec-improve FT-001 -> /prd-to-tasks FT-001`.

## 1) Inputs
Read, if present:
- `.memory-bank/constitution.md`
- `.memory-bank/analysis/product-brief.md`
- `.memory-bank/prd.md`
- existing `.memory-bank/spec-index.md`
- existing specs under `.memory-bank/architecture/`, `.memory-bank/tech-specs/`, `.memory-bank/contracts/`, `.memory-bank/domains/`, `.memory-bank/states/`, `.memory-bank/adrs/`, `.memory-bank/testing/`, and `.memory-bank/runbooks/`

Stop if `.memory-bank/prd.md` is missing or so unclear that even a lightweight route map would mislead `/prd`.

## 2) No architecture interview
Do not conduct an architecture interview in `/spec-init`.

Rules:
- do not ask architecture, API, data model, state machine, source-of-truth, diagram, or backbone design questions here
- if PRD/brief/existing specs provide evidence, route the area as `authoritative`, `planned`, `candidate`, or `not_applicable`
- if evidence is insufficient, mark the area `unknown` and add a gap/open question
- stop only when the PRD is missing/unclear enough that recording `unknown` would create a misleading route map

If a real design decision is needed, route it to `/spec-design` or `/spec-improve`, not to `/spec-init`.

## 3) Update spec-index.md
Update `.memory-bank/spec-index.md` into a lightweight SDD Design Specs Index with these sections:
- Purpose and hard rules
- Existing authoritative specs
- Planned design areas
- Candidate design areas
- Unknown design areas
- Not applicable areas
- Feature design status map
- Expected spec locations
- Gaps and open questions
- Update rules

Use simple links and short annotations. Keep it a route map, not a design dump.
Do not add global backbone status, source-of-truth hierarchy, OpenAPI policy, diagrams, or new architecture decisions here; `/spec-design` owns those after `/prd`.

Design area status meanings:
- `authoritative`: the linked spec is evidence-backed and binding
- `planned`: likely needed, but decision/spec is not written yet
- `candidate`: may be needed; confirm during `/spec-improve`
- `unknown`: insufficient evidence
- `not_applicable`: explicitly out of scope

Expected locations:
- feature hubs: `.memory-bank/tech-specs/FT-<NNN>-<slug>.md`
- architecture notes: `.memory-bank/architecture/<topic>.md`
- contracts: `.memory-bank/contracts/<boundary>.md`
- domain/data models: `.memory-bank/domains/<domain>.md`
- states: `.memory-bank/states/<lifecycle>.md`
- ADRs: `.memory-bank/adrs/ADR-<NNN>-<slug>.md`
- testing/runbooks: `.memory-bank/testing/` and `.memory-bank/runbooks/`

## 4) Hard rule
MUST NOT create authoritative design specs or design decisions unless PRD/user/existing-spec evidence explicitly contains the decision. Even then, prefer linking/routing the existing evidence; leave expansion to `/spec-design`.

Allowed from `/spec-init`:
- create/update `.memory-bank/spec-index.md`
- add planned/candidate/unknown/not_applicable route entries
- record gaps/open questions

Not allowed by default:
- architecture interview
- inventing architecture
- inventing contracts
- inventing state machines
- inventing data models
- creating ADRs for decisions not made
- setting real global backbone status
- defining source-of-truth hierarchy
- writing OpenAPI/API policy
- creating diagrams

## 5) Handoff
Report:
- spec-index path
- planned/candidate/unknown/not_applicable areas
- blocking gaps, if any
- expected next command: `/prd`
- note that `/spec-design` consumes this lightweight route map and owns real backbone design after `/prd`

</process>
