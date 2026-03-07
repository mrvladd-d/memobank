#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  parseArgs,
  resolveCurrentRunId,
  readJson,
  readText,
  writeJson,
  writeText,
  nowIso,
} from './mb-lib.mjs';

function loadEvents(runId) {
  const file = path.join(ROOT, '.tasks', runId, 'events.jsonl');
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean).map((line) => {
    try {
      return JSON.parse(line);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const runId = flags.run || resolveCurrentRunId();
  if (!runId) {
    console.error('No active run.');
    process.exit(1);
  }

  const runDir = path.join(ROOT, '.tasks', runId);
  const meta = readJson(path.join(runDir, 'meta.json'), {});
  const events = loadEvents(runId);
  const eventTypes = {};
  const touched = new Set();
  const questions = [];
  const decisions = [];
  const risks = [];
  for (const event of events) {
    eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    const payload = event.payload || {};
    (payload.touched_files || []).forEach((file) => touched.add(file));
    if (payload.question) questions.push(payload.question);
    if (payload.decision) decisions.push(payload.decision);
    if (payload.risk) risks.push(payload.risk);
  }

  const candidateUpdates = {
    run_id: runId,
    generated_at: nowIso(),
    knowledge: {
      decisions,
      questions,
      risks,
    },
    tasks: {
      touched_files: [...touched],
      task_id: meta.task_id || null,
      feature_id: meta.feature_id || null,
    },
  };

  const summaryLines = [
    '# Run summary',
    '',
    `- run_id: ${runId}`,
    `- generated_at: ${nowIso()}`,
    meta.task_id ? `- task_id: ${meta.task_id}` : null,
    meta.feature_id ? `- feature_id: ${meta.feature_id}` : null,
    '',
    '## Event counts',
    ...Object.entries(eventTypes).map(([type, count]) => `- ${type}: ${count}`),
    '',
    '## Touched files',
    ...([...(touched.size ? touched : ['- none recorded'])].map((item) => `- ${item}`)),
    '',
    '## Decisions',
    ...(decisions.length ? decisions.map((item) => `- ${item}`) : ['- none captured']),
    '',
    '## Risks',
    ...(risks.length ? risks.map((item) => `- ${item}`) : ['- none captured']),
    '',
    '## Open questions',
    ...(questions.length ? questions.map((item) => `- ${item}`) : ['- none captured']),
    '',
    '## Review note',
    'Promote candidate updates into curated docs only after explicit review.',
    '',
  ].filter((line) => line !== null);

  writeText(path.join(runDir, 'summary.md'), `${summaryLines.join('\n')}\n`);
  writeJson(path.join(runDir, 'candidate-updates.json'), candidateUpdates);

  console.log(JSON.stringify({ run_id: runId, events: events.length, touched_files: [...touched] }, null, 2));
}

main();
