# event-kit: a date people can count down to and save

Everything reads `src/event/event.json`, so the countdown, the calendar
button, the `.ics` file and (with the `seo` pack) the `Event` JSON-LD can
never disagree.

| Piece | Behaviour |
| --- | --- |
| `<Countdown />` | Months/days/hours/minutes/seconds in the EVENT's timezone (calendar months, not 30-day blocks). Ticks on the second, stops itself, renders `arrived` after. Screen readers hear one sentence per minute, not five numbers per second. Nothing time-dependent before mount, so prerendered HTML never carries the build machine's clock. |
| `<AddToCalendar />` | Apple devices get the `.ics` (Calendar's own "Add" card, not a subscription); Android and everything else get Google Calendar's template with the organiser's wall-clock times and `ctz`. |
| `scripts/make-ics.mjs` | Writes `public/event.ics` before every build: CRLF, 75-octet folding, escaping, UTC times. |
| `vercel.json` | Serves `.ics` as `text/calendar`, inline, always revalidated. |

**Write times with their offset**: `2026-11-14T10:00:00+05:30`. A `Z` moves
the event by the offset (5h30 in India). For a timezone with daylight saving,
the offset written is the one in force on the event date.

## Structured data (with the seo pack)

Add to the route in `src/seo/seo.config.json`:

```json
"jsonLd": [{
  "@context": "https://schema.org", "@type": "Event",
  "name": "Your Event 2026",
  "startDate": "2026-11-14T10:00:00+05:30", "endDate": "2026-11-14T19:00:00+05:30",
  "eventStatus": "https://schema.org/EventScheduled",
  "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
  "location": { "@type": "Place", "name": "Venue", "address": { "@type": "PostalAddress",
    "streetAddress": "…", "addressLocality": "…", "addressCountry": "IN" } },
  "organizer": { "@type": "Organization", "name": "…", "url": "https://example.com" }
}]
```

Only on the event's own page, and without `offers` if ticket availability
can change without a deploy (a stale "InStock" is worse than none).
