/**
 * Forwards Content-Security-Policy violations to /api/csp-report as JSON.
 *
 * WHY THE BROWSER'S OWN `report-uri` IS NOT ENOUGH. It posts with
 * `Content-Type: application/csp-report`, which the Vercel Node helpers do not
 * parse: `req.body` arrives undefined and the stream is already consumed, so
 * every native report logs as empty. Measured, not assumed. The page reports
 * for itself instead: `securitypolicyviolation` carries the same fields, and a
 * same-origin JSON fetch arrives parsed. `report-uri` stays in the policy for
 * violations that fire before this module loads.
 *
 * TOKENS NEVER LEAVE THE PAGE. URLs are cut to origin + path, and any path
 * segment long enough to be an identifier becomes `:id`, so a link carrying a
 * bearer token in its path cannot write it into a log.
 *
 * Deduplicated per page load and capped at ten, so an extension or a looping
 * widget cannot turn one visit into a burst of requests.
 */

const ENDPOINT = '/api/csp-report';
const MAX_REPORTS_PER_PAGE = 10;

/** `/ticket/9f3c…e1` → `/ticket/:id`. Short, human segments are kept. */
function redactPath(path: string): string {
  return path
    .split('/')
    .map((segment) => (/^[A-Za-z0-9_-]{16,}$/.test(segment) ? ':id' : segment))
    .join('/');
}

/** Origin plus redacted path; never a query string or fragment. Keywords
 *  such as `inline` and `eval` are not URLs and pass through unchanged. */
function redactUrl(value: string): string {
  if (!value) return '';
  try {
    const url = new URL(value, window.location.origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return url.protocol;
    }
    const origin = url.origin === window.location.origin ? '' : url.origin;
    return origin + redactPath(url.pathname);
  } catch {
    return value.slice(0, 64);
  }
}

export function installCspReporter(): void {
  if (typeof window === 'undefined' || !import.meta.env.PROD) return;

  const seen = new Set<string>();

  document.addEventListener('securitypolicyviolation', (event) => {
    /* An extension's own script or style is the extension's business, and
       nothing on this site can fix it. */
    if (/-extension:$/.test(redactUrl(event.sourceFile))) return;

    const report = {
      directive: event.effectiveDirective,
      blocked: redactUrl(event.blockedURI),
      page: redactPath(window.location.pathname),
      source: redactUrl(event.sourceFile),
      line: event.lineNumber,
      column: event.columnNumber,
      disposition: event.disposition,
    };

    const key = `${report.directive} ${report.blocked} ${report.source}:${report.line}`;
    if (seen.has(key) || seen.size >= MAX_REPORTS_PER_PAGE) return;
    seen.add(key);

    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {
      /* A report that cannot be delivered is not the reader's problem. */
    });
  });
}
