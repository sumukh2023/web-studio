# landing-demo (reference only — DO NOT reuse as a skeleton)

These are the original starter's pre-composed marketing sections and the demo
`App.demo.tsx` that assembled them. They are kept **only as a reference** for how
the primitives can be wired together.

**Do not import these into `src/` and do not use them as the page skeleton.**
Reusing this section pool ("Hero → Features → Bento → Metrics → Timeline → FAQ →
CTA", re-worded) is exactly the AI-slop failure this starter now guards against.
Build each site from scratch for its brief (see `CLAUDE.md`). This folder is
outside the build/lint path and the design-process gate fails any `src/` build
that imports from it.
