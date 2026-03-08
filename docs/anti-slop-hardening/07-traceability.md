# 7. Traceability

**Grade: F** | **Priority: LOW**

> Canopy logs every tool call per agent, brackets sessions, captures post-session learnings, tracks which agent worked on which issue, and maintains per-agent branch history.

## Current State

No traceability infrastructure exists:

| Feature | Status |
|---------|--------|
| Tool call logging (PreToolUse/PostToolUse) | Not configured |
| Session bracketing (SessionStart/Stop) | Not configured |
| Post-session learnings capture | Not configured |
| Issue-to-agent tracking | Not configured |
| Per-agent branch history | Not configured |
| Structured PR review output | Partially — `.claude/output/` exists but is empty |

## Why LOW Priority

Traceability matters most when:
- Multiple agents work concurrently on the same codebase
- You need to debug which agent introduced a regression
- You need to audit agent behavior for compliance

For a solo developer with a single agent context, git history provides sufficient traceability. The developer is the human in the loop for every session.

## Minimal Traceability (If Desired)

If you want basic traceability without the full Canopy stack:

1. **Git commit messages** — already follow `type(scope): message` convention, providing natural audit trail
2. **PR descriptions** — custom command `/pr-description` generates structured summaries
3. **Session notes** — add a PostToolUse hook after `git commit` to append commit summary to `.claude/output/session-log.md`

This gives 80% of traceability value with 10% of the effort.
