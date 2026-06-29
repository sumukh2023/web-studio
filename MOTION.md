# MOTION.md — Designing custom animations & getting Claude Code to build them

This repo already ships the premium-motion toolkit: **GSAP 3** (with ScrollTrigger
available via `gsap/ScrollTrigger`), **Framer Motion**, and **Lenis** smooth scroll.
Most "wow" animations are code, not assets — so the fastest path is to *spec* the
motion clearly and let Claude Code implement it with these libraries.

Two routes:
- **A — Code motion** (you describe it → Claude writes GSAP / Framer / Lenis). No
  new dependencies. Default to this.
- **B — Asset motion** (you design it in a visual tool → export a file → Claude
  wires the runtime). Reserve for one signature piece.

---

## A. The Motion Spec (copy, fill in, paste to Claude Code)

The clearer the spec, the better the result. Fill this in:

```
Animation request
- Element/section: <e.g. hero heading words / bento cards / nav logo>
- Trigger: <on load | on scroll-into-view | scroll-scrubbed | on hover | on click>
- From → To: <opacity 0→1, y 40→0, scale 0.9→1, rotate -6→0, blur 8px→0 ...>
- Duration / stagger: <0.6s, stagger 0.06s between items>
- Easing: <power3.out | expo.out | a cubic-bezier(...) from cubic-bezier.com>
- Scroll behavior (if scroll): <scrub: true/false | pin the section for <Nvh>>
- Library: <GSAP ScrollTrigger | Framer Motion | Lenis>
- Respect prefers-reduced-motion: yes
- Keep `npm run build` / typecheck / lint green; open a PR.
```

### Worked example (paste-ready)

> Animate the hero heading: split it into words; on load each word rises from
> `y: 40, opacity: 0` to `y: 0, opacity: 1`, staggered 0.06s, easing `power3.out`,
> total ~0.9s. Then, as the user scrolls, pin the hero for 60vh and scrub a subtle
> parallax on the background blobs. Use GSAP + ScrollTrigger. Respect
> prefers-reduced-motion. Keep the build green and open a PR.

---

## GSAP ScrollTrigger — patterns to ask for by name

ScrollTrigger ships inside the installed `gsap` package — no extra install:
`import { ScrollTrigger } from 'gsap/ScrollTrigger'; gsap.registerPlugin(ScrollTrigger);`

Ask Claude Code for any of these:

- **Reveal on enter** — fade/slide elements in as they hit the viewport.
- **Scrubbed timeline** — animation progress tied to scroll position (`scrub: true`).
- **Pinned section** — "pin the hero for 80vh while an inner timeline plays."
- **Parallax** — background moves slower than foreground on scroll.
- **Horizontal scroll** — a section that scrolls sideways as you scroll down.
- **Counter / progress** — number or bar driven by scroll.

Lenis (already global via `useLenis`) makes all of the above feel buttery; if you
add ScrollTrigger, ask Claude to "sync ScrollTrigger with Lenis."

---

## Where to design motion — free tools

### Easing / timing (feed exact values to Claude)
- **easings.net** — named curves and their feel.
- **cubic-bezier.com** — drag a custom curve, copy the `cubic-bezier(...)`.

### Reference / inspiration (hand Claude a URL + description, or paste code)
- **Awwwards**, **Godly (godly.website)** — best-in-class site motion.
- **Codrops / Tympanus (tympanus.net/codrops)** — tutorials + copyable demos.
- **CodePen** — find an effect; paste the pen's code and say "adapt this to our stack."

---

## B. Asset-based motion (design it yourself, Claude wires it)

Use when you want a bespoke illustrated/interactive/3D piece. Workflow is always:
**design → export file → commit to `public/` → tell Claude the component + trigger.**

### Lottie (vector animation JSON) — lightest, biggest free library
- Design/pick/customize at **lottiefiles.com**; export **Lottie JSON**.
- Commit to `public/` (e.g. `public/confetti.json`).
- Prompt:
  > Add `lottie-react`. Create a reusable `<LottiePlayer src>` component and play
  > `public/confetti.json` in the hero, autoplay + loop, respecting reduced-motion.

### Rive (interactive vector, `.riv`) — for hover/scroll-reactive pieces
- Design at **rive.app**; export a `.riv` file.
- Commit to `public/` (e.g. `public/mascot.riv`).
- Prompt:
  > Add `@rive-app/react-canvas`. Render `public/mascot.riv` in the hero, play the
  > "idle" state machine, and trigger the "wave" input on hover.

### Spline (3D scenes) — for a premium 3D hero
- Design at **spline.design**; export to React or get a public scene URL.
- Prompt:
  > Add `@splinetool/react-spline`. Embed this Spline scene <URL> as a full-bleed
  > hero background; lazy-load it; keep it behind the headline text.

---

## Competition discipline (read before reaching for assets)

1. **Default to route A.** GSAP/Framer/Lenis are installed — zero install time, zero
   build risk. Most judges-impressing motion is code.
2. **One signature asset max.** Each new dependency (Lottie/Rive/Spline) is a small
   build risk + bundle cost under a 2.5h clock. Pick one hero moment, not five.
3. **You can't pre-build theme-specific assets** (theme is revealed on the day) — but
   LottieFiles' free library is huge, so you can usually find something on-theme fast.
4. **Always** end the prompt with "respect prefers-reduced-motion; keep build/lint/
   types green; open a PR."
5. Learn the export flow for Lottie/Rive/Spline **before** the event so it's muscle
   memory, not a first-time fumble on the clock.

---

## Multimedia libraries — R3F / Spline / Lottie / Rive

**Default: none are installed. Add only the ONE your theme needs, in that build's PR.**
GSAP + Framer + Lenis already cover ~90% of premium motion.

| Tool | What | Add when | Minimal setup | Best for |
| --- | --- | --- | --- | --- |
| React Three Fiber | React renderer for Three.js (code-driven WebGL 3D) | theme is inherently 3D | `three @react-three/fiber @react-three/drei`; lazy-load; `frameloop="demand"`; cap DPR | abstract/generative 3D |
| Spline | visual 3D editor; you design, export URL/component | want designed 3D, no Three.js code | hosted scene URL (don't bundle MBs); lazy-load + fallback | a bespoke 3D hero |
| Lottie | vector animation JSON; huge free library | decorative/illustrative motion | `lottie-react` (or dotLottie); JSON in `public/`; lazy-load | loaders, accents, celebratory motion |
| Rive | interactive vector w/ state machines | reactive hover/scroll/click piece | `@rive-app/react-canvas`; tiny `.riv` in `public/` | mascot/logo that reacts |

### Full-bleed scroll backgrounds (Awwwards / motionsites style)
Yes — all four can fill the viewport behind scrolling content. The pattern is a
fixed/absolute full-screen layer at `z-0` with your sections at `z-10` on top:

```tsx
// Hero or page background
<div className="relative">
  <div className="pointer-events-none fixed inset-0 -z-10">
    {/* <Spline> / R3F <Canvas> / <LottiePlayer> / <RiveAnimation> here */}
  </div>
  <main className="relative z-10">{/* scrolling sections */}</main>
</div>
```
For scroll-reactive backgrounds, drive the layer with **GSAP ScrollTrigger** (scrub)
or Lenis scroll progress. For 3D (R3F/Spline) this is the heaviest option — always
lazy-load + provide a static gradient fallback + cap mobile cost.

### Lazy-load + fallback pattern (use for any heavy media)
```tsx
import { lazy, Suspense } from 'react';
const Heavy = lazy(() => import('@/components/HeavyHero')); // 3D/Spline/etc.

<Suspense fallback={<AuroraBackground />}>
  <Heavy />
</Suspense>
```
This keeps the initial bundle small; the heavy code only downloads when needed, and
users see the lightweight `AuroraBackground` until it's ready.

### Prompting Claude Code
- **Asset tools (Spline/Lottie/Rive)** → design-first, then a near-template wiring
  prompt: "Add `<pkg>`, render `public/<file>` as a lazy-loaded full-bleed `-z-10`
  background, static fallback, reduced-motion aware, open a PR."
- **Code tools (R3F)** → natural-language motion spec (no visual editor): describe
  the scene, materials, colors, and scroll/pointer interaction precisely.
