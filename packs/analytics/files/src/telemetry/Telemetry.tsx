import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { scrubEvent } from './scrub';

/**
 * Vercel Web Analytics (page views, no cookies) and Speed Insights (real-user
 * Core Web Vitals), mounted once. Enable both in the Vercel dashboard
 * (Project -> Analytics / Speed Insights); in dev they log and send nothing.
 *
 * NEVER PASS `route` TO <Analytics>: that switches it to `disableAutoTrack`,
 * after which it only records a page view when BOTH `route` and `path` are
 * given, so `route` alone silently reports nothing.
 */
export function Telemetry() {
  return (
    <>
      <Analytics beforeSend={scrubEvent} />
      <SpeedInsights beforeSend={scrubEvent} />
    </>
  );
}
