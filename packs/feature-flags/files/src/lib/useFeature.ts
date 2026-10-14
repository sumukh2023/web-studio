import { useEffect, useState } from 'react';

/**
 * Ask the API whether a public feature switch is on (see api/features.ts).
 *
 * Returns `null` while unknown. ADVISORY: if the probe fails (offline, a cold
 * function) this returns `true`, so the page draws the real UI instead of
 * claiming a closure it has no evidence for. The server still refuses when
 * the switch is off, which is the enforcement; this only saves somebody
 * three steps of typing into a form that will be turned away.
 */
export function useFeature(name: string): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/api/features?name=${encodeURIComponent(name)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { enabled?: boolean }) => live && setEnabled(body.enabled === true))
      .catch(() => live && setEnabled(true));
    return () => {
      live = false;
    };
  }, [name]);
  return enabled;
}
