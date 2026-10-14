#!/usr/bin/env node
/**
 * Every favicon and app icon from ONE source image.
 *
 *   npm run favicons -- src/assets/logo.svg [--background "#ffffff"] [--name "Site"]
 *
 * Writes to public/:
 *   favicon.ico            16/32/48. Safari and crawlers request /favicon.ico
 *                          whatever the page declares; with an SPA rewrite a
 *                          MISSING one is answered with index.html (HTTP 200,
 *                          text/html), which browsers draw as a blank box.
 *   favicon-96.png         transparent PNG for browsers that prefer PNG.
 *   apple-touch-icon.png   180, OPAQUE and padded: iOS composites transparency
 *                          on BLACK and rounds the corners itself.
 *   icon-192.png, icon-512.png   transparent, `purpose: any`.
 *   maskable-512.png       OPAQUE and padded hard: Android crops maskable
 *                          icons to a circle/squircle that may keep only the
 *                          central 80%. A logo edge-to-edge gets clipped.
 *   site.webmanifest       wires the PNGs up for "Add to Home Screen".
 * Prints the <link> tags to paste into index.html.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const source = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!source) {
  console.error('Usage: npm run favicons -- <source.svg|png> [--background "#ffffff"] [--name "Site"]');
  process.exit(1);
}
const background = flag('background', '#ffffff');
const name = flag('name', 'Web Studio');
const input = await readFile(join(ROOT, source));

/** The source fitted into a square of `size`, with `pad` (0-0.5) of margin. */
async function icon(size, { pad = 0, opaque = false } = {}) {
  const inner = Math.round(size * (1 - pad * 2));
  const art = await sharp(input, { density: 512 })
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: opaque ? background : { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: art, gravity: 'centre' }])
    .png()
    .toBuffer();
}

/** An ICO is a tiny directory of embedded PNGs (supported since Vista). */
function ico(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = 6 + 16 * pngs.length;
  const entries = pngs.map(({ size, data }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

const write = (file, data) => writeFile(join(OUT, file), data);
await write('favicon-96.png', await icon(96));
await write('apple-touch-icon.png', await icon(180, { pad: 0.1, opaque: true }));
await write('icon-192.png', await icon(192));
await write('icon-512.png', await icon(512));
await write('maskable-512.png', await icon(512, { pad: 0.2, opaque: true }));
await write(
  'favicon.ico',
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await icon(size) }))))
);
await write(
  'site.webmanifest',
  `${JSON.stringify(
    {
      name,
      short_name: name,
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      theme_color: background,
      background_color: background,
      display: 'browser',
    },
    null,
    2
  )}\n`
);

console.log(`Icons written to public/. Paste into index.html <head>:

    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" type="image/png" href="/favicon-96.png" sizes="96x96" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <link rel="manifest" href="/site.webmanifest" />
`);
