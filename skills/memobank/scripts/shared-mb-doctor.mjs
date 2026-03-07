#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  parseArgs,
  loadSystemConfig,
  loadCommandsManifest,
  loadLockFile,
  loadProviderRegistry,
  readJson,
  listDirs,
} from './mb-lib.mjs';

const HEALTHY_VERSION_RE = /^(?:pending:[A-Za-z0-9._-]+|import-only|v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?)$/;

function add(results, ok, code, message) {
  results.push({ ok, code, message });
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const results = [];

  add(results, exists('.memory-bank/system/memobank.yaml'), 'system-config', 'system manifest exists');
  add(results, exists('.memory-bank/system/providers.lock.json'), 'provider-lock', 'provider lock exists');
  add(results, exists('.memory-bank/system/commands.manifest.json'), 'commands-manifest', 'commands manifest exists');
  add(results, exists('.memory-bank/system/sync-state.json'), 'sync-state', 'sync state exists');

  const config = loadSystemConfig();
  add(results, Boolean(config && config.schema_version === 2), 'schema-version', 'schema_version is 2');
  add(results, Boolean(config.stack), 'stack', 'stack is defined');
  add(results, Boolean(config.providers), 'providers', 'provider config exists');

  const manifest = loadCommandsManifest();
  const selectedCommands = manifest?.selection?.commands || [];
  for (const name of selectedCommands) {
    add(results, exists(`.memory-bank/commands/${name}.md`), `command:${name}`, `command spec exists for ${name}`);
    add(results, exists(`.claude/skills/${name}/SKILL.md`), `claude-skill:${name}`, `Claude proxy exists for ${name}`);
    add(results, exists(`.agents/skills/${name}/SKILL.md`), `agents-skill:${name}`, `Codex proxy exists for ${name}`);
  }

  const tools = ['init-mb.js', 'provider-manager.mjs', 'mb-lib.mjs', 'mb-run.mjs', 'mb-index.mjs', 'mb-condense.mjs', 'mb-update.mjs'];
  for (const tool of tools) {
    add(results, exists(`.memory-bank/tools/${tool}`), `tool:${tool}`, `tool exists: ${tool}`);
  }

  add(results, exists('.tasks/templates/RUN-TEMPLATE/meta.json'), 'run-template', 'run template exists');
  add(results, exists('.protocols/templates/handoffs/template.md'), 'handoff-template', 'handoff template exists');
  add(results, exists('.memory-bank/product/features.json'), 'features-contract', 'feature contract exists');
  add(results, exists('.memory-bank/architecture/project-context.md'), 'project-context', 'project context exists');

  const registry = loadProviderRegistry();
  const lock = loadLockFile();
  add(results, Object.keys(registry).length >= 5, 'provider-registry', 'provider registry copied locally');
  for (const [role, provider] of Object.entries(config.providers || {})) {
    if (!provider || !provider.name || provider.name === 'none' || provider.name === 'native') continue;
    add(results, Boolean(registry[provider.name]), `provider:${role}`, `registry entry exists for provider ${provider.name}`);
    if (provider.mode !== 'managed' && provider.mode !== 'detect-import') continue;

    const entry = lock[provider.name];
    const manifestEntry = registry[provider.name]?.manifest || {};
    add(results, Boolean(entry), `provider-lock:${provider.name}`, `lock entry exists for ${provider.name}`);
    if (!entry) continue;

    add(results, entry.mode === provider.mode, `provider-mode:${provider.name}`, `lock mode matches configured mode for ${provider.name}`);
    add(results, entry.status !== 'failed', `provider-status:${provider.name}`, `${provider.name} lifecycle is not marked failed`);

    const isPending = entry.status === 'pending' || String(entry.resolved_version || '').startsWith('pending:');
    if (provider.mode === 'managed') {
      add(results, entry.last_result_code == null || entry.last_result_code === 0, `provider-exit:${provider.name}`, `${provider.name} last lifecycle command exited cleanly`);
      add(results, isPending || HEALTHY_VERSION_RE.test(String(entry.resolved_version || '')), `provider-version:${provider.name}`, `${provider.name} resolved version looks valid`);
      add(results, isPending || entry.detection?.detected !== false, `provider-detection:${provider.name}`, `${provider.name} detection is consistent with lock state`);
      if (manifestEntry.init_command) {
        add(results, isPending || (entry.detection?.init_hits || []).length > 0, `provider-init:${provider.name}`, `${provider.name} repo initialization markers exist`);
      }
    }

    if (provider.mode === 'detect-import') {
      const importPending = entry.status === 'pending' || entry.status === 'skipped-mode' || String(entry.resolved_version || '').startsWith('pending:');
      add(results, importPending || Boolean(entry.artifacts_hash), `provider-import:${provider.name}`, `${provider.name} import artifacts are hashed`);
    }
  }

  const failures = results.filter((item) => !item.ok);
  const warnings = [];
  if (!exists('.memory-bank/indexes/lexical.json')) warnings.push('derived indexes are missing; run node .memory-bank/tools/mb-index.mjs');
  if (!exists('.tasks/.current-run') && listDirs('.tasks').filter((name) => /^RUN-\d+$/.test(name)).length === 0) warnings.push('no RUN-* exists yet; use /mb-resume or /execute to open one');

  const report = {
    ok: failures.length === 0,
    failures,
    warnings,
    checks: results,
  };

  console.log(JSON.stringify(report, null, 2));
  if (flags.strict && failures.length > 0) {
    process.exit(1);
  }
}

main();
