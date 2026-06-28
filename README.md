<div align="center">

# Webfinity 2026 Starter

**A premium, reusable frontend foundation for hackathons & design competitions.**

Clone it once, win with it for years. Built to ship Apple / Stripe / Linear-grade
websites within a 2.5-hour competition window.

React · Vite · TypeScript · Tailwind · Framer Motion · GSAP · Lenis · shadcn/ui

</div>

---

## Why this exists

The Webfinity competition gives you a theme and **2.5 hours** to design and build a
complete website. This repo removes everything that isn't design or implementation:
the toolchain, the animation system, a token-driven theme, and a polished component
library are already wired up. When the theme drops, you re-skin tokens and compose
components — no setup tax.

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
  App.tsx                # the showcase landing page
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
· Content: `Stats` (count-up), `Timeline`, `FAQ`, `Marquee`
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

## Competition playbook

1. **00:00** — Clone, edit tokens in `globals.css` to match the brief.
2. **00:20** — Wireframe by composing `Hero`, `BentoGrid`, `Stats`, `FAQ` blocks.
3. **01:30** — Layer in reveals, cursor glow, smooth scroll for the premium feel.
4. **02:30** — `npm run build` passes clean → deploy → present with confidence.

---

<div align="center">
<sub>Crafted as a permanent frontend foundation. Built for the win.</sub>
</div>
