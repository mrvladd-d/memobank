---
description: Template for .protocols/TASK-XXX/plan.md (execution plan + MB-SYNC).
status: active
---
# Plan — <TASK_ID>

## Goal

## Non-goals

## Inputs / source specs
- Backlog: `.memory-bank/tasks/backlog.md` (link)
- Feature/Epic: ...
- REQ IDs: ...

## Constraints / invariants (MUST / NEVER)
- MUST: ...
- NEVER: ...

## Scope
### In scope

### Out of scope

## Proposed changes
### Touched areas (hypotheses OK)
- `path/to/file` — why

## Quality gates
- [ ] lint/typecheck: `<cmd>`
- [ ] unit tests: `<cmd>`
- [ ] integration tests: `<cmd>`
- [ ] e2e/UAT: `<cmd>`

## Fan-out plan (if needed)
- Worker A: scope ...
- Worker B: scope ...

## MB-SYNC (required)
Follow: `.memory-bank/workflows/mb-sync.md`

Checklist:
- [ ] Update `.memory-bank/` docs (WHY/WHERE, no pseudocode)
- [ ] Update `.memory-bank/index.md` routers (if needed)
- [ ] Update RTM in `.memory-bank/requirements.md`
- [ ] Mark task in `.memory-bank/tasks/backlog.md`
- [ ] Append entry to `.memory-bank/changelog.md`

## Definition of done
- ...

