---
description: Provider lifecycle: detect, install, update, import, lock.
status: active
---
# Provider lifecycle

Providers are adapters, not truth.

Lifecycle:
1. Resolve desired state from `.memory-bank/system/memobank.yaml`
2. Detect current provider artifacts
3. Install or update only via explicit `/mb-update`
4. Import provider artifacts into canonical memobank paths
5. Record exact version and importer state in `providers.lock.json`
