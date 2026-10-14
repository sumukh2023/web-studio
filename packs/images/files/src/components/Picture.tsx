import { forwardRef, useState, type ImgHTMLAttributes } from 'react';

/**
 * An image element, upgraded: the browser picks AVIF or WebP when it can, the
 * original otherwise. Same props as a plain image element; use it for any
 * photo that lives in public/.
 *
 * The manifest comes from scripts/encode-images.mjs (images pack). An absent
 * manifest is valid in a fresh checkout and simply renders the original.
 * A failed variant retries the original, so nothing ever renders broken.
 */
type Manifest = Record<string, { avif?: string; webp?: string }>;
// An absent manifest is valid in a fresh checkout: render the original image.
// Build/dev scripts generate it BEFORE Vite resolves this glob.
function loadManifest(): Manifest {
  // Vite expands this literal glob. Standalone esbuild/jsdom audits do not
  // implement Vite macros; those deliberately exercise the original fallback.
  try {
    const manifests = import.meta.glob<Manifest>(
      '../generated/image-variants.json',
      {
        eager: true,
        import: 'default',
      }
    );
    return Object.values(manifests)[0] ?? {};
  } catch {
    return {};
  }
}
const manifest = loadManifest();

function variantsForSource(src: string) {
  // The manifest records filesystem names, while an existing caller may use
  // a URL-encoded spelling such as /team%20photo.jpg. Decode only the
  // lookup key, never the actual img src: its original URL must survive a
  // failed derivative unchanged. External URLs and query-dependent images
  // keep their own delivery rules, and malformed escapes simply fall back.
  if (!src.startsWith('/') || src.startsWith('//') || /[?#]/.test(src))
    return undefined;
  try {
    return manifest[decodeURIComponent(src)];
  } catch {
    return undefined;
  }
}

/** Native format selection, preserving existing dimensions, loading and refs. */
export const Picture = forwardRef<
  HTMLImageElement,
  ImgHTMLAttributes<HTMLImageElement>
>(function Picture({ src, srcSet, onError, fetchPriority, ...props }, ref) {
  const [failedSource, setFailedSource] = useState<string | undefined>();
  const variants =
    src && !srcSet && failedSource !== src ? variantsForSource(src) : undefined;
  return (
    <picture style={{ display: 'contents' }}>
      {variants?.avif && <source type="image/avif" srcSet={variants.avif} />}
      {variants?.webp && <source type="image/webp" srcSet={variants.webp} />}
      <img
        key={`${src}:${failedSource === src ? 'fallback' : 'preferred'}`}
        {...props}
        // React 18 does not recognise the camel-case fetchPriority prop yet.
        // Forward the native lowercase attribute so critical hero images keep
        // their scheduling hint without a warning on every development render.
        {...(fetchPriority ? { fetchpriority: fetchPriority } : {})}
        ref={ref}
        src={src}
        srcSet={srcSet}
        onError={(event) => {
          if (variants && (variants.avif || variants.webp))
            setFailedSource(src);
          else onError?.(event);
        }}
      />
    </picture>
  );
});
