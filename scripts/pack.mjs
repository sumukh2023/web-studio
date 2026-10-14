#!/usr/bin/env node
/**
 * Starter packs: opt-in features that live in packs/<name>/ until a build
 * needs them, then get installed into the project in one command.
 *
 *   npm run pack:list                     what exists, what is installed
 *   npm run pack:info -- <name>           what a pack does and how to wire it
 *   npm run pack:add -- <name> [<name>…]  install (with its requirements)
 *        --dry-run      print the plan, change nothing
 *        --force        overwrite a project file that differs from the pack's
 *        --no-install   skip the `npm install` at the end
 *   npm run pack:doctor                   check installed packs are intact
 *
 * WHY A PACK IS NOT JUST "COPY THE FOLDER". Most of what a feature needs is new
 * files, which is easy. The rest is a handful of edits to files the project
 * already owns: a dependency, a build hook, a header in vercel.json, a line in
 * .env.example, a provider around <App />. Those are where hand-wiring goes
 * wrong, so every one of them is declared in pack.json and applied here,
 * idempotently: running `pack:add` twice changes nothing the second time.
 *
 * Nothing here needs a dependency. It is plain Node so it runs before
 * `npm install` and in any session, local or cloud.
 *
 * pack.json fields (all optional except name/title/summary):
 *   requires         other packs installed first
 *   dependencies     merged into package.json, never downgrading an existing one
 *   devDependencies  same
 *   scripts          added if the project has no script of that name
 *   chainScripts     appended to an existing script with `&&` (pre/post hooks,
 *                    typecheck), or created if absent
 *   vercel           deep-merged into vercel.json; arrays are unioned
 *   env              lines appended to .env.example under a pack header
 *   gitignore        lines appended to .gitignore
 *   inject           [{ file, marker, lines }]: lines inserted after the line
 *                    holding `marker` (see src/main.tsx, index.html)
 *   appendCss        a file inside the pack appended to src/styles/globals.css
 *   next             manual steps printed after install
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKS = join(ROOT, 'packs');
const LOCK = join(ROOT, 'packs.lock.json');

const c = {
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
};

function fail(message) {
  console.error(c.red(`✗ ${message}`));
  process.exit(1);
}

const readJson = (file, fallback) =>
  existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback;
const writeJson = (file, value) =>
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

function loadPacks() {
  if (!existsSync(PACKS)) return new Map();
  const packs = new Map();
  for (const name of readdirSync(PACKS).sort()) {
    const manifest = join(PACKS, name, 'pack.json');
    if (!existsSync(manifest)) continue;
    const pack = readJson(manifest);
    if (pack.name !== name)
      fail(`packs/${name}/pack.json names itself "${pack.name}"`);
    pack.dir = join(PACKS, name);
    packs.set(name, pack);
  }
  return packs;
}

const lock = () => readJson(LOCK, { packs: {} });

/** Every file under packs/<name>/files, as repo-relative paths. */
function packFiles(pack) {
  const base = join(pack.dir, 'files');
  if (!existsSync(base)) return [];
  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else out.push(relative(base, full));
    }
  };
  walk(base);
  return out;
}

/** Requirements first, each pack once, cycles reported. */
function resolveOrder(names, packs) {
  const order = [];
  const visiting = new Set();
  const visit = (name, from) => {
    const pack = packs.get(name);
    if (!pack)
      fail(
        `No pack named "${name}"${from ? ` (required by ${from})` : ''}. Run npm run pack:list.`
      );
    if (order.includes(name)) return;
    if (visiting.has(name)) fail(`Requirement cycle through "${name}"`);
    visiting.add(name);
    for (const req of pack.requires ?? []) visit(req, name);
    visiting.delete(name);
    order.push(name);
  };
  for (const name of names) visit(name);
  return order;
}

/* ------------------------------------------------------------------ */
/*  Merges                                                             */
/* ------------------------------------------------------------------ */

/** Major version of a semver range, for "never downgrade" comparisons. */
const major = (range) => Number(/(\d+)/.exec(String(range))?.[1] ?? 0);

function mergeDeps(target = {}, add = {}, log) {
  const out = { ...target };
  for (const [dep, range] of Object.entries(add)) {
    if (!(dep in out)) {
      out[dep] = range;
      log.push(`+ ${dep}@${range}`);
    } else if (major(out[dep]) < major(range)) {
      log.push(
        c.yellow(
          `! ${dep} is ${out[dep]} here, the pack was written against ${range}`
        )
      );
    }
  }
  return Object.fromEntries(
    Object.entries(out).sort(([a], [b]) => a.localeCompare(b))
  );
}

function mergeScripts(scripts, pack, log) {
  const out = { ...scripts };
  for (const [name, cmd] of Object.entries(pack.scripts ?? {})) {
    if (!(name in out)) {
      out[name] = cmd;
      log.push(`+ script ${name}`);
    } else if (out[name] !== cmd) {
      log.push(c.yellow(`! script "${name}" already exists; kept yours`));
    }
  }
  for (const [name, cmd] of Object.entries(pack.chainScripts ?? {})) {
    if (!(name in out)) {
      out[name] = cmd;
      log.push(`+ script ${name}`);
    } else if (!out[name].includes(cmd)) {
      out[name] = `${out[name]} && ${cmd}`;
      log.push(`~ script ${name} (+ ${cmd})`);
    }
  }
  return out;
}

/** Deep merge for vercel.json: objects recurse, arrays union by value. */
function deepMerge(target, add) {
  if (Array.isArray(target) && Array.isArray(add)) {
    const seen = new Set(target.map((v) => JSON.stringify(v)));
    return [...target, ...add.filter((v) => !seen.has(JSON.stringify(v)))];
  }
  if (
    target &&
    add &&
    typeof target === 'object' &&
    typeof add === 'object' &&
    !Array.isArray(target)
  ) {
    const out = { ...target };
    for (const [k, v] of Object.entries(add))
      out[k] = k in out ? deepMerge(out[k], v) : v;
    return out;
  }
  return target ?? add;
}

function appendBlock(file, header, lines) {
  const path = join(ROOT, file);
  const current = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const missing = lines.filter(
    (line) => line.trim() === '' || !current.includes(line)
  );
  if (!missing.some((l) => l.trim())) return false;
  const block = `${current.endsWith('\n') || !current ? '' : '\n'}\n${header}\n${missing.join('\n')}\n`;
  writeFileSync(path, current + block);
  return true;
}

function inject(spec, dryRun) {
  const path = join(ROOT, spec.file);
  if (!existsSync(path))
    return `! ${spec.file} not found; wire by hand (see the pack README)`;
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n');
  const at = lines.findIndex((l) => l.includes(spec.marker));
  if (at === -1)
    return c.yellow(
      `! marker "${spec.marker}" not in ${spec.file}; wire by hand (see the pack README)`
    );
  // A block is one unit: already present means every line appears, in order,
  // after the marker. Checking lines one by one would skip a `}` or `);`
  // that merely exists elsewhere in the file and corrupt the block.
  let cursor = text.indexOf(spec.marker);
  const present = spec.lines.every((line) => {
    if (!line.trim()) return true;
    const found = text.indexOf(line.trim(), cursor);
    if (found === -1) return false;
    cursor = found + line.trim().length;
    return true;
  });
  if (present) return null;
  const indent = /^\s*/.exec(lines[at])[0];
  lines.splice(at + 1, 0, ...spec.lines.map((l) => (l ? indent + l : l)));
  if (!dryRun) writeFileSync(path, lines.join('\n'));
  return `~ ${spec.file} (${spec.marker})`;
}

/* ------------------------------------------------------------------ */
/*  Commands                                                           */
/* ------------------------------------------------------------------ */

function list() {
  const packs = loadPacks();
  const installed = lock().packs;
  console.log(c.bold(`\nStarter packs (${packs.size})\n`));
  const width = Math.max(...[...packs.keys()].map((n) => n.length));
  for (const pack of packs.values()) {
    const mark = installed[pack.name] ? c.green('●') : c.dim('○');
    const req = pack.requires?.length
      ? c.dim(` (needs ${pack.requires.join(', ')})`)
      : '';
    console.log(`${mark} ${pack.name.padEnd(width)}  ${pack.summary}${req}`);
  }
  console.log(
    c.dim(
      '\n● installed  ○ available    npm run pack:info -- <name>   npm run pack:add -- <name>\n'
    )
  );
}

function info(name) {
  const pack = loadPacks().get(name);
  if (!pack) fail(`No pack named "${name}". Run npm run pack:list.`);
  console.log(`\n${c.bold(pack.title)}  ${c.dim(`(${pack.name})`)}\n`);
  console.log(pack.summary);
  if (pack.when) console.log(`\n${c.bold('Use it when:')} ${pack.when}`);
  if (pack.requires?.length)
    console.log(`${c.bold('Requires:')} ${pack.requires.join(', ')}`);
  const files = packFiles(pack);
  if (files.length) {
    console.log(c.bold('\nAdds:'));
    for (const f of files) console.log(`  ${f}`);
  }
  const deps = Object.keys({
    ...pack.dependencies,
    ...pack.devDependencies,
  });
  if (deps.length) console.log(`${c.bold('Packages:')} ${deps.join(', ')}`);
  const envVars = (pack.env ?? [])
    .map((line) => /^#?\s*([A-Z][A-Z0-9_]+)=/.exec(line)?.[1])
    .filter(Boolean);
  if (envVars.length)
    console.log(`${c.bold('Environment:')} ${envVars.join(', ')}`);
  console.log(`\nFull guide: packs/${pack.name}/README.md\n`);
}

function add(names, flags) {
  if (!names.length) fail('Name at least one pack: npm run pack:add -- <name>');
  const packs = loadPacks();
  const state = lock();
  const order = resolveOrder(names, packs);
  const pkgPath = join(ROOT, 'package.json');
  let pkg = readJson(pkgPath);
  let depsChanged = false;
  const nextSteps = [];

  for (const name of order) {
    const pack = packs.get(name);
    const log = [];
    const already = Boolean(state.packs[name]);

    // 1. Files. Identical files are skipped; a file the project has changed
    //    is never silently replaced.
    const files = packFiles(pack);
    for (const file of files) {
      const src = join(pack.dir, 'files', file);
      const dest = join(ROOT, file);
      if (existsSync(dest)) {
        if (readFileSync(dest).equals(readFileSync(src))) continue;
        if (!flags.force) {
          log.push(
            c.yellow(`! ${file} exists and differs; kept yours (--force to replace)`)
          );
          continue;
        }
      }
      log.push(`+ ${file}`);
      if (!flags.dryRun) {
        mkdirSync(dirname(dest), { recursive: true });
        cpSync(src, dest);
      }
    }

    // 2. package.json
    const before = JSON.stringify(pkg);
    pkg = {
      ...pkg,
      scripts: mergeScripts(pkg.scripts ?? {}, pack, log),
      dependencies: mergeDeps(pkg.dependencies, pack.dependencies, log),
      devDependencies: mergeDeps(pkg.devDependencies, pack.devDependencies, log),
    };
    if (pack.allowScripts)
      pkg.allowScripts = { ...pkg.allowScripts, ...pack.allowScripts };
    if (
      JSON.stringify(pkg.dependencies) !== JSON.stringify(JSON.parse(before).dependencies) ||
      JSON.stringify(pkg.devDependencies) !== JSON.stringify(JSON.parse(before).devDependencies)
    )
      depsChanged = true;

    // 3. vercel.json
    if (pack.vercel) {
      const vPath = join(ROOT, 'vercel.json');
      const current = readJson(vPath, {});
      const merged = deepMerge(current, pack.vercel);
      if (JSON.stringify(merged) !== JSON.stringify(current)) {
        log.push('~ vercel.json');
        if (!flags.dryRun) writeJson(vPath, merged);
      }
    }

    // 4. .env.example and .gitignore
    if (pack.env?.length && !flags.dryRun)
      if (appendBlock('.env.example', `# --- ${name} pack ---`, pack.env))
        log.push('~ .env.example');
    if (pack.gitignore?.length && !flags.dryRun)
      if (appendBlock('.gitignore', `# ${name} pack`, pack.gitignore))
        log.push('~ .gitignore');

    // 5. Injections into marked files
    for (const spec of pack.inject ?? []) {
      const result = inject(spec, flags.dryRun);
      if (result) log.push(result);
    }

    // 6. CSS
    if (pack.appendCss) {
      const css = readFileSync(join(pack.dir, pack.appendCss), 'utf8');
      const guard = `/* pack:${name} */`;
      const target = join(ROOT, 'src/styles/globals.css');
      const current = readFileSync(target, 'utf8');
      if (!current.includes(guard)) {
        log.push('~ src/styles/globals.css');
        if (!flags.dryRun)
          writeFileSync(target, `${current.trimEnd()}\n\n${guard}\n${css}`);
      }
    }

    state.packs[name] = { files };
    console.log(
      `\n${c.bold(already ? `↻ ${name}` : `+ ${name}`)}  ${c.dim(pack.title)}`
    );
    console.log(log.length ? log.map((l) => `  ${l}`).join('\n') : c.dim('  up to date'));
    if (pack.next?.length) nextSteps.push([name, pack.next]);
  }

  if (flags.dryRun) {
    console.log(c.dim('\n(dry run: nothing was written)\n'));
    return;
  }
  writeJson(pkgPath, pkg);
  state.packs = Object.fromEntries(
    Object.entries(state.packs).sort(([a], [b]) => a.localeCompare(b))
  );
  writeJson(LOCK, state);

  if (depsChanged && !flags.noInstall) {
    console.log(c.dim('\nInstalling packages…'));
    const r = spawnSync('npm', ['install', '--no-audit', '--no-fund'], {
      cwd: ROOT,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });
    if (r.status !== 0) fail('npm install failed; fix it and run it again.');
  }

  if (nextSteps.length) {
    console.log(c.bold('\nWire-up still to do:'));
    for (const [name, steps] of nextSteps) {
      console.log(c.bold(`  ${name}`));
      for (const step of steps) console.log(`    - ${step}`);
    }
  }
  console.log(
    c.green(
      `\n✓ Installed: ${order.join(', ')}. Read packs/<name>/README.md for each, then run the gates.\n`
    )
  );
}

function doctor() {
  const packs = loadPacks();
  const installed = lock().packs;
  const pkg = readJson(join(ROOT, 'package.json'));
  const problems = [];
  for (const [name, record] of Object.entries(installed)) {
    const pack = packs.get(name);
    if (!pack) {
      problems.push(`${name}: installed but packs/${name} no longer exists`);
      continue;
    }
    for (const req of pack.requires ?? [])
      if (!installed[req]) problems.push(`${name}: requires "${req}", which is not installed`);
    for (const file of record.files ?? [])
      if (!existsSync(join(ROOT, file)))
        problems.push(`${name}: ${file} is missing (deleted or renamed?)`);
    for (const [dep] of Object.entries({ ...pack.dependencies, ...pack.devDependencies }))
      if (!pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep])
        problems.push(`${name}: package "${dep}" is not in package.json`);
  }
  // Every pack must be well-formed, installed or not: a broken manifest
  // should fail CI before somebody tries to install it.
  for (const pack of packs.values()) {
    for (const key of ['title', 'summary'])
      if (!pack[key]) problems.push(`packs/${pack.name}/pack.json: missing "${key}"`);
    if (!existsSync(join(pack.dir, 'README.md')))
      problems.push(`packs/${pack.name}: missing README.md`);
    for (const req of pack.requires ?? [])
      if (!packs.has(req)) problems.push(`packs/${pack.name}: requires unknown pack "${req}"`);
    if (pack.appendCss && !existsSync(join(pack.dir, pack.appendCss)))
      problems.push(`packs/${pack.name}: appendCss file ${pack.appendCss} missing`);
    // Node scripts are not type-checked or linted inside packs/, so at least
    // prove they parse: a pack must never ship a script that cannot start.
    for (const file of packFiles(pack).filter((f) => /\.(mjs|cjs|js)$/.test(f))) {
      const check = spawnSync(process.execPath, ['--check', join(pack.dir, 'files', file)], {
        encoding: 'utf8',
      });
      if (check.status !== 0)
        problems.push(`packs/${pack.name}: ${file} does not parse: ${check.stderr.split('\n').find((l) => /Error/.test(l)) ?? ''}`);
    }
  }
  if (problems.length) {
    console.error(c.red('Starter pack problems:'));
    for (const p of problems) console.error(`  - ${p}`);
    process.exit(1);
  }
  const n = Object.keys(installed).length;
  console.log(
    c.green(`✓ ${packs.size} packs well-formed; ${n} installed${n ? ` (${Object.keys(installed).join(', ')})` : ''} and intact.`)
  );
}

const [command, ...rest] = process.argv.slice(2);
const flags = {
  dryRun: rest.includes('--dry-run'),
  force: rest.includes('--force'),
  noInstall: rest.includes('--no-install'),
};
const names = rest.filter((a) => !a.startsWith('--'));

switch (command) {
  case 'list':
  case undefined:
    list();
    break;
  case 'info':
    if (!names[0]) fail('Usage: npm run pack:info -- <name>');
    info(names[0]);
    break;
  case 'add':
    add(names, flags);
    break;
  case 'doctor':
    doctor();
    break;
  default:
    fail(`Unknown command "${command}". Use list, info, add or doctor.`);
}
