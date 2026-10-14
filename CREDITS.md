# Credits

Web Studio is MIT-licensed (see `LICENSE`). It stands on open-source work by
the people below. Their licence files ship next to their code; this page is
the summary.

## Vendored into this repository

| What | Where | Author | Licence |
| --- | --- | --- | --- |
| [Motion Primitives](https://github.com/ibelick/motion-primitives) (33 animated components) | `src/components/motion/` | ibelick | MIT (`src/components/motion/LICENSE`) |
| `usePreventScroll` (via Motion Primitives) | `src/hooks/usePreventScroll.tsx` | Adobe, from [React Spectrum / React Aria](https://github.com/adobe/react-spectrum) | Apache-2.0 (header in the file) |
| [shadcn/ui](https://github.com/shadcn-ui/ui) primitives (button, card, badge, accordion) | `src/components/ui/` | shadcn | MIT |
| [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) design database, `design-system` | `.claude/skills/ui-ux-pro-max/`, `.claude/skills/design-system/` | Next Level Builder | MIT |
| `ui-styling` skill (same upstream) | `.claude/skills/ui-styling/` | Next Level Builder | Apache-2.0 (`LICENSE.txt`) |
| [impeccable](https://github.com/pbakaus/impeccable) (skill + slop detector) | `.claude/skills/impeccable/`; detector run via `npx impeccable` | Paul Bakaus | Apache-2.0 |
| [taste-skill](https://github.com/Leonxlnx/taste-skill) + minimalist, soft, brutalist, redesign, output variants | `.claude/skills/*-skill/` | Leonxlnx | MIT |
| [emilkowalski/skills](https://github.com/emilkowalski/skills): animation-vocabulary, emil-design-eng, review-animations | `.claude/skills/` | Emil Kowalski | MIT |

Details (source commits, what was included or left out): `.claude/skills/SOURCE.md`.

## Used, not vendored

- **[React Bits](https://reactbits.dev)** by David Haz: configured as a shadcn
  registry in `components.json`; nothing is committed. MIT + Commons Clause:
  use its components in your build, do not redistribute them as part of a
  starter or component kit.
- **Libraries** installed from npm keep their own licences in `node_modules`:
  React, Vite, Tailwind CSS, Framer Motion, GSAP, Lenis, Radix UI,
  lucide-react, and in the starter packs React Router, Supabase JS, Vercel
  Analytics and Speed Insights, sharp, jsdom, qrcode, @node-rs/argon2,
  Fontsource, Playwright.
