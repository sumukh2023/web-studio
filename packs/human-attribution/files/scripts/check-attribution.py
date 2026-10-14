#!/usr/bin/env python3
"""Reject AI-tool and bot contributor attribution in Git.

Policy: AI coding tools are tools, not contributors. Commits carry the
responsible human's identity, with no tool co-author trailers or session links.

  check-attribution.py message <file>   (commit-msg hook)
  check-attribution.py pre-push         (pre-push hook; reads git's stdin)
  check-attribution.py range <rev-range> (CI)

Extend IDENTITY/ATTRIBUTION below for other tools your team uses.
"""
import re
import subprocess
import sys
from pathlib import Path


IDENTITY = re.compile(r"\bclaude\b|(?:^|@)anthropic\.com\b|vercel\[bot\]", re.IGNORECASE)
ATTRIBUTION = re.compile(
    r"^\s*(?:co-authored-by\s*:.*(?:\bclaude\b|@anthropic\.com|vercel\[bot\])"
    r"|claude-session\s*:|(?:🤖\s*)?generated\s+(?:with|by)\s+.*\bclaude\b)",
    re.IGNORECASE | re.MULTILINE,
)


def git(*args):
    return subprocess.check_output(["git", *args], text=True)


def inspect_commit(sha):
    fields = git("show", "-s", "--format=%an <%ae>%x00%cn <%ce>%x00%B", sha).split("\0", 2)
    reasons = []
    if IDENTITY.search(fields[0]):
        reasons.append("Claude or Vercel bot author identity")
    if IDENTITY.search(fields[1]):
        reasons.append("Claude or Vercel bot committer identity")
    if ATTRIBUTION.search(fields[2]):
        reasons.append("Claude or Vercel bot attribution in commit message")
    return reasons


def check_revisions(revisions):
    failures = []
    for sha in sorted(set(revisions)):
        reasons = inspect_commit(sha)
        if reasons:
            failures.append(f"{sha[:12]}: {', '.join(reasons)}")
    if failures:
        print("Attribution check failed:\n" + "\n".join(failures), file=sys.stderr)
        return 1
    print(f"Attribution check passed ({len(set(revisions))} commits).")
    return 0


def main():
    if len(sys.argv) < 2:
        raise SystemExit("Usage: check-attribution.py message FILE | range REV | pre-push")
    mode = sys.argv[1]
    if mode == "message" and len(sys.argv) == 3:
        message = Path(sys.argv[2]).read_text(encoding="utf-8", errors="replace")
        reasons = []
        for role in ("AUTHOR", "COMMITTER"):
            # git var observes both configured identity and GIT_* overrides.
            if IDENTITY.search(git("var", f"GIT_{role}_IDENT")):
                reasons.append(f"Claude or Vercel bot {role.lower()} identity")
        if ATTRIBUTION.search(message):
            reasons.append("Claude or Vercel bot attribution in commit message")
        if reasons:
            print("Commit blocked: " + ", ".join(reasons) + ". Use the responsible human's identity.", file=sys.stderr)
            return 1
        return 0
    if mode == "range" and len(sys.argv) == 3:
        return check_revisions(git("rev-list", sys.argv[2]).splitlines())
    if mode == "pre-push" and len(sys.argv) == 2:
        revisions = []
        for line in sys.stdin:
            _local_ref, local_sha, _remote_ref, remote_sha = line.split()
            if set(local_sha) == {"0"}:  # Ref deletion sends no commits.
                continue
            args = ["rev-list", local_sha]
            if set(remote_sha) != {"0"} and subprocess.run(
                ["git", "cat-file", "-e", f"{remote_sha}^{{commit}}"],
                stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            ).returncode == 0:
                args.append(f"^{remote_sha}")
            revisions.extend(git(*args).splitlines())
        return check_revisions(revisions)
    raise SystemExit("Invalid attribution-check arguments")


if __name__ == "__main__":
    sys.exit(main())
