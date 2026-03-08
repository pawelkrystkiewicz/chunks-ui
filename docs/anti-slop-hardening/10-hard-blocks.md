# 10. Hard Blocks Summary

**Grade: F** | **Priority: HIGH**

> Hard blocks are non-negotiable mechanical constraints that prevent dangerous agent actions. They're the safety net when everything else fails.

## Current State

| Block | Canopy | chunks-ui |
|-------|--------|-----------|
| No `git push` by agents | PreToolUse hook blocks the command | **Not configured** |
| Read-only agents can't write | Tool allowlist excludes Write/Edit | **Not configured** |
| No runaway spawning | `maxDepth: 2` in config | **Not configured** |
| No stale locks | 30s timeout with automatic cleanup | N/A (no lock files) |
| No manual prompt edits | Convention enforced in CLAUDE.md | **Not configured** |
| Concurrent safety | Advisory locks + atomic writes on JSONL | N/A (no shared state files) |

**Zero hard blocks exist.** Agents operate without mechanical guardrails.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Agent pushes broken code to remote | Medium | High | Add `git push` block |
| Agent force-pushes / resets branch | Low | Very High | Block destructive git commands |
| Agent spawns excessive sub-agents | Low | Medium | Add max depth |
| Agent modifies CI/CD config | Low | High | Block `.github/` writes |

## Recommendations

### Immediate — Block `git push`

This is the single most impactful hard block. Create `.claude/hooks.json`:

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
    },
    {
      "matcher": {
        "tool": "Bash",
        "command": "git push --force"
      },
      "type": "PreToolUse",
      "action": "block",
      "message": "Force push is never allowed by agents."
    },
    {
      "matcher": {
        "tool": "Bash",
        "command": "git reset --hard"
      },
      "type": "PreToolUse",
      "action": "block",
      "message": "Hard reset is never allowed by agents."
    }
  ]
}
```

### Short-term

- Block writes to `.github/workflows/` — agents shouldn't modify CI config
- Block `rm -rf` and other destructive shell commands

### Nice-to-have

- Add `maxDepth` for sub-agent spawning
- Block modifications to `CLAUDE.md` and `PRD.md` (these are human-authored specs)

## Key Principle

> "Never fix bad output — diagnose, reset, fix the root cause, rerun from scratch."

Hard blocks exist so that when an agent goes wrong, the blast radius is contained. The most important block — preventing `git push` — ensures a human always reviews before code reaches the remote.
