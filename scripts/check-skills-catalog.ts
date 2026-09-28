#!/usr/bin/env node
/**
 * Validates the SaaSCodex skill catalog (`skills/<name>/SKILL.md`).
 *
 * Hard requirements (fail the check):
 *   - every skill folder has a SKILL.md with YAML frontmatter;
 *   - frontmatter declares a non-empty `name` and `description`;
 *   - names are kebab-case and unique across the catalog.
 *
 * Advisory (printed, does not fail): skills whose body has no markdown heading.
 *
 * Run: pnpm check:skills
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const skillsRoot = resolve(process.cwd(), 'skills');

const dirs: string[] = readdirSync(skillsRoot).filter((name: string) => {
  if (name.startsWith('_') || name.startsWith('.')) return false;
  try {
    return statSync(join(skillsRoot, name)).isDirectory();
  } catch {
    return false;
  }
});

const hard: string[] = [];
const advisory: string[] = [];
const names = new Map<string, string>();

function frontmatter(source: string): string | null {
  if (!source.startsWith('---')) return null;
  const end = source.indexOf('\n---', 3);
  return end < 0 ? null : source.slice(3, end);
}

for (const dir of dirs) {
  const file = join(skillsRoot, dir, 'SKILL.md');
  let source: string;
  try {
    source = readFileSync(file, 'utf8');
  } catch {
    hard.push(`${dir}: no SKILL.md`);
    continue;
  }
  const fm = frontmatter(source);
  if (fm == null) {
    hard.push(`${dir}: missing frontmatter`);
    continue;
  }
  const nameMatch = fm.match(/^name:\s*(.+)$/m);
  const name = nameMatch ? nameMatch[1]!.trim().replace(/^["']|["']$/g, '') : '';
  const hasDescription = /^description:\s*(.+)$/m.test(fm);
  if (!name) hard.push(`${dir}: no frontmatter name`);
  if (!hasDescription) hard.push(`${dir}: no frontmatter description`);
  if (name && !/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    hard.push(`${dir}: name "${name}" is not kebab-case`);
  }
  if (name) {
    const previous = names.get(name);
    if (previous) hard.push(`${dir}: duplicate name "${name}" (also ${previous})`);
    else names.set(name, dir);
  }
  if (!/^#\s/m.test(source)) advisory.push(dir);
}

console.log(`skills scanned: ${dirs.length}  (unique names: ${names.size})`);
if (advisory.length > 0) {
  console.log(`advisory: ${advisory.length} skill(s) without a markdown heading (ok, cosmetic)`);
}
if (hard.length > 0) {
  console.log(`FAIL: ${hard.length} problem(s):`);
  for (const problem of hard) console.log(`  - ${problem}`);
  process.exit(1);
}
console.log('PASS: every skill declares a unique name and a description');
