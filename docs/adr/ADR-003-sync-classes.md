---
status: accepted
date: 2026-03-07
title: sync classes
---
# ADR-003 — Sync classes

## Decision
All generated repo artifacts belong to one of four sync classes:
- `curated`
- `generated`
- `derived`
- `runtime`

## Policy
- `curated` → protect
- `generated` → replace on sync
- `derived` → rebuild on sync
- `runtime` → append/checkpoint/rotate

## Consequences
- Reviewable docs stay stable.
- Commands and indexes remain refreshable.
- Runtime traces do not overwrite project knowledge.
