# Vendored skills

These skills give Claude Code extra design intelligence and ship with the repo,
so they're available automatically in any cloud session (which clones this repo).

- `ui-styling` and `design-system` are vendored from
  **ui-ux-pro-max-skill** by nextlevelbuilder
  (https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), MIT-licensed.
- Only these two sub-skills (most relevant to this React + Tailwind + shadcn
  stack) were included; the bundle's marketing/AI-image skills were omitted.

To update: re-copy `cli/assets/skills/{ui-styling,design-system}` from upstream.

## ui-ux-pro-max — the full design database (added)

The complete `ui-ux-pro-max` skill from the same project
(nextlevelbuilder/ui-ux-pro-max-skill) is now vendored at
`.claude/skills/ui-ux-pro-max/` (source commit `3effe97`, MIT-licensed, LICENSE
kept). This is the searchable design database the earlier note left out: 50+ UI
styles, 161 colour palettes, 57 font pairings, 161 product patterns, 99 UX
guidelines, chart types, and per-stack guidance, in `data/*.csv`, queried via
`scripts/search.py` (pure stdlib Python, runs in cloud sessions). CLAUDE.md now
requires querying it at the start of every build (Golden rule 3). To update,
re-copy `.claude/skills/ui-ux-pro-max` from the upstream repo.

## Anti-slop design frameworks (added)

Two open-source anti-slop frameworks are vendored so they load in any cloud
session and steer design work (see `CLAUDE.md` -> Golden rule 4 and "Design
skills (anti-slop)"):

- `impeccable` -- by Paul Bakaus (https://github.com/pbakaus/impeccable),
  **Apache-2.0**. Full Claude build: SKILL.md + 23 command references
  (`reference/`) + scripts incl. the deterministic slop `detector/`. Commit `c979ac3`.
- `taste-skill` + variants `redesign-skill`, `minimalist-skill`, `soft-skill`,
  `brutalist-skill`, `output-skill` -- by Leon Lin
  (https://github.com/Leonxlnx/taste-skill), **MIT**. Commit `06d6028`. Partial:
  the image-gen / brandkit / Codex-only / stitch / v1 skills were omitted.

Each vendored skill keeps its upstream LICENSE. Update via the upstream CLIs.
