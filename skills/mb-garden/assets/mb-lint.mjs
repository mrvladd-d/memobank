#!/usr/bin/env node
/**
 * mb-lint.mjs
 *
 * Deterministic lint for `.memory-bank/`.
 * Intentionally mechanical: structure + frontmatter + broken links.
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const MB = path.join(ROOT, '.memory-bank');

if (!fs.existsSync(MB)) {
  console.error('❌ .memory-bank/ not found. Run mb-init first.');
  process.exit(1);
}

const REQUIRED = [
  '.memory-bank/index.md',
  '.memory-bank/mbb/index.md',
  '.memory-bank/changelog.md',
  '.memory-bank/workflows/mb-sync.md',
  '.memory-bank/testing/index.md',
  '.memory-bank/tasks/backlog.md',
  '.memory-bank/skills/index.md',
];

const ALLOWED_STATUS = new Set(['draft', 'active', 'deprecated', 'archived']);
const ALLOWED_LIFECYCLE = new Set(['planned', 'implemented', 'verified']);

const errors = [];
const warnings = [];

function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

function listMarkdownFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listMarkdownFiles(full));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function hasFrontmatter(text) {
  return text.startsWith('---\n') && text.includes('\n---\n');
}

function parseFrontmatter(text) {
  // Minimal YAML-ish parser for frontmatter block:
  // - key: value
  // - key: (then indented block, e.g. lists)
  const end = text.indexOf('\n---\n', 4);
  if (end === -1) return null;
  const block = text.slice(4, end).replace(/\r\n/g, '\n').trimEnd();
  const lines = block.split('\n');
  const kv = {};

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^([A-Za-z0-9_\-]+):\s*(.*)$/);
    if (!m) {
      i += 1;
      continue;
    }

    const key = m[1];
    const rest = (m[2] ?? '').trimEnd();

    if (rest === '') {
      const collected = [];
      i += 1;
      while (i < lines.length) {
        const next = lines[i];
        if (/^[A-Za-z0-9_\-]+:\s*/.test(next)) break;
        collected.push(next);
        i += 1;
      }
      kv[key] = collected.join('\n').trim();
      continue;
    }

    kv[key] = rest.trim();
    i += 1;
  }

  return kv;
}

function normalizeRel(p) {
  return p.replace(/\\/g, '/');
}

function isIndexDoc(rel) {
  const n = normalizeRel(rel);
  return n.endsWith('/index.md') || n === '.memory-bank/index.md';
}

function isLifecycleScopedDoc(rel) {
  const n = normalizeRel(rel);
  if (isIndexDoc(n)) return false;
  return (
    n.startsWith('.memory-bank/epics/') ||
    n.startsWith('.memory-bank/features/') ||
    n.startsWith('.memory-bank/requirements/')
  );
}

function isMetadataScopedDoc(rel) {
  const n = normalizeRel(rel);
  if (isIndexDoc(n)) return false;
  return (
    n === '.memory-bank/product.md' ||
    n === '.memory-bank/requirements.md' ||
    n.startsWith('.memory-bank/architecture/') ||
    n.startsWith('.memory-bank/guides/') ||
    n.startsWith('.memory-bank/adrs/') ||
    n.startsWith('.memory-bank/tech-specs/') ||
    n.startsWith('.memory-bank/domains/') ||
    n.startsWith('.memory-bank/contracts/') ||
    n.startsWith('.memory-bank/runbooks/') ||
    n.startsWith('.memory-bank/epics/') ||
    n.startsWith('.memory-bank/features/') ||
    n.startsWith('.memory-bank/requirements/') ||
    n.startsWith('.memory-bank/bugs/')
  );
}

function stripYamlQuotes(value) {
  const v = String(value ?? '').trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

function hasSourceOfTruth(fm) {
  if (!fm) return false;
  if (!Object.prototype.hasOwnProperty.call(fm, 'source_of_truth')) return false;
  const raw = String(fm.source_of_truth ?? '').trim();
  if (!raw || raw === '[]') return false;
  if (raw.includes('\n') || raw.startsWith('-')) {
    return /^\s*-\s+\S+/m.test(raw);
  }
  return true;
}

function checkRequiredFiles() {
  for (const rel of REQUIRED) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) errors.push(`Missing required file: ${rel}`);
  }
}

function checkFrontmatter(filePath, text) {
  const rel = normalizeRel(path.relative(ROOT, filePath));
  if (!hasFrontmatter(text)) {
    errors.push(`${rel}: missing YAML frontmatter`);
    return;
  }
  const fm = parseFrontmatter(text);
  if (!fm || !fm.description) {
    errors.push(`${rel}: frontmatter must include 'description'`);
  }
  if (!fm || !fm.status) {
    errors.push(`${rel}: frontmatter must include 'status'`);
  } else {
    const status = stripYamlQuotes(fm.status);
    if (!ALLOWED_STATUS.has(status)) {
      errors.push(`${rel}: invalid status '${status}' (allowed: draft|active|deprecated|archived)`);
    }

    if (isMetadataScopedDoc(rel) && status === 'active') {
      if (!fm.owner || !String(fm.owner).trim()) warnings.push(`${rel}: missing 'owner' (recommended for active docs)`);
      if (!fm.last_updated || !String(fm.last_updated).trim()) {
        warnings.push(`${rel}: missing 'last_updated' (recommended for active docs, YYYY-MM-DD)`);
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(stripYamlQuotes(fm.last_updated))) {
        warnings.push(`${rel}: invalid 'last_updated' format (expected YYYY-MM-DD)`);
      }
      if (!hasSourceOfTruth(fm)) warnings.push(`${rel}: missing 'source_of_truth' (recommended for active docs)`);
    }
  }

  if (isLifecycleScopedDoc(rel)) {
    if (!fm || !fm.lifecycle) {
      warnings.push(`${rel}: missing 'lifecycle' (planned|implemented|verified)`);
    } else {
      const lifecycle = stripYamlQuotes(fm.lifecycle);
      if (!ALLOWED_LIFECYCLE.has(lifecycle)) {
        errors.push(
          `${rel}: invalid lifecycle '${lifecycle}' (allowed: planned|implemented|verified)`
        );
      }
    }
  }
}

function extractLinks(text) {
  // markdown links: [text](path)
  // Ignore anything inside code fences and inline code to avoid flagging examples/templates.
  const stripped = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '');
  const links = [];
  const re = /\[[^\]]+\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(stripped)) !== null) {
    links.push(m[1]);
  }
  return links;
}

function checkLinks(filePath, text) {
  const rel = normalizeRel(path.relative(ROOT, filePath));
  const dir = path.dirname(filePath);
  for (const link of extractLinks(text)) {
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    if (link.startsWith('/')) continue;
    const target = path.normalize(path.join(dir, link));
    if (!target.startsWith(ROOT)) continue;
    if (!fs.existsSync(target)) {
      errors.push(`${rel}: broken link -> ${link}`);
    }
  }
}

function checkIndexRouters() {
  // For each folder inside .memory-bank with >3 md files, require index.md.
  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const mdFiles = entries
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name);

    const hasIndex = mdFiles.includes('index.md');
    const mdCount = mdFiles.length;

    const relDir = normalizeRel(path.relative(ROOT, dir));
    if (mdCount > 3 && !hasIndex) {
      warnings.push(`${relDir}: has ${mdCount} md files but no index.md router`);
    }

    for (const e of entries) {
      if (e.isDirectory()) walk(path.join(dir, e.name));
    }
  }

  walk(MB);
}

function checkFileSize(filePath, text) {
  const rel = normalizeRel(path.relative(ROOT, filePath));
  const lines = text.split(/\r?\n/).length;
  if (lines > 2000) {
    warnings.push(`${rel}: very large file (${lines} lines). Consider splitting.`);
  }
}

checkRequiredFiles();

const files = listMarkdownFiles(MB);
for (const f of files) {
  const text = readText(f);
  checkFrontmatter(f, text);
  checkLinks(f, text);
  checkFileSize(f, text);
}

checkIndexRouters();

if (warnings.length) {
  console.log('⚠️  WARNINGS');
  for (const w of warnings) console.log(`- ${w}`);
  console.log('');
}

if (errors.length) {
  console.error('❌ ERRORS');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}

console.log(`✅ mb-lint passed (${files.length} files).`);
