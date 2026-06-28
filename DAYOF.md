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
