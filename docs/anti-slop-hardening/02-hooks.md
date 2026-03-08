# 2. Hooks — First Layer of Defense

**Grade: D** | **Priority: HIGH**

> Canopy implements hooks at every lifecycle point: SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, PreCompact, Stop.

## Current State

No `.claude/hooks.json` exists. The only Claude configuration is `settings.local.json` with a permission allowlist (86 command/tool patterns).

| Hook | Canopy | chunks-ui |
|------|--------|-----------|
| SessionStart (inject context) | `overstory prime` | Manual `/onboard` command |
| UserPromptSubmit (check mail) | Agent coordination | Not applicable |
| PreToolUse — block `git push` | Hard block | Not configured |
| PreToolUse — log tool usage | Per-agent logging | Not configured |
| PostToolUse — log completion | Per-agent logging | Not configured |
| PostToolUse — capture learnings | `mulch diff` after commit | Not configured |
| Stop — session end | `mulch learn` | Not configured |
| PreCompact — re-inject context | Context preservation | Not configured |

### What Does Exist

- **16 custom commands** in `.claude/commands/` — these are documentation templates agents invoke manually, not automated hooks
- **Permission allowlist** in `settings.local.json` — controls which Bash commands are pre-approved
- **Skills library** — 33 symlinked skills in `.claude/skills/`

## Gaps

### Critical

1. **No `git push` block** — agents can push directly to remote without human review
2. **No session lifecycle hooks** — no automated context injection or learning capture

### Moderate

3. **No PreCompact hook** — when context compresses, project conventions may be lost
4. **No tool usage logging** — no audit trail of agent actions

## Recommendations

### Immediate — Create `.claude/hooks.json`

```json
{
  "hooks": [
    {
      "matcher": {
        "tool": "Bash",
        "command": "git push"
      },
      "type": "PreToolUse",
      "action": "block",
      "message": "Agents must not push to remote. A human must review and push."
    }
  ]
}
```

### Short-term

- Add SessionStart hook to inject CLAUDE.md + PRD summary
- Add PreCompact hook to re-inject key conventions before memory compression

### Nice-to-have

- PostToolUse logging for audit trail
- Stop hook to capture session summary
