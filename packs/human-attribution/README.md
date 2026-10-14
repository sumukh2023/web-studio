# human-attribution: commits belong to people

For repositories whose policy is that AI coding assistants are tools, not
contributors.

| Layer | What it does |
| --- | --- |
| `.claude/settings.json` | Turns off Claude Code's automatic commit/PR attribution and session links. |
| `.githooks/commit-msg` | Refuses a commit whose author/committer is a tool or bot identity, or whose message carries a tool `Co-authored-by`, `Claude-Session:` or "Generated with" line. |
| `.githooks/pre-push` | Same check over every commit being pushed. |
| `.github/workflows/human-attribution.yml` | Same check in CI, over only the commits the push/PR adds (older history never fails a build). |

Patterns live at the top of `scripts/check-attribution.py` (Claude,
`@anthropic.com`, `vercel[bot]`); add others your team uses.

This governs **attribution**, not disclosure: if your course, competition or
client requires you to disclose AI assistance, do that where they ask (a
README section, a submission form), not as a fake co-author.

Rewriting existing history to change authors is a separate, destructive
operation (force-push, every clone invalidated). Do it only with everyone's
agreement; this pack never does it for you.
