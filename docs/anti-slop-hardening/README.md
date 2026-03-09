# Anti-Slop Hardening Audit

Audit of chunks-ui against anti-slop agentic engineering practices from [jayminwest/canopy](https://github.com/jayminwest/canopy).

Source: Jim West's "Anti-Slop" guide for agentic engineering, analyzed via the Canopy/Overstory ecosystem.

## Audit Date

2026-03-08 (initial), 2026-03-08 (remediation applied)

## Overall Scorecard

| # | Practice | Before | After | Priority |
| - | -------- | ------ | ----- | -------- |
| 1 | [Quality Gates](./01-quality-gates.md) | B+ | **A-** | DONE |
| 2 | [Hooks](./02-hooks.md) | D | **C+** | DONE |
| 3 | [Testing Philosophy](./03-testing.md) | B | **A-** | DONE |
| 4 | [Agent Isolation](./04-agent-isolation.md) | F | **C** | DONE |
| 5 | [Standardization](./05-standardization.md) | B+ | **A-** | LOW |
| 6 | [Task Decomposition](./06-task-decomposition.md) | F | **C** | DONE |
| 7 | [Traceability](./07-traceability.md) | F | **D+** | DONE |
| 8 | [Input Token Quality](./08-input-token-quality.md) | B | **B+** | MEDIUM |
| 9 | [Specs & Documentation](./09-specs-docs.md) | B- | **B** | MEDIUM |
| 10 | [Hard Blocks](./10-hard-blocks.md) | F | **C** | DONE |

## Remediation Applied (2026-03-08)

### Quick Wins (all completed)

1. ~~Add CI workflows for lint + typecheck~~ — `.github/workflows/quality-gates.yml`
2. ~~Create `.claude/hooks.json`~~ — blocks git push, force-push, hard reset, .github/ writes
3. ~~Enable `noUnusedLocals` + `noUnusedParameters`~~ — in `base.json` + root `tsconfig.json`
4. ~~Create `CONTRIBUTING.md`~~ — branch naming, commit format, component anatomy, testing checklist
5. ~~Install and wire up `jest-axe`~~ — globally in `vitest.setup.ts`

### Additional Hardening

1. ~~Add a11y tests to all 21 components~~ — `axe()` assertions in every spec file
2. ~~Add ToggleGroup tests~~ — 7 tests (renders, className, single/multi select, disabled, a11y)
3. ~~Set `passWithNoTests: false`~~ — deleted test files now fail CI
4. ~~Add Biome `noExplicitAny: error`~~ — blocks `any` type usage
5. ~~Add Biome `useSortedClasses: error`~~ — enforces Tailwind class ordering (auto-fixed 18 files)
6. ~~Expand TESTING_STRATEGY.md~~ — added a11y testing, coverage targets, mocking philosophy, file organization sections
7. ~~Add `UserPromptSubmit` hook~~ — session lifecycle tracking
8. ~~Block `.github/` writes~~ — agents cannot modify CI/CD workflows
9. ~~Add agent role definitions~~ — `.claude/agents/scout.md`, `builder.md`, `reviewer.md`
10. ~~Add `/new-component` command~~ — structured task overlay pattern
11. ~~Add PostToolUse session log~~ — appends git commit summaries to `.claude/output/session-log.md`
12. ~~Add visual regression tests~~ — Button, Chip, ClearButton, Input, Loader with per-combination screenshots

### Remaining Gaps

- **llms.txt** — promised in PRD Section 11, not yet created
- **Agent isolation enforcement** — role definitions exist (C), but tool restrictions are convention-based; no mechanical enforcement
- **Task decomposition enforcement** — `/new-component` command exists (C), per-component CLAUDE.md files remain convention-based
- **Traceability** (D+) — session log hook active; full tool-call logging and session bracketing remain out of scope

## Context

Canopy's approach is built for a multi-agent orchestration ecosystem (Overstory, Mulch, Seeds, Canopy) with 8 distinct agent types. chunks-ui is a personal component library with a solo developer. Practices 4, 6, and 7 (agent isolation, task decomposition, traceability) are rated F but are LOW priority because the infrastructure overhead doesn't justify itself at this scale.

The HIGH priority items (quality gates in CI, hooks, hard blocks) have been addressed.
