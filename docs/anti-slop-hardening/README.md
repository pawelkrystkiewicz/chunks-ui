# Anti-Slop Hardening Audit

Audit of chunks-ui against anti-slop agentic engineering practices from [jayminwest/canopy](https://github.com/jayminwest/canopy).

Source: Jim West's "Anti-Slop" guide for agentic engineering, analyzed via the Canopy/Overstory ecosystem.

## Audit Date

2026-03-08

## Overall Scorecard

| # | Practice | Grade | Priority |
|---|----------|-------|----------|
| 1 | [Quality Gates](./01-quality-gates.md) | **B+** | HIGH |
| 2 | [Hooks](./02-hooks.md) | **D** | HIGH |
| 3 | [Testing Philosophy](./03-testing.md) | **B** | MEDIUM |
| 4 | [Agent Isolation](./04-agent-isolation.md) | **F** | LOW |
| 5 | [Standardization](./05-standardization.md) | **B+** | LOW |
| 6 | [Task Decomposition](./06-task-decomposition.md) | **F** | LOW |
| 7 | [Traceability](./07-traceability.md) | **F** | LOW |
| 8 | [Input Token Quality](./08-input-token-quality.md) | **B** | MEDIUM |
| 9 | [Specs & Documentation](./09-specs-docs.md) | **B-** | MEDIUM |
| 10 | [Hard Blocks](./10-hard-blocks.md) | **F** | HIGH |

## Quick Wins

1. Add CI workflows for lint + typecheck (10 min)
2. Create `.claude/hooks.json` with `git push` block + session start context injection
3. Enable `noUnusedLocals` + `noUnusedParameters` in tsconfig
4. Create `CONTRIBUTING.md`
5. Install and wire up `jest-axe` for a11y testing

## Context

Canopy's approach is built for a multi-agent orchestration ecosystem (Overstory, Mulch, Seeds, Canopy) with 8 distinct agent types. chunks-ui is a personal component library with a solo developer. Practices 4, 6, and 7 (agent isolation, task decomposition, traceability) are rated F but are LOW priority because the infrastructure overhead doesn't justify itself at this scale.

The HIGH priority items (quality gates in CI, hooks, hard blocks) are universally valuable regardless of team size.
