---
status: accepted
date: 2026-03-07
title: provider bridge model
---
# ADR-002 — Provider bridge model

## Decision
Provider integrations support three modes:
- `managed`
- `detect-import`
- `pattern-only`

Each provider must declare install/update/detect/import semantics in a local registry copied into `.memory-bank/system/provider-registry/`.

## Consequences
- No long-lived vendored framework copies.
- Exact resolved provider versions are tracked in `providers.lock.json`.
- Updates happen only through explicit `/mb-update`.
