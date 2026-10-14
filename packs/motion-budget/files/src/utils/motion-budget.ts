/**
 * HOW MUCH MOTION THIS DEVICE GETS, decided once and read everywhere.
 *
 * An animated site carries a lot of optional motion: parallax layers, blurred
 * edges, a cursor spotlight, counters, a sheen. All of it is pleasant on a
 * laptop and all of it is a tax on a budget Android phone with one bar of
 * signal, which is exactly the phone a real visitor often has. So every
 * effect declares what it costs, and this decides what the device can afford.
 *
 * THREE LEVELS, and the middle one is the interesting one.
 *
 *   still  The reader asked for no motion (prefers-reduced-motion), or the
 *          hardware is so tight that any decoration is the wrong call.
 *          Everything is drawn in its final state. Nothing moves except what
 *          carries meaning — a spinner, a progress bar.
 *   lite   The normal experience. Cheap motion only: fades, slides, a colour change, a
 *          number ticking. No blur, no parallax, no continuous loop, no
 *          per-frame work tied to the pointer or the scroll position.
 *   full   An explicit inspection mode for richer optional effects.
 *
 * WHY `lite` IS NORMAL. An idle frame sample did not predict how the page behaved once video, scrolling and
 * interaction began together; auto-upgrading after load made capable devices
 * pay for every optional effect at once and feel LESS responsive. `allowFull`
 * opts a build into promoting clearly capable desktops (fine pointer, 8+
 * cores, 8 GB+), for briefs where the rich layer is the point.
 *
 * NOTHING HERE READS THE USER AGENT. A string that says "iPhone" says nothing
 * about what this particular device can draw this particular second, and the
 * string is a lie often enough that treating it as a capability is how sites
 * end up shipping a slideshow to a flagship and a blur to a budget phone.
 *
 * A reader's reduced-motion or Data Saver preference still lowers the budget
 * to `still`. `?motion=full` remains available for deliberate review, but the
 * automatic path never promotes itself into rich motion.
 */

export type MotionBudget = 'still' | 'lite' | 'full';

/** The order, so a demotion can be expressed as "no higher than". */
const RANK: Record<MotionBudget, number> = { still: 0, lite: 1, full: 2 };

export const lowest = (a: MotionBudget, b: MotionBudget): MotionBudget =>
  RANK[a] <= RANK[b] ? a : b;

/** `?motion=lite` and friends, for looking at one level deliberately. */
export function overrideFromLocation(search: string): MotionBudget | null {
  const asked = new URLSearchParams(search).get('motion');
  return asked === 'still' || asked === 'lite' || asked === 'full'
    ? asked
    : null;
}

type Nav = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

/**
 * The opening guess, from what the browser will tell us for free.
 *
 * Every signal here is optional and absent in some browser, so each is read
 * defensively and none of them alone decides anything.
 */
export function initialBudget(
  win: Window = window,
  nav: Nav = navigator as Nav,
  { allowFull = false }: { allowFull?: boolean } = {}
): MotionBudget {
  const asks = (query: string) => {
    try {
      return win.matchMedia(query).matches;
    } catch {
      return false;
    }
  };

  if (asks('(prefers-reduced-motion: reduce)')) return 'still';

  /* DATA SAVER IS A STATED PREFERENCE, not a guess about hardware, and it is
     the reader's preference rather than the browser's: honour it like the
     motion one. */
  if (nav.connection?.saveData) return 'still';

  const memory = nav.deviceMemory;
  const cores = nav.hardwareConcurrency;
  /* 2GB of RAM or two cores is not a phone that should also be compositing a
     blurred layer behind a scrolling map. Chrome rounds `deviceMemory` down to
     0.25/0.5/1/2/4/8, so `<= 2` is a real floor rather than a fuzzy one. */
  if (
    (memory !== undefined && memory <= 2) ||
    (cores !== undefined && cores <= 2)
  )
    return 'still';

  const slowNetwork = /^(slow-)?2g$/.test(nav.connection?.effectiveType ?? '');
  if (slowNetwork) return 'lite';

  /* `lite` is the normal experience. Rich motion is available as the
     explicit `?motion=full` inspection mode, or automatically for clearly
     capable desktops when the build opts in with `allowFull`. */
  if (
    allowFull &&
    asks('(pointer: fine)') &&
    (cores ?? 0) >= 8 &&
    (memory === undefined || memory >= 8)
  )
    return 'full';
  return 'lite';
}
