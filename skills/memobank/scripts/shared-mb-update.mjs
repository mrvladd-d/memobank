#!/usr/bin/env node
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ROOT,
  parseArgs,
  loadSystemConfig,
  loadCommandsManifest,
} from './mb-lib.mjs';

function runNode(script, args = [], execute = false) {
  const printable = `${process.execPath} ${script} ${args.join(' ')}`.trim();
  if (!execute) {
    console.log(JSON.stringify({ dryRun: true, command: printable }, null, 2));
    return { ok: true, dryRun: true };
  }
  const result = spawnSync(process.execPath, [script, ...args], { cwd: ROOT, stdio: 'inherit' });
  return { ok: result.status === 0, dryRun: false, code: result.status ?? 1 };
}

function providerArgs(config) {
  const providers = config.providers || {};
  const byRole = [];
  const byMode = [];
  const byChannel = [];
  for (const [role, value] of Object.entries(providers)) {
    if (!value || !value.name) continue;
    byRole.push(`${role}=${value.name}`);
    if (value.mode) byMode.push(`${value.name}=${value.mode}`);
    if (value.channel) byChannel.push(`${value.name}=${value.channel}`);
  }
  return { byRole, byMode, byChannel };
}

function main() {
  const { flags } = parseArgs(process.argv.slice(2));
  const execute = Boolean(flags.execute);
  const config = loadSystemConfig();
  const commandsManifest = loadCommandsManifest();
  const initScript = path.join(ROOT, '.memory-bank', 'tools', 'init-mb.js');
  const providerScript = path.join(ROOT, '.memory-bank', 'tools', 'provider-manager.mjs');
  const indexScript = path.join(ROOT, '.memory-bank', 'tools', 'mb-index.mjs');
  const doctorScript = path.join(ROOT, '.memory-bank', 'tools', 'mb-doctor.mjs');
  const commands = (commandsManifest?.selection?.commands || []).join(',');
  const selectionLabel = commandsManifest?.selection?.label || config.stack || 'core';
  const p = providerArgs(config);

  const nothingSpecified = !flags.core && !flags.providers && !flags.provider;
  const doCore = flags.core || nothingSpecified;
  const doProviders = flags.providers || Boolean(flags.provider) || nothingSpecified;
  let failed = false;

  if (doCore) {
    const args = ['--sync', `--stack=${config.stack || 'core'}`, `--commands=${commands}`];
    if (selectionLabel) args.push(`--preset=${selectionLabel}`);
    if (p.byRole.length) args.push(`--providers=${p.byRole.join(',')}`);
    if (p.byMode.length) args.push(`--provider-mode=${p.byMode.join(',')}`);
    if (p.byChannel.length) args.push(`--provider-channel=${p.byChannel.join(',')}`);
    const result = runNode(initScript, args, execute);
    failed = failed || !result.ok;
  }

  if (doProviders) {
    if (flags.provider) {
      const result = runNode(providerScript, ['update', '--execute', `--provider=${flags.provider}`], execute);
      failed = failed || !result.ok;
    } else {
      const result = runNode(providerScript, ['update', '--execute', '--all'], execute);
      failed = failed || !result.ok;
    }
  }

  const indexResult = runNode(indexScript, [], execute);
  failed = failed || !indexResult.ok;
  const doctorResult = runNode(doctorScript, ['--strict'], execute);
  failed = failed || !doctorResult.ok;
  if (execute && failed) {
    process.exit(1);
  }
}

main();
