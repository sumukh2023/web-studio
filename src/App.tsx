// ⚠️ FROM-SCRATCH SHELL — Webfinity 2026.
// Do NOT reuse examples/landing-demo/ as a page skeleton (that is the old
// template slop). Build the page for THIS brief from scratch, composing the
// primitives in src/components/ + src/components/motion/ per CLAUDE.md's
// mandatory design workflow. Remove this shell (and the sentinel below) once
// you start building — the design-process gate activates when it's gone.
import { RootLayout } from '@/layouts/RootLayout';

export default function App() {
  return (
    <RootLayout chrome={false}>
      <main className="grid min-h-screen place-items-center p-8">
        <div className="max-w-md text-center">
          <p className="font-heading text-sm font-semibold uppercase tracking-widest text-primary">
            Webfinity 2026
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">
            From-scratch shell
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Build this page for the brief from scratch. Follow the mandatory
            workflow in CLAUDE.md: query ui-ux-pro-max, set a direction with
            taste-skill, compose from the primitives and the motion library,
            run review-animations, then the impeccable detector.
          </p>
        </div>
      </main>
      {/* FROM-SCRATCH-SHELL */}
    </RootLayout>
  );
}
