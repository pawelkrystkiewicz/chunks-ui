# Scripts

This directory contains utility scripts for the project.

## check-playwright-version.ts

Fails when the Playwright version differs between `@playwright/test` (packages/ui), `playwright` (apps/docs), the `mcr.microsoft.com/playwright` images in the workflows and the Docker recipe in `TESTING_STRATEGY.md`. Also fails on an image reference without a `v<version>` tag. It checks no digest: they are bumped with the tag by hand or by Renovate. It makes no network calls.

```bash
bun run check:playwright
```

Runs in the `lint` job of `quality-gates.yml`. Tests: `scripts/__specs__/check-playwright-version.spec.ts`.

## check-bun-version.ts

Fails when the bun version in the Docker recipe in `TESTING_STRATEGY.md` (`bun@<version>`) or a workflow `bun-version:` differs from `packageManager` in the root `package.json`, which setup-bun reads in every workflow. Also fails when the recipe names no `bun@<version>`, and when a workflow's `bun-version-file:` is not `package.json`. It makes no network calls.

```bash
bun run check:bun
```

Runs in the `lint` job of `quality-gates.yml`. Tests: `scripts/__specs__/check-bun-version.spec.ts`.

## check-tailwind-compat.ts

Compiles `packages/ui/dist` with Tailwind 4.0.0 and with the installed version, and fails when 4.0.0 does not generate a class the installed version does. Tailwind does not scan CSS files, so both versions also scan a file that lists the utilities `theme.css` defines with `@utility` (such as `touch-target`, which no component uses). The installed version must generate all of them. The utility scan also follows the theme's quoted `@import`s with Bun's resolver and fails on one it cannot resolve; the limits are in `resolveImport` in `scripts/check-tailwind-compat.ts`. The installed version uses the Tailwind packages in `bun.lock`. 4.0.0 installs from the fixture in `tailwind-4.0/` with `bun install --frozen-lockfile` in a temporary directory. The fixture files are named `package.fixture.json` and `bun.fixture.lock` so that Renovate leaves them alone.

```bash
bun run check:tailwind   # builds chunks-ui first, needs the network
```

Runs in the `typecheck` job of `quality-gates.yml`. Tests: `scripts/__specs__/check-tailwind-compat.spec.ts`.

## check-no-motion.ts

Bundles chunks-ui with webpack in two throwaway consumers, one without Motion and one with it, to prove `motion` is optional. Without Motion, the build must succeed with exactly one `Can't resolve 'motion/react'` warning, and `tsc --noEmit` with `strict` and `skipLibCheck: false` must compile a file that imports `Button` and `useMotion` from `chunks-ui`, so the package types reference no `motion/react` (TS2307). With Motion, the build must emit an async chunk holding Motion and leave no bare `import("motion/react")` in any output. The fixtures in `no-motion/` pin every dependency, including `typescript` and `@types/react` for the type-check; to move a pin, see the recipe in `TESTING_STRATEGY.md`.

```bash
bun run check:no-motion   # builds chunks-ui first, needs the network
```

Runs in the `docs-build` job of `quality-gates.yml`, as its own step. Tests: `scripts/__specs__/check-no-motion.spec.ts`.

## check-peer-floors.ts

What it does and how to run it: `TESTING_STRATEGY.md` › CI › Peer floors. Tests: `scripts/__specs__/check-peer-floors.spec.ts`.

## Previewing the next version

Preview the next version with `bunx changeset status --output=<file>` (`releases[].newVersion`); the branch rules are in `CONTRIBUTING.md` › Changesets.
