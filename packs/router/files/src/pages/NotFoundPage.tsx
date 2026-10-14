import { Link } from 'react-router-dom';

/**
 * The address that is not a page. Rendered by the catch-all route, and by the
 * `seo` pack's prerender into dist/404.html so an unknown URL answers a real
 * HTTP 404 before any JavaScript runs.
 *
 * Restyle it for the brief, but keep: one h1, a way home, and no dead end.
 */
export default function NotFoundPage() {
  return (
    <main
      id="main"
      tabIndex={-1}
      className="grid min-h-[100dvh] place-items-center px-6 outline-none"
    >
      <div className="max-w-md text-center">
        <p className="font-heading text-sm font-semibold tabular-nums text-muted-foreground">404</p>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          This page does not exist
        </h1>
        <p className="mt-4 text-muted-foreground">
          The link may be old, or the address mistyped. Everything on the site is one click from home.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-[filter] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
