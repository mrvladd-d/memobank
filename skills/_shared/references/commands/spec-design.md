---
description: Mandatory global SDD architecture backbone gate after PRD decomposition and before feature design.
status: active
---
# /spec-design - Global SDD backbone gate

<objective>
Create or update the mandatory global architecture/design backbone after `/prd` has created the FT set and before `/spec-improve FT-<NNN>`, `/spec-auto --all`, or `/prd-to-tasks`.

The gate is mandatory by workflow, but adaptive by depth:
- simple T0/T1 projects create a minimal backbone and mark irrelevant areas `not_applicable`;
- projects with shared/T2/T3 concerns get staged architecture decisions and normal backbone specs;
- unresolved key decisions are recorded as blockers and downstream commands must stop.

`/spec-design` does not create TASK records, implementation plans, or feature-local tech specs, and it does not replace `/spec-improve`.
</objective>

<process>

## 0) Input and timing
Run after `/prd`.

Supported arguments:
- no argument: inspect all current features and update the global backbone
- `--all`: same as no argument; explicit for autonomous or batch flow

Required inputs:
- `.memory-bank/spec-index.md`
- `.memory-bank/requirements.md`
- `.memory-bank/epics/`
- `.memory-bank/features/`
- existing relevant specs under `.memory-bank/architecture/`, `.memory-bank/guides/`, `.memory-bank/domains/`, `.memory-bank/contracts/`, `.memory-bank/states/`, `.memory-bank/adrs/`, `.memory-bank/testing/`, and `.memory-bank/runbooks/`

Never skip the command. For small independent T0/T1-only scope, write the minimal backbone status and mark non-applicable areas instead of expanding architecture.

## 1) Backbone status gate
Update `.memory-bank/spec-index.md` with a clear global backbone status:
- `complete`: shared/global decisions are recorded and no blocker remains
- `minimal`: project is simple/T0-T1 oriented; unnecessary areas are explicitly `not_applicable`
- `blocked`: key architecture decisions are unresolved

If status is `blocked`, stop downstream work. Record:
- unresolved decision
- affected features/requirements
- why a conservative assumption would be unsafe
- next question or owner needed

## 2) Spec-index content contract
`.memory-bank/spec-index.md` is an index and route map, not an authoritative design spec.

Allowed in `spec-index.md`:
- global backbone status, blockers, and next command routing
- short decision labels, such as `Architecture: local layered modular monolith`
- links to authoritative specs/ADRs and one-line scope notes
- planned/candidate/unknown/not_applicable areas
- feature-to-spec routing

Not allowed in `spec-index.md`:
- decision body, rationale, trade-off analysis, or architecture rules
- API naming/status/error/auth/upload rules
- state transitions, data schemas, event/message envelope rules, safety policy, or testing gate details
- duplicated content that already belongs in `.memory-bank/architecture/`, `.memory-bank/contracts/`, `.memory-bank/domains/`, `.memory-bank/states/`, `.memory-bank/testing/`, `.memory-bank/invariants.md`, or `.memory-bank/adrs/`

If a decision needs more than a short label plus link, write it in the relevant authoritative spec or ADR and route it from `spec-index.md`. If `spec-index.md` already contains detailed decision content, summarize it into labels and move the body to the linked spec.

## 3) Phase A - staged architecture decision interview
Do not use a long questionnaire. Ask one question at a time with 2-3 options, a preferred option, and a short rationale. After each answer, record the decision body and rationale in the relevant authoritative spec or ADR. Update `.memory-bank/spec-index.md` only with the short decision label, status, and link.

Confirm or choose only decisions that affect the current PRD:
- monolith vs split services
- persistence strategy
- API style
- frontend/backend boundary
- event model
- schema strategy
- deployment assumptions
- testing gates
- architecture documentation granularity

For simple/T0-T1 projects, prefer conservative defaults such as modular monolith, local/simple persistence, no event bus, no separate HTTP boundary, and minimal testing gates when supported by PRD evidence. Mark unrelated areas `not_applicable`.

In autonomous mode, do not ask questions. Record conservative assumptions only when they are reversible and safe; otherwise set backbone status `blocked`.

## 4) Architecture documentation granularity
Before creating multiple files under `.memory-bank/architecture/`, choose the architecture artifact strategy.

Ask one targeted question unless the answer is obvious from project size or existing docs:
- **Single-file KISS (recommended default)**: keep the global architecture backbone in `.memory-bank/architecture/system-architecture.md`; include source-of-truth, module-boundary, deployment, data-flow, and Mermaid diagram sections there.
- **Split core docs**: create `system-architecture.md`, `source-of-truth.md`, and `module-boundaries.md` only when those sections are large, reused independently, or owned by different workstreams.
- **Split by boundary/topic**: add extra files such as `agno-boundary.md` only for large projects or complex external/runtime boundaries that would make `system-architecture.md` hard to prime.

Default to Single-file KISS for small, early, T0/T1, or unclear scope. Do not create `.memory-bank/architecture/index.md` unless the architecture folder has more than three docs. If the project already has split architecture docs, do not churn them unless consolidation is explicitly useful.

Recommended `system-architecture.md` sections for Single-file KISS:
- `# System Architecture`
- `## Scope`
- `## Architecture Overview`
- `## Source Of Truth`
- `## Module Boundaries`
- `## External/Runtime Boundaries`
- `## Data Flow`
- `## Downstream Requirements`

Architecture docs content boundary:
- keep only global architecture decisions and invariants there: system shape, ownership, module boundaries, source-of-truth, deployment assumptions, high-level data flow, and diagrams
- do not put detailed API schemas, endpoint contracts, lifecycle state machines, message/event envelope contracts, or feature-local implementation design in `architecture/*`
- route those details to `.memory-bank/contracts/`, `.memory-bank/states/`, `.memory-bank/domains/`, or feature-level `.memory-bank/tech-specs/`

## 5) Phase B - write initial global specs
Write or update only relevant backbone artifacts:
- `.memory-bank/spec-index.md`
- `.memory-bank/architecture/system-architecture.md` as the default architecture hub, using the Single-file KISS sections above and Mermaid C4/context/container/component, data flow, and sequence diagrams when useful
- `.memory-bank/architecture/source-of-truth.md` only when Split core docs or Split by boundary/topic was selected, or when source-of-truth rules are too large/reused to keep in `system-architecture.md`
- `.memory-bank/architecture/module-boundaries.md` only when Split core docs or Split by boundary/topic was selected, or when boundary rules are too large/reused to keep in `system-architecture.md`
- `.memory-bank/architecture/<boundary>.md` only for a complex dedicated architecture boundary that cannot stay readable inside `system-architecture.md`
- `.memory-bank/domains/runtime-data-model.md`
- `.memory-bank/contracts/api-guidelines.md`
- `.memory-bank/contracts/http-api.md` or `.memory-bank/contracts/openapi.md` only when a separate HTTP boundary spec is needed
- `.memory-bank/contracts/agent-chat-bus.md` if agent/event/chat boundary exists
- `.memory-bank/contracts/message-envelope.md` if messages/events/envelopes exist
- `.memory-bank/guides/frontend-component-guide.md` if frontend component system/design behavior is in scope
- `.memory-bank/glossary.md`
- `.memory-bank/invariants.md`
- `.memory-bank/testing/*`
- `.memory-bank/adrs/*` for stable architecture decisions

Keep output conservative. Prefer updating an existing authoritative spec over creating a new one.
Prefer fewer architecture files for faster priming; split only when it removes real complexity or matches the selected artifact strategy.
Keep architecture docs global: if the content is an API schema, lifecycle state machine, message/event contract, or feature-local behavior, create or update the relevant contract/state/domain/tech-spec instead of expanding `architecture/*`.

Do not create:
- `.memory-bank/tasks/*.task.json`
- `.memory-bank/tasks/plans/*`
- feature-local `.memory-bank/tech-specs/FT-*.md`
- implementation plans
- separate diagrams folders; diagrams belong as Mermaid sections in `.memory-bank/architecture/system-architecture.md`
- extra architecture files just because a standard filename exists in this command

## 6) OpenAPI policy
OpenAPI is not the source of truth for the whole system.

Rules:
- backend schemas such as FastAPI/Pydantic, or equivalent stack schemas, should generate OpenAPI when that stack exists or is selected
- `.memory-bank/contracts/api-guidelines.md` defines naming, status codes, error format, auth, CORS, upload, pagination, and compatibility rules
- OpenAPI covers only frontend/backend HTTP API
- agent/domain/event/state/safety contracts live in separate specs
- do not write a large hand-written `openapi.yaml` before architecture design
- gate: generated OpenAPI validates and critical endpoints have integration/contract tests

## 7) Phase C - targeted follow-up interviews
While writing boundary/data/testing specs, ask follow-up questions only for unresolved branch decisions that block truthful specs.

Examples:
- the data model needs retention or migration rules not present in PRD
- HTTP API exists but auth/error/upload behavior is undecided
- event/message boundary exists but envelope or ordering rules are undecided
- frontend component behavior is normative but ownership/design system source is unclear

If the answer is unavailable and a safe assumption is not possible, mark backbone status `blocked` and stop.

## 8) Update routing
Update `.memory-bank/spec-index.md`:
- source-of-truth route labels and links; detailed hierarchy/rules live in the selected architecture artifact (`system-architecture.md` by default, or `source-of-truth.md` when split)
- global backbone status and blockers
- architecture artifact strategy and baseline backbone specs with their scope
- short backbone decision labels only, never decision body/rationale/rules
- authoritative/planned/candidate/unknown/not_applicable areas
- feature-to-backbone routing
- expected spec locations

For affected feature docs:
- add SDD Design Gate notes with normative backbone links where evidence exists
- do not set `spec_design_status: complete` unless feature-local `/spec-improve` criteria are already fully satisfied
- do not mark `not_required` for features that still depend on shared T2/T3 backbone decisions

## 9) Handoff
Report:
- backbone status: `complete`, `minimal`, or `blocked`
- architecture artifact strategy: single-file, split core docs, or split by boundary/topic
- specs created/updated
- not_applicable areas and rationale for simple projects
- affected features and normative links
- blockers/open questions
- next command: `/spec-improve FT-<NNN>` for manual flow, or `/spec-auto --all` before `/prd-to-tasks --all` in autonomous flow

</process>
