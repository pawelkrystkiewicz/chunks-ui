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

A deployment builds only when `apps/docs` or a workspace package it depends on changed since that branch's last successful deployment (`turbo query affected` in `apps/docs/vercel.json`). Otherwise Vercel shows it as canceled by the Ignored Build Step. The first deployment of a branch always builds.

The ignore command also reads the HEAD commit message: `[vercel deploy]` forces a build and `[vercel skip]` skips it. `[skip ci]` no longer affects the docs deploy.

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
  - Import `cva` from `src/lib/cva`, not from `class-variance-authority`, so the emitted typings never reference cva's `./types` subpath.
- **Props over config objects**: `<Button color="primary" variant="outlined">`
- **One component, one job** — no mode-switching god components

Built-in text is the one exception to props over config objects. A component with English strings of its own takes `labels?: Partial<XLabels>` on the part users render (for a compound component, usually its Root, which passes it to the other parts by context). Define `XLabels` and `DEFAULT_X_LABELS` (typed `Readonly<XLabels>`) in a React-free `X.Labels.ts` with no React or client imports, re-export both from `src/utils.ts`, and merge with `mergeLabels(DEFAULT_X_LABELS, labels)`, which keeps the default for keys set to `undefined`. An explicit `aria-label`, or an existing prop that sets the same text (such as `placeholder`), wins over `labels`. List the component in `apps/docs/content/labels.mdx`.

### Animation

- Import spring presets from `src/lib/motion.ts` — no magic numbers in components
- Use `useMotion()` hook from `src/lib/use-motion.ts` for lazy Motion detection
- A popup part gets its `render` from `usePopupRender()` in `src/lib/use-popup-render.ts`, which picks the Motion spring or the CSS path (and keeps the CSS path for a consumer `render`). The part gates its CSS fallback classes on the returned `useSpring` (`!useSpring && "data-starting-style:…"`) and adds a row to the table in `src/lib/PopupRender.fixtures.tsx`, whose `ui(renderProp, open)` renders the part open or closed from `open`
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
bun run test              # Vitest in packages/ui and apps/docs, then bun test ./scripts
bun run test:unit:coverage # the same Vitest suites, with the coverage report and its thresholds
```

`bun run gates` (see Quality Gates) runs everything CI's `test` job runs: the Vitest suites with coverage, then `bun test ./scripts ./packages/ui/scripts`.

## PR Workflow

1. Create a branch from `master`
2. Implement changes
3. Commit, then run the quality gates on the clean branch: `GITHUB_TOKEN=$(gh auth token) bun run gates:full`, or `bun run gates` where Quality Gates says it is enough
4. Push branch and open PR
5. CI runs lint, typecheck, unit tests with coverage, the docs build with its checks, and the visual regression tests

## Quality Gates

Two commands run CI's checks locally. Each step is a `run:` step of a CI job, word for word, in its working directory. Each job's steps run in CI's order and the jobs one after another, where CI runs the jobs side by side: the run stops at the first step that fails, so it does not show what the other jobs would report. It says what the failed step needs and how to re-run it alone, and ends with every step and its time.

- `bun run gates` runs the `lint` and `typecheck` jobs (`quality-gates.yml`), then the `test` job (`unit.tests.yml`), in about half a minute when warm.
- `GITHUB_TOKEN=$(gh auth token) bun run gates:full` runs the same, then the `docs-build` job, a few minutes more. That job builds the docs, runs axe (WCAG A and AA, colour contrast included, which jest-axe in jsdom cannot see) on every docs page in both themes, and runs `check:no-motion`, which type-checks a consumer with `skipLibCheck: false` under `node10` resolution.

`bun run gates` is enough only when every changed file is one of these: a spec (`*.spec.ts`, `*.spec.tsx`); a file in `.claude/` or `.changeset/`; Markdown outside `apps/docs`; a file in the root `scripts/` other than `check-no-motion.ts` and `no-motion/`, which the `docs-build` job runs; a workflow line outside the `docs-build` job. For anything else, run `gates:full`.

What the steps need:

- The first step is CI's `bun install --frozen-lockfile`. It fails when `package.json` and `bun.lock` disagree, and brings `node_modules` in line with `bun.lock`, for example after a merge of `master` that bumps a dependency.
- The changeset check (`bunx changeset status --since=origin/master`, see Changesets) compares with your `origin/master`, so run `git fetch origin` first. It does not see untracked files, so commit first.
- `check:tailwind` builds `chunks-ui` and fails when Tailwind 4.0.0, the library's floor, cannot generate a class the installed Tailwind does. It installs the 4.0.0 CLI from `scripts/tailwind-4.0`, so it needs the network, and node. `lint` and `check-types` do not cover it. Details: `scripts/README.md`.
- The `docs-build` steps need the network and Chromium for Playwright (`bunx playwright install chromium`). With `GITHUB_TOKEN`, `check:a11y` also checks the state of the issues its `ALLOWED` entries link, as CI does; the gates pass the token to that step only. Without it, it prints a notice and skips that part; in CI a missing token fails the run.

The step lists are in `scripts/gates.ts`, with the CI steps they leave out (the install in the other jobs, the cache and container setup, the `floors` job) and why. `scripts/README.md` lists the other differences from CI. `scripts/__specs__/gates.spec.ts` reads `quality-gates.yml` and `unit.tests.yml` and fails when one of their jobs has a `run:` step that the lists do not cover. It skips a job defined with `uses:` (a reusable workflow) and does not read other workflow files. Neither command runs the visual regression tests: run the specs a change touches with `bun run test:visual <filter>` in `packages/ui`.

Pre-commit hook (Lefthook) auto-runs Biome on staged files.

## Changesets

Every PR that changes a publishable package needs a changeset. That is `chunks-ui` only: `@chunks-ui/docs` is in `ignore` and `@chunks-ui/typescript-config` is private, and `privatePackages.version` is `false` in `.changeset/config.json`, so neither is gated. `typescript-config` is still a devDependency that shapes the `chunks-ui` build (`target`, `jsx`): a change there that alters the build output gets a changeset written by hand, because the gate does not see it. The `lint` job of `quality-gates.yml` runs `changeset status --since=origin/master` on pull requests and fails without a changeset. For a user-facing change:

```bash
bunx changeset
```

Describe the change, select semver bump level, and commit the generated `.changeset/*.md` file with your PR. To run the gate locally, use `bunx changeset status --since=origin/master`: a bare `bunx changeset status` compares with a local `master` branch (`baseBranch` in `.changeset/config.json`) and fails in a clone without one.

The changelog entry links the PR that added the changeset (`@changesets/changelog-github`), so add the changeset in the PR with the change. `changeset version` needs a GitHub token to resolve those links: the release workflow passes `PAT_TOKEN`; locally, run `GITHUB_TOKEN=$(gh auth token) bun run version-packages`.

### Files that need no changeset

`changedFilePatterns` in `.changeset/config.json` lists the files that do not count as a change. The patterns match the path inside `packages/ui`:

- `**/*.spec.{ts,tsx}` (unit, visual and WebKit specs)
- `**/__screenshots__/**` (visual baselines)
- `vitest*.config.ts` and `vitest*.setup.ts` in the package root
- `src/VisualTest.*` and `src/visual-test.css` (visual test helpers and styles, never bundled)
- `src/AxeTest.*` (unit test helpers for axe audits, never bundled)
- `scripts/**` (the package's own `scripts/check-dist.ts`, which checks `dist` and ships nothing)

A PR that changes only these files passes the gate with no changeset. Any other file in `packages/ui` counts: source, `package.json` and build config such as `tsup.config.ts`. Keep `**` first in the list and add exclusions after it: a later positive pattern adds back the files an earlier negation removed (micromatch applies the list in order).

A change to such a file with no user-facing effect (a comment, a refactor) gets an empty changeset, which bumps nothing and adds no changelog entry:

```bash
bunx changeset --empty
```

### Renovate and release PRs

The gate does not run on the Version Packages PR (`changeset-release/master`). Renovate cannot write a changeset, so the gate skips `renovate/*` branches. A bump of a runtime `dependencies` entry of `packages/ui` (`clsx`, `tailwind-merge`) reaches users, so add a changeset for it by hand in a PR of its own. That PR changes no package file, so the gate passes it. Bumps of dev dependencies need none. Automerge rules: `.github/renovate.json5`.
