#!/usr/bin/env node

/**
 * cold-start/scripts/init-mb.js
 *
 * A small helper to initialize the Memory Bank skeleton in the current directory.
 *
 * - Creates .memory-bank/ (durable knowledge base)
 * - Creates .tasks/ (operational runtime memory)
 * - Creates .protocols/ (file-based protocols)
 * - Creates AGENTS.md + CLAUDE.md symlink/copy
 *
 * Safe by default: does NOT overwrite existing files.
 *
 * Update mode:
 * - --sync / --force: overwrite generated command specs in .memory-bank/commands/
 *   and proxy skills in .claude/skills/ + .agents/skills/ (keeps other docs safe).
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const MB = '.memory-bank';
const SHARED_DIR = path.resolve(__dirname, '..');
const REFERENCES_DIR = path.join(SHARED_DIR, 'references');
const COMMAND_TEMPLATES_DIR = path.join(REFERENCES_DIR, 'commands');
const FLAT_COMMAND_PREFIX = 'shared-commands-';

const ARGS = new Set(process.argv.slice(2));
const SYNC_MODE = ARGS.has('--sync') || ARGS.has('--force');

if (ARGS.has('--help') || ARGS.has('-h')) {
  console.log(`
init-mb.js — initialize Memory Bank skeleton

Usage:
  node init-mb.js                # safe (no overwrites)
  node init-mb.js --sync         # update .memory-bank/commands + proxy skills
  node init-mb.js --force        # alias for --sync
`.trim());
  process.exit(0);
}

if (SYNC_MODE) {
  console.log('\n[Mode] SYNC: overwriting .memory-bank/commands/* and proxy skills (.claude/skills, .agents/skills).');
}

function ensureDir(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    console.log(`  + ${rel}/`);
  }
}

function writeFile(rel, content, { overwrite = false } = {}) {
  const p = path.join(ROOT, rel);
  const existed = fs.existsSync(p);
  if (existed && !overwrite) return;

  fs.writeFileSync(p, content, 'utf8');
  console.log(`  ${existed ? '~' : '+'} ${rel}${existed ? ' (updated)' : ''}`);
}

function readUtf8(absPath) {
  return fs.readFileSync(absPath, 'utf8');
}

function listMarkdownFiles(absDir) {
  return fs
    .readdirSync(absDir, { withFileTypes: true })
    .filter((d) => d.isFile())
    .map((d) => d.name)
    .filter((name) => name.toLowerCase().endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));
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
      filename: `${filename.replace(new RegExp(`^${FLAT_COMMAND_PREFIX}`), '')}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function extractFrontmatterDescription(markdown) {
  const fm = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!fm) return null;
  const m = fm[1].match(/^description:\s*(.*)\s*$/m);
  if (!m) return null;
  const value = m[1].trim();
  if (!value) return null;
  return value.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
}

function yamlQuote(value) {
  const escaped = String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

function generateCommandsIndex(commandMetas) {
  const lines = [];
  lines.push('---');
  lines.push('description: Роутер по command-spec файлам (slash commands).');
  lines.push('status: active');
  lines.push('---');
  lines.push('# Commands');
  lines.push('');
  commandMetas.forEach(({ name, desc }) => {
    lines.push(`- [.memory-bank/commands/${name}.md](${name}.md): ${desc}`);
  });
  lines.push('');
  return lines.join('\n');
}

function seedCommandsFromTemplates() {
  const templates = resolveCommandTemplates();
  if (templates.length === 0) {
    console.error(`\nERROR: Command templates not found in: ${COMMAND_TEMPLATES_DIR} or flattened references.`);
    console.error('Run init-mb.js from the memobank package (do not copy it standalone).');
    process.exit(1);
  }

  const metas = [];

  templates.forEach(({ filename, absPath, name }) => {
    const content = readUtf8(absPath);
    const desc = extractFrontmatterDescription(content) || `/${name}`;

    writeFile(`${MB}/commands/${filename}`, content, { overwrite: SYNC_MODE });
    metas.push({ name, desc });
  });

  writeFile(`${MB}/commands/index.md`, generateCommandsIndex(metas), { overwrite: SYNC_MODE });
  return metas;
}

function symlinkOrCopy(target, linkName) {
  const linkPath = path.join(ROOT, linkName);
  if (fs.existsSync(linkPath)) return;

  try {
    fs.symlinkSync(target, linkPath);
    console.log(`  ~ ${linkName} -> ${target}`);
  } catch (e) {
    // Windows / restricted env fallback
    const targetPath = path.join(ROOT, target);
    if (fs.existsSync(targetPath)) {
      fs.writeFileSync(linkPath, fs.readFileSync(targetPath, 'utf8'));
      console.log(`  + ${linkName} (copy, symlink failed)`);
    } else {
      console.log(`  ! Could not create ${linkName}: missing target ${target}`);
    }
  }
}

console.log('\n[1/5] Creating directories...');
[
  MB,
  `${MB}/mbb`,
  `${MB}/architecture`,
  `${MB}/guides`,
  `${MB}/adrs`,
  `${MB}/tech-specs`,
  `${MB}/domains`,
  `${MB}/contracts`,
  `${MB}/runbooks`,
  `${MB}/workflows`,
  `${MB}/quality`,
  `${MB}/testing`,
  `${MB}/skills`,
  `${MB}/epics`,
  `${MB}/features`,
  `${MB}/tasks`,
  `${MB}/tasks/plans`,
  `${MB}/commands`,
  `${MB}/agents`,
  `${MB}/archive`,
  `${MB}/bugs`,
  '.tasks',
  '.protocols',
].forEach(ensureDir);

console.log('\n[2/5] Writing core files...');

writeFile('AGENTS.md', `# Agent Operating Guide (Project Map)

## Prime before work
1. Read \`.memory-bank/index.md\` (table of contents)
2. Read \`.memory-bank/mbb/index.md\` (rules)
3. Follow annotated links for deeper context

## Docs First
After finishing a meaningful unit of work:
1) Update \`.memory-bank/\` (WHY/WHERE + navigation)
2) Then commit code changes

## Runtime vs durable memory
- Durable knowledge base: \`.memory-bank/\`
- Operational artifacts: \`.tasks/\` (NOT part of Memory Bank)
- Long-running plans/logs: \`.protocols/\`

## Where skills live (don’t confuse)
- Codex CLI reads project skills from \`.agents/skills/<name>/SKILL.md\` (not from \`.codex/\`).
- Claude Code reads project skills from \`.claude/skills/<name>/SKILL.md\`.
- \`.codex/\` is only for project configuration (e.g. \`.codex/config.toml\`).

## Subagents
- Orchestrator → workers only (max depth = 2)
- Workers write details into \`.tasks/TASK-XXX/\`
- Orchestrator reads only short summaries

## Clean context (recommended)
- If running in **Claude Code**: execute each \`TASK-XXX\` in a **fresh Claude session** using \`.protocols/TASK-XXX/{context,plan,progress}\` as the primary state.
- If running in **Codex**: you can run each \`TASK-XXX\` in a fresh session via \`codex exec\` (see \`/execute\`).
- Sequencing: independent tasks may run in parallel clean sessions; dependent/shared-file tasks must run sequentially.

Codex (fresh session):
- \`codex exec --ephemeral --full-auto -m gpt-5.2-high 'TASK_ID=TASK-123. Read AGENTS.md + .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement. Update progress. Report → .tasks/TASK-123/…'\`

Claude (fresh session):
- \`claude -p --no-session-persistence --permission-mode acceptEdits --model opus 'TASK_ID=TASK-123. Read AGENTS.md + .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement. Update progress. Report → .tasks/TASK-123/…'\`

## Two modes (interactive vs autonomous)
- **Interactive**: run \`/prd\` → pick one \`FT-<NNN>\` → \`/prd-to-tasks FT-<NNN>\` → execute tasks one-by-one with \`/execute TASK-<ID>\` and review after each wave.
- **Autonomous (batch)**: use \`/autonomous\` for full \`PRD → done\`, or \`/autopilot\` if backlog already exists. See: \`.memory-bank/workflows/execute-loop.md\` and \`.memory-bank/workflows/autonomy-policy.md\`.

Naming:
- Folder: \`.tasks/TASK-<ID>/\`
- Files: \`TASK-<ID>-S-<STAGE>-final-report-<code|docs>-<NN>.md\`

## Quality gates (before merge)
- lint / typecheck / build
- unit tests
- e2e tests (if UI/flow)

## Entry points
- /cold-start → .memory-bank/commands/cold-start.md
- /mb → .memory-bank/commands/mb.md
- /mb-init → .memory-bank/commands/mb-init.md
- /prd → .memory-bank/commands/prd.md
- /prd-to-tasks → .memory-bank/commands/prd-to-tasks.md
- /mb-from-prd → .memory-bank/commands/mb-from-prd.md (alias)
- /mb-execute → .memory-bank/commands/mb-execute.md (alias)
- /execute → .memory-bank/commands/execute.md
- /verify → .memory-bank/commands/verify.md
- /mb-verify → .memory-bank/commands/mb-verify.md (alias)
- /autopilot → .memory-bank/commands/autopilot.md
- /autonomous → .memory-bank/commands/autonomous.md
- /map-codebase → .memory-bank/commands/map-codebase.md
- /mb-map-codebase → .memory-bank/commands/mb-map-codebase.md (alias)
- /mb-sync → .memory-bank/commands/mb-sync.md
- /discuss → .memory-bank/commands/discuss.md
- /add-tests → .memory-bank/commands/add-tests.md
- /review → .memory-bank/commands/review.md
- /mb-review → .memory-bank/commands/mb-review.md (alias)
- /mb-garden → .memory-bank/commands/mb-garden.md
- /mb-harness → .memory-bank/commands/mb-harness.md
- /find-skills → .memory-bank/commands/find-skills.md
- /find-skill → .memory-bank/commands/find-skill.md (alias)
`);

writeFile(`${MB}/index.md`, `---
description: Главная карта знаний проекта (table of contents) для агентов.
status: active
---
# Memory Bank Index

## Навигация

- [.memory-bank/mbb/index.md](mbb/index.md): Правила ведения Memory Bank (MBB).
- [.memory-bank/product.md](product.md): Продукт (C4 L1).
- [.memory-bank/requirements.md](requirements.md): Требования + RTM.
- [.memory-bank/epics/](epics/): Эпики (C4 L2).
- [.memory-bank/features/](features/): Фичи (C4 L3).
- [.memory-bank/tasks/backlog.md](tasks/backlog.md): Backlog / waves.

- [.memory-bank/architecture/](architecture/): Duo (WHAT/WHY).
- [.memory-bank/guides/](guides/): Duo (HOW).
- [.memory-bank/adrs/](adrs/): ADR решения.

- [.memory-bank/contracts/](contracts/): API contracts.
- [.memory-bank/runbooks/](runbooks/): Runbooks.
- [.memory-bank/testing/index.md](testing/index.md): Testing strategy.
- [.memory-bank/skills/index.md](skills/index.md): Skill registry.
`);

writeFile(`${MB}/mbb/index.md`, `---
description: Memory Bank Bible — правила, инварианты и стандарты документации.
status: active
---
# Memory Bank Bible (MBB)

## SSOT pyramid
- **Code**: WHAT/HOW — implementation truth.
- **Docstrings**: contracts + @docs pointers.
- **Memory Bank**: WHY/WHERE — boundaries, invariants, navigation.

## Hard rules
1. Every \`.memory-bank/**/*.md\` MUST have frontmatter with \`description:\`.
2. If a folder has >3 docs, add an \`index.md\` router.
3. Use annotated links: \`[.memory-bank/path](rel-path): короткое описание\`.
4. Atomic docs: one concept per doc; keep ~≤500 lines.
5. Duo docs: \`architecture/\` (WHAT/WHY) + \`guides/\` (HOW), cross-link both ways.
6. C4 layering: L1 product → L2 epics → L3 features → L4 plans/tasks.
7. Docs First: update MB immediately after finishing a task.
8. Refactor MB every 5–10 updates (split, merge, archive).
9. Separate facts from interpretations: mark hypotheses explicitly ("предположительно", "требует проверки").
10. After merge/rebase conflicts: re-check MB consistency.
11. MB-SYNC after each wave/significant change (see \`workflows/mb-sync.md\`).

## Forbidden
- Copy-paste implementation details / pseudocode
- Duplicating configs instead of linking to source
- Speculative claims without evidence from code/metrics/tests

## Allowed / encouraged
- Invariants (MUST/NEVER)
- Contracts at boundaries
- Decision rationale + pointers
- Runbooks and verification procedures
`);

writeFile(`${MB}/product.md`, `---
description: Product brief (C4 L1): что это, для кого, core value, ограничения.
status: draft
---
# Product

## What this is

## Core value

## Audience

## Primary user flow

## Constraints
- Tech stack:
- Timeline:
- Non-goals:
`);

writeFile(`${MB}/requirements.md`, `---
description: Требования (REQ-IDs) + traceability matrix (RTM).
status: draft
---
# Requirements

## Status model
- Document \`status\`: \`draft|active|deprecated|archived\`
- RTM \`Lifecycle\`: \`planned|implemented|verified\`

## REQ list
- (fill from PRD; do not invent requirements without evidence)

## Out of scope
- ...

## Traceability (RTM)
| REQ | Epic | Feature | Test | Lifecycle |
|---|---|---|---|---|
| REQ-XXX | EP-XXX | FT-XXX | test:... | planned |
`);

writeFile(`${MB}/tasks/backlog.md`, `---
description: Backlog и execution plan (waves) для реализации.
status: draft
---
# Backlog

> PRD-less rule: an empty backlog skeleton is OK, but do NOT create waves/TASK-IDs until you have PRD (or explicit human instruction).

## Conventions
Each task should include:
- goal
- expected touched files
- tests
- verification steps
- docs-first update

## Task state model
- \`Status: planned|ready|in_progress|blocked|done|failed\`
- \`Wave: W1|W2|W3|...\`
- \`Depends on: TASK-... | none\`

## Task card template
### TASK-001 — short title
- Status: ready
- Wave: W1
- Feature: FT-001
- REQs: REQ-001, REQ-002
- Depends on: none
- Touched files: \`src/...\`, \`tests/...\`
- Tests: \`npm test -- foo\`
- Verify: API/manual/UAT steps
- Docs: product/requirements/feature/changelog/index
`);

writeFile(`${MB}/testing/index.md`, `---
description: Стратегия тестирования и верификации (quality gates, anti-cheat, UI/e2e).
status: active
---
# Testing & Verification

## Quality gates
- lint / typecheck
- unit tests
- integration tests (if applicable)
- e2e tests for critical user flows

## UI verification
- Prefer Playwright / agent-browser / CDP for UI flows when available
- Store screenshots/videos/traces in .tasks/TASK-XXX/
- In Memory Bank keep only links + short conclusions

## Artifacts
- screenshots/logs/videos → .tasks/TASK-XXX/
- in Memory Bank store only links + conclusions
`);

writeFile(`${MB}/skills/index.md`, `---
description: Реестр доступных скиллов (когда применять) в этом репозитории.
status: active
---
# Skills

## Installed
- cold-start

## When to use
- Bootstrap: cold-start / mb-init
- PRD → MB: mb-from-prd
- Map codebase: mb-map-codebase
- Execution: mb-execute
- Verification (UAT): mb-verify
- Autonomous run: autonomous / autopilot
- Review: mb-review
- Maintenance: mb-garden
- Harness: mb-harness
`);

writeFile(`${MB}/changelog.md`, `---
description: Лог изменений Memory Bank.
status: active
---
# Changelog

## [${new Date().toISOString().slice(0, 10)}] Initial setup
- Created Memory Bank skeleton
- Seeded core docs (product, requirements, testing, backlog)
`);

writeFile(`${MB}/workflows/mb-sync.md`, `---
description: Чеклист синхронизации Memory Bank после wave/изменений.
status: active
---
# MB-SYNC Checklist

- [ ] Duo docs consistent (architecture ↔ guides)
- [ ] RTM lifecycle up to date (requirements.md)
- [ ] Feature/epic document \`status\` and implementation \`lifecycle\` are both updated
- [ ] Backlog tasks marked done
- [ ] Changelog entry added
- [ ] index.md links valid
- [ ] Lint passes (0 errors; blocking in autonomous mode)
`);

writeFile(`${MB}/workflows/autonomy-policy.md`, `---
description: Guardrails and terminal states for unattended autonomous runs.
status: active
---
# Autonomy policy

## Default mode
- Prefer interactive mode unless the user explicitly requested unattended execution.

## Hard-stop categories
- security / compliance ambiguity
- external contracts or partner APIs with unknown behavior
- destructive data migrations
- secret reads / prod writes / deploys

## Allowed assumptions
- naming / wording / non-critical UX defaults
- low-risk implementation details that can be verified later

Non-blocking gaps must be written as explicit assumptions in \`.protocols/AUTONOMOUS-RUN/decision-log.md\`.

## Required gates
- latest \`/review\` verdict must be \`APPROVE\`
- mandatory \`/verify\` per TASK
- mandatory \`/mb-sync\`
- mandatory lint/link consistency before final success

## Failure budgets
- max_retries_per_task: 2
- max_consecutive_failures: 3
- max_open_blockers: 3

## Terminal states
- \`SUCCESS\`
- \`HALT_BLOCKING_QUESTIONS\`
- \`HALT_REVIEW_REJECT\`
- \`HALT_FAILURE_BUDGET\`
- \`HALT_DEPENDENCY_DEADLOCK\`
- \`HALT_POLICY_VIOLATION\`
- \`HALT_QUALITY_GATES\`
- \`HALT_BUDGET_EXCEEDED\`
`);

writeFile(`${MB}/workflows/execute-loop.md`, `---
description: Workflow: PRD → FT → TASK loop (interactive or autonomous).
status: active
---
# Execute loop (PRD → Feature → Tasks)

## Principle: no task explosion
- \`/prd\` creates L1–L3 only (product/requirements/epics/features/testing/index).
- Tasks are created **per feature** via \`/prd-to-tasks FT-<NNN>\`.

## Interactive mode (you stay)
1) \`/prd\` (fills L1–L3; records open questions)
2) Pick one top feature: \`FT-<NNN>\`
3) \`/prd-to-tasks FT-<NNN>\` (creates IMPL plan + TASK-* for this feature)
4) Execute tasks from \`.memory-bank/tasks/backlog.md\` one-by-one:
   - \`/execute TASK-<ID>\` → \`/verify\` → \`/mb-sync\`
5) After each wave: \`/review\` (or \`mb-review\` fresh context)

## Autonomous end-to-end mode (start and leave)
1) \`/autonomous\`
2) command builds L1–L3, runs review gate, decomposes all FT, and then schedules ready TASKs
3) each TASK runs in **fresh CLI sessions**
4) after each wave: \`/review\`
5) final success only if last review = \`APPROVE\` and no blocking tasks remain

## Autonomous executor only
If backlog already exists and review gate already passed, use:
- \`/autopilot\`

Codex (implement then verify):
~~~bash
codex exec --ephemeral --full-auto -m gpt-5.2-high \\
  'TASK_ID=TASK-123. Read AGENTS.md + .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement only scoped changes. Update progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md.'

codex exec --ephemeral --full-auto -m gpt-5.2-high \\
  'TASK_ID=TASK-123. Read .protocols/TASK-123/{context,plan,progress}.md + acceptance criteria. Keep context.md updated. Fill .protocols/TASK-123/verification.md. Evidence → .tasks/TASK-123/. VERDICT: PASS/FAIL.'
~~~

Claude (implement then verify):
~~~bash
claude -p --no-session-persistence --permission-mode acceptEdits --model opus \\
  'TASK_ID=TASK-123. Read AGENTS.md + .protocols/TASK-123/{context,plan,progress}.md. Keep context.md updated. Implement only scoped changes. Update progress.md. Report → .tasks/TASK-123/TASK-123-S-IMPL-final-report-code-01.md.'

claude -p --no-session-persistence --permission-mode acceptEdits --model opus \\
  'TASK_ID=TASK-123. Read .protocols/TASK-123/{context,plan,progress}.md + acceptance criteria. Keep context.md updated. Fill .protocols/TASK-123/verification.md. Evidence → .tasks/TASK-123/. VERDICT: PASS/FAIL/NEEDS-CLARIFICATION.'
~~~

## Parallel vs sequential
- Independent tasks (no shared files) MAY run in parallel (separate sessions).
- Dependent or shared-file tasks MUST run sequentially: TASK-A (impl→verify→mb-sync) → TASK-B.
`);

writeFile(`${MB}/adrs/ADR-000-template.md`, `---
description: "ADR-000: Шаблон для архитектурных решений."
status: active
owner: architecture
last_updated: ${new Date().toISOString().slice(0, 10)}
source_of_truth:
  - .memory-bank/adrs/ADR-000-template.md
---
# ADR-000: Template

## ADR Status
accepted

## Context
Используй этот файл как шаблон для новых ADR.
Копируй и заполняй: Status, Context, Decision, Consequences, Alternatives.

## Decision
Каждое значимое архитектурное решение фиксируется как ADR в этой папке.

## Consequences
Все решения трассируемы и reviewable.
`);

console.log('\n[3/5] Writing command specs (SSOT templates)...');
const commandMetas = seedCommandsFromTemplates();

console.log('\n[4/5] Creating symlinks...');
symlinkOrCopy('AGENTS.md', 'CLAUDE.md');
symlinkOrCopy('AGENTS.md', 'GEMINI.md');

// Native skills for Claude Code, Codex CLI, and OpenCode
// .claude/skills/  → Claude Code + OpenCode
// .agents/skills/  → Codex CLI + OpenCode
// Both are thin proxies pointing to .memory-bank/commands/ (SSOT)
console.log('\n[5/5] Creating native skills (proxy commands)...');

const commands = commandMetas;

const skillContent = (name, desc) =>
`---
name: ${name}
description: ${yamlQuote(desc)}
---

Read and follow the instructions in \`.memory-bank/commands/${name}.md\`
`;

commands.forEach(({ name, desc }) => {
  // Claude Code + OpenCode
  ensureDir(`.claude/skills/${name}`);
  writeFile(`.claude/skills/${name}/SKILL.md`, skillContent(name, desc), { overwrite: SYNC_MODE });

  // Codex CLI + OpenCode
  ensureDir(`.agents/skills/${name}`);
  writeFile(`.agents/skills/${name}/SKILL.md`, skillContent(name, desc), { overwrite: SYNC_MODE });
});

console.log('\n[Done] Memory Bank skeleton initialized.');
console.log(`\nMemory Bank initialized in: ${ROOT}`);
