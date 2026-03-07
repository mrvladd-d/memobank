#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  MB,
  listFilesRecursive,
  readText,
  writeJson,
  readFrontmatterDescription,
  markdownTitle,
  statMtime,
} from './mb-lib.mjs';

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}_-]+/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function extractLinks(markdown) {
  const links = [];
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = regex.exec(markdown))) {
    links.push({ text: m[1], href: m[2] });
  }
  return links;
}

function extractEntities(text) {
  const regex = /\b(?:REQ|EP|FT|TASK|ADR|RUN|CLM|HOF|VER|STP)-\d+\b/g;
  return Array.from(new Set(text.match(regex) || [])).sort();
}

function main() {
  const files = listFilesRecursive(MB, { ignore: ['.memory-bank/indexes/', '.memory-bank/tools/', '.memory-bank/system/provider-registry/'] })
    .filter((abs) => abs.endsWith('.md') || abs.endsWith('.json'));

  const lexical = {};
  const links = {};
  const entities = {};
  const freshness = {};
  const cache = [];

  for (const abs of files) {
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
    const content = readText(abs, '');
    const tokens = {};
    for (const token of tokenize(content)) {
      tokens[token] = (tokens[token] || 0) + 1;
    }
    lexical[rel] = {
      title: markdownTitle(content, path.basename(rel)),
      description: readFrontmatterDescription(content),
      top_tokens: Object.entries(tokens).sort((a, b) => b[1] - a[1]).slice(0, 40),
    };
    links[rel] = extractLinks(content);
    entities[rel] = extractEntities(content);
    freshness[rel] = { updated_at: statMtime(abs) };
    cache.push({ path: rel, title: lexical[rel].title, description: lexical[rel].description, entities: entities[rel] });
  }

  writeJson('.memory-bank/indexes/lexical.json', lexical);
  writeJson('.memory-bank/indexes/links.json', links);
  writeJson('.memory-bank/indexes/entities.json', entities);
  writeJson('.memory-bank/indexes/freshness.json', freshness);
  writeJson('.memory-bank/indexes/recall-cache.json', { generated_at: new Date().toISOString(), files: cache });

  console.log(JSON.stringify({ indexed_files: files.length }, null, 2));
}

main();
