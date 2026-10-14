# AGENTS.md

**The project rules are in [`CLAUDE.md`](CLAUDE.md). Read it now, in full, and
follow it.** This file is a pointer for Codex and any other tool that reads the
`AGENTS.md` convention; it is deliberately not a second copy of the rules,
because two rulebooks that must agree will drift.

- The design skills live in **`.claude/skills/`** (markdown + pure-stdlib
  Python; nothing in them is Claude-specific). Use that path. If your tool
  generates a duplicate at `.agents/skills/`, it is git-ignored; ignore it.
- Starter packs (opt-in features: routing, SEO prerender, forms, auth, a
  Supabase backend, payments, analytics...) are in **`packs/`**. Read
  `.claude/skills/starter-packs/SKILL.md` before adding one; install with
  `npm run pack:add <name>`.
- `.codex/config.toml` registers the Playwright MCP server so you can look at
  the running site.
