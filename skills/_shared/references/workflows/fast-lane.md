---
description: Fast lane for small bounded changes.
status: active
---
# Fast lane

Use the fast lane only when all of the following are true:
- small bounded diff
- no destructive migration
- no cross-cutting architectural change
- acceptance criteria fit in a short checklist
- verification is straightforward

Flow:
1. Write a compact feature contract to `product/features.json`
2. Open or resume a run
3. Implement with `/fast-track`
4. Use Codex built-in `/fast` only during implementation, not during design review
5. Verify and sync
