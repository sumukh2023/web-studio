#!/usr/bin/env node
/**
 * Swap Google Fonts for self-hosted @fontsource packages.
 *
 *   npm run fonts:self-host -- "Inter:400,500,600" "Space Grotesk:500,700" [--italic] [--latin-only]
 *
 * 1. npm-installs @fontsource/<family> for each family.
 * 2. Writes src/styles/fonts.ts importing ONLY the latin + latin-ext subsets
 *    of the weights you name.
 * 3. Imports it from src/main.tsx and removes the Google Fonts <link> and
 *    preconnect tags from index.html.
 *
 * WHY ONLY LATIN + LATIN-EXT. `@fontsource/x/400.css` is the every-subset
 * entry: on a real site it put cyrillic, greek and vietnamese rules into a
 * render-blocking stylesheet, 44 of 68 @font-face rules for alphabets the site
 * never printed. Browsers never DOWNLOAD the unused woff2 (unicode-range), but
 * every visitor PARSES the CSS before first paint. latin-ext stays because
 * forms take names, and a surname is not limited to the site's language.
 * Pass --latin-only if the site takes no free-text names.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const italic = args.includes('--italic');
const subsets = args.includes('--latin-only') ? ['latin'] : ['latin', 'latin-ext'];
const specs = args
  .filter((a) => !a.startsWith('--'))
  .map((spec) => {
    const [family, weights = '400'] = spec.split(':');
    return {
      family: family.trim(),
      pkg: `@fontsource/${family.trim().toLowerCase().replace(/\s+/g, '-')}`,
      weights: weights.split(',').map((w) => w.trim()).filter(Boolean),
    };
  });

if (!specs.length) {
  console.error('Usage: npm run fonts:self-host -- "Inter:400,500,600" "Sora:600,700" [--italic] [--latin-only]');
  console.error('Use the families from tailwind.config.ts fontFamily (the ones ui-ux-pro-max chose).');
  process.exit(1);
}

const install = spawnSync('npm', ['install', '--no-audit', '--no-fund', ...specs.map((s) => s.pkg)], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (install.status !== 0) {
  console.error('npm install failed. Is every family name spelled as on fonts.google.com?');
  process.exit(1);
}

const imports = [];
const missing = [];
for (const { pkg, weights } of specs) {
  for (const weight of weights)
    for (const style of italic ? ['', '-italic'] : [''])
      for (const subset of subsets) {
        const file = `${subset}-${weight}${style}.css`;
        if (existsSync(join(ROOT, 'node_modules', pkg, file))) imports.push(`import '${pkg}/${file}';`);
        else if (subset === 'latin') missing.push(`${pkg} has no ${weight}${style} (${file})`);
      }
}
if (missing.length) {
  console.error(`Not available:\n  ${missing.join('\n  ')}`);
  process.exit(1);
}

writeFileSync(
  join(ROOT, 'src/styles/fonts.ts'),
  `/**\n * Self-hosted fonts (fonts pack): same origin, no third-party request,\n * ${subsets.join(' + ')} subsets only. Regenerate with npm run fonts:self-host.\n */\n${imports.join('\n')}\n`
);

const mainPath = join(ROOT, 'src/main.tsx');
const main = readFileSync(mainPath, 'utf8');
if (!main.includes("import './styles/fonts';")) {
  writeFileSync(
    mainPath,
    main.includes("import './styles/globals.css';")
      ? main.replace("import './styles/globals.css';", "import './styles/fonts';\nimport './styles/globals.css';")
      : `import './styles/fonts';\n${main}`
  );
}

const htmlPath = join(ROOT, 'index.html');
const html = readFileSync(htmlPath, 'utf8')
  .replace(/[ \t]*<!--[^>]*[Ff]onts[^>]*-->\n/g, '')
  .replace(/[ \t]*<link[^>]+fonts\.(googleapis|gstatic)\.com[^>]*\/?>\n/g, '')
  .replace(/[ \t]*<link\s+href="https:\/\/fonts\.googleapis\.com[\s\S]*?\/>\n/g, '')
  .replace(/\n{3,}/g, '\n\n');
writeFileSync(htmlPath, html);

console.log(`\n✓ ${imports.length} font files self-hosted via src/styles/fonts.ts; Google Fonts removed from index.html.`);
console.log('  If the security-headers pack is installed, drop fonts.googleapis.com / fonts.gstatic.com from the CSP.');
