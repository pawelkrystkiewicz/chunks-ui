# Contributing to Chunks UI

## Setup

```bash
bun install
bun run build
bun run test
```

Always use `bun`. Never `npm`, `yarn`, or `pnpm`.

## Branch Naming

```
feat/component-name    # new component or feature
fix/short-description  # bug fix
refactor/scope         # refactoring
docs/topic             # documentation
```

## Commit Messages

Follow Conventional Commits:

```
type(scope): message

feat(tabs): add indicator animation
fix(select): correct dropdown positioning
refactor(button): extract loading state logic
test(checkbox): add a11y violation checks
docs(prd): update component tier list
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

## Component Anatomy

Each component lives in `packages/ui/src/components/<name>/` with:

```
button/
  Button.tsx           # component implementation
  Button.Variants.ts   # CVA variant definitions
  Button.spec.tsx      # unit tests (co-located)
  index.ts             # public exports
```

### Patterns

- **Compound pattern** via Base UI: `<X.Root>`, `<X.Trigger>`, `<X.Content>`
- **Composition** via Base UI `render` prop, not `asChild`
- **Variants** defined with CVA in separate `*.Variants.ts` files
- **Props over config objects**: `<Button color="primary" variant="outlined">`
- **One component, one job** — no mode-switching god components

### Animation

- Import spring presets from `src/lib/motion.ts` — no magic numbers in components
- Use `useMotion()` hook from `src/lib/use-motion.ts` for lazy Motion detection
- Use `createPopupRenderer()` from `src/lib/PopupMotion.tsx` for popup animations
- Components must work without Motion installed (CSS transition fallback)
- Respect `prefers-reduced-motion` via `useReducedMotion()` hook

### Exports

After creating a component, export it from `packages/ui/src/index.ts`.

## Testing

Tests use Vitest + Testing Library. Co-locate tests next to source files as `Component.spec.tsx`.

### What to Test

1. Renders without crashing
2. Custom `className` merging works
3. Sub-components render (compound pattern)
4. Disabled/loading states apply correct attributes
5. User callbacks fire on interaction
6. Accessibility: no axe violations

### What NOT to Test

- Base UI internals (focus management, ARIA — trusted)
- Tailwind CSS output
- CSS variable values
- Motion animation timing

### Running Tests

```bash
bun run test              # run all tests
bun run test:unit:coverage # with coverage report
```

## PR Workflow

1. Create a branch from `master`
2. Implement changes
3. Run quality gates locally: `bun run lint && bun run check-types && bun run test`
4. Push branch and open PR
5. CI runs lint, typecheck, and unit tests with coverage

## Quality Gates

All of these run in CI on every PR:

- `bun run lint` — Biome lint + format
- `bun run check-types` — TypeScript strict mode
- `bun run test` — Vitest unit tests

Pre-commit hook (Lefthook) auto-runs Biome on staged files.

## Changesets

For version bumps, create a changeset:

```bash
bunx changeset
```

Describe the change, select semver bump level, and commit the generated `.changeset/*.md` file with your PR.
