import { useMemo } from 'react';

/**
 * How much visual work this device should be asked to do.
 *
 * ONE PREDICATE, EVERY CONSUMER. `TextEffect`, `AnimatedGroup` and any
 * blurred surface ask this same question and get the same answer. Two hooks
 * each deciding privately what "a slow phone" means is how a device ends up
 * with cheap glass and expensive text.
 *
 * WHAT IT IS TESTING FOR, and it is deliberately blunt: a narrow viewport, a
 * low core count, little memory, or a session that has asked for less data.
 * None of these is a reliable measure of GPU throughput — the platform does
 * not expose one — but every one of them correlates with the devices where a
 * per-frame filter is the difference between a page that glides and a page
 * that stutters. Read once and memoised: none of these change mid-session,
 * and re-reading them on resize would only produce a hook that re-renders the
 * whole tree when a phone is turned sideways.
 */
export type DeviceTier = 'full' | 'lite';

export function readDeviceTier(): DeviceTier {
  if (typeof window === 'undefined') return 'full';
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };
  const small = window.matchMedia('(max-width: 767px)').matches;
  const lowCpu = (navigator.hardwareConcurrency ?? 8) <= 4;
  const lowMem = (nav.deviceMemory ?? 8) <= 4;
  const saveData = nav.connection?.saveData === true;
  return small || lowCpu || lowMem || saveData ? 'lite' : 'full';
}

export function useDeviceTier(): DeviceTier {
  return useMemo(readDeviceTier, []);
}

/**
 * Should this device animate `filter: blur()`?
 *
 * THE MOST EXPENSIVE THING A TYPICAL PAGE ANIMATES. A blur is not a
 * compositor property: opacity and transform are handed to the GPU and cost
 * effectively nothing per frame, but a filter forces the element to be
 * re-rasterised on every frame it changes. `TextEffect` blurs each WORD in,
 * so a landing page with a few headings asks a phone to re-raster twenty
 * text runs per frame while it is also decoding a video and running a
 * smooth-scroll loop.
 *
 * On a desktop with a discrete GPU that is invisible. On a mid-range Android,
 * and on Edge's compositor on an integrated Intel chip, it is the difference
 * the reports of "not smooth" were describing.
 *
 * So the blur is treated as what it is: a garnish on top of the real
 * animation. The movement and the fade stay on every device; the blur is
 * dropped where it costs more than it gives. `prefers-reduced-motion` is
 * handled separately and more strongly: wrap the app in
 * `<MotionConfig reducedMotion="user">` and everything stills for anyone who
 * asked.
 */
export function useBlurEffects(): boolean {
  return useDeviceTier() === 'full';
}
