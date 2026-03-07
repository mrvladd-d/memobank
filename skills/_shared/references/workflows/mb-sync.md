---
description: Memory Bank synchronization workflow for memobank v2.
status: active
---
# MB-SYNC — Memory Bank synchronization workflow

## When to run
- After each meaningful work unit
- After `/verify`
- After long runs that produced new runtime evidence
- Before `/review`
- Whenever durable docs drift from implementation reality

## Sync classes
- curated → protect / review
- generated → replace
- derived → rebuild
- runtime → append / checkpoint / rotate

## Checklist

### 1) Canonical docs
- [ ] `product/*` reflects the actual scope and accepted criteria
- [ ] `architecture/*` reflects the current or intended boundaries
- [ ] `knowledge/*` separates facts, decisions, assumptions, evidence, and open questions
- [ ] `tasks/backlog.md` and `tasks/board.json` reflect the canonical backlog state

### 2) Feature contract
- [ ] `product/features.json` is in sync with the work just completed
- [ ] No feature was implemented outside an explicit contract or assumption

### 3) Runtime condensation
- [ ] Long run condensed into `summary.md`
- [ ] `candidate-updates.json` created if needed
- [ ] No candidate update promoted into curated docs without review

### 4) Derived recall
- [ ] `node .memory-bank/tools/mb-index.mjs`
- [ ] indexes rebuilt successfully

### 5) Protocol consistency
- [ ] claims / handoffs / verification stamps are consistent with the actual state
- [ ] evidence pointers exist for important assertions

### 6) Integrity
- [ ] `node .memory-bank/tools/mb-doctor.mjs --strict`

## Failure policy
- Fix the issue while the context is still warm.
- In autonomous mode, treat failed integrity checks as blocking.
