---
status: accepted
date: 2026-03-07
title: memobank v2 as control plane
---
# ADR-001 — memobank v2 as control plane

## Decision
`memobank` stays a single public setup skill and becomes the control plane for repo-local memory, runtime checkpoints, protocol contracts, and provider bridges.

## Why
- Keep one public UX surface.
- Preserve `.memory-bank/` as SSOT.
- Avoid permanent vendoring of external frameworks.
- Keep provider integrations explicit, updatable, and disposable.

## Consequences
- Providers are adapters, not truth.
- Runtime state moves into `.tasks/RUN-*`.
- Handoffs, claims, and verification stamps become first-class files.
