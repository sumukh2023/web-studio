# CLAUDE.md — Working instructions for this repo

This file is read automatically by Claude Code at the start of every session.
Follow it for all work in this repository.

## What this project is

`webfinity-2026` is a **premium, reusable frontend starter** for design
competitions and hackathons (theme announced on the day; ~2.5h to design + build,
then present). The goal each event is to build a polished, ANIMATED site for the theme
**from scratch, fast**, using this starter's vendored design tools and primitives.
The starter is a **toolkit + building blocks, NOT a page template to re-skin.**
The old demo marketing page now lives in `examples/landing-demo/` as reference
only (see Golden rule 1).

Stack: React 18 + Vite + TypeScript (strict) · Tailwind CSS v3 with CSS-variable
design tokens · Framer Motion + GSAP + Lenis · shadcn/ui (Radix) · lucide-react.

## Golden rules (most important)

1. **Build from scratch for the brief. Do NOT reuse the example skeleton.**
   The old pre-composed marketing sections live in `examples/landing-demo/` as
   REFERENCE ONLY. Never import them, and never use that "Hero -> Features ->
   Bento -> Metrics -> Timeline -> FAQ -> CTA" section pool as your page
   structure, re-worded. That is the exact AI-slop failure this starter guards
   against. Design a section structure specific to THIS brief and compose it
   fresh from the primitives (`src/components/`, `src/components/motion/`) and
   design tokens. `src/App.tsx` ships as a from-scratch shell — replace it. The
   design-process gate FAILS any `src/` build that imports `examples/`.
2. **Query the design database first (MANDATORY).** Before choosing any colour,
   font, or style, run the vendored `ui-ux-pro-max` skill and base your tokens on
   what it returns, then RECORD it in `.design/brief.md`:
   ```bash
   python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<product/industry/keywords>" --design-system -p "<Project>"
   ```
   Write the returned STYLE, PALETTE (hex + CSS var names) and TYPOGRAPHY into
   `src/styles/globals.css`, `tailwind.config.ts`, `index.html`, and summarise
   them in `.design/brief.md`. Do NOT invent a palette or default font. The gate
   FAILS a build with no `.design/brief.md`.
3. **Set a non-templated direction with taste-skill (MANDATORY).** Use
   `taste-skill` (+ `minimalist`/`soft`/`brutalist` variants, `redesign-skill`)
   to infer the brief and commit to a direction. Banned by default: gradient-text,
   glassmorphism, aurora/mesh blobs, cream+serif "vintage" defaults, an eyebrow on
   every section, em-dashes, three-equal-feature-card rows, and reused skeletons.
4. **Animate it (MANDATORY). Build from the motion library.** This starter builds
   ANIMATED sites. Compose real motion from `src/components/motion/` (`TextEffect`,
   `AnimatedGroup`, `InView`, `BorderTrail`, `Magnetic`, `Spotlight`, …) plus the
   `animations/` wrappers — a static wall of cards is slop. Run the
   `review-animations` skill (Emil Kowalski) on any non-trivial motion and fix what
   it flags. The gate FAILS a build that imports ZERO `@/components/motion`.
5. **Theme via tokens.** Re-skin through the CSS variables in
   `src/styles/globals.css` and fonts in `tailwind.config.ts`. No hard-coded colours.
6. **Keep it green AND pass both gates.** `npm run build`, `npm run typecheck`,
   `npm run lint`, `npm run slop:check` (impeccable detector) and
   `npm run design:check` (design-process gate) must all pass before a PR.
7. **Match the quality bar:** Apple / Stripe / Linear / Vercel. Typography,
   spacing, responsiveness, accessibility (semantic HTML, focus states,
   reduced-motion), and performant, meaningful animation.
8. **Work on a branch and open a PR.** Never commit straight to `main`.

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
- `src/components/motion/` — **Motion Primitives** (ibelick/motion-primitives, MIT):
  33 vendored animated components (`TextEffect`, `AnimatedNumber`, `BorderTrail`,
  `AnimatedGroup`, `Carousel`, `GlowEffect`, `Tilt`, `Magnetic`, `Spotlight`,
  `TextShimmer`, `Dock`, `InfiniteSlider`, …). Import directly, e.g.
  `import { TextEffect } from '@/components/motion/text-effect'`. Pull more from
  their registry: `npx shadcn add "https://motion-primitives.com/c/<name>.json"`.
- **Component registries** are configured in `components.json`:
  `@motion-primitives` and `@react-bits` (David Haz, reactbits.dev). Pull on
  demand with `npx shadcn add @react-bits/<name>` (or the full URL). **React Bits
  is MIT + Commons Clause: USE its components in a build, but do NOT commit their
  source into this public starter as a reusable bundle** (redistribution). Prefer
  the MIT `src/components/motion/` primitives for anything reusable.
- `examples/landing-demo/` — the old demo marketing sections + `App.demo.tsx`,
  REFERENCE ONLY (outside the build/lint path). Do NOT import or reuse as a
  skeleton (Golden rule 1); the design-process gate blocks it.
- `src/layouts/RootLayout.tsx` — app shell (smooth scroll + nav/footer/chrome).
- `src/App.tsx` — a **from-scratch shell** (carries a `FROM-SCRATCH-SHELL`
  sentinel). Replace it entirely; build the page for the brief from scratch.
- `.design/brief.md` — record the ui-ux-pro-max result here (Golden rule 2);
  `scripts/verify-design-process.mjs` requires it once you leave the shell.
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
- **emilkowalski/skills** (MIT, by Emil Kowalski of animations.dev) — expert
  motion judgment. `animation-vocabulary` and `emil-design-eng` inform how you
  build animation; **`review-animations` is a motion-quality gate** — run it on
  any non-trivial motion work before shipping (it flags by default, approval is
  earned). Prefer the vendored `src/components/motion/` primitives over hand-rolled
  animation.

**The enforced website workflow (all three tools):**
1. `ui-ux-pro-max` query → get the style, palette, and font pairing (Golden rule 3).
2. `taste-skill` → confirm the direction fits the brief and is not templated.
3. Build by reusing components; write the palette/fonts into the tokens.
4. For non-trivial motion, use `src/components/motion/` primitives and run the
   `review-animations` skill; fix what it flags.
5. `impeccable detect src/` → fix every flag.
6. Only then open the PR.

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

## Building for a theme (from scratch — the mandatory flow)

1. **Design DB:** run `ui-ux-pro-max --design-system`; write the palette/fonts into
   `globals.css` + `tailwind.config.ts` + `index.html`; record it in `.design/brief.md`.
2. **Direction:** use `taste-skill` to fix a non-templated direction for THIS brief.
   Design a section structure specific to the brief — do NOT reach for the
   `examples/landing-demo` pool.
3. **Build from scratch** in a replaced `src/App.tsx`, composing primitives from
   `src/components/` and real animation from `src/components/motion/`.
4. **Review motion** with `review-animations`; fix what it flags.
5. **Gate:** `npm run slop:check` + `npm run design:check` + build + typecheck +
   lint must all pass. Open a PR.

The design-process gate (`scripts/verify-design-process.mjs`, wired into the
pre-push hook + CI) hard-fails any themed build that reuses `examples/`, imports
zero motion primitives, or has no `.design/brief.md`. It stays quiet while
`src/App.tsx` still has the from-scratch sentinel.

## Notes

- New shadcn primitives: `npx shadcn@latest add <component>` (configured via
  `components.json`, lands in `src/components/ui`).
- Static SPA, Vercel-ready; merging to `main` auto-deploys. No backend by default
  (add Supabase/serverless only if a theme truly requires persistent data).
- External MCP connectors (e.g. image generators) are NOT available in cloud
  sessions — commit any pre-generated assets into `public/` instead.
