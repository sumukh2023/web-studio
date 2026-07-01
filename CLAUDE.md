# CLAUDE.md — Working instructions for this repo

This file is read automatically by Claude Code at the start of every session.
Follow it for all work in this repository.

## What this project is

`webfinity-2026` is a **premium, reusable frontend starter** for design
competitions and hackathons (theme announced on the day; ~2.5h to design + build,
then present). The goal each event is to adapt this starter into a polished site
for the given theme **as fast as possible** — not to rebuild from scratch.

Stack: React 18 + Vite + TypeScript (strict) · Tailwind CSS v3 with CSS-variable
design tokens · Framer Motion + GSAP + Lenis · shadcn/ui (Radix) · lucide-react.

## Golden rules (most important)

1. **Reuse, don't rebuild.** Compose the existing components and sections. Only
   write new components when nothing existing can be adapted. Never scaffold a new
   project or replace the architecture.
2. **Theme via tokens first.** Re-skin the whole site by editing the CSS variables
   in `src/styles/globals.css` (and fonts in `tailwind.config.ts`). Prefer token
   changes over hard-coded colors.
3. **Query the design database before you pick anything (MANDATORY).** Before you
   choose colours, fonts, or a visual style, you MUST run the vendored
   `ui-ux-pro-max` skill and base your tokens on what it returns:
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product/industry/keywords>" --design-system -p "<Project>"
   ```
   Take the returned STYLE, COLORS (hex + CSS var names) and TYPOGRAPHY (Google
   Fonts + Tailwind config) and write them into `src/styles/globals.css` and
   `tailwind.config.ts`. This is non-negotiable and applies even under time
   pressure. Do NOT invent a palette or reach for a default font. See "Design
   intelligence database" below.
4. **Run the anti-slop frameworks (MANDATORY).** Use `taste-skill`
   (`design-taste-frontend`, plus the `minimalist`/`soft`/`brutalist` style
   variants and `redesign-skill`) to infer the brief and commit to a
   non-templated direction, then gate EVERY build with the `impeccable` slop
   detector before you open a PR:
   ```bash
   npx impeccable detect src/    # or: node .claude/skills/impeccable/scripts/detector/cli/main.mjs src/
   ```
   Fix every flag. Banned by default: gradient-text, glassmorphism, aurora/mesh
   blobs, cream+serif "vintage" defaults, an eyebrow on every section, and
   em-dashes. See "Design skills (anti-slop)" below.
5. **Keep it green.** `npm run build`, `npm run typecheck`, and `npm run lint` must
   all pass before you open a PR. Run them.
6. **Match the quality bar:** Apple / Stripe / Linear / Vercel. Prioritize
   typography, spacing, responsiveness, accessibility (semantic HTML, focus
   states, reduced-motion), and subtle, performant animation.
7. **Work on a branch and open a PR.** Don't commit straight to `main`. Keep
   commits small and logically scoped with clear messages.

## Where things live

- `src/styles/globals.css` — **design tokens** (colors, radius) for light + dark.
  This is the #1 file to edit when theming.
- `tailwind.config.ts` — fonts (`font-display/heading/body/sans`), animations,
  shadows, gradients.
- `src/components/` — reusable library: `Navbar`, `Hero`, `Footer`, `Section`/
  `SectionHeading`, `GlassCard`, `FeatureCard`, `BentoGrid`/`BentoCard`, `Stats`
  (count-up), `Timeline`, `FAQ`, `Testimonials`, `Gallery`, `Marquee`,
  `AnimatedButton`, `CursorGlow`, `ScrollProgress`; `components/ui/` shadcn
  primitives; `components/assets/`
  (`AuroraBackground`, `Noise`, `Avatar`).
- `src/components/animations/` — `FadeIn`, `SlideUp`, `ScaleIn`, `StaggerChildren`/
  `StaggerItem`, `HoverLift`, `Reveal` (GSAP). Shared tokens in `src/utils/motion.ts`.
- `src/sections/` — page sections composed from components.
- `src/layouts/RootLayout.tsx` — app shell (smooth scroll + nav/footer/chrome).
- `src/App.tsx` — assembles the page. Re-theme and recompose this for the brief.
- `src/hooks/` — `useLenis`, `useScrollProgress`, `useMediaQuery`, `useMousePosition`.
- `.claude/skills/` — vendored design skills: **`ui-ux-pro-max`** (design
  database: styles, palettes, font pairings, UX rules — query it first, Golden
  rule 3); the anti-slop frameworks **`impeccable`** (detector + 23 commands)
  and **`taste-skill`** (+ `redesign`/`minimalist`/`soft`/`brutalist`/`output`),
  Golden rule 4; and `ui-styling` + `design-system` for shadcn/Tailwind/token
  guidance. See `.claude/skills/SOURCE.md`.
- `README.md` — full component + theming docs. `DAYOF.md` — competition playbook.

Everything is re-exported via barrels: `@/components`, `@/components/animations`,
`@/hooks`. The `@/` alias maps to `src/`.

## Design intelligence database (ui-ux-pro-max)

A searchable design database ships with the repo at
`.claude/skills/ui-ux-pro-max/` (50+ UI styles, 161 colour palettes, 57 font
pairings, 161 product patterns, 99 UX guidelines, chart types, and per-stack
guidance). It is pure-stdlib Python, so it runs in any Claude Code session
including cloud. **Use it at the start of every website build** (Golden rule 3).

Full recommendation (style + palette + fonts + layout for a brief):
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product industry keywords>" --design-system -p "<Project>"
```
Targeted lookups:
```bash
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --domain style       -n 3
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --domain color       -n 3
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --domain typography  -n 3
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --domain ux          -n 5
# stack-specific component guidance:
python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<keywords>" --stack react -n 3
```
Then translate the result into the repo's tokens: put the palette hexes into the
CSS variables in `globals.css`, and the font pairing into `tailwind.config.ts`
(`font-display/heading/body`) plus the Google Fonts `<link>` in `index.html`.
Data lives in `.claude/skills/ui-ux-pro-max/data/*.csv` if you want to read it
directly. Vendored copy (see `.claude/skills/SOURCE.md`); update via the
upstream repo.

## Design skills (anti-slop)

Two anti-slop frameworks are vendored under `.claude/skills/` and load
automatically in any Claude Code session (local or cloud) on this repo:

- **impeccable** (`pbakaus/impeccable`, Apache-2.0) — a design vocabulary plus a
  deterministic slop **detector**. Drive it with its commands (`craft`, `shape`,
  `audit`, `polish`, `typeset`, `colorize`, `animate`, `distill`, …) and gate
  work with `npx impeccable detect src/` (Golden rule 4).
- **taste-skill** (`Leonxlnx/taste-skill`, MIT) — `design-taste-frontend` reads
  the brief, infers a direction, and ships non-templated UI. Pick a register with
  `minimalist-skill` / `soft-skill` / `brutalist-skill`, use `redesign-skill` for
  audit-first redesigns, and `output-skill` to avoid half-finished output.

**The enforced website workflow (all three tools):**
1. `ui-ux-pro-max` query → get the style, palette, and font pairing (Golden rule 3).
2. `taste-skill` → confirm the direction fits the brief and is not templated.
3. Build by reusing components; write the palette/fonts into the tokens.
4. `impeccable detect src/` → fix every flag.
5. Only then open the PR.

Vendored copies; update via each project's upstream repo (`npx impeccable
install`, `npx skills add Leonxlnx/taste-skill`). See `.claude/skills/SOURCE.md`.

**The detector gate is automated.** A committed pre-push hook (`.githooks/pre-push`,
wired via the `prepare` script on `npm install`) runs `npx impeccable detect src/`
and blocks pushes on any finding. Run it yourself with `npm run slop:check`.
Emergency bypass: `git push --no-verify`. The same check runs in CI via the
`Slop check` GitHub Action (`.github/workflows/slop-check.yml`) on every PR and
push to `main`.

## Commands

```bash
npm install        # once
npm run dev        # dev server (HMR)
npm run build      # tsc -b && vite build  (must pass)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint  (must pass)
npm run format     # prettier --write
```

## Adapting to a theme (typical flow)

1. Set the palette in `src/styles/globals.css` tokens (and fonts if it fits).
2. Recompose `src/App.tsx` + `src/sections/` from existing blocks; re-word/re-skin
   them for the theme (e.g. schedule → `Timeline`, attractions → `BentoGrid`,
   tiers → cards, questions → `FAQ`).
3. Add new sections only where the theme genuinely needs them, in the existing
   component style.
4. Run build + typecheck + lint. Fix everything. Open a PR.

## Notes

- New shadcn primitives: `npx shadcn@latest add <component>` (configured via
  `components.json`, lands in `src/components/ui`).
- Static SPA, Vercel-ready; merging to `main` auto-deploys. No backend by default
  (add Supabase/serverless only if a theme truly requires persistent data).
- External MCP connectors (e.g. image generators) are NOT available in cloud
  sessions — commit any pre-generated assets into `public/` instead.
