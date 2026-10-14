# live-updates: announcements that appear without a refresh

Insert a row in Supabase and every open browser shows it: an "Updates"
button with an unread badge, opening a panel.

- **Realtime when configured**: with `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY`, the browser reads published rows through RLS and
  subscribes to `postgres_changes`. `supabase-js` is loaded lazily.
- **Polling otherwise, and as the safety net**: `/api/updates` every minute,
  skipping hidden tabs, refetching when the tab returns. Edge-cached 30s.
- **The anon key is public by design.** The RLS policy in the migration
  (published rows only) is the security boundary. Never grant `anon` more.
- **Unread is per session**, so each visit starts with the badge.
- The panel is a proper dialog (`useDialog`): Escape, focus trap and return,
  inert background, no scroll bleed.

## Publish

```sql
insert into public.updates (title, message, priority, cta_label, cta_url, published, published_at)
values ('Gate 2 is open', 'Entry for pass holders from 10:00.', 'high', 'Get directions', '/visit', true, now());
```

Unpublish by setting `published = false`; open browsers remove it live.
Use the `auth` pack to build a small staff page that does this without SQL.

`cta_url` must start with `https://` or `/` (a CHECK constraint), so a
`javascript:` URL can never be published into everyone's browser.
