#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  SYSTEM_DIR,
  nowIso,
  parseArgs,
  loadSystemConfig,
  loadLockFile,
  saveLockFile,
  loadProviderRegistry,
  commandExists,
  globExists,
  runShell,
  writeJson,
  ensureDir,
  hashFiles,
  writeText,
  shortExcerpt,
} from './mb-lib.mjs';

const WRAPPER_BINARIES = new Set(['npx', 'uvx', 'npm']);

function resolveDesiredProviders(config) {
  const providers = config.providers || {};
  return Object.entries(providers)
    .filter(([, value]) => value && value.name && value.name !== 'none' && value.name !== 'native')
    .map(([role, value]) => ({ role, ...value }));
}

function needsIsolatedRuntime(manifest) {
  return [manifest?.install_command, manifest?.update_command, manifest?.init_command]
    .filter(Boolean)
    .some((command) => /\bnpm\s+install\s+-g\b/.test(command));
}

function providerRuntime(providerName, manifest, createDirs = false) {
  const base = path.join(ROOT, '.memory-bank', 'providers', providerName);
  if (!needsIsolatedRuntime(manifest)) {
    return { base, env: {} };
  }
  const npmPrefix = path.join(base, 'npm-global');
  const env = {
    HOME: path.join(base, 'home'),
    XDG_CONFIG_HOME: path.join(base, 'xdg'),
    NPM_CONFIG_PREFIX: npmPrefix,
    UV_CACHE_DIR: path.join(base, 'uv-cache'),
    CODEX_HOME: path.join(base, 'codex-home'),
    CLAUDE_CONFIG_DIR: path.join(base, 'claude-config'),
    GEMINI_CONFIG_DIR: path.join(base, 'gemini-config'),
  };
  if (createDirs) {
    for (const value of Object.values(env)) ensureDir(value);
    ensureDir(path.join(npmPrefix, 'bin'));
  }
  return {
    base,
    env: {
      ...env,
      PATH: `${path.join(npmPrefix, 'bin')}${path.delimiter}${process.env.PATH || ''}`,
    },
  };
}

function detectProvider(manifest, runtime) {
  const binaryCandidates = [manifest?.binary, ...(manifest?.binary_candidates || [])]
    .filter(Boolean)
    .filter((binary, index, values) => values.indexOf(binary) === index)
    .filter((binary) => !WRAPPER_BINARIES.has(binary));
  const binaryHits = binaryCandidates.filter((candidate) => commandExists(candidate, { env: runtime?.env }));
  const pathHits = (manifest?.detect_paths || []).filter((candidate) => globExists(candidate));
  const initHits = (manifest?.init_paths || []).filter((candidate) => globExists(candidate));
  return {
    binary_ok: binaryHits.length > 0,
    binary_hits: binaryHits,
    path_hits: pathHits,
    init_hits: initHits,
    initialized: manifest?.init_command ? initHits.length > 0 : true,
    detected: binaryHits.length > 0 || pathHits.length > 0 || initHits.length > 0,
  };
}

function extractVersion(manifest, text) {
  const raw = String(text || '').trim();
  if (!raw) return null;
  if (manifest?.version_regex) {
    const regex = new RegExp(manifest.version_regex, 'm');
    const match = raw.match(regex);
    if (match) return (match[1] || match[0]).trim();
  }
  const generic = raw.match(/\bv?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?\b/);
  return generic ? generic[0] : null;
}

function resolveProviderVersion(manifest, runtime) {
  if (!manifest?.version_command) return null;
  const result = runShell(manifest.version_command, { execute: true, cwd: ROOT, env: runtime.env });
  if (!result.ok) return null;
  return extractVersion(manifest, `${result.stdout}\n${result.stderr}`);
}

function lifecyclePlan(op, manifest, detection) {
  const steps = [];
  const needsInstall = !detection.detected;
  const needsInit = Boolean(manifest?.init_command) && !detection.initialized;

  if (op === 'install') {
    if (needsInstall && manifest.install_command) steps.push({ action: 'install', command: manifest.install_command });
    if (needsInit && manifest.init_command) steps.push({ action: 'init', command: manifest.init_command });
    return steps;
  }

  if (needsInstall && manifest.install_command) steps.push({ action: 'install', command: manifest.install_command });
  if (needsInit && manifest.init_command) steps.push({ action: 'init', command: manifest.init_command });
  if (steps.length === 0) {
    const updateCommand = manifest.update_command || manifest.install_command;
    if (updateCommand) steps.push({ action: 'update', command: updateCommand });
  }
  return steps;
}

function executeLifecycle(op, manifest, runtime, execute) {
  const detection = detectProvider(manifest, runtime);
  const steps = lifecyclePlan(op, manifest, detection);
  if (steps.length === 0) {
    return {
      ok: true,
      code: 0,
      stdout: '',
      stderr: '',
      dryRun: !execute,
      action: 'noop',
      status: detection.detected ? 'ready' : 'pending',
      command: '',
      steps: [],
      detection,
    };
  }

  const aggregate = {
    ok: true,
    code: 0,
    stdout: '',
    stderr: '',
    dryRun: !execute,
    action: steps.at(-1)?.action || op,
    status: !execute ? 'pending' : 'ready',
    command: steps.at(-1)?.command || '',
    steps: [],
    detection,
  };

  let currentDetection = detection;
  for (const step of steps) {
    const result = runShell(step.command, { execute, cwd: ROOT, env: runtime.env });
    aggregate.steps.push({
      action: step.action,
      command: step.command,
      ok: result.ok,
      code: result.code,
      dryRun: result.dryRun,
    });
    if (result.stdout) {
      aggregate.stdout = [aggregate.stdout, result.stdout].filter(Boolean).join('\n');
    }
    if (result.stderr) {
      aggregate.stderr = [aggregate.stderr, result.stderr].filter(Boolean).join('\n');
    }
    aggregate.code = result.code;
    aggregate.command = step.command;
    aggregate.action = step.action;

    if (!result.ok) {
      aggregate.ok = false;
      aggregate.status = 'failed';
      break;
    }

    if (!result.dryRun) {
      currentDetection = detectProvider(manifest, runtime);
      aggregate.status = step.action === 'update' ? 'updated' : step.action === 'init' ? 'initialized' : 'installed';
    }
  }

  aggregate.detection = currentDetection;
  return aggregate;
}

function buildLockEntry(manifest, detection, mode, channel, result, previous = {}, importHash) {
  const requestedChannel = channel || manifest?.channel_default || 'latest';
  const resolvedVersion = (() => {
    if (result?.version) return result.version;
    if (result?.dryRun) return previous.resolved_version || `pending:${requestedChannel}`;
    if (result?.status === 'imported') return previous.resolved_version || 'import-only';
    if (result?.ok === false) return previous.resolved_version || 'unknown';
    return previous.resolved_version || 'unknown';
  })();

  return {
    ...previous,
    requested_channel: requestedChannel,
    resolved_version: resolvedVersion,
    mode,
    installed_at: result?.dryRun ? previous.installed_at || null : nowIso(),
    importer_version: 'mb-v2',
    detection,
    artifacts_hash: importHash ?? previous.artifacts_hash ?? '',
    status: result?.status || (result?.ok === false ? 'failed' : result?.dryRun ? 'pending' : previous.status || 'ready'),
    last_action: result?.action || previous.last_action || null,
    last_command: result?.command || previous.last_command || null,
    last_result_code: Number.isInteger(result?.code) ? result.code : previous.last_result_code ?? null,
    last_error: result?.ok === false ? shortExcerpt(result.stderr || result.stdout || 'command failed', 1200) : null,
    last_stdout_excerpt: result?.stdout ? shortExcerpt(result.stdout, 1200) : previous.last_stdout_excerpt || '',
  };
}

function findSourceCandidate(candidate) {
  const abs = path.join(ROOT, candidate);
  if (fs.existsSync(abs)) return abs;
  return null;
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    ensureDir(dest);
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function importProviderArtifacts(providerName, importMap) {
  const summary = {
    provider: providerName,
    imported_at: nowIso(),
    items: [],
  };
  for (const mapping of importMap?.mappings || []) {
    const source = (mapping.sourceCandidates || []).map(findSourceCandidate).find(Boolean) || null;
    const targetAbs = path.join(ROOT, mapping.target);
    const item = {
      name: mapping.name,
      source,
      target: mapping.target,
      copyMode: mapping.copyMode,
      action: 'missing',
    };
    if (!source) {
      summary.items.push(item);
      continue;
    }

    if (mapping.copyMode === 'summary_only') {
      const stat = fs.statSync(source);
      item.action = 'summarized';
      item.summary = {
        isDirectory: stat.isDirectory(),
        bytes: stat.isDirectory() ? null : stat.size,
      };
      const content = [
        `# ${providerName} import summary`,
        '',
        `- mapping: ${mapping.name}`,
        `- source: ${path.relative(ROOT, source).replace(/\\/g, '/')}`,
        `- generated: ${nowIso()}`,
        '',
        'This is a summary-only import. Canonical memobank files remain the source of truth.',
        '',
      ].join('\n');
      writeText(targetAbs, content);
    } else if (!fs.existsSync(targetAbs)) {
      copyRecursive(source, targetAbs);
      item.action = 'copied';
    } else {
      item.action = 'skipped_existing';
    }
    summary.items.push(item);
  }

  const importedPaths = summary.items.filter((item) => item.source).map((item) => path.join(ROOT, item.target));
  summary.artifacts_hash = hashFiles(importedPaths);
  const summaryPath = path.join(SYSTEM_DIR, 'provider-imports', `${providerName}.json`);
  writeJson(summaryPath, summary);
  return summary;
}

function printHelp() {
  console.log(`provider-manager.mjs

Commands:
  list
  resolve
  status
  install --provider <name> [--execute]
  update --provider <name>|--all [--execute]
  import --provider <name>|--all
`);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const command = positional[0] || 'status';
  if (flags.help || flags.h) {
    printHelp();
    process.exit(0);
  }

  const config = loadSystemConfig();
  const lock = loadLockFile();
  const registry = loadProviderRegistry();
  const desired = resolveDesiredProviders(config);
  const desiredByName = new Map(desired.map((item) => [item.name, item]));

  if (command === 'list') {
    console.log(JSON.stringify(Object.keys(registry), null, 2));
    return;
  }

  if (command === 'resolve') {
    console.log(JSON.stringify({ stack: config.stack, desired }, null, 2));
    return;
  }

  if (command === 'status') {
    const report = desired.map((item) => {
      const entry = registry[item.name] || {};
      const manifest = entry.manifest || {};
      const runtime = providerRuntime(item.name, manifest);
      return {
        role: item.role,
        name: item.name,
        mode: item.mode || 'pattern-only',
        channel: item.channel || manifest.channel_default || 'latest',
        detection: detectProvider(manifest, runtime),
        lock: lock[item.name] || null,
      };
    });
    console.log(JSON.stringify({ stack: config.stack, providers: report }, null, 2));
    return;
  }

  if (command === 'install' || command === 'update') {
    const names = flags.provider ? [flags.provider] : flags.all ? [...desiredByName.keys()] : [];
    if (names.length === 0) {
      console.error('Specify --provider <name> or --all');
      process.exit(1);
    }

    let hadError = false;
    for (const name of names) {
      const desiredEntry = desiredByName.get(name) || { name, mode: 'pattern-only' };
      const registryEntry = registry[name];
      if (!registryEntry?.manifest) {
        console.error(`Unknown provider: ${name}`);
        hadError = true;
        continue;
      }

      const manifest = registryEntry.manifest;
      if (desiredEntry.mode && desiredEntry.mode !== 'managed') {
        const runtime = providerRuntime(name, manifest);
        const detection = detectProvider(manifest, runtime);
        const result = {
          ok: true,
          code: 0,
          stdout: `skipped ${command}: provider mode is ${desiredEntry.mode}`,
          stderr: '',
          dryRun: true,
          action: 'noop',
          status: 'skipped-mode',
          command: '',
        };
        lock[name] = buildLockEntry(
          manifest,
          detection,
          desiredEntry.mode,
          desiredEntry.channel,
          result,
          lock[name] || {},
          lock[name]?.artifacts_hash || '',
        );
        console.log(JSON.stringify({ provider: name, skipped: true, mode: desiredEntry.mode, result, detection }, null, 2));
        continue;
      }
      const runtime = providerRuntime(name, manifest, Boolean(flags.execute));
      const result = executeLifecycle(command, manifest, runtime, Boolean(flags.execute));
      const detection = result.detection || detectProvider(manifest, runtime);
      const version = flags.execute && result.ok ? resolveProviderVersion(manifest, runtime) : null;
      lock[name] = buildLockEntry(
        manifest,
        detection,
        desiredEntry.mode,
        desiredEntry.channel,
        { ...result, version },
        lock[name] || {},
        lock[name]?.artifacts_hash || '',
      );
      console.log(JSON.stringify({ provider: name, result, detection, version }, null, 2));
      if (!result.ok) hadError = true;
    }

    saveLockFile(lock);
    if (hadError) process.exit(1);
    return;
  }

  if (command === 'import') {
    const names = flags.provider ? [flags.provider] : flags.all ? Object.keys(registry) : [];
    if (names.length === 0) {
      console.error('Specify --provider <name> or --all');
      process.exit(1);
    }

    let hadError = false;
    for (const name of names) {
      const registryEntry = registry[name];
      if (!registryEntry?.manifest) {
        console.error(`Unknown provider: ${name}`);
        hadError = true;
        continue;
      }

      try {
        const summary = importProviderArtifacts(name, registryEntry.importMap || { mappings: [] });
        const runtime = providerRuntime(name, registryEntry.manifest);
        const detection = detectProvider(registryEntry.manifest, runtime);
        const desiredEntry = desiredByName.get(name) || {
          mode: 'detect-import',
          channel: registryEntry.manifest.channel_default || 'latest',
        };
        lock[name] = buildLockEntry(
          registryEntry.manifest,
          detection,
          desiredEntry.mode,
          desiredEntry.channel,
          {
            ok: true,
            code: 0,
            dryRun: false,
            action: 'import',
            status: 'imported',
            command: `import:${name}`,
            stdout: JSON.stringify(summary),
            version: lock[name]?.resolved_version || 'import-only',
          },
          lock[name] || {},
          summary.artifacts_hash,
        );
        console.log(JSON.stringify(summary, null, 2));
      } catch (error) {
        const runtime = providerRuntime(name, registryEntry.manifest);
        const detection = detectProvider(registryEntry.manifest, runtime);
        const desiredEntry = desiredByName.get(name) || {
          mode: 'detect-import',
          channel: registryEntry.manifest.channel_default || 'latest',
        };
        lock[name] = buildLockEntry(
          registryEntry.manifest,
          detection,
          desiredEntry.mode,
          desiredEntry.channel,
          {
            ok: false,
            code: 1,
            dryRun: false,
            action: 'import',
            status: 'failed',
            command: `import:${name}`,
            stderr: error?.stack || String(error),
          },
          lock[name] || {},
          lock[name]?.artifacts_hash || '',
        );
        console.error(error);
        hadError = true;
      }
    }

    saveLockFile(lock);
    if (hadError) process.exit(1);
    return;
  }

  printHelp();
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
