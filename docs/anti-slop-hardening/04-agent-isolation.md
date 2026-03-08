# 4. Per-Agent Isolation via Worktrees

**Grade: F** | **Priority: LOW**

> "An isolated agent is a safe agent." Canopy defines 8 distinct agent types with tool allowlists, worktree isolation, and spawn depth limits.

## Current State

No agent isolation exists. All agents share:

- Same workspace (no worktrees)
- Same permissions (single `settings.local.json` allowlist)
- Same context (single root `CLAUDE.md`)
- No role separation (no read-only agents, no builder-only agents)
- No spawn depth limits

## Canopy's Model (for reference)

| Agent | Tools | Constraints |
|-------|-------|-------------|
| Scout | Read, Glob, Grep, Bash | read-only |
| Builder | Read, Write, Edit, Glob, Grep, Bash | — |
| Reviewer | Read, Glob, Grep, Bash | read-only |
| Lead | All + Task | Can spawn |
| Merger | Read, Write, Edit, Glob, Grep, Bash | — |
| Coordinator | Read, Glob, Grep, Bash | read-only, no-worktree |
| Supervisor | All + Task | Can spawn |
| Monitor | Read, Glob, Grep, Bash | read-only, no-worktree |

## Why LOW Priority

chunks-ui is a personal component library with a single developer. The overhead of maintaining 8 agent profiles, worktree configs, and coordination protocols doesn't justify itself at this scale.

The meaningful safety improvements from agent isolation are already achievable through simpler mechanisms:

- **Push blocks** (covered in [02-hooks.md](./02-hooks.md)) prevent the most dangerous agent action
- **CI quality gates** (covered in [01-quality-gates.md](./01-quality-gates.md)) catch bad code before merge
- **Pre-commit hooks** catch issues locally

## If Scaling Up

If the project grows to multi-contributor or multi-agent workflows:

1. Define a `Reviewer` agent profile (read-only, Glob, Grep, Read, Bash)
2. Define a `Builder` agent profile (full write access)
3. Add `maxDepth: 2` to prevent runaway agent spawning
4. Use worktrees for parallel agent work on separate features
