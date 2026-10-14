/**
 * AVIF + WebP siblings for every JPEG/PNG under public/, before Vite starts.
 *
 *   npm run images:encode     (also runs automatically before dev and build)
 *
 * - Originals are NEVER rewritten; variants go to public/_optimized/ (ignored).
 * - A variant is offered only when it is SMALLER than its original.
 * - Content-hashed (bytes + encoder options + versions), so unchanged images
 *   reuse their cached variants; a damaged cache entry is re-encoded.
 * - Writes are atomic and never follow a symlink out of the checkout.
 * - Icons and favicons are skipped (see `skip`); animated images are skipped.
 *
 * src/components/Picture.tsx reads the manifest and serves the variants.
 */
import { createHash, randomUUID } from 'node:crypto';
import {
  lstat,
  mkdir,
  readdir,
  readFile,
  realpath,
  rename,
  unlink,
  writeFile,
} from 'node:fs/promises';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const options = {
  avif: { quality: 60, effort: 4 },
  webp: { quality: 82, effort: 4 },
};
// Files the browser fetches by exact name (icons) gain nothing from a variant.
const skip = /^(?:apple-touch-icon|favicon|icon-|maskable-|og-image)/i;
const ownedVariant = /^[a-f0-9]{24}\.(?:avif|webp)$/;
const samePath = (left, right) =>
  process.platform === 'win32'
    ? left.toLowerCase() === right.toLowerCase()
    : left === right;

async function inspect(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

async function safeDirectory(root, directory) {
  // Walk before creating, not after mkdir({ recursive: true }): the latter
  // could already have created a directory outside this checkout through an
  // existing junction. Generated output belongs here, never behind a link.
  let current = root;
  for (const part of relative(root, directory).split(/[\\/]/).filter(Boolean)) {
    if (part === '..')
      throw new Error('Image output must remain inside the checkout.');
    current = join(current, part);
    const info = await inspect(current);
    if (info && (!info.isDirectory() || info.isSymbolicLink())) {
      throw new Error(`Refusing redirected output directory: ${current}`);
    }
    if (!info) await mkdir(current);
    if (!samePath(await realpath(current), resolve(current))) {
      throw new Error(`Refusing redirected output directory: ${current}`);
    }
  }
}

async function regularOutput(path) {
  const info = await inspect(path);
  if (info && (!info.isFile() || info.isSymbolicLink())) {
    throw new Error(`Refusing non-regular generated file: ${path}`);
  }
  return info;
}

async function atomicWrite(path, content) {
  await regularOutput(path);
  const temporary = join(
    dirname(path),
    `.${basename(path)}.${randomUUID()}.tmp`
  );
  try {
    // A killed encode must not leave a nonempty but half-written image that
    // the next build mistakes for a cache hit. Rename only complete files;
    // replacing a regular destination also avoids writing through hardlinks.
    await writeFile(temporary, content, { flag: 'wx' });
    await rename(temporary, path);
  } finally {
    await unlink(temporary).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
    });
  }
}

async function photos(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || entry.name === '_optimized') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await photos(path)));
    else if (
      entry.isFile() &&
      /\.(jpe?g|png)$/i.test(entry.name) &&
      !skip.test(entry.name)
    )
      result.push(path);
  }
  return result.sort();
}

async function cachedSize(path, format, width, height) {
  const info = await regularOutput(path);
  if (!info?.size) return undefined;
  try {
    // Buffers avoid libvips retaining file handles across validation. On
    // Windows a cached read handle can otherwise prevent the atomic repair
    // or removal of a generated file later in this same build.
    const decoder = sharp(await readFile(path), { failOn: 'warning' });
    const metadata = await decoder.metadata();
    const expectedFormat =
      format === 'avif'
        ? metadata.format === 'heif' && metadata.compression === 'av1'
        : metadata.format === 'webp';
    if (
      !expectedFormat ||
      metadata.width !== width ||
      metadata.height !== height
    )
      return undefined;
    // A readable header alone cannot prove that a cached file is complete.
    // Decode its pixels as well so an interrupted/manual truncation repairs
    // itself during the build rather than becoming a broken picture online.
    await decoder.stats();
    return info.size;
  } catch {
    return undefined;
  }
}

export async function encodeImages({
  root = defaultRoot,
  log = console.log,
} = {}) {
  root = resolve(root);
  if (!samePath(await realpath(root), root))
    throw new Error('Refusing a redirected checkout.');
  const publicDir = join(root, 'public');
  const outputDir = join(publicDir, '_optimized');
  const manifestFile = join(root, 'src/generated/image-variants.json');
  await safeDirectory(root, outputDir);
  await safeDirectory(root, dirname(manifestFile));
  await regularOutput(manifestFile);

  sharp.concurrency(2);
  const manifest = {};
  const currentFiles = new Set();
  let originals = 0;
  let avifBytes = 0;
  let webpBytes = 0;
  for (const path of await photos(publicDir)) {
    const input = await readFile(path);
    const source = '/' + relative(publicDir, path).split('\\').join('/');
    const metadata = await sharp(input).metadata();
    // Animated artwork is deliberately not flattened to its first frame.
    if ((metadata.pages ?? 1) > 1) continue;
    const swapped = metadata.orientation >= 5 && metadata.orientation <= 8;
    const width = swapped ? metadata.height : metadata.width;
    const height = swapped ? metadata.width : metadata.height;
    const hash = createHash('sha256')
      .update(input)
      .update(JSON.stringify(options))
      .update(JSON.stringify(sharp.versions))
      .digest('hex')
      .slice(0, 24);
    const variants = {};
    const sizes = {};
    for (const format of ['avif', 'webp']) {
      const filename = `${hash}.${format}`;
      const target = join(outputDir, filename);
      currentFiles.add(filename);
      let size = await cachedSize(target, format, width, height);
      if (!size) {
        const encoded = await sharp(input)
          .rotate()
          [format](options[format])
          .toBuffer();
        await atomicWrite(target, encoded);
        size = encoded.length;
      }
      // A modern format that is larger is not an optimisation. The browser
      // still gets its original in this case, even though a valid cached
      // derivative is kept so the next local run need not encode it again.
      if (size < input.length) variants[format] = `/_optimized/${filename}`;
      sizes[format] = Math.min(size, input.length);
    }
    manifest[source] = variants;
    originals += input.length;
    avifBytes += sizes.avif;
    webpBytes += sizes.webp;
  }
  const manifestText = JSON.stringify(manifest, null, 2) + '\n';
  const previousText = await readFile(manifestFile, 'utf8').catch((error) => {
    if (error.code !== 'ENOENT') throw error;
    return '';
  });
  if (manifestText !== previousText)
    await atomicWrite(manifestFile, manifestText);

  // This exact directory and filename convention are owned by this build
  // step. Remove only obsolete regular derivatives, never source images,
  // subdirectories, links or unrelated files. Otherwise every photo edit
  // would leave another full pair for Vite to copy into the next deployment.
  let removed = 0;
  for (const entry of await readdir(outputDir, { withFileTypes: true })) {
    if (!ownedVariant.test(entry.name) || currentFiles.has(entry.name))
      continue;
    const target = join(outputDir, entry.name);
    await regularOutput(target);
    await unlink(target);
    removed += 1;
  }
  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
  log(
    `Images: ${Object.keys(manifest).length} originals preserved (${mb(originals)} MiB).`
  );
  log(
    `AVIF selection: ${mb(avifBytes)} MiB; WebP selection: ${mb(webpBytes)} MiB.`
  );
  log(
    `Variants generated locally; ${removed} obsolete generated files removed. No source edits or uploads.`
  );
  return { manifest, originals, avifBytes, webpBytes, removed };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  await encodeImages();
}
