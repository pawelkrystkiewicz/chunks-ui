# 1. Quality Gates — Strict & Automated

**Grade: B+** | **Priority: HIGH**

> "Enforce the strictest possible rules for LLMs. Agents can't commit code that violates strict TypeScript or Biome rules. The gates are mechanical, not advisory."

## Current State

### TypeScript Strictness

| Setting                              | Value   | Assessment |
| ------------------------------------ | ------- | ---------- |
| `strict`                             | `true`  | OK         |
| `noUncheckedIndexedAccess`           | `true`  | OK         |
| `noFallthroughCasesInSwitch`         | `true`  | OK         |
| `verbatimModuleSyntax`               | `true`  | OK         |
| `noUnusedLocals`                     | `false` | Gap        |
| `noUnusedParameters`                 | `false` | Gap        |
| `noPropertyAccessFromIndexSignature` | `false` | Gap        |

TypeScript config lives in `@chunks-ui/typescript-config/react-library.json` and is extended by workspace `tsconfig.json` files.

### Biome Linting

- `recommended: true` — all recommended rules active
- Custom a11y rule for Base UI's `noLabelWithoutControl`
- VCS integration enabled (Git)
- Import organization auto-enabled
- No explicit `@ts-ignore` / `@ts-expect-error` blocking rules (relies on `recommended` defaults)

### Pre-commit Hook (Lefthook)

```yaml
pre-commit:
  commands:
    biome:
      glob: '*.{js,ts,jsx,tsx,mjs,cjs,json,css}'
      run: bunx biome check --write --staged {staged_files}
      stage_fixed: true
```

Lint + auto-fix runs on staged files. No typecheck in pre-commit.

### CI Workflows

| Gate              | Runs in CI? | File                                            |
| ----------------- | ----------- | ----------------------------------------------- |
| Unit tests        | Yes         | `.github/workflows/unit.tests.yml`              |
| Visual regression | Yes         | `.github/workflows/visual-regression.tests.yml` |
| **Lint**          | **NO**      | Missing                                         |
| **Typecheck**     | **NO**      | Missing                                         |

## Gaps

### Critical

1. **No CI lint workflow** — `bun run lint` does not run on PRs or master pushes. Formatting and lint violations can merge if the pre-commit hook is bypassed (e.g., `--no-verify`, agent direct push).
2. **No CI typecheck workflow** — `bun run check-types` does not run in CI. Type errors can slip through.

### Moderate

3. `noUnusedLocals: false` — dead code accumulates silently
4. `noUnusedParameters: false` — unused function params not caught
5. No pre-commit typecheck (acceptable if CI covers it, but CI doesn't)

## Recommendations

### Immediate

Add two CI workflows (can be one combined file):

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates
on:
  push:
    branches: [master]
  pull_request:
    branches: [master]
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run lint
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run check-types
```

### Short-term

- Enable `noUnusedLocals: true` and `noUnusedParameters: true` in tsconfig (requires cleanup pass)
- Add explicit Biome rules blocking `@ts-ignore` and `@ts-expect-error`

### Nice-to-have

- Add `noPropertyAccessFromIndexSignature: true`
- Consider complexity rules in Biome (max function length, cyclomatic complexity)
