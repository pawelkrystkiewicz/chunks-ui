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
| ----------- | ------------------------------------ | ------------------- |
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

## Implementation

Role definitions created in `.claude/agents/`:

- `scout.md` — read-only exploration, system prompt + use-when guidelines
- `builder.md` — implementation with file scope discipline, worktree guidance
- `reviewer.md` — read-only review with structured CRITICAL/WARNING/INFO report format

Role docs are used as system prompt additions when spawning Agent tool calls. Tool restrictions are not mechanically enforced (requires Canopy-style infra), but convention + prompt-level constraints provide meaningful isolation.

Worktree isolation available via `isolation: "worktree"` on the Agent tool.

**Grade updated: F → C** (role definitions + worktree pattern documented; enforcement is convention-based)
