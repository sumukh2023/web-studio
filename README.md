<div align="center">

# Web Studio

**A premium, animated frontend starter kit — built for your first real build.**

For first-time web developers and "vibe coders": skip the setup tax and go
straight to designing and shipping something that actually looks and feels
premium, pairing with Claude Code the whole way.

React · Vite · TypeScript · Tailwind · Framer Motion · GSAP · Lenis · shadcn/ui

</div>

---

## Why this exists

Most starters hand you a folder of config and leave the hard part — making
something that looks *good* — entirely up to you. This one is different: the
toolchain, the animation system, a token-driven theme, and a polished
component library are already wired up, and a vendored design database
(`ui-ux-pro-max`) plus anti-slop skills guide you toward good taste even if
you've never designed anything before. You (and Claude Code) focus on the
brief; re-skin the tokens, compose the components, and ship.

It also happens to work great under a competition clock — the same setup
that gets a first-timer to a polished site in an evening gets a hackathon
team there in 2.5 hours.

## Quick start

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run preview  # preview the production build
```

### Scripts

| Script                 | What it does                                |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Vite dev server with HMR                    |
| `npm run build`        | `tsc -b` then `vite build`                  |
| `npm run preview`      | Serve the production build locally          |
| `npm run lint`         | ESLint over the project                     |
| `npm run lint:fix`     | ESLint with autofix                         |
| `npm run format`       | Prettier write                              |
| `npm run format:check` | Prettier check (CI-friendly)                |
| `npm run typecheck`    | `tsc --noEmit`                              |

## Project structure

```
src/
  assets/                # (place static imports here)
  components/
    animations/          # FadeIn, SlideUp, ScaleIn, StaggerChildren, HoverLift, Reveal
    assets/              # AuroraBackground, Noise, Avatar (decorative)
    ui/                  # shadcn-style primitives: button, card, badge, accordion
    *.tsx                # Navbar, Hero, Footer, Section, GlassCard, BentoGrid,
                         # FeatureCard, Timeline, Stats, FAQ, Marquee,
                         # AnimatedButton, CursorGlow, ScrollProgress
  hooks/                 # useLenis, useScrollProgress, useMediaQuery, useMousePosition
  layouts/               # RootLayout (smooth scroll + global chrome)
  sections/              # landing-page sections composed from components
  styles/                # globals.css (design tokens live here)
  utils/                 # cn() + shared motion tokens
  App.tsx                # the from-scratch shell — replace it with your build
  main.tsx               # entry point
```

Everything is re-exported through barrels, so imports stay tidy:

```tsx
import { Hero, BentoGrid, BentoCard, Stats, FAQ } from '@/components';
import { FadeIn, SlideUp, StaggerChildren, StaggerItem } from '@/components/animations';
import { useLenis, useScrollProgress } from '@/hooks';
```

The `@/` alias maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

## Theming — the 60-second re-skin

All visual decisions are CSS variables in [`src/styles/globals.css`](src/styles/globals.css)
(HSL channel values, so Tailwind's `/opacity` modifiers work). Change a handful of
tokens and the entire site re-themes — light and dark:

```css
:root {
  --primary: 244 84% 60%;
  --accent: 280 84% 62%;
  --radius: 0.85rem;
  /* background, foreground, secondary, muted, card, border, ring... */
}
```

Fonts are mapped in [`tailwind.config.ts`](tailwind.config.ts) to semantic families —
`font-display`, `font-heading`, `font-body`, `font-sans` — loaded in `index.html`
(Inter, Sora, Space Grotesk, Manrope). Swap a family in one place to restyle typography.

The app is dark by default (`<html class="dark">`); remove the class for light mode.

## The animation system

Composable, scroll-aware wrappers built on Framer Motion, with a GSAP-powered
`Reveal` for variety. All respect `prefers-reduced-motion`.

```tsx
<FadeIn>…</FadeIn>
<SlideUp direction="up" delay={0.1}>…</SlideUp>
<ScaleIn>…</ScaleIn>

<StaggerChildren>
  <StaggerItem>…</StaggerItem>
  <StaggerItem>…</StaggerItem>
</StaggerChildren>

<HoverLift>…</HoverLift>

<Reveal splitChildren stagger={0.1}>…</Reveal>   {/* GSAP */}
```

Shared easing/duration tokens live in [`src/utils/motion.ts`](src/utils/motion.ts) so
every motion feels consistent. Smooth scrolling is provided globally by Lenis via
`useLenis()` inside `RootLayout`.

## Component library

Layout: `Navbar`, `Hero`, `Footer`, `Section` / `SectionHeading`, `RootLayout`
· Surfaces: `GlassCard` (cursor spotlight), `FeatureCard`, `BentoGrid` / `BentoCard`
· Content: `Stats` (count-up), `Timeline`, `FAQ`, `Testimonials`, `Gallery`, `Marquee`
· Chrome: `AnimatedButton`, `CursorGlow`, `ScrollProgress`
· Primitives: `Button`, `Card`, `Badge`, `Accordion`
· Decorative: `AuroraBackground`, `Noise`, `Avatar`

### Adding more shadcn/ui components

`components.json` is configured, so you can pull in any primitive:

```bash
npx shadcn@latest add dialog tabs tooltip
```

They land in `src/components/ui` with the right aliases and tokens.

## Tech stack

| Area       | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Framework  | React 18 + Vite 5 + TypeScript (strict)                   |
| Styling    | Tailwind CSS v3 + CSS-variable design tokens              |
| Animation  | Framer Motion · GSAP · Lenis (smooth scroll)              |
| UI         | shadcn/ui (new-york) + Radix primitives                   |
| Icons      | lucide-react                                              |
| Utilities  | clsx · tailwind-merge · class-variance-authority          |
| Quality    | ESLint (flat config) · Prettier + tailwind plugin         |

## Deployment

Vercel-ready out of the box. Import the repo, accept defaults (build `npm run build`,
output `dist`), and ship. Any static host works — the build is a plain SPA.

## Your first build

1. **Start here** — clone, `npm install`, `npm run dev`. Read `CLAUDE.md`: it's
   the workflow Claude Code follows in this repo, and it's worth skimming even
   if a human is driving.
2. **Get a direction** — run the vendored `ui-ux-pro-max` design database for
   your brief (style, palette, font pairing) instead of guessing at colors.
3. **Wireframe** — compose `Hero`, `BentoGrid`, `Stats`, `FAQ` and friends into
   a structure that fits *your* idea, not a copy-pasted template.
4. **Animate it** — layer in reveals, cursor glow, smooth scroll from
   `src/components/motion/` for the premium feel.
5. **Ship** — `npm run build` passes clean → deploy → you've shipped a real,
   polished site.

---

<div align="center">
<sub>Crafted as a foundation for your first real build — and your best one.</sub>
</div>
