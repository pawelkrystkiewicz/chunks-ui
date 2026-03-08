# 6. Agent Scope & Task Decomposition

**Grade: F** | **Priority: LOW**

> "One agent, one task, one prompt." Canopy uses two-layer agent definitions: Layer 1 (.md files) defines HOW, Layer 2 (per-task CLAUDE.md) defines WHAT.

## Current State

- Single root `CLAUDE.md` with project-wide conventions
- No per-task overlays (no task ID, file scope, spec path, or branch constraints)
- No agent type definitions
- No file scope restrictions — agents see the entire repo
- No max spawn depth configured

## Canopy's Model (for reference)

**Layer 1 (Base):** `.md` files defining workflow, constraints, capabilities per agent type
**Layer 2 (Overlay):** Per-task CLAUDE.md with:

- Task ID
- File scope (which files to touch)
- Spec path (which spec to implement)
- Branch name

This ensures each agent knows exactly what it should and shouldn't do.

## Why LOW Priority

For a personal component library:

- Tasks are typically "add component X" or "fix bug in Y" — scope is naturally narrow
- The developer provides scope via conversation context
- Adding overlay infrastructure adds maintenance burden without proportional benefit
- The 16 custom commands already provide structured task guidance

## Implementation

Layer 2 overlay pattern implemented as a custom command:

- `.claude/commands/new-component.md` — `/new-component <ComponentName>` generates a structured task brief with: branch name, declared file scope, out-of-scope list, PRD spec reference, pre-flight checklist, and definition of done. Asks human to confirm scope before writing code.

**Grade updated: F → C** (task overlay pattern implemented via custom command; per-component CLAUDE.md files and file scope enforcement remain convention-based)
