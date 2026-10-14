#!/usr/bin/env node
/**
 * Guard rails for supabase/migrations/, from mistakes that reached production.
 *
 *   npm run db:check
 *
 * FAILS on:
 *   - a filename that is not `<14-digit timestamp>_<snake_case>.sql`. A
 *     date-only prefix (`20260811_x.sql`) sorts ALPHABETICALLY against other
 *     files from the same day, so the order on disk is not the order the
 *     files were meant to run in. That is how a function got rebuilt from a
 *     superseded definition.
 *   - two migrations with the same timestamp (order between them undefined).
 *
 * WARNS on:
 *   - a migration edited after it was first committed. Once a file has been
 *     applied anywhere it is history; change the database with a NEW forward
 *     migration built from the live definition, never by editing an old one.
 */
import { readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'supabase', 'migrations');
if (!existsSync(DIR)) {
  console.log('[db:check] no supabase/migrations directory; nothing to check.');
  process.exit(0);
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.sql')).sort();
const errors = [];
const warnings = [];
const stamps = new Map();

for (const file of files) {
  const match = /^(\d{14})_[a-z0-9_]+\.sql$/.exec(file);
  if (!match) {
    errors.push(
      `${file}: name it <YYYYMMDDHHMMSS>_<snake_case>.sql (e.g. ${new Date()
        .toISOString()
        .replace(/\D/g, '')
        .slice(0, 14)}_add_orders.sql)`
    );
    continue;
  }
  if (stamps.has(match[1]))
    errors.push(`${file}: same timestamp as ${stamps.get(match[1])}; order is undefined`);
  stamps.set(match[1], file);

  try {
    const commits = execFileSync('git', ['log', '--format=%h', '--', join(DIR, file)], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .trim()
      .split('\n')
      .filter(Boolean);
    if (commits.length > 1)
      warnings.push(
        `${file}: changed in ${commits.length} commits. If it was already applied anywhere, write a new migration instead.`
      );
  } catch {
    /* no git: skip the history check */
  }
}

for (const w of warnings) console.warn(`\x1b[33m! ${w}\x1b[0m`);
if (errors.length) {
  for (const e of errors) console.error(`\x1b[31m✗ ${e}\x1b[0m`);
  process.exit(1);
}
console.log(`\x1b[32m✓ ${files.length} migrations, uniquely and correctly ordered.\x1b[0m`);
