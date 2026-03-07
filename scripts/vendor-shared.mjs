#!/usr/bin/env node

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const repoRoot = resolve(process.cwd());
const skillsRoot = join(repoRoot, 'skills');
const sharedRoot = join(skillsRoot, '_shared');

if (!existsSync(sharedRoot)) {
  console.error(`Missing shared source: ${sharedRoot}`);
  process.exit(1);
}

function flattenReferenceName(referenceFile) {
  const rel = relative(join(sharedRoot, 'references'), referenceFile);
  return `shared-${rel.replaceAll('/', '-')}`;
}

const publicSkillDir = join(skillsRoot, 'memobank');
const skillDirs = existsSync(join(publicSkillDir, 'SKILL.md')) ? [publicSkillDir] : [];

if (skillDirs.length === 0) {
  console.error('Missing public skill entry: skills/memobank/SKILL.md');
  process.exit(1);
}

for (const skillDir of skillDirs) {
  rmSync(join(skillDir, '_shared'), { recursive: true, force: true });
  rmSync(join(skillDir, 'agents', '_shared'), { recursive: true, force: true });
  rmSync(join(skillDir, 'references', '_shared'), { recursive: true, force: true });
  rmSync(join(skillDir, 'scripts', '_shared'), { recursive: true, force: true });
  rmSync(join(skillDir, 'agents', 'shared'), { recursive: true, force: true });
  rmSync(join(skillDir, 'references', 'shared'), { recursive: true, force: true });
  rmSync(join(skillDir, 'scripts', 'shared'), { recursive: true, force: true });

  const agentsDir = join(skillDir, 'agents');
  const referencesDir = join(skillDir, 'references');
  const scriptsDir = join(skillDir, 'scripts');

  mkdirSync(agentsDir, { recursive: true });
  mkdirSync(referencesDir, { recursive: true });
  mkdirSync(scriptsDir, { recursive: true });

  for (const entry of readdirSync(join(sharedRoot, 'agents'), { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    copyFileSync(
      join(sharedRoot, 'agents', entry.name),
      join(agentsDir, `shared-${entry.name}`),
    );
  }

  const referenceQueue = [join(sharedRoot, 'references')];
  while (referenceQueue.length) {
    const current = referenceQueue.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const abs = join(current, entry.name);
      if (entry.isDirectory()) {
        referenceQueue.push(abs);
        continue;
      }
      copyFileSync(abs, join(referencesDir, flattenReferenceName(abs)));
    }
  }

  for (const entry of readdirSync(join(sharedRoot, 'scripts'), { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    copyFileSync(
      join(sharedRoot, 'scripts', entry.name),
      join(scriptsDir, `shared-${entry.name}`),
    );
  }
}

console.log(`Vendored shared assets into public skill package: memobank.`);
