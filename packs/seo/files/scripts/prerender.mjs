#!/usr/bin/env node
/**
 * Build-time prerendering of the public routes' <head>.
 *
 * WHAT THIS SOLVES. `vite build` emits one index.html whose body is an empty
 * #root, and <Seo /> writes the title, description, canonical, Open Graph and
 * JSON-LD in an effect, i.e. only after JavaScript runs. Google renders and
 * sees them; the scrapers behind WhatsApp/Slack/X/LinkedIn previews mostly do
 * not, so every shared URL previews identically with no image.
 *
 * HOW. The real app (built as one classic script by vite.prerender.config.mjs)
 * runs against a DOM (jsdom) per route, and the resulting head is written to
 * dist/<route>/index.html. Not React SSR (no server-safe rewrite of the app)
 * and not a headless browser (no Chromium download inside the deploy).
 *
 * ONLY THE HEAD IS SHIPPED. main.tsx uses createRoot().render(), which does not
 * hydrate: prerendered body markup would be painted, discarded and rebuilt, a
 * visible flash. And a body snapshot captures whatever transient state the app
 * happened to be in on the build machine. The head is deterministic and is
 * where the value is. A <noscript> block carries the page's own h1,
 * description and real nav links for crawlers that run no JavaScript.
 *
 * SAFETY. A route that fails keeps the ordinary SPA shell and the build
 * carries on. A prerender step must never be able to take the site down.
 */
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const config = JSON.parse(await readFile(join(ROOT, 'src/seo/seo.config.json'), 'utf8'));
const ROUTES = config.routes.map((r) => r.path);
const PRIVATE = new RegExp(
  `^(${config.privatePrefixes.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(/|$)`
);
const PRERENDER_BUNDLE = '/__prerender-app.js';

/**
 * The untouched `vite build` shell, read ONCE before anything is written.
 * `/` is rendered first and overwrites dist/index.html; if later routes read
 * that file they would inherit its head (duplicated JSON-LD, the home page's
 * noscript block). Every render starts from this pristine copy instead.
 */
let SHELL = null;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

/** A static server over dist/, standing in for the hosting. */
function serveDist() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent((req.url || '/').split('?')[0]);
    if (path === PRERENDER_BUNDLE) {
      res.writeHead(200, { 'content-type': MIME['.js'] });
      return res.end(await readFile(join(ROOT, 'dist-prerender', 'app.js')));
    }
    // Media and platform scripts never change the head. A 404 (not an empty
    // 200, which a <video> treats as a decode error) leaves components in
    // their ordinary waiting state.
    if (path.startsWith('/_vercel/') || /\.(mp4|webm|mov)$/i.test(path)) {
      res.writeHead(404, { 'content-type': 'text/plain' });
      return res.end('not served during prerender');
    }
    const candidate = join(DIST, path);
    if (existsSync(candidate) && extname(candidate)) {
      res.writeHead(200, { 'content-type': MIME[extname(candidate)] ?? 'application/octet-stream' });
      return res.end(await readFile(candidate));
    }
    res.writeHead(200, { 'content-type': MIME['.html'] });
    res.end(SHELL);
  });
  return new Promise((resolve) =>
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }))
  );
}

/**
 * Browser APIs jsdom lacks, stubbed just enough.
 *
 * IntersectionObserver REPORTS EVERYTHING AS ON SCREEN, so `whileInView`
 * reveals reach their finished state. `fetch` resolves as unavailable: every
 * well-written caller renders its empty state, the build never depends on an
 * API being up, and an undefined fetch can no longer throw inside an effect
 * and tear the React tree down.
 */
function installShims(win) {
  win.matchMedia ??= (query) => ({
    matches: /min-width|pointer:\s*fine|hover:\s*hover/.test(query),
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  });
  win.IntersectionObserver = class {
    constructor(cb) {
      this.cb = cb;
    }
    observe(target) {
      this.cb([{ target, isIntersecting: true, intersectionRatio: 1, boundingClientRect: {}, intersectionRect: {}, rootBounds: null, time: 0 }], this);
    }
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  };
  win.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  win.scrollTo = () => {};
  win.scrollBy = () => {};
  win.HTMLElement.prototype.scrollIntoView = () => {};
  win.HTMLMediaElement.prototype.play = () => Promise.resolve();
  win.HTMLMediaElement.prototype.pause = () => {};
  win.HTMLMediaElement.prototype.load = () => {};
  win.DOMMatrixReadOnly ??= class {
    constructor() {
      this.m41 = 0;
      this.m42 = 0;
    }
  };
  win.fetch = async () => ({
    ok: false,
    status: 503,
    statusText: 'unavailable during prerender',
    headers: { get: () => null },
    json: async () => ({}),
    text: async () => '',
  });
  win.crypto ??= {};
  win.crypto.randomUUID ??= () => '00000000-0000-4000-8000-000000000000';
}

async function render(port, route) {
  const virtualConsole = new VirtualConsole();
  for (const event of ['jsdomError', 'error', 'warn']) virtualConsole.on(event, () => {});
  const dom = new JSDOM(SHELL, {
    url: `http://127.0.0.1:${port}${route}`,
    runScripts: 'dangerously',
    resources: 'usable',
    pretendToBeVisual: true,
    virtualConsole,
  });
  installShims(dom.window);
  // The production module script stays untouched in the document; this
  // classic copy is what jsdom actually runs.
  const boot = dom.window.document.createElement('script');
  boot.src = PRERENDER_BUNDLE;
  dom.window.document.body.appendChild(boot);

  // Finished = the app has mounted AND written its head.
  const deadline = Date.now() + 20000;
  let ok = false;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 150));
    const d = dom.window.document;
    const rooted = (d.getElementById('root')?.childElementCount ?? 0) > 0;
    const headed =
      !!d.querySelector('link[rel="canonical"]') &&
      !!d.querySelector('meta[property="og:title"]') &&
      !!d.querySelector('meta[name="description"]');
    if (rooted && headed) {
      ok = true;
      break;
    }
  }
  if (ok) await new Promise((r) => setTimeout(r, 600));
  boot.remove();
  const html = ok ? headOnly(dom) : null;
  dom.window.close();
  return html;
}

/**
 * What a crawler that runs no JavaScript is left with: the page's OWN h1,
 * description and real nav links, inside <noscript>. Every string is lifted
 * from the render (never written for crawlers), which keeps it a fallback and
 * not cloaking. With scripting on, browsers parse <noscript> as text, so it
 * cannot add a second h1 or shift layout.
 */
function noscriptFallback(doc) {
  // Accessible text, not textContent: skip aria-hidden decorative copies
  // (TextEffect renders words twice) and keep CSS-gap word breaks.
  const text = (node) => {
    const gather = (n) => {
      if (n.nodeType === 3) return n.nodeValue ?? '';
      if (n.nodeType !== 1 || n.getAttribute?.('aria-hidden') === 'true') return '';
      return [...n.childNodes].map(gather).join(' ');
    };
    return node
      ? gather(node).replace(/\s+/g, ' ').replace(/\s+([,.;:!?’'”)\]])/g, '$1').replace(/([(\[“])\s+/g, '$1').trim()
      : '';
  };
  const heading = text(doc.querySelector('#root h1'));
  if (!heading) return null;
  const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  const links = new Map();
  for (const a of doc.querySelectorAll('#root a[href^="/"]')) {
    const href = a.getAttribute('href');
    const label = text(a);
    // Never advertise a private route to a crawler.
    if (!href || !label || href.includes('#') || PRIVATE.test(href)) continue;
    if (!links.has(href)) links.set(href, label);
  }
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const list = [...links].map(([h, l]) => `<li><a href="${esc(h)}">${esc(l)}</a></li>`).join('');
  return (
    `<noscript><h1>${esc(heading)}</h1>` +
    (description ? `<p>${esc(description)}</p>` : '') +
    (list ? `<nav aria-label="Pages"><ul>${list}</ul></nav>` : '') +
    '</noscript>'
  );
}

function headOnly(dom) {
  const doc = dom.window.document;
  // JSON-LD renders inside #root (it is JSX); rescue it into <head> BEFORE the
  // body is emptied, or the structured data is thrown away with it.
  for (const script of doc.querySelectorAll('script[type="application/ld+json"]')) doc.head.appendChild(script);
  const fallback = noscriptFallback(doc);
  const root = doc.getElementById('root');
  if (root) root.innerHTML = '';
  // Outside #root: React empties that container on mount.
  if (fallback && root) {
    const holder = doc.createElement('div');
    holder.innerHTML = fallback;
    if (holder.firstElementChild) root.parentNode.insertBefore(holder.firstElementChild, root);
  }
  // The splash (splash pack) is removed by main.tsx after first paint, which
  // happened in jsdom too. Put the shell's copy back so first paint is covered.
  if (!doc.getElementById('splash') && root) {
    const match = /<div id="splash"[\s\S]*?<\/div>\s*<\/div>|<div id="splash"[\s\S]*?<\/div>/.exec(SHELL);
    if (match) {
      const holder = doc.createElement('div');
      holder.innerHTML = match[0];
      if (holder.firstElementChild) root.parentNode.insertBefore(holder.firstElementChild, root);
    }
  }
  return `<!doctype html>\n${doc.documentElement.outerHTML}`;
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('[prerender] dist/index.html not found; run `vite build` first.');
    process.exit(1);
  }
  if (!existsSync(join(ROOT, 'dist-prerender', 'app.js'))) {
    console.error('[prerender] dist-prerender/app.js not found; run `vite build --config vite.prerender.config.mjs`.');
    process.exit(1);
  }
  // Idempotent when re-run on its own output: strip what a previous run added.
  SHELL = (await readFile(join(DIST, 'index.html'), 'utf8'))
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
    .replace(/<noscript>[\s\S]*?<\/noscript>/g, '');

  const { server, port } = await serveDist();
  const results = [];
  for (const route of ROUTES) {
    let html = null;
    try {
      html = await render(port, route);
    } catch (error) {
      results.push({ route, ok: false, reason: String(error).slice(0, 80) });
      continue;
    }
    if (!html) {
      results.push({ route, ok: false, reason: 'did not settle' });
      continue;
    }
    const target = route === '/' ? join(DIST, 'index.html') : join(DIST, route, 'index.html');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, html, 'utf8');
    results.push({ route, ok: true, bytes: html.length });
  }

  /* dist/404.html, rendered from the app's own catch-all route, so Vercel can
     answer an unknown path with the branded page at a real HTTP 404 (when no
     catch-all rewrite intercepts it first; see packs/router/README.md). */
  try {
    const notFound = await render(port, '/__prerender-not-found');
    if (notFound) {
      await writeFile(join(DIST, '404.html'), notFound, 'utf8');
      results.push({ route: '404.html', ok: true, bytes: notFound.length });
    } else results.push({ route: '404.html', ok: false, reason: 'did not settle' });
  } catch (error) {
    results.push({ route: '404.html', ok: false, reason: String(error).slice(0, 80) });
  }
  server.close();

  for (const r of results)
    console.log(
      r.ok
        ? `  ok    ${r.route.padEnd(24)} ${(r.bytes / 1024).toFixed(1)} kB`
        : `  SKIP  ${r.route.padEnd(24)} ${r.reason} (SPA shell left in place)`
    );
  const good = results.filter((r) => r.ok).length;
  console.log(`[prerender] ${good}/${results.length} prerendered.`);
  // Exit 0 even with skips: a skipped route behaves exactly as before this existed.
}

await main();
