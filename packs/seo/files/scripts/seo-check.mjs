#!/usr/bin/env node
/**
 * After `npm run build`: does every public route ship the head a crawler and
 * a link-preview scraper need? Exits 1 with a list if not.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const config = JSON.parse(await readFile(join(ROOT, 'src/seo/seo.config.json'), 'utf8'));
const ORIGIN = config.origin.replace(/\/+$/, '');
const problems = [];

if (/example\.com/.test(ORIGIN)) problems.push('seo.config.json: origin is still example.com');
if (!existsSync(join(ROOT, 'public', config.socialImage.path.replace(/^\//, ''))))
  problems.push(`public${config.socialImage.path} (the social image) does not exist`);

const titles = new Map();
for (const route of config.routes) {
  const file = route.path === '/' ? join(DIST, 'index.html') : join(DIST, route.path, 'index.html');
  if (!existsSync(file)) {
    problems.push(`${route.path}: not prerendered (no ${file.slice(ROOT.length + 1)})`);
    continue;
  }
  const html = await readFile(file, 'utf8');
  const need = {
    title: /<title>[^<]+<\/title>/,
    description: /<meta name="description" content="[^"]{30,}"/,
    canonical: new RegExp(`<link rel="canonical" href="${ORIGIN}${route.path === '/' ? '/' : route.path}"`),
    'og:image': /<meta property="og:image" content="https?:\/\//,
    robots: /<meta name="robots" content="[^"]+"/,
  };
  for (const [what, re] of Object.entries(need)) if (!re.test(html)) problems.push(`${route.path}: missing or wrong ${what}`);
  const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
  if (title) {
    if (titles.has(title)) problems.push(`${route.path}: same <title> as ${titles.get(title)}`);
    titles.set(title, route.path);
  }
  if (route.description.length > 160) problems.push(`${route.path}: description is ${route.description.length} chars (aim for <= 160)`);
}
for (const file of ['sitemap.xml', 'robots.txt', '404.html'])
  if (!existsSync(join(DIST, file)) && !(file === 'robots.txt' && existsSync(join(ROOT, 'public/robots.txt'))))
    problems.push(`dist/${file} missing`);

if (problems.length) {
  console.error('\x1b[31mSEO check failed:\x1b[0m');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(`\x1b[32m✓ ${config.routes.length} routes ship a complete head; sitemap, robots and 404 present.\x1b[0m`);
