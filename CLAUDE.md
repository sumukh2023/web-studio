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
3. **Keep it green.** `npm run build`, `npm run typecheck`, and `npm run lint` must
   all pass before you open a PR. Run them.
4. **Match the quality bar:** Apple / Stripe / Linear / Vercel. Prioritize
   typography, spacing, responsiveness, accessibility (semantic HTML, focus
   states, reduced-motion), and subtle, performant animation.
5. **Work on a branch and open a PR.** Don't commit straight to `main`. Keep
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
- `.claude/skills/` — vendored design skills (`ui-styling`, `design-system`); use
  them for shadcn/Tailwind/token guidance.
- `README.md` — full component + theming docs. `DAYOF.md` — competition playbook.

Everything is re-exported via barrels: `@/components`, `@/components/animations`,
`@/hooks`. The `@/` alias maps to `src/`.

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
