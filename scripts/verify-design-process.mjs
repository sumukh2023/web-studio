#!/usr/bin/env node
/**
 * Design-process gate (Webfinity 2026).
 *
 * Enforces the mandatory workflow the impeccable slop detector CANNOT see:
 *   - no reuse of the quarantined example section skeleton,
 *   - real animation (the motion-primitives library is actually used),
 *   - a recorded design brief from ui-ux-pro-max.
 *
 * It stays out of the way of the pristine starter: while src/App.tsx still
 * carries the FROM-SCRATCH-SHELL sentinel, there is nothing to verify and the
 * gate passes. The moment a real page is built (sentinel removed), it activates.
 *
 * Exit 0 = pass, 1 = fail. No dependencies.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const RED = '\x1b[31m', GRN = '\x1b[32m', YEL = '\x1b[33m', DIM = '\x1b[2m', RST = '\x1b[0m';
const fail = [];
const ok = (m) => console.log(`${GRN}✓${RST} ${m}`);

function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (['.ts', '.tsx'].includes(extname(p))) out.push(p);
  }
  return out;
}

const appPath = 'src/App.tsx';
const app = existsSync(appPath) ? readFileSync(appPath, 'utf8') : '';
const SENTINEL = 'FROM-SCRATCH-SHELL';

if (app.includes(SENTINEL)) {
  console.log(`${DIM}Design gate: App is the from-scratch shell — nothing to verify yet. Pass.${RST}`);
  process.exit(0);
}

const files = existsSync('src') ? walk('src') : [];
const importsOf = (re) => files.filter((f) => re.test(readFileSync(f, 'utf8')));

// 1) No reuse of the quarantined example skeleton
const reused = importsOf(/from\s+['"](@\/sections|.*examples\/landing-demo).*['"]/);
if (reused.length) {
  fail.push(
    `Reuses the quarantined example section skeleton (that is the old slop). Offending files:\n    ${reused.join('\n    ')}\n  Build the page from scratch; do not import examples/landing-demo.`
  );
} else ok('No reuse of the example section skeleton.');

// 2) Real animation: the motion-primitives library must actually be used
const usesMotion = importsOf(/from\s+['"]@\/components\/motion(\/|['"])/);
if (!usesMotion.length) {
  fail.push(
    `Uses ZERO motion primitives. This starter builds ANIMATED sites — compose\n  at least a few components from src/components/motion/ (TextEffect, AnimatedGroup,\n  BorderTrail, InView, …). Static walls of cards are the slop we are avoiding.`
  );
} else ok(`Motion primitives in use (${usesMotion.length} file(s) import @/components/motion).`);

// 3) A recorded ui-ux-pro-max design brief must exist
const brief = '.design/brief.md';
if (!existsSync(brief) || readFileSync(brief, 'utf8').trim().length < 120) {
  fail.push(
    `Missing/empty ${brief}. Record the ui-ux-pro-max result before building:\n  the chosen STYLE, PALETTE (hex + token names), and FONT PAIRING. Run:\n    python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<brief>" --design-system -p "<Project>"\n  and paste the result into ${brief}.`
  );
} else ok('Design brief recorded (.design/brief.md).');

if (fail.length) {
  console.log(`\n${RED}✗ Design-process gate failed:${RST}`);
  fail.forEach((f, i) => console.log(`\n${RED}${i + 1}.${RST} ${f}`));
  console.log(`\n${YEL}This gate enforces the CLAUDE.md workflow. Emergency bypass: git push --no-verify${RST}`);
  process.exit(1);
}
console.log(`\n${GRN}✓ Design-process gate passed.${RST}`);
process.exit(0);
