import { useCallback, useEffect, useMemo, useState } from 'react';

export type LiveUpdate = {
  id: string;
  title: string;
  message: string;
  priority: 'normal' | 'high';
  cta_label: string | null;
  cta_url: string | null;
  published_at: string | null;
  created_at?: string | null;
};

const SEEN_KEY = 'live-updates-seen';
const time = (u: LiveUpdate) => Date.parse(u.published_at ?? u.created_at ?? '') || 0;
const sortDesc = (rows: LiveUpdate[]) => [...rows].sort((a, b) => time(b) - time(a));

/**
 * The feed. With VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY it reads through
 * RLS and subscribes to Supabase Realtime (supabase-js is loaded lazily, so it
 * never weighs on first paint). Without them, or if realtime fails at any
 * step, it falls back to polling /api/updates: updates must never silently
 * vanish.
 *
 * Polling SKIPS HIDDEN TABS (a phone in a pocket should not wake the radio
 * once a minute) and fetches immediately when the tab comes back.
 *
 * Unread is SESSION-scoped: each visit starts with the badge showing.
 */
export function useLiveUpdates() {
  const [updates, setUpdates] = useState<LiveUpdate[]>([]);
  const [live, setLive] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => {
    try {
      return Number(sessionStorage.getItem(SEEN_KEY) ?? 0);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
    const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let polling = false;
    const apply = (rows: LiveUpdate[]) => !cancelled && setUpdates(sortDesc(rows));

    const startPolling = () => {
      if (polling || cancelled) return;
      polling = true;
      const load = async () => {
        try {
          const response = await fetch('/api/updates');
          if (!response.ok) return;
          const data = (await response.json()) as { updates?: LiveUpdate[] };
          if (Array.isArray(data.updates)) apply(data.updates);
        } catch {
          /* quiet: the panel shows its empty state */
        }
      };
      void load();
      const interval = window.setInterval(() => !document.hidden && void load(), 60_000);
      const onVisible = () => !document.hidden && void load();
      document.addEventListener('visibilitychange', onVisible);
      const previous = cleanup;
      cleanup = () => {
        window.clearInterval(interval);
        document.removeEventListener('visibilitychange', onVisible);
        previous?.();
      };
    };

    if (url && anon) {
      import('@supabase/supabase-js')
        .then(({ createClient }) => {
          if (cancelled) return;
          const client = createClient(url, anon);
          const reload = () =>
            client
              .from('updates')
              .select('id,title,message,priority,cta_label,cta_url,published_at,created_at')
              .eq('published', true)
              .order('published_at', { ascending: false, nullsFirst: false })
              .limit(50)
              .then(({ data, error }) => {
                if (data) apply(data as LiveUpdate[]);
                if (error) startPolling();
              });
          void reload();
          const channel = client
            .channel('live-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'updates' }, (payload) => {
              if (payload.eventType === 'DELETE') {
                const gone = (payload.old as { id?: string })?.id;
                if (gone) setUpdates((current) => current.filter((u) => u.id !== gone));
                return;
              }
              const row = payload.new as LiveUpdate & { published?: boolean };
              if (!row?.id) return;
              setUpdates((current) => {
                const rest = current.filter((u) => u.id !== row.id);
                return sortDesc(row.published ? [...rest, row] : rest);
              });
            })
            .subscribe((status) => {
              if (cancelled) return;
              setLive(status === 'SUBSCRIBED');
              if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') startPolling();
            });
          /* RECONCILE, BECAUSE REALTIME CANNOT SAY "GONE". Realtime applies
             RLS to the NEW row, and an unpublished row is one the anon key may
             no longer read, so the event that would remove it is never
             delivered: open browsers kept showing an unpublished update
             (found by the sandbox test). So the list is re-read every 30s while
             the tab is visible, and as soon as it becomes visible again. */
          const reconcile = window.setInterval(() => !document.hidden && void reload(), 30_000);
          const onVisible = () => !document.hidden && void reload();
          document.addEventListener('visibilitychange', onVisible);
          const previous = cleanup;
          cleanup = () => {
            window.clearInterval(reconcile);
            document.removeEventListener('visibilitychange', onVisible);
            void client.removeChannel(channel);
            previous?.();
          };
        })
        .catch(startPolling);
    } else startPolling();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  const unread = useMemo(() => updates.filter((u) => time(u) > lastSeen).length, [updates, lastSeen]);

  /* Nothing loaded means nothing was seen: stamping "now" would hide rows
     that arrive a moment later. */
  const markSeen = useCallback(() => {
    const newest = updates[0] ? time(updates[0]) : 0;
    if (!newest) return;
    setLastSeen(newest);
    try {
      sessionStorage.setItem(SEEN_KEY, String(newest));
    } catch {
      /* private mode: unread resets next visit */
    }
  }, [updates]);

  return { updates, unread, live, markSeen };
}
