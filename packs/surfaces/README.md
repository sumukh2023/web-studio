# surfaces: depth that costs nothing to scroll

Appends three utilities to `src/styles/globals.css`:

| Class | Use on | Effect |
| --- | --- | --- |
| `depth-card` | photos, offers, summary cards | top light + contact shadow + soft falloff |
| `depth-inset` | text inputs (not labels) | recessed control surface |
| `depth-band` | full-width sections | light top edge, recessed foot |

All static (no blur, no filter, no animation), driven by `--depth-ink` and
`--depth-light`, which alias the theme's own foreground/background/card, so
they re-theme with the palette and flip correctly in `.dark`. They compose
through Tailwind's `--tw-shadow`, so `focus-visible:ring-*` still shows. Print
removes them.

**Do not put depth on everything.** Dense rows, badges, maps and editorial
text stay flat; elevation means "this is a thing you can pick up".

## Glass (opt-in)

`.glass` exists for the rare brief that needs a floating surface over video
or imagery. It is on the starter's anti-slop ban list by default, so record
the reason in `.design/brief.md` when you use it. It ships with the costs
already handled: small blur by default, larger only under
`html[data-motion="full"]` (motion-budget pack), its own compositor layer,
and a solid fallback for `prefers-reduced-transparency`.
