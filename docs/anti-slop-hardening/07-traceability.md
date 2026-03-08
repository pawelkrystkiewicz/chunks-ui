# 7. Traceability

**Grade: F** | **Priority: LOW**

> Canopy logs every tool call per agent, brackets sessions, captures post-session learnings, tracks which agent worked on which issue, and maintains per-agent branch history.

## Current State

No traceability infrastructure exists:

| Feature | Status |
| ----------------------------------------------- | -------------------------------------------------- |
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

## Implementation

Minimal traceability stack (80% value, 10% effort):

1. **Git commit messages** — `type(scope): message` convention provides natural audit trail
2. **PR descriptions** — `/pr-description` custom command generates structured summaries
3. **Session log** — PostToolUse hook fires after every `git commit*`, appends to `.claude/output/session-log.md`:

   ```text
   [2026-03-08 14:32:01 +0100] HEAD -> feat/button | abc1234 feat(button): add size variants
   ```

**Grade updated: F → D+** (session log hook active; full tool-call logging and session bracketing remain out of scope for solo project)
