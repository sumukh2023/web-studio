#!/usr/bin/env node
/**
 * Create (or reset) an account by hand: the FIRST admin, who cannot be created
 * through an admin API because there is no admin yet.
 *
 *   npm run auth:hash -- you@example.com "Your Name" admin
 *
 * Reads the password from a prompt with echo OFF, never from an argument
 * (arguments land in shell history and the process list). Prints the Argon2id
 * hash and the SQL to paste into the Supabase SQL editor. Parameters match
 * api/_auth.ts exactly, so the site verifies it with no further step.
 */
import { createInterface } from 'node:readline';
import { stdin, stdout, argv, exit } from 'node:process';
import { hash, Algorithm } from '@node-rs/argon2';

const ARGON = { algorithm: Algorithm.Argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
const ROLES = ['member', 'staff', 'admin'];
const MIN_LENGTH = 12;

async function readSecrets(questions) {
  if (!stdin.isTTY) {
    const chunks = [];
    for await (const chunk of stdin) chunks.push(chunk);
    const lines = Buffer.concat(chunks).toString('utf8').split(/\r?\n/);
    return questions.map((_, i) => lines[i] ?? '');
  }
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  const answers = [];
  for (const question of questions) {
    answers.push(
      await new Promise((resolve) => {
        // Redraw the bare prompt on every keystroke so nothing is echoed.
        const hide = () => stdout.write(`\u001b[2K\u001b[200D${question}`);
        stdin.on('data', hide);
        rl.question(question, (answer) => {
          stdin.off('data', hide);
          stdout.write('\n');
          resolve(answer);
        });
      })
    );
  }
  rl.close();
  return answers;
}

const email = (argv[2] ?? '').trim().toLowerCase();
const name = (argv[3] ?? '').trim();
const role = (argv[4] ?? 'member').trim().toLowerCase();
if (!ROLES.includes(role)) {
  console.error(`Role must be one of ${ROLES.join(', ')}, not "${role}".`);
  exit(1);
}

const [password, again] = await readSecrets(['Password (hidden): ', 'Repeat password: ']);
if (password.length < MIN_LENGTH) {
  console.error(`\nPassword must be at least ${MIN_LENGTH} characters.`);
  exit(1);
}
if (password !== again) {
  console.error('\nThe two passwords did not match.');
  exit(1);
}

const phc = await hash(password, ARGON);
console.log('\nArgon2id hash (not reversible):\n');
console.log(phc);

if (email && name) {
  const q = (s) => `'${s.replace(/'/g, "''")}'`;
  console.log('\nSQL for the Supabase editor:\n');
  console.log(
    `insert into public.accounts (full_name, email, password_hash, role, active)\n` +
      `values (${q(name)}, ${q(email)}, ${q(phc)}, ${q(role)}, true)\n` +
      `on conflict ((lower(email))) do update\n` +
      `  set password_hash = excluded.password_hash, role = ${q(role)}, active = true,\n` +
      `      failed_attempts = 0, locked_until = null, updated_at = now();`
  );
  console.log('\nRe-running for the same email RESETS that password and unlocks it.');
} else {
  console.log('\nPass an email and name for the full SQL:\n  npm run auth:hash -- you@example.com "Your Name" admin');
}
