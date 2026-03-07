#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = process.cwd();
const MB = '.memory-bank';
const SHARED_DIR = path.resolve(__dirname, '..');
const REFERENCES_DIR = path.join(SHARED_DIR, 'references');
const SCRIPTS_DIR = __dirname;
const COMMAND_TEMPLATES_DIR = path.join(REFERENCES_DIR, 'commands');
const FLAT_COMMAND_PREFIX = 'shared-commands-';
const FLAT_PREFIX = 'shared-';
const RAW_ARGS = process.argv.slice(2);
const ARGS = new Set(RAW_ARGS);
function readOption(name) {
  const exact = `--${name}`;
  const prefix = `--${name}=`;
  for (let i = 0; i < RAW_ARGS.length; i += 1) {
    const arg = RAW_ARGS[i];
    if (arg === exact) {
      const next = RAW_ARGS[i + 1];
      if (!next || next.startsWith('--')) return '';
      return next;
    }
    if (arg.startsWith(prefix)) return arg.slice(prefix.length);
  }
  return null;
}
function hasFlag(name) {
  const exact = `--${name}`;
  return RAW_ARGS.includes(exact) || RAW_ARGS.some((arg) => arg.startsWith(`${exact}=`));
}
const SYNC_MODE = hasFlag('sync') || hasFlag('force');
const PRESET_OPTION = readOption('preset');
const STACK_OPTION = readOption('stack');
const COMMANDS_OPTION = readOption('commands');
const PROVIDERS_OPTION = readOption('providers');
const PROVIDER_MODE_OPTION = readOption('provider-mode');
const PROVIDER_CHANNEL_OPTION = readOption('provider-channel');
const SYNC_SCOPE = readOption('sync-scope') || 'all';
const LIST_PRESETS = hasFlag('list-presets');
const LIST_COMMANDS = hasFlag('list-commands');
const DOCTOR_MODE = hasFlag('doctor');
const MIGRATE_V2 = hasFlag('migrate-v2');
const DEFAULT_POLICIES = {
  sync: {
    curated: 'protect',
    generated: 'replace',
    derived: 'rebuild',
    runtime: 'append',
  },
  promotion: {
    mode: 'review',
  },
  context: {
    max_active_blocks: 5,
    max_block_bytes: 16000,
  },
};
const STACKS = {
  core: {
    repo_mode: 'core',
    stack: 'core',
    providers: {
      prd: { name: 'native' },
      spec: { name: 'native' },
      execute: { name: 'native' },
      verify: { name: 'native' },
      tasks: { name: 'none' },
      recall: { name: 'native' },
    },
  },
  fast: {
    repo_mode: 'mixed',
    stack: 'fast',
    providers: {
      prd: { name: 'native' },
      spec: { name: 'native' },
      execute: { name: 'gsd', mode: 'managed', channel: 'latest' },
      verify: { name: 'native' },
      tasks: { name: 'none' },
      recall: { name: 'native' },
    },
  },
  'greenfield-lite': {
    repo_mode: 'greenfield',
    stack: 'greenfield-lite',
    providers: {
      prd: { name: 'native' },
      spec: { name: 'native' },
      execute: { name: 'gsd', mode: 'managed', channel: 'latest' },
      verify: { name: 'native' },
      tasks: { name: 'none' },
      recall: { name: 'native' },
    },
  },
  'greenfield-standard': {
    repo_mode: 'greenfield',
    stack: 'greenfield-standard',
    providers: {
      prd: { name: 'bmad', mode: 'managed', channel: 'latest' },
      spec: { name: 'native' },
      execute: { name: 'gsd', mode: 'managed', channel: 'latest' },
      verify: { name: 'native' },
      tasks: { name: 'none' },
      recall: { name: 'native' },
    },
  },
  'greenfield-heavy': {
    repo_mode: 'greenfield',
    stack: 'greenfield-heavy',
    providers: {
      prd: { name: 'bmad', mode: 'managed', channel: 'latest' },
      spec: { name: 'native' },
      execute: { name: 'gsd', mode: 'managed', channel: 'latest' },
      verify: { name: 'tea', mode: 'managed', channel: 'latest' },
      tasks: { name: 'taskmaster', mode: 'managed', channel: 'latest', profile: 'core' },
      recall: { name: 'native' },
    },
  },
  'brownfield-lite': {
    repo_mode: 'brownfield',
    stack: 'brownfield-lite',
    providers: {
      prd: { name: 'native' },
      spec: { name: 'native' },
      execute: { name: 'gsd', mode: 'managed', channel: 'latest' },
      verify: { name: 'native' },
      tasks: { name: 'none' },
      recall: { name: 'native' },
    },
  },
  'brownfield-standard': {
    repo_mode: 'brownfield',
    stack: 'brownfield-standard',
    providers: {
      prd: { name: 'native' },
      spec: { name: 'openspec', mode: 'detect-import', channel: 'latest', profile: 'core' },
      execute: { name: 'gsd', mode: 'managed', channel: 'latest' },
      verify: { name: 'native' },
      tasks: { name: 'none' },
      recall: { name: 'native' },
    },
  },
  'brownfield-heavy': {
    repo_mode: 'brownfield',
    stack: 'brownfield-heavy',
    providers: {
      prd: { name: 'bmad', mode: 'managed', channel: 'latest' },
      spec: { name: 'openspec', mode: 'detect-import', channel: 'latest', profile: 'core' },
      execute: { name: 'gsd', mode: 'managed', channel: 'latest' },
      verify: { name: 'tea', mode: 'managed', channel: 'latest' },
      tasks: { name: 'none' },
      recall: { name: 'native' },
    },
  },
  'execution-only': {
    repo_mode: 'execution',
    stack: 'execution-only',
    providers: {
      prd: { name: 'native' },
      spec: { name: 'native' },
      execute: { name: 'gsd', mode: 'managed', channel: 'latest' },
      verify: { name: 'native' },
      tasks: { name: 'none' },
      recall: { name: 'native' },
    },
  },
  autonomous: {
    repo_mode: 'mixed',
    stack: 'autonomous',
    providers: {
      prd: { name: 'bmad', mode: 'managed', channel: 'latest' },
      spec: { name: 'openspec', mode: 'detect-import', channel: 'latest', profile: 'core' },
      execute: { name: 'gsd', mode: 'managed', channel: 'latest' },
      verify: { name: 'tea', mode: 'managed', channel: 'latest' },
      tasks: { name: 'taskmaster', mode: 'managed', channel: 'latest', profile: 'core' },
      recall: { name: 'native' },
    },
  },
  'experimental-github': {
    repo_mode: 'greenfield',
    stack: 'experimental-github',
    providers: {
      prd: { name: 'native' },
      spec: { name: 'speckit', mode: 'detect-import', channel: 'latest' },
      execute: { name: 'native' },
      verify: { name: 'native' },
      tasks: { name: 'none' },
      recall: { name: 'native' },
    },
  },
};
const PRESET_ALIASES = {
  greenfield: 'greenfield-standard',
  brownfield: 'brownfield-standard',
  execution: 'execution-only',
};
if (ARGS.has('--help') || ARGS.has('-h')) {
  console.log(`
init-mb.js — initialize Memory Bank v2 skeleton
Usage:
  node init-mb.js --preset greenfield-standard
  node init-mb.js --preset fast
  node init-mb.js --stack brownfield-standard --commands mb,map-codebase,execute,verify,review,mb-sync
  node init-mb.js --sync --preset brownfield-standard
  node init-mb.js --sync --sync-scope generated
  node init-mb.js --doctor
  node init-mb.js --migrate-v2
  node init-mb.js --list-presets
  node init-mb.js --list-commands
`.trim());
  process.exit(0);
}
function ensureDir(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    console.log(`  + ${rel}/`);
  }
}
function shouldOverwrite(className) {
  if (!SYNC_MODE) return false;
  if (className === 'curated' || className === 'runtime') return false;
  if (SYNC_SCOPE === 'all') return true;
  if (SYNC_SCOPE === 'generated') return className === 'generated' || className === 'system' || className === 'provider';
  if (SYNC_SCOPE === 'providers') return className === 'provider' || className === 'system';
  if (SYNC_SCOPE === 'derived') return className === 'derived';
  if (SYNC_SCOPE === 'core') return className === 'system' || className === 'generated';
  return false;
}
function writeFile(rel, content, { className = 'curated' } = {}) {
  const p = path.join(ROOT, rel);
  const existed = fs.existsSync(p);
  const overwrite = !existed || shouldOverwrite(className);
  if (!overwrite) return;
  ensureDir(path.dirname(rel));
  fs.writeFileSync(p, content, 'utf8');
  console.log(`  ${existed ? '~' : '+'} ${rel}${existed ? ' (updated)' : ''}`);
}
function readUtf8(absPath) {
  return fs.readFileSync(absPath, 'utf8');
}
function listMarkdownFiles(absDir) {
  return fs.readdirSync(absDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));
}
function parseCsvList(value) {
  if (!value) return [];
  const seen = new Set();
  return value.split(',').map((item) => item.trim()).filter(Boolean).filter((item) => {
    if (seen.has(item)) return false;
    seen.add(item);
    return true;
  });
}
function parseKeyValueCsv(value) {
  const out = {};
  for (const item of parseCsvList(value)) {
    const [key, v] = item.split('=');
    if (key && v) out[key.trim()] = v.trim();
  }
  return out;
}
function resolveReferencePath(relPath) {
  const nested = path.join(REFERENCES_DIR, relPath);
  if (fs.existsSync(nested)) return nested;
  const flattened = path.join(REFERENCES_DIR, `${FLAT_PREFIX}${relPath.replace(/[\\/]/g, '-')}`);
  if (fs.existsSync(flattened)) return flattened;
  return null;
}
function resolveCommandTemplates() {
  if (fs.existsSync(COMMAND_TEMPLATES_DIR)) {
    return listMarkdownFiles(COMMAND_TEMPLATES_DIR).map((filename) => ({
      name: filename.replace(/\.md$/i, ''),
      absPath: path.join(COMMAND_TEMPLATES_DIR, filename),
      filename,
    }));
  }
  if (!fs.existsSync(REFERENCES_DIR)) return [];
  return listMarkdownFiles(REFERENCES_DIR)
    .filter((filename) => filename.startsWith(FLAT_COMMAND_PREFIX))
    .map((filename) => ({
      name: filename.replace(new RegExp(`^${FLAT_COMMAND_PREFIX}`), '').replace(/\.md$/i, ''),
      absPath: path.join(REFERENCES_DIR, filename),
      filename: filename.replace(new RegExp(`^${FLAT_COMMAND_PREFIX}`), ''),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
function buildCommandPresets(allCommandNames) {
  const preset = (names) => names.filter((name) => allCommandNames.includes(name));
  return {
    all: [...allCommandNames],
    core: preset(['mb', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'mb-update', 'review', 'mb-sync', 'find-skills']),
    fast: preset(['mb', 'fast-track', 'execute', 'verify', 'review', 'mb-sync', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'find-skills']),
    'greenfield-lite': preset(['cold-start', 'mb', 'prd', 'prd-to-tasks', 'execute', 'verify', 'review', 'mb-sync', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'mb-update', 'fast-track', 'find-skills']),
    'greenfield-standard': preset(['cold-start', 'mb', 'prd', 'prd-to-tasks', 'discuss', 'execute', 'verify', 'review', 'mb-sync', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'mb-update', 'fast-track', 'find-skills']),
    'greenfield-heavy': preset(['cold-start', 'mb', 'prd', 'prd-to-tasks', 'discuss', 'execute', 'verify', 'review', 'add-tests', 'mb-sync', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'mb-update', 'autopilot', 'autonomous', 'fast-track', 'find-skills']),
    'brownfield-lite': preset(['cold-start', 'mb', 'map-codebase', 'execute', 'verify', 'review', 'mb-sync', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'mb-update', 'fast-track', 'find-skills']),
    'brownfield-standard': preset(['cold-start', 'mb', 'map-codebase', 'discuss', 'execute', 'verify', 'review', 'mb-sync', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'mb-update', 'fast-track', 'find-skills']),
    'brownfield-heavy': preset(['cold-start', 'mb', 'map-codebase', 'prd', 'prd-to-tasks', 'discuss', 'execute', 'verify', 'review', 'add-tests', 'mb-sync', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'mb-update', 'autopilot', 'autonomous', 'fast-track', 'find-skills']),
    'execution-only': preset(['mb', 'execute', 'verify', 'add-tests', 'review', 'mb-sync', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'mb-update', 'discuss', 'fast-track']),
    autonomous: preset(['cold-start', 'mb', 'prd', 'prd-to-tasks', 'map-codebase', 'execute', 'verify', 'review', 'autopilot', 'autonomous', 'mb-sync', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'mb-update', 'fast-track', 'find-skills']),
    'experimental-github': preset(['cold-start', 'mb', 'prd', 'execute', 'verify', 'review', 'mb-sync', 'mb-status', 'mb-resume', 'mb-checkpoint', 'mb-handoff', 'mb-doctor', 'mb-update', 'find-skills']),
  };
}
function printSelectionHelp(allCommandNames, presets) {
  if (LIST_COMMANDS) {
    console.log('Available commands:');
    allCommandNames.forEach((name) => console.log(`- ${name}`));
  }
  if (LIST_PRESETS) {
    console.log('Available presets:');
    Object.entries(presets).forEach(([name, commands]) => {
      console.log(`- ${name}: ${commands.join(', ')}`);
    });
  }
  process.exit(0);
}
function normalizePresetName(name) {
  if (!name) return null;
  return PRESET_ALIASES[name] || name;
}
function resolveSelection(templates) {
  const allCommandNames = templates.map((template) => template.name);
  const presets = buildCommandPresets(allCommandNames);
  if (LIST_COMMANDS || LIST_PRESETS) {
    printSelectionHelp(allCommandNames, presets);
  }
  let selectedNames = presets.all;
  let selectionLabel = 'all';
  const normalizedPreset = normalizePresetName(PRESET_OPTION);
  if (COMMANDS_OPTION) {
    selectedNames = parseCsvList(COMMANDS_OPTION);
    selectionLabel = normalizedPreset || `custom:${selectedNames.join(',')}`;
  } else if (normalizedPreset) {
    if (!Object.prototype.hasOwnProperty.call(presets, normalizedPreset)) {
      console.error(`Unknown preset: ${PRESET_OPTION}`);
      console.error(`Available presets: ${Object.keys(presets).join(', ')}`);
      process.exit(1);
    }
    selectedNames = presets[normalizedPreset];
    selectionLabel = normalizedPreset;
  }
  const invalid = selectedNames.filter((name) => !allCommandNames.includes(name));
  if (invalid.length > 0) {
    console.error(`Unknown command(s): ${invalid.join(', ')}`);
    console.error(`Available commands: ${allCommandNames.join(', ')}`);
    process.exit(1);
  }
  const byName = new Map(templates.map((template) => [template.name, template]));
  return {
    allCommandNames,
    selectedNames,
    selectedTemplates: selectedNames.map((name) => byName.get(name)),
    selectionLabel,
  };
}
function extractFrontmatterDescription(markdown) {
  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!fm) return null;
  const m = fm[1].match(/^description:\s*(.*)\s*$/m);
  if (!m) return null;
  return m[1].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
}
function yamlQuote(value) {
  const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}
function removePathIfExists(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return;
  fs.rmSync(abs, { recursive: true, force: true });
  console.log(`  - ${rel}`);
}
function syncDeselectedArtifacts(allCommandNames, selectedNames) {
  if (!SYNC_MODE || !['all', 'generated', 'core'].includes(SYNC_SCOPE)) return;
  const selected = new Set(selectedNames);
  allCommandNames.filter((name) => !selected.has(name)).forEach((name) => {
    removePathIfExists(`${MB}/commands/${name}.md`);
    removePathIfExists(`.claude/skills/${name}`);
    removePathIfExists(`.agents/skills/${name}`);
  });
}
function generateCommandsIndex(commandMetas) {
  const lines = ['---', 'description: Router for project command specs.', 'status: active', '---', '# Commands', ''];
  commandMetas.forEach(({ name, desc }) => lines.push(`- [.memory-bank/commands/${name}.md](${name}.md): ${desc}`));
  lines.push('');
  return lines.join('\n');
}
function mergeProviderOverrides(baseProviders) {
  const providers = JSON.parse(JSON.stringify(baseProviders || {}));
  const roleToName = parseKeyValueCsv(PROVIDERS_OPTION);
  const nameToMode = parseKeyValueCsv(PROVIDER_MODE_OPTION);
  const nameToChannel = parseKeyValueCsv(PROVIDER_CHANNEL_OPTION);
  Object.entries(roleToName).forEach(([role, name]) => {
    providers[role] = providers[role] || {};
    providers[role].name = name;
  });
  Object.values(providers).forEach((provider) => {
    if (!provider || !provider.name) return;
    if (nameToMode[provider.name]) provider.mode = nameToMode[provider.name];
    if (nameToChannel[provider.name]) provider.channel = nameToChannel[provider.name];
  });
  return providers;
}
function resolveStack(selectionLabel) {
  const requested = STACK_OPTION || normalizePresetName(PRESET_OPTION) || (Object.prototype.hasOwnProperty.call(STACKS, selectionLabel) ? selectionLabel : null) || 'core';
  const normalized = normalizePresetName(requested) || 'core';
  if (!Object.prototype.hasOwnProperty.call(STACKS, normalized)) {
    console.error(`Unknown stack: ${normalized}`);
    console.error(`Available stacks: ${Object.keys(STACKS).join(', ')}`);
    process.exit(1);
  }
  const stack = JSON.parse(JSON.stringify(STACKS[normalized]));
  stack.providers = mergeProviderOverrides(stack.providers);
  stack.policies = DEFAULT_POLICIES;
  return stack;
}
function copyReferenceFile(referenceRel, targetRel, className) {
  const source = resolveReferencePath(referenceRel);
  if (!source) {
    console.error(`Missing reference template: ${referenceRel}`);
    process.exit(1);
  }
  writeFile(targetRel, readUtf8(source), { className });
}
function seedCommandsFromTemplates(selection) {
  syncDeselectedArtifacts(selection.allCommandNames, selection.selectedNames);
  const metas = [];
  selection.selectedTemplates.forEach(({ filename, absPath, name }) => {
    const content = readUtf8(absPath);
    const desc = extractFrontmatterDescription(content) || `/${name}`;
    writeFile(`${MB}/commands/${filename}`, content, { className: 'generated' });
    metas.push({ name, desc });
  });
  writeFile(`${MB}/commands/index.md`, generateCommandsIndex(metas), { className: 'generated' });
  return metas;
}
function generateEntryPoints(commandMetas) {
  return commandMetas.map(({ name, desc }) => `- /${name} → .memory-bank/commands/${name}.md (${desc})`).join('\n');
}
function generateAgentsGuide(commandMetas, selectionLabel, stack) {
  return `# Agent Operating Guide (Project Map)
## Prime before work
1. Read \`.memory-bank/system/memobank.yaml\`
2. Read \`.memory-bank/index.md\`
3. Read \`.memory-bank/mbb/index.md\`
4. If continuing prior work, run \`/mb-resume\` before coding
## Durable vs runtime vs protocol memory
- Durable knowledge: \`.memory-bank/\`
- Runtime state: \`.tasks/RUN-*\`
- Inter-agent contracts: \`.protocols/\`
- Derived recall: \`.memory-bank/indexes/\`
## Command profile
- Enabled command profile: \`${selectionLabel}\`
- Stack: \`${stack.stack}\`
- Repo mode: \`${stack.repo_mode}\`
## Fast lane
Use \`/fast-track\` only for small bounded changes.
In Codex, built-in \`/fast\` is allowed during implementation, not during deep design or verification.
## Provider policy
- External frameworks are adapters, not SSOT.
- Canonical truth remains in \`.memory-bank/\`.
- Updates happen only via \`/mb-update\`.
## Helper tools
- \`node .memory-bank/tools/mb-run.mjs status\`
- \`node .memory-bank/tools/mb-run.mjs resume\`
- \`node .memory-bank/tools/mb-index.mjs\`
- \`node .memory-bank/tools/mb-condense.mjs\`
- \`node .memory-bank/tools/provider-manager.mjs status\`
- \`node .memory-bank/tools/mb-doctor.mjs --strict\`
## Clean context (recommended)
- Open a new run for meaningful work.
- Use checkpoints instead of mutating curated docs mid-flight.
- Handoffs must go through \`.protocols/handoffs/\`.
## Enabled entry points
${generateEntryPoints(commandMetas)}
`;
}
function generateSkillsRegistry(commandMetas, selectionLabel, stack) {
  const lines = ['---', 'description: Registry of project commands and stack state.', 'status: active', '---', '# Skills', '', '## Setup', '- public package skill: `memobank`', `- selected command profile: \`${selectionLabel}\``, `- stack: \`${stack.stack}\``, '', '## Enabled project commands'];
  commandMetas.forEach(({ name, desc }) => lines.push(`- \`/${name}\` — ${desc}`));
  lines.push('');
  return lines.join('\n');
}
function symlinkOrCopy(target, linkName) {
  const linkPath = path.join(ROOT, linkName);
  if (fs.existsSync(linkPath)) return;
  try {
    fs.symlinkSync(target, linkPath);
    console.log(`  ~ ${linkName} -> ${target}`);
  } catch {
    const targetPath = path.join(ROOT, target);
    if (fs.existsSync(targetPath)) {
      fs.writeFileSync(linkPath, fs.readFileSync(targetPath, 'utf8'));
      console.log(`  + ${linkName} (copy, symlink failed)`);
    }
  }
}
function createSystemManifests(stack, selection, commandMetas) {
  const providersLock = {};
  Object.values(stack.providers || {}).forEach((provider) => {
    if (!provider || !provider.name || provider.name === 'native' || provider.name === 'none') return;
    providersLock[provider.name] = providersLock[provider.name] || {
      requested_channel: provider.channel || 'latest',
      resolved_version: `pending:${provider.channel || 'latest'}`,
      mode: provider.mode || 'pattern-only',
      installed_at: null,
      importer_version: 'mb-v2',
      artifacts_hash: '',
      status: 'pending',
      last_action: null,
      last_command: null,
      last_result_code: null,
      last_error: null,
      last_stdout_excerpt: '',
      detection: {
        binary_ok: false,
        binary_hits: [],
        path_hits: [],
        init_hits: [],
        initialized: false,
        detected: false,
      },
    };
  });
  writeFile(`${MB}/system/memobank.yaml`, `${JSON.stringify({
    schema_version: 2,
    repo_mode: stack.repo_mode,
    stack: stack.stack,
    providers: stack.providers,
    policies: stack.policies,
  }, null, 2)}\n`, { className: 'system' });
  writeFile(`${MB}/system/providers.lock.json`, `${JSON.stringify(providersLock, null, 2)}\n`, { className: 'system' });
  writeFile(`${MB}/system/commands.manifest.json`, `${JSON.stringify({
    schema_version: 2,
    selection: {
      label: selection.selectionLabel,
      commands: selection.selectedNames,
    },
    commands: commandMetas,
    generated_at: new Date().toISOString(),
  }, null, 2)}\n`, { className: 'system' });
  writeFile(`${MB}/system/sync-state.json`, `${JSON.stringify({
    schema_version: 2,
    classes: stack.policies.sync,
    generated_at: new Date().toISOString(),
    sync_scope: SYNC_SCOPE,
  }, null, 2)}\n`, { className: 'system' });
  ['feature.schema.json', 'run-event.schema.json', 'handoff.schema.json', 'provider-lock.schema.json'].forEach((name) => {
    copyReferenceFile(`schemas/${name}`, `${MB}/system/schemas/${name}`, 'system');
  });
  const providers = ['bmad', 'tea', 'gsd', 'openspec', 'taskmaster', 'speckit'];
  providers.forEach((provider) => {
    copyReferenceFile(`providers/${provider}/manifest.yaml`, `${MB}/system/provider-registry/${provider}/manifest.yaml`, 'provider');
    copyReferenceFile(`providers/${provider}/import-map.yaml`, `${MB}/system/provider-registry/${provider}/import-map.yaml`, 'provider');
    copyReferenceFile(`providers/${provider}/install.md`, `${MB}/system/provider-registry/${provider}/install.md`, 'provider');
  });
}
function seedCoreDocs(commandMetas, selection, stack) {
  writeFile('AGENTS.md', generateAgentsGuide(commandMetas, selection.selectionLabel, stack), { className: 'generated' });
  writeFile(`${MB}/index.md`, `---
description: Main table of contents for memobank v2.
status: active
---
# Memory Bank Index
## System
- [.memory-bank/system/memobank.yaml](system/memobank.yaml): desired state and provider routing
- [.memory-bank/system/providers.lock.json](system/providers.lock.json): resolved provider state
- [.memory-bank/system/commands.manifest.json](system/commands.manifest.json): generated command profile
## Durable memory
- [.memory-bank/product/brief.md](product/brief.md): product brief
- [.memory-bank/product/prd.md](product/prd.md): PRD / change intent
- [.memory-bank/product/requirements.md](product/requirements.md): requirements + RTM
- [.memory-bank/product/features.json](product/features.json): machine-readable feature contract
- [.memory-bank/architecture/project-context.md](architecture/project-context.md): always-load project context
- [.memory-bank/architecture/as-is.md](architecture/as-is.md): current state for brownfield
- [.memory-bank/architecture/to-be.md](architecture/to-be.md): intended architecture
- [.memory-bank/knowledge/](knowledge/): facts, decisions, assumptions, evidence, open questions
- [.memory-bank/tasks/backlog.md](tasks/backlog.md): canonical backlog
## Runtime and protocol memory
- [.tasks/](../.tasks/): run store
- [.protocols/](../.protocols/): claims, handoffs, verifications, stamps
## Derived
- [.memory-bank/indexes/](indexes/): rebuildable recall indexes
`, { className: 'curated' });
  writeFile(`${MB}/mbb/index.md`, `---
description: Memory Bank Bible — memobank v2 rules and invariants.
status: active
---
# Memory Bank Bible (MBB)
## Hard rules
1. Durable SSOT stays in \`.memory-bank/\`.
2. Runtime evidence stays in \`.tasks/RUN-*\`.
3. Handoffs and claims stay in \`.protocols/\`.
4. Derived indexes are disposable and rebuildable.
5. External providers never become canonical truth.
6. Curated docs require review before promotion.
7. Use active memory blocks, not full-bank loading.
8. Use checkpoints for long runs.
9. Use explicit \`/mb-update\` for upgrades.
10. Fast lane is allowed only for bounded changes.
`, { className: 'curated' });
  writeFile(`${MB}/product/brief.md`, `---
description: Product brief.
status: draft
---
# Product brief
## What this is
## Core value
## Audience
## Primary user flow
## Constraints
- Tech stack:
- Timeline:
- Non-goals:
`, { className: 'curated' });
  writeFile(`${MB}/product/prd.md`, `---
description: Canonical PRD / change intent.
status: draft
---
# PRD
## Problem
## Goals
## Scope
## Risks
## Open questions
`, { className: 'curated' });
  writeFile(`${MB}/product/requirements.md`, `---
description: Requirements and traceability matrix.
status: draft
---
# Requirements
## REQ list
- REQ-001 — TBD
## Traceability
| REQ | Feature | Tests | Lifecycle |
|---|---|---|---|
| REQ-001 | FT-001 | TBD | planned |
`, { className: 'curated' });
  writeFile(`${MB}/product/features.json`, `${JSON.stringify({
    features: [
      {
        id: 'FT-001',
        title: 'Placeholder feature',
        status: 'draft',
        reqs: ['REQ-001'],
        acceptance: ['Replace with accepted criteria.'],
        tests: ['Add deterministic tests.'],
      },
    ],
  }, null, 2)}\n`, { className: 'curated' });
  writeFile(`${MB}/architecture/project-context.md`, `---
description: Always-load project context.
status: draft
---
# Project context
## Architecture stance
## Constraints
## Conventions to preserve
## Preferred tools and patterns
`, { className: 'curated' });
  writeFile(`${MB}/architecture/as-is.md`, `---
description: Brownfield as-is view.
status: draft
---
# As-is architecture
## Current modules
## Current runtime boundaries
## Known constraints
`, { className: 'curated' });
  writeFile(`${MB}/architecture/to-be.md`, `---
description: Intended architecture and target state.
status: draft
---
# To-be architecture
## Desired modules
## Boundary changes
## Migration notes
`, { className: 'curated' });
  writeFile(`${MB}/knowledge/facts.md`, `---
description: Verified facts.
status: active
---
# Facts
- Add only evidence-backed facts.
`, { className: 'curated' });
  writeFile(`${MB}/knowledge/decisions.md`, `---
description: Accepted decisions.
status: active
---
# Decisions
- Add decisions with rationale and links.
`, { className: 'curated' });
  writeFile(`${MB}/knowledge/assumptions.md`, `---
description: Explicit assumptions.
status: active
---
# Assumptions
- Mark assumptions clearly and retire them when verified.
`, { className: 'curated' });
  writeFile(`${MB}/knowledge/evidence.md`, `---
description: Evidence pointers.
status: active
---
# Evidence
- Link to traces, tests, logs, screenshots, and reports.
`, { className: 'curated' });
  writeFile(`${MB}/knowledge/open-questions.md`, `---
description: Open questions and blockers.
status: active
---
# Open questions
- Capture unresolved questions explicitly.
`, { className: 'curated' });
  writeFile(`${MB}/tasks/backlog.md`, `---
description: Canonical backlog.
status: draft
---
# Backlog
## Task card template
### TASK-001 — short title
- Status: ready
- Wave: W1
- Feature: FT-001
- REQs: REQ-001
- Depends on: none
- Touched files: src/... , tests/...
- Tests: npm test -- ...
- Verify: deterministic steps
`, { className: 'curated' });
  writeFile(`${MB}/tasks/board.json`, `${JSON.stringify({ tasks: [] }, null, 2)}\n`, { className: 'curated' });
  writeFile(`${MB}/testing/index.md`, `---
description: Testing strategy and quality gates.
status: active
---
# Testing
- Prefer deterministic tests over subjective judgment.
- Store runtime evidence in \`.tasks/RUN-*\`.
`, { className: 'curated' });
  writeFile(`${MB}/workflows/mb-sync.md`, resolveReferencePath('workflows/mb-sync.md') ? readUtf8(resolveReferencePath('workflows/mb-sync.md')) : '# MB-SYNC\n', { className: 'curated' });
  copyReferenceFile('workflows/run-resume.md', `${MB}/workflows/run-resume.md`, 'curated');
  copyReferenceFile('workflows/provider-lifecycle.md', `${MB}/workflows/provider-lifecycle.md`, 'curated');
  copyReferenceFile('workflows/fast-lane.md', `${MB}/workflows/fast-lane.md`, 'curated');
  writeFile(`${MB}/skills/index.md`, generateSkillsRegistry(commandMetas, selection.selectionLabel, stack), { className: 'generated' });
  writeFile(`${MB}/changelog.md`, `---
description: Memory Bank changelog.
status: active
---
# Changelog
## [${new Date().toISOString().slice(0, 10)}] memobank v2 setup
- Initialized system manifests
- Created durable/runtime/protocol layout
- Generated command profile: ${selection.selectionLabel}
`, { className: 'curated' });
  writeFile(`${MB}/product.md`, `---
description: Compatibility router to product layer.
status: active
---
# Product router
See:
- [.memory-bank/product/brief.md](product/brief.md)
- [.memory-bank/product/prd.md](product/prd.md)
- [.memory-bank/product/features.json](product/features.json)
`, { className: 'generated' });
  writeFile(`${MB}/requirements.md`, `---
description: Compatibility router to requirements.
status: active
---
# Requirements router
See [.memory-bank/product/requirements.md](product/requirements.md)
`, { className: 'generated' });
}
function seedRuntimeAndProtocolTemplates() {
  writeFile('.tasks/README.md', '# Runtime artifacts\n\nUse `.tasks/RUN-*` for append-only runtime state.\n', { className: 'generated' });
  copyReferenceFile('templates/runtime/meta.json', '.tasks/templates/RUN-TEMPLATE/meta.json', 'generated');
  copyReferenceFile('templates/runtime/events.jsonl', '.tasks/templates/RUN-TEMPLATE/events.jsonl', 'generated');
  copyReferenceFile('templates/runtime/active-memory.json', '.tasks/templates/RUN-TEMPLATE/active-memory.json', 'generated');
  copyReferenceFile('templates/runtime/context-snapshot.md', '.tasks/templates/RUN-TEMPLATE/context-snapshot.md', 'generated');
  copyReferenceFile('templates/runtime/summary.md', '.tasks/templates/RUN-TEMPLATE/summary.md', 'generated');
  copyReferenceFile('templates/runtime/checkpoint.json', '.tasks/templates/RUN-TEMPLATE/checkpoints/CP-0001.json', 'generated');
  writeFile('.protocols/index.md', '# Protocol memory\n\nUse claims, handoffs, verifications, stamps, and contracts for inter-agent coordination.\n', { className: 'generated' });
  copyReferenceFile('templates/protocols/claim-template.yaml', '.protocols/templates/claims/template.yaml', 'generated');
  copyReferenceFile('templates/protocols/handoff-template.md', '.protocols/templates/handoffs/template.md', 'generated');
  copyReferenceFile('templates/protocols/verification-template.md', '.protocols/templates/verifications/template.md', 'generated');
  copyReferenceFile('templates/protocols/stamp-template.json', '.protocols/templates/stamps/template.json', 'generated');
}
function copyHelperScripts() {
  const files = fs.readdirSync(SCRIPTS_DIR, { withFileTypes: true }).filter((d) => d.isFile()).map((d) => d.name);
  files.forEach((filename) => {
    const normalized = filename.startsWith('shared-') ? filename.replace(/^shared-/, '') : filename;
    const targetName = normalized === 'init-mb.js' || normalized === 'shared-init-mb.js' ? 'init-mb.js' : normalized;
    const sourcePath = path.join(SCRIPTS_DIR, filename);
    const content = readUtf8(sourcePath);
    writeFile(`${MB}/tools/${targetName}`, content, { className: 'generated' });
  });
}
function generateCodexConfig() {
  const source = resolveReferencePath('templates/system/codex-config.toml');
  if (source) writeFile('.codex/config.toml', readUtf8(source), { className: 'generated' });
}
function generateNativeSkills(commandMetas) {
  const skillContent = (name, desc) => `---\nname: ${name}\ndescription: ${yamlQuote(desc)}\n---\n\nRead and follow the instructions in \`.memory-bank/commands/${name}.md\`\n`;
  commandMetas.forEach(({ name, desc }) => {
    ensureDir(`.claude/skills/${name}`);
    writeFile(`.claude/skills/${name}/SKILL.md`, skillContent(name, desc), { className: 'generated' });
    ensureDir(`.agents/skills/${name}`);
    writeFile(`.agents/skills/${name}/SKILL.md`, skillContent(name, desc), { className: 'generated' });
  });
}
function runDerivedBuilders() {
  if (!(SYNC_SCOPE === 'all' || SYNC_SCOPE === 'derived' || !SYNC_MODE)) return;
  const indexScript = path.join(ROOT, '.memory-bank', 'tools', 'mb-index.mjs');
  if (!fs.existsSync(indexScript)) return;
  const result = spawnSync(process.execPath, [indexScript], { cwd: ROOT, stdio: 'inherit' });
  if (result.status !== 0) {
    console.warn('! mb-index failed during init; you can rerun it manually later.');
  }
}
function maybeRunDoctor() {
  if (!DOCTOR_MODE) return;
  const doctorScript = path.join(ROOT, '.memory-bank', 'tools', 'mb-doctor.mjs');
  if (!fs.existsSync(doctorScript)) return;
  spawnSync(process.execPath, [doctorScript], { cwd: ROOT, stdio: 'inherit' });
}
function migrateLegacyDocs() {
  if (!MIGRATE_V2) return;
  const legacyProduct = path.join(ROOT, '.memory-bank', 'product.md');
  const legacyReq = path.join(ROOT, '.memory-bank', 'requirements.md');
  if (fs.existsSync(legacyProduct)) {
    fs.writeFileSync(path.join(ROOT, '.memory-bank', 'product', 'brief.md'), readUtf8(legacyProduct), 'utf8');
    console.log('  ~ migrated legacy .memory-bank/product.md -> .memory-bank/product/brief.md');
  }
  if (fs.existsSync(legacyReq)) {
    fs.writeFileSync(path.join(ROOT, '.memory-bank', 'product', 'requirements.md'), readUtf8(legacyReq), 'utf8');
    console.log('  ~ migrated legacy .memory-bank/requirements.md -> .memory-bank/product/requirements.md');
  }
  const legacyProtocolDirs = fs.existsSync(path.join(ROOT, '.protocols'))
    ? fs.readdirSync(path.join(ROOT, '.protocols'), { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .filter((name) => !['claims', 'handoffs', 'verifications', 'stamps', 'contracts', 'templates'].includes(name))
    : [];
  if (legacyProtocolDirs.length > 0) {
    const report = ['# Legacy protocol directories', '', ...legacyProtocolDirs.map((name) => `- ${name}`), ''].join('\n');
    fs.writeFileSync(path.join(ROOT, '.protocols', 'contracts', 'legacy-protocols.md'), report, 'utf8');
    console.log('  ~ captured legacy protocol directories in .protocols/contracts/legacy-protocols.md');
  }
}
console.log('\n[1/7] Creating directories...');
[
  MB,
  `${MB}/system`,
  `${MB}/system/schemas`,
  `${MB}/system/provider-imports`,
  `${MB}/system/provider-registry`,
  `${MB}/product`,
  `${MB}/architecture`,
  `${MB}/architecture/adrs`,
  `${MB}/knowledge`,
  `${MB}/tasks`,
  `${MB}/tasks/plans`,
  `${MB}/testing`,
  `${MB}/workflows`,
  `${MB}/skills`,
  `${MB}/commands`,
  `${MB}/indexes`,
  `${MB}/tools`,
  `${MB}/imports`,
  `${MB}/mbb`,
  `${MB}/epics`,
  `${MB}/features`,
  `${MB}/contracts`,
  `${MB}/runbooks`,
  `${MB}/guides`,
  `${MB}/archive`,
  `${MB}/bugs`,
  '.tasks',
  '.tasks/templates',
  '.tasks/templates/RUN-TEMPLATE',
  '.tasks/templates/RUN-TEMPLATE/checkpoints',
  '.tasks/templates/RUN-TEMPLATE/evidence',
  '.protocols',
  '.protocols/claims',
  '.protocols/handoffs',
  '.protocols/verifications',
  '.protocols/stamps',
  '.protocols/contracts',
  '.protocols/templates',
  '.protocols/templates/claims',
  '.protocols/templates/handoffs',
  '.protocols/templates/verifications',
  '.protocols/templates/stamps',
  '.claude',
  '.claude/skills',
  '.agents',
  '.agents/skills',
  '.codex',
].forEach(ensureDir);
console.log('\n[2/7] Resolving command templates...');
const templates = resolveCommandTemplates();
if (templates.length === 0) {
  console.error('ERROR: command templates not found.');
  process.exit(1);
}
const selection = resolveSelection(templates);
const stack = resolveStack(selection.selectionLabel);
const commandMetas = seedCommandsFromTemplates(selection);
console.log('\n[3/7] Writing system manifests...');
createSystemManifests(stack, selection, commandMetas);
console.log('\n[4/7] Writing durable memory docs...');
seedCoreDocs(commandMetas, selection, stack);
migrateLegacyDocs();
console.log('\n[5/7] Writing runtime and protocol templates...');
seedRuntimeAndProtocolTemplates();
console.log('\n[6/7] Copying helper tools and runtime configs...');
copyHelperScripts();
generateCodexConfig();
symlinkOrCopy('AGENTS.md', 'CLAUDE.md');
symlinkOrCopy('AGENTS.md', 'GEMINI.md');
console.log('\n[7/7] Creating native skills and derived indexes...');
generateNativeSkills(commandMetas);
runDerivedBuilders();
maybeRunDoctor();
console.log('\n[Done] memobank v2 initialized.');
console.log(`- root: ${ROOT}`);
console.log(`- stack: ${stack.stack}`);
console.log(`- command profile: ${selection.selectionLabel}`);
