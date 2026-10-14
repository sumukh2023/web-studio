/**
 * Time left until an instant, as a person would say it.
 *
 * A file of its own (not inside a component) so the date arithmetic can be
 * checked by handing it instants, rather than by reading a screen at whatever
 * time it happens to be. Date maths is the part of a countdown that is quietly
 * wrong for weeks.
 */
import event from './event.json';

export const OPENS_AT = Date.parse(event.start);

/** The event's own UTC offset in ms, from the ISO string (`+05:30`). */
const OFFSET_MS = (() => {
  const m = /([+-])(\d{2}):(\d{2})$/.exec(event.start);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) * 60_000 : 0;
})();

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** `d` plus `n` calendar months, clamped to the landing month's last day (31 Jan + 1 = 28/29 Feb). */
function addMonths(d: Date, n: number): Date {
  const day = d.getUTCDate();
  const landed = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds())
  );
  const last = new Date(Date.UTC(landed.getUTCFullYear(), landed.getUTCMonth() + 1, 0)).getUTCDate();
  landed.setUTCDate(Math.min(day, last));
  return landed;
}

export type Remaining = { months: number; days: number; hours: number; minutes: number; seconds: number };

/**
 * Time left before `target`, or `null` once it has passed (the caller renders
 * something else entirely; a countdown that subtracts past zero is impossible).
 *
 * MONTHS ARE CALENDAR MONTHS, not 30-day blocks, decomposed in the EVENT's
 * local time, so every visitor sees the organiser's numbers whatever their
 * own timezone. Every unit is floored: the last second shown is 01, never 00.
 */
export function remaining(nowMs: number, target: number = OPENS_AT): Remaining | null {
  if (nowMs >= target) return null;
  const from = new Date(nowMs + OFFSET_MS);
  const to = new Date(target + OFFSET_MS);
  let months = 0;
  while (addMonths(from, months + 1).getTime() <= to.getTime()) months += 1;
  let rest = to.getTime() - addMonths(from, months).getTime();
  const days = Math.floor(rest / DAY);
  rest -= days * DAY;
  const hours = Math.floor(rest / HOUR);
  rest -= hours * HOUR;
  const minutes = Math.floor(rest / MINUTE);
  rest -= minutes * MINUTE;
  return { months, days, hours, minutes, seconds: Math.floor(rest / SECOND) };
}

/** Singular where the figure is 1, so no cell reads "1 months". */
export const UNITS: { key: keyof Remaining; one: string; many: string }[] = [
  { key: 'months', one: 'month', many: 'months' },
  { key: 'days', one: 'day', many: 'days' },
  { key: 'hours', one: 'hour', many: 'hours' },
  { key: 'minutes', one: 'minute', many: 'minutes' },
  { key: 'seconds', one: 'second', many: 'seconds' },
];

/** "2 months, 4 days and 3 hours": for screen readers and the noscript head. */
export function spoken(r: Remaining): string {
  const parts = UNITS.filter(({ key }) => key !== 'seconds' && r[key] > 0).map(
    ({ key, one, many }) => `${r[key]} ${r[key] === 1 ? one : many}`
  );
  if (!parts.length) return 'less than a minute';
  return parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}
