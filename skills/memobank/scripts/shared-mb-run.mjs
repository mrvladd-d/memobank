#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  nowIso,
  ensureDir,
  readText,
  writeText,
  readJson,
  writeJson,
  appendJsonl,
  listDirs,
  nextNumericId,
  resolveCurrentRunId,
  writeCurrentRunId,
  loadSystemConfig,
  shortExcerpt,
  statMtime,
} from './mb-lib.mjs';

const TASKS_DIR = path.join(ROOT, '.tasks');
const PROTOCOLS_DIR = path.join(ROOT, '.protocols');

function parseCli(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positional.push(arg);
      continue;
    }
    const [k, v] = arg.slice(2).split('=', 2);
    if (v !== undefined) {
      flags[k] = v;
    } else {
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        flags[k] = next;
        i += 1;
      } else {
        flags[k] = true;
      }
    }
  }
  return { positional, flags };
}

function existingRuns() {
  return listDirs(TASKS_DIR).filter((name) => /^RUN-\d+$/.test(name)).sort();
}

function currentRunId() {
  return resolveCurrentRunId() || existingRuns().at(-1) || null;
}

function runPaths(runId) {
  const base = path.join(TASKS_DIR, runId);
  return {
    base,
    meta: path.join(base, 'meta.json'),
    events: path.join(base, 'events.jsonl'),
    summary: path.join(base, 'summary.md'),
    snapshot: path.join(base, 'context-snapshot.md'),
    active: path.join(base, 'active-memory.json'),
    checkpoints: path.join(base, 'checkpoints'),
    evidence: path.join(base, 'evidence'),
  };
}

function appendEvent(runId, type, payload = {}) {
  appendJsonl(path.join(TASKS_DIR, runId, 'events.jsonl'), {
    ts: nowIso(),
    run_id: runId,
    type,
    payload,
  });
}

function openRun(flags) {
  const config = loadSystemConfig();
  let runId = flags.run || currentRunId();
  if (!runId || flags.new) {
    runId = nextNumericId(existingRuns(), 'RUN');
  }
  const paths = runPaths(runId);
  ensureDir(paths.base);
  ensureDir(paths.checkpoints);
  ensureDir(paths.evidence);

  const meta = readJson(paths.meta, {
    run_id: runId,
    status: 'active',
    created_at: nowIso(),
    task_id: null,
    feature_id: null,
    agent_id: flags.agent || 'orchestrator',
    stack: config.stack || 'core',
  });
  if (flags.task) meta.task_id = flags.task;
  if (flags.feature) meta.feature_id = flags.feature;
  meta.last_opened_at = nowIso();
  meta.status = 'active';
  writeJson(paths.meta, meta);

  if (!fs.existsSync(paths.events)) writeText(paths.events, '');
  if (!fs.existsSync(paths.summary)) writeText(paths.summary, '# Run summary\n\n');
  if (!fs.existsSync(paths.snapshot)) writeText(paths.snapshot, '# Context snapshot\n\n');
  if (!fs.existsSync(paths.active)) writeJson(paths.active, { blocks: [] });

  writeCurrentRunId(runId);
  appendEvent(runId, 'run_opened', { task_id: meta.task_id, feature_id: meta.feature_id, agent_id: meta.agent_id });
  return { run_id: runId, meta };
}

function readLatestFile(dir, regex) {
  if (!fs.existsSync(dir)) return null;
  const matches = fs.readdirSync(dir).filter((name) => regex.test(name)).sort();
  return matches.length ? path.join(dir, matches.at(-1)) : null;
}

function buildActiveBlocks(runId) {
  const config = loadSystemConfig();
  const contextPolicy = config?.policies?.context || {};
  const maxBlocks = Number(contextPolicy.max_active_blocks || 5);
  const maxBlockBytes = Number(contextPolicy.max_block_bytes || 16000);
  const candidates = [
    '.memory-bank/architecture/project-context.md',
    '.memory-bank/product/features.json',
    '.memory-bank/product/requirements.md',
    '.memory-bank/knowledge/decisions.md',
    '.memory-bank/knowledge/open-questions.md',
  ];

  const latestHandoff = readLatestFile(path.join(PROTOCOLS_DIR, 'handoffs'), /^HOF-\d+\.md$/);
  if (latestHandoff) candidates.push(path.relative(ROOT, latestHandoff).replace(/\\/g, '/'));

  const latestAdr = readLatestFile(path.join(ROOT, '.memory-bank/architecture/adrs'), /^ADR-\d+.*\.md$/)
    || readLatestFile(path.join(ROOT, '.memory-bank/adrs'), /^ADR-\d+.*\.md$/);
  if (latestAdr) candidates.push(path.relative(ROOT, latestAdr).replace(/\\/g, '/'));

  const latestSummary = path.join(TASKS_DIR, runId, 'summary.md');
  if (fs.existsSync(latestSummary)) candidates.push(path.relative(ROOT, latestSummary).replace(/\\/g, '/'));

  const deduped = [];
  for (const rel of candidates) {
    if (deduped.includes(rel)) continue;
    if (fs.existsSync(path.join(ROOT, rel))) deduped.push(rel);
  }

  return deduped.slice(0, maxBlocks).map((rel) => {
    const content = readText(rel, '');
    return {
      path: rel,
      bytes: Buffer.byteLength(content, 'utf8'),
      excerpt: shortExcerpt(content, maxBlockBytes),
      updated_at: statMtime(rel),
    };
  });
}

function resumeRun(flags) {
  const result = openRun(flags);
  const runId = result.run_id;
  const paths = runPaths(runId);
  const blocks = buildActiveBlocks(runId);
  writeJson(paths.active, { run_id: runId, generated_at: nowIso(), blocks });

  const lines = [];
  lines.push('# Context snapshot');
  lines.push('');
  lines.push(`- run_id: ${runId}`);
  lines.push(`- generated_at: ${nowIso()}`);
  lines.push('');
  for (const block of blocks) {
    lines.push(`## ${block.path}`);
    lines.push('');
    lines.push(block.excerpt.trim());
    lines.push('');
  }
  writeText(paths.snapshot, `${lines.join('\n')}\n`);
  appendEvent(runId, 'run_resumed', { blocks: blocks.map((block) => block.path) });
  return { run_id: runId, blocks };
}

function checkpoint(flags) {
  const runId = currentRunId();
  if (!runId) throw new Error('No active run. Use open-run or resume first.');
  const checkpointDir = path.join(TASKS_DIR, runId, 'checkpoints');
  ensureDir(checkpointDir);
  const existing = fs.readdirSync(checkpointDir).filter((name) => /^CP-\d+\.json$/.test(name)).map((name) => name.replace(/\.json$/, ''));
  const checkpointId = nextNumericId(existing, 'CP');
  const note = flags.notes || flags.note || '';
  const touched = (flags.files ? String(flags.files).split(',') : []).map((s) => s.trim()).filter(Boolean);
  const payload = {
    checkpoint_id: checkpointId,
    run_id: runId,
    created_at: nowIso(),
    notes: note,
    touched_files: touched,
  };
  writeJson(path.join(checkpointDir, `${checkpointId}.json`), payload);
  appendEvent(runId, 'checkpoint_created', payload);
  return payload;
}

function nextFileId(dir, prefix, ext) {
  ensureDir(dir);
  const existing = fs.readdirSync(dir)
    .filter((name) => name.startsWith(`${prefix}-`) && name.endsWith(ext))
    .map((name) => name.slice(0, -ext.length));
  return nextNumericId(existing, prefix);
}

function handoff(flags) {
  const runId = currentRunId();
  if (!runId) throw new Error('No active run. Use open-run or resume first.');
  const handoffId = nextFileId(path.join(PROTOCOLS_DIR, 'handoffs'), 'HOF', '.md');
  const latestSummary = readText(path.join(TASKS_DIR, runId, 'summary.md'), '').trim();
  const notes = flags.notes || '';
  const content = [
    `# ${handoffId}`,
    '',
    '## Scope',
    notes || 'Document the exact scope being handed off.',
    '',
    '## What changed',
    '- Add the implemented change set here.',
    '',
    '## What did not change',
    '- Explicitly note untouched boundaries.',
    '',
    '## Owned files',
    '- List files or globs.',
    '',
    '## Evidence',
    `- Active run: ${runId}`,
    '',
    '## Risks',
    '- Describe residual risks.',
    '',
    '## Open questions',
    '- List blockers or questions.',
    '',
    '## Suggested next action',
    '- Recommend the next command or task.',
    '',
    '## Run summary excerpt',
    latestSummary || '- No summary yet.',
    '',
  ].join('\n');
  const rel = path.join('.protocols', 'handoffs', `${handoffId}.md`);
  writeText(rel, `${content}\n`);
  appendEvent(runId, 'handoff_created', { handoff_id: handoffId, notes });
  return { handoff_id: handoffId, path: rel };
}

function claim(flags) {
  const claimDir = path.join(PROTOCOLS_DIR, 'claims');
  ensureDir(claimDir);
  const claimId = nextFileId(claimDir, 'CLM', '.yaml');
  const taskId = flags.task || '';
  const agentId = flags.agent || 'orchestrator';
  const files = (flags.files ? String(flags.files).split(',') : ['src/**']).map((s) => s.trim()).filter(Boolean);
  const content = [
    `claim_id: ${claimId}`,
    `task_id: ${taskId}`,
    `agent_id: ${agentId}`,
    'status: claimed',
    'scope:',
    '  files:',
    ...files.map((file) => `    - ${file}`),
    'return_contract:',
    '  required:',
    '    - diff_summary',
    '    - test_results',
    '    - evidence_links',
    'blocked_by: []',
    `created_at: ${nowIso()}`,
    '',
  ].join('\n');
  const rel = path.join('.protocols', 'claims', `${claimId}.yaml`);
  writeText(rel, content);
  const runId = currentRunId();
  if (runId) appendEvent(runId, 'claim_created', { claim_id: claimId, task_id: taskId, agent_id: agentId, files });
  return { claim_id: claimId, path: rel };
}

function status() {
  const config = loadSystemConfig();
  const runId = currentRunId();
  const summary = {
    stack: config.stack || 'unknown',
    repo_mode: config.repo_mode || 'unknown',
    current_run: runId,
    latest_run_summary: runId ? path.join('.tasks', runId, 'summary.md') : null,
    active_claim: (() => {
      const dir = path.join(PROTOCOLS_DIR, 'claims');
      if (!fs.existsSync(dir)) return null;
      const latest = fs.readdirSync(dir).filter((name) => /^CLM-\d+\.yaml$/.test(name)).sort().at(-1);
      return latest ? path.join('.protocols', 'claims', latest) : null;
    })(),
    latest_handoff: (() => {
      const dir = path.join(PROTOCOLS_DIR, 'handoffs');
      if (!fs.existsSync(dir)) return null;
      const latest = fs.readdirSync(dir).filter((name) => /^HOF-\d+\.md$/.test(name)).sort().at(-1);
      return latest ? path.join('.protocols', 'handoffs', latest) : null;
    })(),
    runs: existingRuns(),
  };
  return summary;
}

function printHelp() {
  console.log(`mb-run.mjs

Commands:
  status
  open-run [--task TASK-001] [--feature FT-001] [--agent agent-id] [--new]
  resume [--task TASK-001] [--feature FT-001] [--new]
  checkpoint [--notes text] [--files a,b]
  handoff [--notes text]
  claim [--task TASK-001] [--agent agent-id] [--files a,b]
`);
}

function main() {
  const { positional, flags } = parseCli(process.argv.slice(2));
  const command = positional[0] || 'status';
  if (flags.help || flags.h) {
    printHelp();
    return;
  }

  let result;
  switch (command) {
    case 'status':
      result = status();
      break;
    case 'open-run':
      result = openRun(flags);
      break;
    case 'resume':
      result = resumeRun(flags);
      break;
    case 'checkpoint':
      result = checkpoint(flags);
      break;
    case 'handoff':
      result = handoff(flags);
      break;
    case 'claim':
      result = claim(flags);
      break;
    default:
      printHelp();
      process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
