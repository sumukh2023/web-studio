# 🏆 DAY-OF Playbook — Webfinity 2026

Everything needed to go from **theme announced → live, polished site** using
**Claude Code (web)** as the engineer, **VS Code** as preview/review, and the
**GitHub repo** as the single source of truth.

> Golden rule: **GitHub is the hub.** Claude Code (cloud) and VS Code (local)
> never talk to each other directly — they sync *through* GitHub. When in doubt,
> `git push` / `git pull` / merge the PR.

---

## How the pieces fit

```
        ┌─────────────────────┐
        │   Claude Code (web) │  writes code in a cloud VM,
        │   claude.ai/code    │  pushes a branch + opens a PR
        └─────────┬───────────┘
                  │  (push / PR)
                  ▼
        ┌─────────────────────┐        auto-build on every push
        │   GitHub repo  ◄─────┼──────────────► Vercel → live URL
        │ webfinity-2026      │        (PR = preview URL, main = production)
        └─────────┬───────────┘
                  │  (git pull)
                  ▼
        ┌─────────────────────┐
        │   VS Code (local)   │  `npm run dev` preview + manual tweaks + review
        └─────────────────────┘
```

Claude Code clones from **GitHub**, not from your laptop. So the laptop's job is
to *preview* and *review* what Claude pushes — not to be the source of truth.

---

## ✅ Before the event (do this in advance, once)

1. **Vercel connected** to the repo (see README/section below) → confirm the
   production URL loads the starter.
2. **Claude Code GitHub access** confirmed: open https://claude.ai/code, sign in,
   make sure `sumukh2023/webfinity-2026` is selectable.
3. **A scratch task** run once through Claude Code (e.g. "change the hero badge
   text") to confirm the full loop works: PR appears → Vercel preview builds →
   merge → production updates. Then revert it.
4. Skim this repo's `README.md` so you can steer Claude with the right vocabulary
   (design tokens in `src/styles/globals.css`, sections in `src/sections/`, etc.).

---

## 🧪 Pre-event dry run (do this once, in advance)

Rehearse the full loop so there are zero surprises on the clock:

1. Open **https://claude.ai/code** → select `sumukh2023/webfinity-2026`, branch `main`.
2. Paste this tiny task:

   > On a new branch, change the hero badge text from "Webfinity 2026 Starter" to
   > "Dry Run ✅". Keep `npm run build` green. Open a PR.

3. Wait for Claude to **open a PR** on GitHub.
4. Confirm the loop pieces work:
   - **Vercel** posts a **preview URL** on the PR (or check the Vercel dashboard) →
     open it, verify the badge changed.
   - In **VS Code** (Remote Repositories + GitHub Pull Requests extensions), open the
     PR and read the diff.
5. **Merge** the PR on GitHub.
6. Confirm **Vercel production** rebuilds and the live URL updates.
7. Clean up: either revert with a quick "revert the badge text to the original" task,
   or just leave it — you'll re-theme everything on the day anyway.

If all six steps worked, your D-Day pipeline is proven end to end.

---

## ⏱️ D-Day loop (theme is announced)

### Step 0 — Open your three windows
- **Browser tab A:** https://claude.ai/code (Claude Code) → select `webfinity-2026`.
- **Browser tab B:** your Vercel project dashboard (for live URLs).
- **VS Code:** open a terminal and run:
  ```bash
  git clone https://github.com/sumukh2023/webfinity-2026.git
  cd webfinity-2026 && npm install && npm run dev
  ```
  Leave `npm run dev` running — it hot-reloads as you pull.

### Step 0.5 — Decide the concept FIRST (~10 min, don't touch code yet)
Before any building, lock a direction. In Claude (chat or Code), ask:

> The competition theme is **"<THEME>"**. Give me 5 distinct website concepts.
> For each: the core idea, the mood/palette, the hero moment, and which of our
> existing sections it would use. Then tell me which is the most visually
> impressive and most defensible to judges, and why.

Pick **one**. Then spend ~5 min sketching the page order (Hero → Stats →
Interactive → Gallery → Timeline → Testimonials → CTA → Footer — drop/add to fit).
Only then brief Claude Code to build. A clear concept beats fast typing.

### Step 1 — Brief Claude Code (the big prompt)
In Claude Code, paste a clear brief. Tell it the **theme**, the **goal**, and to
**use the existing starter**. Example:

> The competition theme is **"<THEME>"**. Design and build a complete, polished
> single-page site for it using this repo's existing system: re-theme the design
> tokens in `src/styles/globals.css`, compose the existing components/sections
> (`src/components`, `src/sections`), and add new sections as needed. Match the
> polish of Apple/Stripe/Linear. Keep `npm run build`, typecheck, and lint
> passing. Work on a branch and open a PR.

### Step 2 — Let it work, then review
- Claude works in its cloud VM and **opens a PR** on GitHub.
- **Fastest preview:** Vercel auto-builds the PR → click the **preview URL** in
  the PR (or Vercel dashboard) to see it live. No pull needed.
- **Local preview / tweaks:** in VS Code:
  ```bash
  git fetch origin
  git checkout <claude-branch-name>   # first time
  git pull                            # subsequent updates
  ```
  Your running dev server reloads instantly.

### Step 3 — Iterate
- Give feedback **in Claude Code** (tab A): "make the hero taller, add a pricing
  section, switch accent to emerald." It pushes more commits to the same PR.
- `git pull` in VS Code to follow along; Vercel re-builds the preview each push.

### Step 4 — Ship
- When happy, **merge the PR** on GitHub (or ask Claude Code to merge).
- Vercel auto-deploys **main → production URL**. That's your presentation link.

### Step 5 — Present
- Present from the **Vercel production URL** (most reliable).
- Keep the **VS Code localhost** preview as offline backup.

---

## 🎤 Presentation — explain WHY, not just WHAT

Most teams narrate *what* they built. You win by explaining *why* — judges reward
design rationale as much as visual polish. Before the 1.5-hour presentation, have a
one-line justification ready for every major decision, each tied back to the theme:

- **Palette** — why these colors fit the theme's mood/audience.
- **Typography** — why this display/heading pairing (tone, hierarchy).
- **Animation** — why these motions (guide attention, reinforce concept) and why
  they're subtle/performant + reduced-motion friendly.
- **Layout & user flow** — why this section order tells the theme's story.
- **Navigation** — why this structure makes the content effortless to scan.
- **Accessibility & responsiveness** — why it works for everyone, on any device.

Quick prep prompt (ask Claude after the build): *"Draft a 2-minute design-rationale
script for this site on the theme '<THEME>', justifying palette, type, motion,
layout, and flow — tie each to the theme and the judging criteria."*

---

## 🔒 Sync rules (avoid conflicts under pressure)

1. **One writer at a time.** Let Claude Code be the primary author. Avoid editing
   the *same files* locally while Claude is mid-task.
2. **If you DO edit locally,** commit + push **before** giving Claude the next
   task, and tell it to "pull latest / work from the current main." Claude clones
   fresh from GitHub each task, so it only sees what's been pushed.
3. **Always pull before you touch.** `git pull` in VS Code before any manual edit.
4. **Prefer PRs over direct-to-main.** PRs give you a preview URL and a safe
   review gate. Merge fast when good.
5. **If git ever complains about a conflict:** don't fight it under time pressure —
   ask Claude Code to "resolve conflicts with main and update the PR."

---

## 🆘 Fallbacks

- **Claude Code unavailable?** Edit directly in VS Code (re-theme tokens + compose
  sections per `README.md`), `git push`, Vercel deploys.
- **Vercel down?** `npm run build` locally → drag the `dist/` folder onto
  vercel.com or netlify.com for an instant deploy.
- **No local Node?** Open the repo in StackBlitz:
  `https://stackblitz.com/github/sumukh2023/webfinity-2026` (runs in-browser).

---

## 🎯 Prompt starters for Claude Code

- "Re-theme the whole site for **<theme>**: update tokens, fonts, and hero copy."
- "Add a `<feature>` section consistent with the existing component style."
- "Make it feel more like **<Apple/Stripe/Linear>** — refine spacing, type scale, motion."
- "Audit for responsiveness and accessibility; fix any issues; keep build green."
- "Resolve conflicts with main and update the PR."

---

## 🤖 How Claude Code (web) uses this repo

When you start a session at **claude.ai/code** on `webfinity-2026`, the cloud VM
**clones the whole repo** — so all your components, sections, design tokens, hooks,
the vendored design skills in `.claude/skills/`, and `CLAUDE.md` are already there.
Claude **composes and adapts** them; it does not "re-install" or "re-deploy" them —
they're simply present. `CLAUDE.md` is auto-loaded and tells Claude to reuse the
starter, theme via tokens, and keep the build green, so reuse is the default.

It works in the cloud, **opens a PR** (never commits straight to `main`), and you
review → merge → Vercel deploys. Reliability of reuse still depends on a clear
prompt — always say "use the existing system, don't start from scratch."

### Full-brief prompt template (copy, fill `<THEME>`)

> The competition theme is **"<THEME>"**. Design and build a complete, polished
> single-page site for it using THIS repo's existing system — do NOT start from
> scratch. Specifically:
> • Re-theme the design tokens in `src/styles/globals.css` to a palette that fits
>   the theme, keeping the light/dark structure (and adjust fonts in
>   `tailwind.config.ts` if it helps).
> • Reuse the existing components/sections (`src/components`, `src/sections`):
>   Hero, BentoGrid, Stats, Timeline, FAQ, Marquee, GlassCard, AnimatedButton —
>   re-skin and re-word them for the theme.
> • Add new sections only where the theme genuinely needs them, in the existing
>   component style.
> • Use the design skills in `.claude/skills/` for token/shadcn/accessibility guidance.
> • Match the polish of Apple/Stripe/Linear. Responsive + accessible.
> • Ensure `npm run build`, `npm run typecheck`, and `npm run lint` all pass.
> • Work on a branch and open a PR.

Example (carnival): replace `<THEME>` with *"School Carnival"* and add
"map the event schedule to Timeline, attractions/rides to the Bento grid, ticket
tiers to cards, and a parents' FAQ; add a festive 'Get Tickets' CTA."

---

## 🖼️ AI-generated assets (important limitation)

External **MCP connectors do NOT work in claude.ai/code cloud sessions** — only the
first-party GitHub integration is loaded. So an image/video generator like
**Higgsfield MCP**, even if connected to your Claude account, **cannot be called
from a web Claude Code session.**

If a theme needs custom imagery:

1. Generate it beforehand in **claude.ai chat** (with the generator connected), or
   any tool you like.
2. **Commit the files into `public/`** (e.g. `public/hero.jpg`).
3. Reference them in code (`<img src="/hero.jpg" />`) — no MCP needed at runtime.

Note: the starter is designed to look great with **CSS gradients, the aurora
backdrop, and noise** — usually no external images are required. Also check the
competition rules on externally-generated AI assets before relying on them.
