#!/usr/bin/env node
/**
 * Prove starter packs install cleanly, without touching this checkout.
 *
 *   npm run pack:test                 every pack at once
 *   npm run pack:test -- router seo   just these (plus their requirements)
 *   npm run pack:test -- --each       every pack on its own, one copy each
 *
 * Copies the project into a temporary directory, installs the packs there,
 * then runs the same gates a contributor runs: typecheck, lint, build,
 * design-process gate, impeccable slop detector and pack doctor. A pack that only works next to some
 * other pack, or that breaks the build the moment it lands, fails here
 * instead of in somebody's first session.
 */
import { cpSync, mkdtempSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const each = args.includes('--each');
const keep = args.includes('--keep');
const named = args.filter((a) => !a.startsWith('--'));
const all = readdirSync(join(ROOT, 'packs')).filter((n) =>
  existsSync(join(ROOT, 'packs', n, 'pack.json'))
);

const SKIP = new Set(['node_modules', '.git', 'dist', 'dist-prerender', '.cache']);

function run(cwd, cmd, cmdArgs) {
  const r = spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit', env: process.env });
  return r.status === 0;
}

function trial(packs) {
  const dir = mkdtempSync(join(tmpdir(), 'web-studio-packs-'));
  console.log(`\n\x1b[1m▶ ${packs.join(', ')}\x1b[0m  \x1b[2m${dir}\x1b[0m`);
  cpSync(ROOT, dir, {
    recursive: true,
    filter: (src) => !SKIP.has(src.slice(ROOT.length + 1).split(/[\\/]/)[0]),
  });
  // Reuse the installed tree; `pack:add` then installs only what is new.
  if (existsSync(join(ROOT, 'node_modules')))
    cpSync(join(ROOT, 'node_modules'), join(dir, 'node_modules'), {
      recursive: true,
      verbatimSymlinks: true,
    });

  const steps = [
    ['pack:add', ['node', ['scripts/pack.mjs', 'add', ...packs]]],
    ['typecheck', ['npm', ['run', 'typecheck']]],
    ['lint', ['npm', ['run', 'lint']]],
    ['build', ['npm', ['run', 'build']]],
    ['design:check', ['npm', ['run', 'design:check']]],
    ['slop:check', ['npm', ['run', 'slop:check']]],
    ['pack:doctor', ['npm', ['run', 'pack:doctor']]],
  ];
  for (const [label, [cmd, cmdArgs]] of steps) {
    if (!run(dir, cmd, cmdArgs)) {
      console.error(`\x1b[31m✗ ${packs.join(', ')}: ${label} failed (kept at ${dir})\x1b[0m`);
      return false;
    }
  }
  if (!keep) rmSync(dir, { recursive: true, force: true });
  console.log(`\x1b[32m✓ ${packs.join(', ')}\x1b[0m`);
  return true;
}

const targets = named.length ? named : all;
const results = each ? targets.map((p) => trial([p])) : [trial(targets)];
process.exit(results.every(Boolean) ? 0 : 1);
