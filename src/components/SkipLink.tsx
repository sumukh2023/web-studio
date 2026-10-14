/**
 * "Skip to main content", rendered first on every page.
 *
 * Without it a keyboard user tabs through the logo and every navigation link
 * before reaching anything the page is about, and does it again on the next
 * page. It targets `#main`, which `RootLayout` puts on its `<main>`.
 * `tabIndex={-1}` on that element is what makes the jump move FOCUS and not
 * merely the viewport: without it the browser scrolls and the next Tab carries
 * on from the link, straight back into the navigation.
 *
 * Visually hidden until focused, then a real pill in the corner: a skip link
 * nobody can see when they need it is not a skip link.
 */
export function SkipLink({ to = '#main' }: { to?: string }) {
  return (
    <a
      href={to}
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:inline-flex focus:min-h-11 focus:items-center focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
    >
      Skip to main content
    </a>
  );
}
