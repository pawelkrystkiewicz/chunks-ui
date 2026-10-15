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

### Vercel deployments

Only `master` and branches whose name ends in `-preview` (for example `feat/tabs-preview`) get a Vercel deployment.

A deployment builds only when `apps/docs` or a workspace package it depends on changed since that branch's last successful deployment (`turbo-ignore` in `apps/docs/vercel.json`). Otherwise Vercel shows it as canceled by the Ignored Build Step. The first deployment of a branch always builds.

`turbo-ignore` reads the HEAD commit message: `[vercel deploy]` forces a build and `[vercel skip]` skips it. `[skip ci]` and its variants also skip it, so a `[skip ci]` meant for GitHub Actions skips the docs deploy too.

To watch a new package, add it as a dependency of `apps/docs`. To force a rebuild on a repo-root file, add it to `globalDependencies` in `turbo.json`.

## Commit Messages

Follow Conventional Commits:

```
type(scope): message

feat(tabs): add indicator animation
fix(select): correct dropdown positioning
refactor(button): extract loading state logic
test(checkbox): add a11y violation checks
docs(contributing): update component scope
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `perf`

## Component Scope

Chunks UI is a personal design system, not a kitchen sink. If Tailwind or plain React does the job inline, it does not need a component.

### Selection criteria

A component earns its place if it meets **at least two** of:

1. Used in 2+ personal projects
2. Non-trivial to implement from scratch (accessibility, positioning, state)
3. Provides meaningful animation choreography via Motion

### One component, one job

If a component needs a config prop to switch between different interaction models (`mode="select" | "combobox" | "search"`), make separate components instead. Shared logic lives in Base UI's headless layer, so the styled components stay small and testable on their own.

The classic case is the "dropdown" god component that tries to be Select, Combobox and search box at once: every fix in one mode breaks the others. Chunks keeps them apart:

| Component        | Input                         | Must pick from list? | Use case                        |
| ---------------- | ----------------------------- | -------------------- | ------------------------------- |
| **Select**       | No text input (click to open) | Yes                  | Country picker, status dropdown |
| **Combobox**     | Text input filters the list   | Yes                  | User picker, tag selector       |
| **Autocomplete** | Text input is the value       | No (free-form)       | Search box, address field       |

Select and Combobox ship. Autocomplete (Base UI's free-form pattern) gets added only when a real use case appears.

### Removed components

Components from `@creation-ui/react` that were not carried forward:

| Component                 | Why removed                                  | Use instead                                         |
| ------------------------- | -------------------------------------------- | --------------------------------------------------- |
| **Flex**                  | Tailwind does it in a few classes            | `<div className="flex gap-4 items-center">`         |
| **Show**                  | Plain React syntax                           | `{condition && <X />}`                              |
| **For**                   | Plain React syntax                           | `{items.map(item => ...)}`                          |
| **Link**                  | Empty shell                                  | `Link` from Next.js or React Router                 |
| **DarkModeToggle**        | Theme logic belongs to the app               | `ThemeToggle` (presentation-only, icon slots)       |
| **LoadingOverlay**        | Trivial composition                          | Position a `Loader` over the content with Tailwind  |
| **Highlighter**           | Niche search highlighting                    | App code                                            |
| **Icon** (built-in paths) | Hardcoded SVG paths lock users in            | Pass any icon (e.g. Lucide) as `ReactNode`          |
| **TouchTarget**           | Too small to be a component                  | `touch-target` CSS utility (#200)                   |
| **Overlay**               | Not useful on its own                        | Built into Dialog and Drawer                        |
| **DropdownChevron**       | Internal detail                              | Internal to Select and Combobox                     |
| **Autocomplete** (custom) | Behaved as a combobox, not free-form         | `Combobox`                                          |

## Component Anatomy

Each component lives in `packages/ui/src/components/<name>/` with:

```
button/
  Button.tsx           # component implementation
  Button.Variants.ts   # CVA variant definitions
  Button.Labels.ts     # built-in text and its defaults, when the component has any
  Button.spec.tsx      # unit tests (co-located)
  index.ts             # public exports
```

### Patterns

- **Compound pattern** via Base UI: `<X.Root>`, `<X.Trigger>`, `<X.Content>`
- **Composition** via Base UI `render` prop, not `asChild`
- **Variants** defined with CVA in separate `*.Variants.ts` files
- **Props over config objects**: `<Button color="primary" variant="outlined">`
- **One component, one job** — no mode-switching god components

Built-in text is the one exception to props over config objects. A component with English strings of its own takes `labels?: Partial<XLabels>` on the part users render (for a compound component, usually its Root, which passes it to the other parts by context). Define `XLabels` and `DEFAULT_X_LABELS` (typed `Readonly<XLabels>`) in a React-free `X.Labels.ts` with no React or client imports, re-export both from `src/utils.ts`, and merge with `mergeLabels(DEFAULT_X_LABELS, labels)`, which keeps the default for keys set to `undefined`. An explicit `aria-label`, or an existing prop that sets the same text (such as `placeholder`), wins over `labels`. List the component in `apps/docs/content/labels.mdx`.

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

Every PR that changes a publishable package needs a changeset. That is `chunks-ui` only: `@chunks-ui/docs` is in `ignore` and `@chunks-ui/typescript-config` is private, and `privatePackages.version` is `false` in `.changeset/config.json`, so neither is gated. `typescript-config` is still a devDependency that shapes the `chunks-ui` build (`target`, `jsx`): a change there that alters the build output gets a changeset written by hand, because the gate does not see it. The `lint` job of `quality-gates.yml` runs `changeset status --since=origin/master` on pull requests and fails without a changeset. For a user-facing change:

```bash
bunx changeset
```

Describe the change, select semver bump level, and commit the generated `.changeset/*.md` file with your PR.

The changelog entry links the PR that added the changeset (`@changesets/changelog-github`), so add the changeset in the PR with the change. `changeset version` needs a GitHub token to resolve those links: the release workflow passes `PAT_TOKEN`; locally, run `GITHUB_TOKEN=$(gh auth token) bunx changeset version`.

### Files that need no changeset

`changedFilePatterns` in `.changeset/config.json` lists the files that do not count as a change. The patterns match the path inside `packages/ui`:

- `**/*.spec.ts` and `**/*.spec.tsx` (unit, visual and WebKit specs)
- `**/__screenshots__/**` (visual baselines)
- `vitest*.config.ts` and `vitest*.setup.ts` in the package root

A PR that changes only these files passes the gate with no changeset. Any other file in `packages/ui` counts: source, `package.json`, build config and test helpers such as `VisualTest.utils.tsx`. Keep `**` first in the list and add exclusions after it: a later positive pattern adds back the files an earlier negation removed (micromatch applies the list in order).

A change to such a file with no user-facing effect (a comment, a refactor) gets an empty changeset, which bumps nothing and adds no changelog entry:

```bash
bunx changeset --empty
```

### Renovate and release PRs

The gate does not run on Renovate branches (`renovate/*`) or on the Version Packages PR (`changeset-release/master`). Renovate cannot write a changeset, so the gate would fail every bump. It merges patch bumps by itself, and minor bumps of packages that are not on 0.x (`.github/renovate.json5`). Major bumps wait for approval on the dependency dashboard, and the Playwright group never merges by itself. A bump of a runtime `dependencies` entry of `packages/ui` (`clsx`, `tailwind-merge`) reaches users, so add a changeset for it by hand in a PR of its own. That PR changes no package file, so the gate passes it. Bumps of dev dependencies need none.
