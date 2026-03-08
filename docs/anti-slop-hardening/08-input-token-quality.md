# 8. Pit of Success — Input Token Quality

**Grade: B** | **Priority: MEDIUM**

> "If you are passing in garbage tokens, you're going to get garbage out." Canopy uses `mulch prime` at session start to inject accumulated expertise, creating a recursive quality loop.

## Current State

### Static Documentation — Strong

| Resource | Quality | Size |
|----------|---------|------|
| `CLAUDE.md` | Concise, actionable | ~2KB |
| `PRD.md` | Exceptional — component list, color system, architecture decisions, rationale | 37KB |
| `TESTING_STRATEGY.md` | Covers basics, thin on depth | ~3.7KB |
| `README.md` | Good npm package entry point | ~4KB |
| `docs/animated-candidates.md` | Detailed animation RFC | 7.3KB |
| `docs/component-inventory.md` | Component catalog snapshot | 6KB |
| `docs/migration-roadmap.md` | Actionable migration plan | 4.8KB |

### Dynamic Context Injection — Missing

| Feature | Status |
|---------|--------|
| Session start priming | Manual `/onboard` command only |
| Accumulated learnings injection | Not configured |
| PreCompact context re-injection | Not configured |
| Recursive learning loop | Not configured |

### Skills Library — Present

33 symlinked skills in `.claude/skills/` covering React patterns, TypeScript, Tailwind, a11y, testing, design system patterns, etc. These are externally maintained and symlinked in.

## Gaps

### Moderate

1. **No automated session start** — agent must manually run `/onboard` or read CLAUDE.md
2. **No PreCompact hook** — when context window compresses, key conventions may be lost
3. **No learning persistence** — insights from one session don't carry to the next (beyond what's in CLAUDE.md)

## Recommendations

### Immediate

Add a SessionStart hook that outputs key context:

```json
{
  "hooks": [
    {
      "type": "SessionStart",
      "action": "run",
      "command": "cat CLAUDE.md && echo '---' && head -50 PRD.md"
    }
  ]
}
```

### Short-term

- Add PreCompact hook to re-inject CLAUDE.md conventions before memory compression
- Create `.claude/learnings.md` for cross-session knowledge persistence

### Nice-to-have

- Auto-generate context summary from recent git log at session start
- Inject component inventory at session start for component-related tasks
