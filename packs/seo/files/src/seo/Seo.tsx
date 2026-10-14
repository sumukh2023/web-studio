import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import config from './seo.config.json';

/**
 * The head, per route: title, description, canonical, robots, Open Graph,
 * Twitter card, and JSON-LD. Render ONCE inside the router; it renders no UI.
 *
 * ONE SOURCE OF TRUTH. `seo.config.json` is read here, by the prerender
 * (which routes get a static file) and by the sitemap (which routes are
 * nominated). A page added to the router but not to the config is titled
 * "Page not found" and marked noindex, loudly, rather than shipping with the
 * previous page's head.
 *
 * Why this matters even though Google runs JavaScript: the scrapers behind
 * link previews on WhatsApp, Slack, X and LinkedIn mostly do NOT. Without the
 * prerender every shared URL previews with the same generic title and no
 * image. The prerender runs this component at build time and keeps its head.
 */

type RouteMeta = {
  path: string;
  title: string;
  description: string;
  /** `false`: public and prerendered, but `noindex, follow` and absent from the sitemap (step two of a flow, a lookup form). */
  sitemap?: boolean;
  /** Structured data for this page only (schema.org objects). */
  jsonLd?: Record<string, unknown>[];
  sources?: string[];
};

const ROUTES = new Map((config.routes as RouteMeta[]).map((r) => [r.path, r]));
const ORIGIN = config.origin.replace(/\/+$/, '');
const PRIVATE = new RegExp(
  `^(${config.privatePrefixes.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(/|$)`
);

const normalise = (pathname: string) =>
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;

/** Upsert by selector, so navigating never accumulates duplicate tags. */
function tag(selector: string, create: () => HTMLElement, attrs: Record<string, string>) {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}
const meta = (key: 'name' | 'property', id: string, content: string) =>
  tag(`meta[${key}="${id}"]`, () => {
    const m = document.createElement('meta');
    m.setAttribute(key, id);
    return m;
  }, { content });

export function Seo() {
  const { pathname } = useLocation();
  const path = normalise(pathname);
  const route = ROUTES.get(path);
  const isPrivate = PRIVATE.test(path);

  useEffect(() => {
    /* The home title leads with the site name and nothing in front of it:
       search engines read the run before the first separator as a site-name
       candidate. Inner pages carry the site name as a suffix. */
    const name = route ? route.title : isPrivate ? '' : 'Page not found';
    const title = name ? `${name}${config.titleSeparator}${config.siteName}` : config.siteName;
    const description =
      route?.description ??
      (isPrivate
        ? config.routes[0]?.description ?? ''
        : 'That address is not a page on this site.');

    document.title = title;
    meta('name', 'description', description);

    /* The canonical is the path WITHOUT query or hash. Private paths point at
       the home page: a token in a path must never be published as canonical. */
    const canonical = `${ORIGIN}${route ? path : '/'}`;
    tag('link[rel="canonical"]', () => {
      const l = document.createElement('link');
      l.setAttribute('rel', 'canonical');
      return l;
    }, { href: canonical });

    // Most restrictive first: private or unknown, then unlisted, then open.
    meta(
      'name',
      'robots',
      !route || isPrivate ? 'noindex, nofollow' : route.sitemap === false ? 'noindex, follow' : 'index, follow'
    );

    const image = `${ORIGIN}${config.socialImage.path}`;
    meta('property', 'og:title', title);
    meta('property', 'og:description', description);
    meta('property', 'og:url', canonical);
    meta('property', 'og:type', 'website');
    meta('property', 'og:site_name', config.siteName);
    meta('property', 'og:locale', config.locale);
    meta('property', 'og:image', image);
    meta('property', 'og:image:alt', config.socialImage.alt);
    /* Declared size lets a scraper lay the card out BEFORE fetching the
       image; without it Facebook/LinkedIn often show a small card, or none,
       on the first share. */
    meta('property', 'og:image:width', String(config.socialImage.width));
    meta('property', 'og:image:height', String(config.socialImage.height));
    meta('name', 'twitter:card', 'summary_large_image');
    meta('name', 'twitter:title', title);
    meta('name', 'twitter:description', description);
    meta('name', 'twitter:image', image);
    meta('name', 'twitter:image:alt', config.socialImage.alt);
    if (config.twitterHandle) meta('name', 'twitter:site', config.twitterHandle);
  }, [path, route, isPrivate]);

  /* JSON-LD as JSX, so React owns its lifetime and a re-run cannot duplicate
     it. The prerender moves these blocks into <head>. Structured data is a
     claim about THIS page, so it only appears where the config puts it; the
     WebSite block (the site name Google shows) only on the home page. */
  const blocks: Record<string, unknown>[] = [
    ...(path === '/'
      ? [{ '@context': 'https://schema.org', '@type': 'WebSite', name: config.siteName, url: `${ORIGIN}/` }]
      : []),
    ...(route?.jsonLd ?? []),
  ];
  if (!blocks.length) return null;
  return (
    <>
      {blocks.map((block, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Content comes from the config file in this repo, not from users.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(block).replace(/</g, '\\u003c') }}
        />
      ))}
    </>
  );
}
