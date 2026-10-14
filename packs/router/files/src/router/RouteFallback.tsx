/**
 * What shows while a lazy page's chunk downloads. Deliberately quiet: on a
 * fast connection it is visible for a frame or two, and a spinner that flashes
 * reads as a glitch. Full height, so the footer does not jump up and back.
 */
export function RouteFallback() {
  return (
    <div role="status" aria-live="polite" className="grid min-h-[100dvh] place-items-center">
      <span className="sr-only">Loading page</span>
      <span aria-hidden="true" className="h-1 w-16 animate-pulse rounded-full bg-muted" />
    </div>
  );
}
