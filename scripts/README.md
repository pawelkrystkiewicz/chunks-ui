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

## check-docs-direction.ts

Fails on a physical direction class (`ml-*`, `left-*`, `text-left` and the like) in the docs source, so the docs mirror in RTL. A deliberate one carries a `direction: physical, <reason>` marker. The full class list, marker rules and limits: `TESTING_STRATEGY.md` › CI › Docs direction.

```bash
bun run check:docs-direction
```

Runs in the `lint` job of `quality-gates.yml`. Tests: `scripts/__specs__/check-docs-direction.spec.ts`.

## check-tailwind-compat.ts

Compiles `packages/ui/dist` with Tailwind 4.0.0 and with the installed version, and fails when 4.0.0 does not generate a class the installed version does. Tailwind does not scan CSS files, so both versions also scan a file that lists the utilities `theme.css` defines with `@utility` (such as `touch-target`, which no component uses). The installed version must generate all of them. The utility scan also follows the theme's quoted `@import`s with Bun's resolver and fails on one it cannot resolve; the limits are in `resolveImport` in `scripts/check-tailwind-compat.ts`. The installed version uses the Tailwind packages in `bun.lock`. 4.0.0 installs from the fixture in `tailwind-4.0/` with `bun install --frozen-lockfile` in a temporary directory. The fixture files are named `package.fixture.json` and `bun.fixture.lock` so that Renovate leaves them alone.

```bash
bun run check:tailwind   # builds chunks-ui first, needs the network
```

Runs in the `typecheck` job of `quality-gates.yml`. Tests: `scripts/__specs__/check-tailwind-compat.spec.ts`.

## check-no-motion.ts

Proves `motion` is an optional peer of chunks-ui. It packs the built package, installs it into two throwaway consumers, one without Motion and one with it, and builds each with two bundlers:

- **webpack** (Next.js in webpack mode) bundles an entry that imports chunks-ui. Without Motion, the build must succeed with exactly one `Can't resolve 'motion/react'` warning, and `tsc --noEmit` with `strict` and `skipLibCheck: false` must compile a file that imports `Button` and `useMotion` from `chunks-ui`, so the package types reference no `motion/react` (TS2307). With Motion, the build must emit an async chunk holding Motion and leave no bare `import("motion/react")` in any output.
- **Turbopack** (`next build`, Next 16's default) builds the minimal app in `no-motion/next/` (`app/layout.jsx`, `app/page.jsx` with a `Dialog` and a `Tooltip`, the components that lazy-load Motion, and `next.config.mjs` with `output: "export"`) in a subdirectory of each consumer. The app is plain JavaScript, so Next has nothing to type-check, and only `app/` and `next.config.mjs` are copied, so a local `next build` in the fixture directory leaves nothing in a run. Without Motion, the build must pass and `out/index.html` must contain both trigger texts (`NEXT_TRIGGERS` in the script). That proves three things: Turbopack compiles the client and server graphs of chunks-ui without Motion, the server module (with Turbopack's stub for `motion/react`) evaluates without throwing, and the triggers prerender. It does not run any Motion code: `loadMotion()` runs only in the browser, and the popups of `Dialog` and `Tooltip` sit in closed client-only portals, so the server render reaches `Root` and `Trigger` only. The browser path (the `import()` rejecting into the `catch`, the CSS fallback) is not exercised by this check. No server is started. With Motion, a chunk under `out/_next/static/chunks` must contain `MotionGlobalConfig` (an export of `motion/react`, so it survives minification), `out/index.html` must not name that chunk (in a script or link tag, the Turbopack bootstrap or the inline flight payload), because a chunk it names is part of the initial load instead of an async chunk, and must name a chunk with the page's own code, and no chunk may keep a bare `import("motion/react")`.

The fixtures pin every dependency: `no-motion/package.fixture.json` and `no-motion/with-motion/package.fixture.json`, with their `bun.fixture.lock`, installed with `bun install --frozen-lockfile` in a temporary directory, so the root `bun.lock` does not change. They are named `*.fixture.*` so that Renovate leaves them alone; keep `next` at the version `apps/docs/package.json` uses, and `typescript` and `@types/react` in the consumer without Motion are there for the strict `tsc` run. The `next` unit test compares the floor of the docs app's `next` range in `apps/docs/package.json` (a leading `^` or `~` stripped), not the version the root `bun.lock` resolves. So a Renovate bump of `next` in `apps/docs` fails `bun test ./scripts` until the fixture follows the recipe below; that failure is expected. To move a pin, change both `package.fixture.json` files and refresh each lockfile from the repository root (needs the network). The old lockfile seeds the install, so moving one pin does not re-resolve every transitive dependency:

```bash
for fixture in scripts/no-motion scripts/no-motion/with-motion; do
  dir=$(mktemp -d) && cp "$fixture/package.fixture.json" "$dir/package.json" &&
    cp "$fixture/bun.fixture.lock" "$dir/bun.lock" && (cd "$dir" && bun install) &&
    cp "$dir/bun.lock" "$fixture/bun.fixture.lock" && rm -rf "$dir"
done
```

```bash
bun run check:no-motion   # builds chunks-ui first, needs the network
```

Runs in the `docs-build` job of `quality-gates.yml`, as its own step. Tests: `scripts/__specs__/check-no-motion.spec.ts` (the assertion helpers on fixture strings and the fixture files; no build runs in the unit tests).

## check-peer-floors.ts

What it does and how to run it: `TESTING_STRATEGY.md` › CI › Peer floors. Tests: `scripts/__specs__/check-peer-floors.spec.ts`.

## Previewing the next version

Preview the next version with `bunx changeset status --output=<file>` (`releases[].newVersion`); the branch rules are in `CONTRIBUTING.md` › Changesets.
