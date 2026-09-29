#!/usr/bin/env node
/**
 * Packages a SplatStudio release artifact from already-built outputs.
 *
 * Produces, under `dist-release/`:
 *   - splatstudio-<version>.tar.gz   runnable daemon bundle + web export + assets
 *   - SHA256SUMS                   checksum of every artifact
 *
 * The release workflow builds first (`pnpm --filter @splatstudio/web build` and
 * the daemon `deploy` bundle) and passes the bundle path via `--daemon-dir`.
 * Run locally with `pnpm package:release` after a build.
 *
 * Docs: docs/RELEASING.md
 */
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(process.cwd());
const args = process.argv.slice(2);

function arg(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1]! : fallback;
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { version?: string };
const version = arg('version', pkg.version ?? '0.0.0');

// The daemon bundle is whatever `pnpm --filter @splatstudio/daemon deploy`
// produced; default to the workspace build output.
const daemonDir = resolve(root, arg('daemon-dir', 'apps/daemon'));
const outDir = resolve(root, arg('out-dir', 'dist-release'));
const stageName = `splatstudio-${version}`;
const stage = join(outDir, stageName);

if (!existsSync(join(daemonDir, 'dist', 'cli.js'))) {
  console.error(`error: no daemon build at ${join(daemonDir, 'dist', 'cli.js')}`);
  console.error('build first: pnpm --filter @splatstudio/daemon build');
  process.exit(1);
}

rmSync(outDir, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

// Runtime code + data the daemon serves. Directories that have not been built
// (e.g. the web export on a source-only run) are skipped with a warning.
const required: string[] = [];
const optional = [
  'apps/web/out',
  'skills',
  'design-systems',
  'craft',
  'prompt-templates',
  'plugins/_official',
  'data',
  'assets/frames',
  'assets/community-pets',
];

const EXCLUDED_SEGMENTS = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'test-results',
  'tests',
  '__tests__',
]);

function skipHeavy(src: string): boolean {
  return !src.split(/[\\/]/).some((segment) => EXCLUDED_SEGMENTS.has(segment));
}

function copy(rel: string, must: boolean): void {
  const from = join(root, rel);
  if (existsSync(from)) {
    cpSync(from, join(stage, rel), { recursive: true, filter: (src) => skipHeavy(src) });
  } else if (must) {
    console.error(`error: required path missing: ${rel}`);
    process.exit(1);
  } else {
    console.warn(`warn: skipping missing path: ${rel}`);
  }
}

// The daemon bundle is copied to the canonical layout the container uses.
// Prod dependencies are installed by `pnpm deploy` in CI, not copied from the
// workspace symlink farm.
cpSync(daemonDir, join(stage, 'apps/daemon'), {
  recursive: true,
  filter: (src) => skipHeavy(src),
});
required.push('apps/daemon/dist/cli.js');
for (const rel of optional) copy(rel, false);

// Small release-facing files.
for (const rel of ['package.json', 'pnpm-workspace.yaml', 'LICENSE', 'README.md', 'DESIGN.md']) {
  if (existsSync(join(root, rel))) cpSync(join(root, rel), join(stage, basename(rel)));
}
if (existsSync(join(root, 'deploy'))) copy('deploy', false);

// Tarball (deterministic-ish: sorted, gzip).
const tarball = join(outDir, `${stageName}.tar.gz`);
execFileSync('tar', ['-czf', tarball, '-C', outDir, stageName], { stdio: 'inherit' });

function sha256(file: string): string {
  const hash = createHash('sha256');
  hash.update(readFileSync(file));
  return hash.digest('hex');
}

const sums = `${sha256(tarball)}  ${basename(tarball)}\n`;
writeFileSync(join(outDir, 'SHA256SUMS'), sums, 'utf8');

rmSync(stage, { recursive: true, force: true });
console.log(`built ${basename(tarball)} (${version})`);
console.log(sums.trim());
