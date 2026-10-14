# feature-flags: switches you flip without a deploy

One table, `public.feature_rollout`, one row per switch:

| column | meaning |
| --- | --- |
| `feature` | the switch's name, `^[a-z][a-z0-9_]{2,49}$` |
| `enabled_from` | the instant it turns on; `null` is **off** |

**Off is the default and the fallback.** No row is off, a null is off, a
future timestamp is off, and an unreachable database is off. `api/_features.ts`
and the SQL function `public.feature_enabled(feature, at default now())` are
the only places those rules are written.

## Flip a switch (SQL editor)

```sql
update public.feature_rollout set enabled_from = now() where feature = 'example_launch';  -- on
update public.feature_rollout set enabled_from = null  where feature = 'example_launch';  -- off
update public.feature_rollout set enabled_from = '2026-11-14 10:00+05:30' where feature = 'example_launch'; -- scheduled
select feature, enabled_from, public.feature_enabled(feature) as on from public.feature_rollout;
```

The next request sees the new state. Nothing is cached.

## Gate a route (the enforcement)

```ts
import { featureEnabled } from './_features';
if (!(await featureEnabled(env, 'registrations', 'register'))) {
  return send(res, 503, { error: 'Registrations are not open yet. Please check back later.' });
}
```

Put the check BEFORE validating or writing anything.

## Tell the page (advisory)

Add the switch to `PUBLIC_SWITCHES` in `api/features.ts`, then:

```tsx
const open = useFeature('registrations');   // null while loading
if (open === false) return <p role="status">Registrations open on 14 November.</p>;
```

If the probe fails the hook answers `true` and the page draws the form; the
server still refuses. Never let the browser be the only gate.

## Adding a switch

```sql
insert into public.feature_rollout (feature, enabled_from) values ('my_switch', null);
```

Write it as a migration too if the switch must exist on a fresh database.
