---
description: How run resume works in memobank v2.
status: active
---
# Run resume

1. Find the latest `RUN-*` or open a new run.
2. Build `active-memory.json` from the highest-signal blocks only.
3. Write `context-snapshot.md`.
4. Keep events append-only in `events.jsonl`.
5. Use checkpoints instead of mutating durable docs.
