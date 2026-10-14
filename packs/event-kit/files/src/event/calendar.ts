import event from './event.json';

/**
 * Which calendar "Add to calendar" should open, so the visitor's OWN calendar
 * offers to add ONE event (never a subscription to a separate calendar).
 *
 * - `apple` (iPhone, iPad, Mac): the .ics file over https, served
 *   `text/calendar` + inline (vercel.json). iOS opens Calendar's event card.
 *   (A `webcal://` link would subscribe instead, which is what this avoids.)
 * - `google` (Android, Windows, Linux, anything else): Google Calendar's
 *   event template, which opens the app on Android and the web elsewhere.
 *
 * Android is tested FIRST: its browsers report a Linux platform. iPad Safari
 * reports a Mac, which needs nothing special since both get the file.
 */
export type CalendarTarget = 'apple' | 'google';

export function calendarTarget(
  nav: Pick<Navigator, 'userAgent' | 'platform'> | undefined = typeof navigator === 'undefined'
    ? undefined
    : navigator
): CalendarTarget {
  if (!nav) return 'google';
  const ua = nav.userAgent ?? '';
  if (/Android/i.test(ua)) return 'google';
  if (/iPhone|iPad|iPod|Macintosh/i.test(ua)) return 'apple';
  if (/Windows|Linux|CrOS|X11/i.test(ua)) return 'google';
  if (/^(iP|Mac)/i.test(nav.platform ?? '')) return 'apple';
  return 'google';
}

/** `2026-11-14T10:00:00+05:30` -> `20261114T100000`, the template's wall-clock form. */
const wall = (iso: string) => iso.slice(0, 19).replace(/[-:]/g, '');

/** Wall-clock times + `ctz`, so the entry reads the organiser's hours anywhere. */
export const GOOGLE_CALENDAR_URL =
  'https://calendar.google.com/calendar/render?' +
  new URLSearchParams({
    action: 'TEMPLATE',
    text: event.name,
    dates: `${wall(event.start)}/${wall(event.end)}`,
    ctz: event.timeZone,
    details: event.description,
    location: event.location,
  }).toString();

export const calendarHref = (target: CalendarTarget) =>
  target === 'apple' ? event.calendarFile : GOOGLE_CALENDAR_URL;
