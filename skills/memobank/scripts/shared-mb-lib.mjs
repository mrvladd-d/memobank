import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const ROOT = process.cwd();
export const MB = path.join(ROOT, '.memory-bank');
export const SYSTEM_DIR = path.join(MB, 'system');

export function nowIso() {
  return new Date().toISOString();
}

export function ensureDir(relOrAbs) {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  fs.mkdirSync(p, { recursive: true });
  return p;
}

export function exists(relOrAbs) {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  return fs.existsSync(p);
}

export function readText(relOrAbs, fallback = '') {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  if (!fs.existsSync(p)) return fallback;
  return fs.readFileSync(p, 'utf8');
}

export function writeText(relOrAbs, content) {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

export function readJson(relOrAbs, fallback = null) {
  const text = readText(relOrAbs, '');
  if (!text) return fallback;
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function readJsonYaml(relOrAbs, fallback = null) {
  return readJson(relOrAbs, fallback);
}

export function writeJson(relOrAbs, value) {
  return writeText(relOrAbs, `${JSON.stringify(value, null, 2)}\n`);
}

export function appendJsonl(relOrAbs, value) {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  ensureDir(path.dirname(p));
  fs.appendFileSync(p, `${JSON.stringify(value)}\n`, 'utf8');
  return p;
}

export function listDirs(relOrAbs) {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  if (!fs.existsSync(p)) return [];
  return fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

export function listFilesRecursive(relOrAbs, options = {}) {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  const out = [];
  const { ignore = [] } = options;
  if (!fs.existsSync(p)) return out;

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
      if (ignore.some((prefix) => rel.startsWith(prefix))) continue;
      if (entry.isDirectory()) {
        walk(abs);
      } else {
        out.push(abs);
      }
    }
  }

  walk(p);
  return out.sort();
}

export function readFrontmatterDescription(markdown) {
  const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!m) return null;
  const d = m[1].match(/^description:\s*(.*)$/m);
  return d ? d[1].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1') : null;
}

export function markdownTitle(markdown, fallback = '') {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

export function hashText(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function collectHashEntries(absPath, out) {
  if (!fs.existsSync(absPath)) return;
  const stat = fs.statSync(absPath);
  if (stat.isDirectory()) {
    out.push({ type: 'dir', path: absPath });
    for (const entry of fs.readdirSync(absPath).sort()) {
      collectHashEntries(path.join(absPath, entry), out);
    }
    return;
  }
  out.push({ type: 'file', path: absPath });
}

export function hashFiles(paths) {
  const h = crypto.createHash('sha256');
  const entries = [];
  for (const p of [...paths].sort()) {
    collectHashEntries(p, entries);
  }
  for (const entry of entries.sort((a, b) => a.path.localeCompare(b.path))) {
    const rel = path.relative(ROOT, entry.path).replace(/\\/g, '/');
    h.update(`${entry.type}:${rel}\n`);
    if (entry.type === 'file') {
      h.update(fs.readFileSync(entry.path));
    }
  }
  return h.digest('hex');
}

export function loadSystemConfig() {
  return readJsonYaml(path.join(SYSTEM_DIR, 'memobank.yaml'), {});
}

export function loadLockFile() {
  return readJson(path.join(SYSTEM_DIR, 'providers.lock.json'), {});
}

export function saveLockFile(lock) {
  return writeJson(path.join(SYSTEM_DIR, 'providers.lock.json'), lock);
}

export function loadCommandsManifest() {
  return readJson(path.join(SYSTEM_DIR, 'commands.manifest.json'), {});
}

export function loadProviderRegistry() {
  const base = path.join(SYSTEM_DIR, 'provider-registry');
  const providers = {};
  for (const dir of listDirs(base)) {
    const manifest = readJsonYaml(path.join(base, dir, 'manifest.yaml'), null);
    const importMap = readJsonYaml(path.join(base, dir, 'import-map.yaml'), { mappings: [] });
    providers[dir] = {
      manifest,
      importMap,
      installDoc: readText(path.join(base, dir, 'install.md'), ''),
    };
  }
  return providers;
}

export function runShell(command, options = {}) {
  const { execute = false, cwd = ROOT, env = {} } = options;
  if (!execute) {
    return { ok: true, code: 0, stdout: '', stderr: '', dryRun: true, command };
  }
  const result = spawnSync(command, {
    cwd,
    shell: true,
    stdio: 'pipe',
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return {
    ok: result.status === 0,
    code: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    dryRun: false,
    command,
  };
}

export function commandExists(binary, options = {}) {
  const { env = {} } = options;
  const check = process.platform === 'win32' ? `where ${binary}` : `command -v ${binary}`;
  const result = spawnSync(check, {
    shell: true,
    stdio: 'pipe',
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return result.status === 0;
}

export function nextNumericId(existingNames, prefix, width = 4) {
  const nums = existingNames
    .map((name) => {
      const m = String(name).match(new RegExp(`^${prefix}-(\\d+)$`));
      return m ? Number(m[1]) : null;
    })
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${String(next).padStart(width, '0')}`;
}

export function latestByPrefix(relDir, prefix) {
  const names = listDirs(relDir).filter((name) => name.startsWith(`${prefix}-`));
  return names.sort().at(-1) || null;
}

export function resolveCurrentRunId() {
  const pointer = readText(path.join(ROOT, '.tasks/.current-run'), '').trim();
  if (pointer) return pointer;
  return latestByPrefix('.tasks', 'RUN');
}

export function writeCurrentRunId(runId) {
  return writeText(path.join(ROOT, '.tasks/.current-run'), `${runId}\n`);
}

export function parseArgs(argv) {
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

export function shortExcerpt(text, maxBytes = 16000) {
  const buf = Buffer.from(String(text), 'utf8');
  if (buf.length <= maxBytes) return String(text);
  return `${buf.subarray(0, maxBytes).toString('utf8')}\n...[truncated]`;
}

export function statMtime(relOrAbs) {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(ROOT, relOrAbs);
  if (!fs.existsSync(p)) return null;
  return fs.statSync(p).mtime.toISOString();
}

export function globExists(pattern) {
  const normalized = pattern.replace(/\\/g, '/');
  if (!normalized.includes('*')) return exists(normalized);
  const escaped = normalized
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '::DOUBLESTAR::')
    .replace(/\*/g, '[^/]*')
    .replace(/::DOUBLESTAR::/g, '.*');
  const regex = new RegExp(`^${escaped}$`);
  return listFilesRecursive('.', { ignore: ['node_modules/', '.git/'] })
    .map((abs) => path.relative(ROOT, abs).replace(/\\/g, '/'))
    .some((rel) => regex.test(rel));
}

export function toPosix(relOrAbs) {
  return String(relOrAbs).replace(/\\/g, '/');
}
