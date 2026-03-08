# 9. Specs Leave No Ambiguity

**Grade: B-** | **Priority: MEDIUM**

> Canopy has a 29KB SPEC.md covering on-disk format, CLI behavior, inheritance resolution, concurrency model, error handling, and edge cases. Custom commands give step-by-step instructions with zero ambiguity.

## Current State

### What Exists

| Document | Quality | Assessment |
|----------|---------|------------|
| `PRD.md` (37KB) | Exceptional | Component list, color system, architecture decisions, migration path, open questions resolved. Reads like a mature RFC. |
| `CLAUDE.md` (2KB) | Good | Concise conventions cheat sheet. Links to PRD and TESTING_STRATEGY. |
| `TESTING_STRATEGY.md` (3.7KB) | Thin | Covers tool matrix and test types, but lacks coverage targets, a11y depth, fixture strategy. |
| `README.md` (4KB) | Good | Appropriate npm package README. |
| `docs/animated-candidates.md` (7.3KB) | Excellent | Detailed animation RFC with effort estimates and priority ordering. |
| `docs/component-inventory.md` (6KB) | Good | Snapshot reference of all 23 components with props and file paths. |
| `docs/migration-roadmap.md` (4.8KB) | Good | Phase-by-phase migration plan for ModelBox. |
| `docs/modelbox-migration-analysis.md` (8.3KB) | Excellent | Thorough gap analysis between chunks-ui and ModelBox needs. |

### What's Missing

| Document | Impact |
|----------|--------|
| `CONTRIBUTING.md` | Medium — conventions must be inferred from git history and code patterns |
| `llms.txt` | Medium — promised in PRD Section 11, not created. Essential for LLM-friendly development. |
| Per-component documentation | Low — API lives in TypeScript types only, no examples per component |
| `STEELMAN.md` | N/A — counter-argument doc; not needed for a personal library with clear vision |
| CI/CD pipeline docs | Low — GitHub Actions exist but are undocumented |

## Gaps

### Moderate

1. **No CONTRIBUTING.md** — branching convention, PR workflow, component anatomy, animation patterns, and testing checklist all exist as informal knowledge but aren't codified
2. **No llms.txt** — PRD explicitly plans for it but it hasn't been created
3. **TESTING_STRATEGY.md is thin** — missing:
   - Coverage targets
   - A11y assertion examples
   - Visual test baseline management
   - Fixture/mock strategy for optional deps (Motion)

### Minor

4. `docs/component-inventory.md` is manually maintained — could drift from source
5. No deprecation strategy documented
6. `.changeset/README.md` is default boilerplate, not customized

## Recommendations

### Immediate

Create `CONTRIBUTING.md` covering:
- Branch naming: `feat/component-name`, `fix/issue-description`
- Commit format: `type(scope): message`
- Component anatomy: when compound vs single, file structure
- PR workflow: branch, implement, test, push, open PR
- Testing checklist: unit + variants + a11y

### Short-term

- Create `llms.txt` at repo root (PRD Section 11 details contents)
- Expand TESTING_STRATEGY.md with coverage targets, a11y examples, visual test guidance

### Nice-to-have

- Auto-generate component inventory from source on release
- Document GitHub Actions pipeline in CLAUDE.md or separate file
