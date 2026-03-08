# 5. Standardization — Everything Has a Place

**Grade: B+** | **Priority: LOW**

> "Every tool follows the same patterns." Canopy uses 4 tools with standardized storage, all JSONL, advisory locks, atomic writes.

## Current State

### Code Standardization — Strong

| Pattern | Status | Detail |
|---------|--------|--------|
| Component structure | Consistent | `Component.tsx` + `Component.Variants.ts` + `index.ts` |
| Variant definitions | Consistent | CVA in separate `*.Variants.ts` files |
| CSS variables | Consistent | shadcn naming in `theme.css` |
| Motion presets | Centralized | `src/lib/motion.ts` — no magic numbers in components |
| Utility function | Centralized | `src/lib/cn.ts` — `clsx` + `tailwind-merge` |
| Barrel exports | Consistent | `packages/ui/src/index.ts` |
| Compound pattern | Consistent | `<X.Root>`, `<X.Trigger>`, `<X.Content>` via Base UI |
| Commit format | Consistent | `type(scope): message` |

### Agent Workflow Standardization — Weak

| Pattern | Status | Detail |
|---------|--------|--------|
| Structured learnings storage | Missing | No mulch-style JSONL capture |
| Session protocol | Missing | No standardized start/end flow |
| Issue tracking | Missing | No seeds-style agent-aware tracking |
| Prompt management | Missing | No canopy-style prompt versioning |

### Custom Commands — Present

16 commands in `.claude/commands/` covering common workflows (onboard, PR review, test generation, changelog, etc.). These are documentation templates, not automated triggers.

## Gaps

The code-level standardization is excellent. The gap is in agent workflow tooling — there's no structured way to capture learnings, track agent-worked issues, or version prompts.

## Why LOW Priority

The code patterns are already well-established and self-reinforcing. Adding mulch/seeds/canopy-style tooling would be over-engineering for a solo project. The existing CLAUDE.md + PRD.md + custom commands provide sufficient agent guidance.

## Recommendations

### If Desired

- Add a `.claude/learnings.md` file that agents append to after significant discoveries
- Standardize command output format (all PR reviews go to `.claude/output/`, all changelogs to same place)
