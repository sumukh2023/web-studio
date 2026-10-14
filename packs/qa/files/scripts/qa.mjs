#!/usr/bin/env node
/**
 * Look at the BUILT site the way visitors will, at phone and desktop width.
 *
 *   npm run build && npm run qa                 every route in seo.config.json (or /)
 *   npm run qa -- / /about --url http://localhost:5173   specific routes, a running server
 *
 * For each route at 390px and 1440px (reduced motion on, so screenshots show
 * finished states):
 *   FAIL  horizontal overflow (the #1 mobile bug), uncaught page errors,
 *         console errors, same-origin requests answering 4xx/5xx,
 *         not exactly one <h1>, not exactly one <main>, <img> without alt,
 *         buttons/links with no accessible name
 *   WARN  tap targets under 44x44 on the phone width
 * Screenshots land in .cache/qa/<route>@<width>.png. Exit 1 on any FAIL.
 *
 * Chromium: uses Playwright's own browser if installed, else $QA_CHROMIUM,
 * else an installed Google Chrome, else /opt/pw-browsers (cloud sessions).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, '.cache', 'qa');
const args = process.argv.slice(2);
const urlFlag = args.indexOf('--url');
let base = urlFlag === -1 ? null : args[urlFlag + 1];
const routes = args.filter((a, i) => a.startsWith('/') && args[i - 1] !== '--url');
const seoConfig = join(ROOT, 'src/seo/seo.config.json');
const ROUTES = routes.length
  ? routes
  : existsSync(seoConfig)
    ? JSON.parse(readFileSync(seoConfig, 'utf8')).routes.map((r) => r.path)
    : ['/'];
const WIDTHS = [
  { name: 'phone', width: 390, height: 844, mobile: true },
  { name: 'desktop', width: 1440, height: 900, mobile: false },
];

async function launch() {
  const attempts = [
    () => chromium.launch(),
    () => (process.env.QA_CHROMIUM ? chromium.launch({ executablePath: process.env.QA_CHROMIUM }) : Promise.reject()),
    () => chromium.launch({ channel: 'chrome' }),
    () => {
      const dir = '/opt/pw-browsers';
      const found = existsSync(dir) && readdirSync(dir).find((d) => /^chromium-\d+$/.test(d));
      return found
        ? chromium.launch({ executablePath: join(dir, found, 'chrome-linux', 'chrome') })
        : Promise.reject();
    },
  ];
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch {
      /* next */
    }
  }
  console.error('No Chromium found. Run `npx playwright install chromium`, or set QA_CHROMIUM=/path/to/chrome.');
  process.exit(1);
}

async function startPreview() {
  if (!existsSync(join(ROOT, 'dist', 'index.html'))) {
    console.error('No dist/ build. Run `npm run build` first (or pass --url for a running server).');
    process.exit(1);
  }
  const child = spawn('npx', ['vite', 'preview', '--port', '4319', '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
    shell: process.platform === 'win32',
  });
  const url = 'http://localhost:4319';
  for (let i = 0; i < 50; i += 1) {
    try {
      if ((await fetch(url)).ok) return { url, child };
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  child.kill();
  console.error('vite preview did not start on :4319.');
  process.exit(1);
}

let preview = null;
if (!base) {
  preview = await startPreview();
  base = preview.url;
}
mkdirSync(OUT, { recursive: true });
const browser = await launch();
const fails = [];
const warns = [];

for (const route of ROUTES) {
  for (const vp of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    const where = `${route} @${vp.width}`;
    page.on('pageerror', (e) => fails.push(`${where}: uncaught ${e.message.split('\n')[0]}`));
    /* /api/* needs `vercel dev` and /_vercel/* (analytics scripts) only
       exists on a Vercel deployment, so neither is judged here. */
    const platformOnly = (url) => {
      try {
        return /^\/(api|_vercel)\//.test(new URL(url).pathname);
      } catch {
        return false;
      }
    };
    page.on('console', (m) => {
      if (m.type() === 'error' && !platformOnly(m.location()?.url ?? ''))
        fails.push(`${where}: console error ${m.text().slice(0, 160)}`);
    });
    page.on('response', (r) => {
      const u = new URL(r.url());
      if (u.origin === new URL(base).origin && r.status() >= 400 && !platformOnly(r.url()))
        fails.push(`${where}: ${r.status()} ${u.pathname}`);
    });
    await page.goto(base + route, { waitUntil: 'networkidle' }).catch((e) => fails.push(`${where}: ${e.message}`));
    /* Scroll the whole page once, as a reader would, so `whileInView`
       reveals fire and lazy images load; otherwise everything below the
       fold is captured at opacity 0 and the screenshot lies. */
    await page.evaluate(async () => {
      const step = Math.max(200, window.innerHeight * 0.8);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(400);

    const report = await page.evaluate(() => {
      const doc = document.documentElement;
      const named = (el) =>
        (el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.textContent || el.getAttribute('title') || '').trim() ||
        el.querySelector('img[alt]:not([alt=""]), svg[aria-label]');
      const visible = (el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
      };
      const offenders = [...document.body.querySelectorAll('*')]
        .filter((el) => el.getBoundingClientRect().right > doc.clientWidth + 1 && visible(el))
        .slice(0, 3)
        .map((el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : ''}`);
      return {
        overflow: doc.scrollWidth > doc.clientWidth + 1 ? { by: doc.scrollWidth - doc.clientWidth, offenders } : null,
        h1: document.querySelectorAll('h1').length,
        main: document.querySelectorAll('main, [role="main"]').length,
        imgNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).map((i) => i.src.slice(-40)),
        unnamed: [...document.querySelectorAll('button, a[href]')].filter((el) => visible(el) && !named(el)).length,
        small: [...document.querySelectorAll('button, a[href], input, select, textarea')]
          .filter(visible)
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width < 44 || r.height < 44;
          }).length,
      };
    });

    if (report.overflow) fails.push(`${where}: horizontal overflow by ${report.overflow.by}px (${report.overflow.offenders.join(', ')})`);
    if (report.h1 !== 1) fails.push(`${where}: ${report.h1} <h1> elements (want exactly 1)`);
    if (report.main !== 1) fails.push(`${where}: ${report.main} <main> landmarks (want exactly 1)`);
    if (report.imgNoAlt.length) fails.push(`${where}: images without alt: ${report.imgNoAlt.join(', ')}`);
    if (report.unnamed) fails.push(`${where}: ${report.unnamed} buttons/links without an accessible name`);
    if (vp.mobile && report.small) warns.push(`${where}: ${report.small} tap targets smaller than 44x44`);

    const file = `${route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_')}@${vp.width}.png`;
    await page.screenshot({ path: join(OUT, file), fullPage: true }).catch(() => {});
    await context.close();
  }
}

await browser.close();
preview?.child.kill();

for (const w of [...new Set(warns)]) console.warn(`\x1b[33m! ${w}\x1b[0m`);
const unique = [...new Set(fails)];
for (const f of unique) console.error(`\x1b[31m✗ ${f}\x1b[0m`);
console.log(`\nScreenshots: .cache/qa/ (${ROUTES.length} routes x ${WIDTHS.length} widths)`);
if (unique.length) process.exit(1);
console.log(`\x1b[32m✓ ${ROUTES.length} routes clean at 390px and 1440px.\x1b[0m`);
