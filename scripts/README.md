# Scripts

This directory contains utility scripts for the project.

## design-system/

Builds the files of the Chunks UI design system (a claude.ai artifact) and merges them with the published one: `bun run design-system`, then `merge.ts`. See `design-system/README.md`.

## gates.ts

Runs CI's checks in this checkout and stops at the first that fails. Each step is a `run:` step of a CI job, word for word, in its `working-directory`. Each job's steps run in CI's order, the jobs one after another (lint, typecheck, test, then docs-build), where CI runs them side by side. The lists are `FAST` and `FULL` in the script:

- `FAST` (`bun run gates`): the `lint` and `typecheck` jobs of `quality-gates.yml`, then the `test` job of `unit.tests.yml`. It starts with CI's `bun install --frozen-lockfile`, once per run. It includes the changeset check, which CI runs on pull requests only, and the unit tests with coverage (`test:unit:coverage`), not `bun run test`: the coverage thresholds in `packages/ui/vitest.config.ts` fail CI's run where a plain run passes.
- `FULL` (`GITHUB_TOKEN=$(gh auth token) bun run gates:full`, after `FAST`): the `docs-build` job of `quality-gates.yml`.

Which changes need `FULL`, how long each list takes and what the steps need: `CONTRIBUTING.md` › Quality Gates.

Each step runs with `sh -e` (CI's default shell is `bash -e`, or `sh -e` in a container job) from the repo root or its `cwd`, with this shell's environment and the terminal attached. At the end the script lists every step with its time. For a failed step it says what the step needs (`network`, `node`, `browser`, `token`, `origin/master`) and the command that runs it alone. It exits with 0 when every step passed, 1 when one failed and 2 on an unknown argument.

About `check:a11y`:

- The script passes `GITHUB_TOKEN` to this step only, as CI does. That keeps the token out of the other tools' environment dumps, logs and crash reports. It is no barrier to hostile dependency code, which can read its parent process's environment or run `gh auth token` itself, and Bun loads a `.env` file in a step's directory: do not keep the token in a `.env` file.
- It serves the docs build on port 3105, which `PORT` changes: two runs at once, such as deliveries in parallel, each need their own port.

Left out on purpose (`CI_ONLY` in the script gives the reason for each): the install in the `typecheck`, `test` and `docs-build` jobs, the Turbo cache prune, the `unzip` install of the `docs-build` image, and the `floors` job. Also the `uses:` steps (checkout, setup-bun, the caches, the coverage upload and its PR comment), which run no command, and the visual regression workflow: run the specs a change touches with `bun run test:visual <filter>` in `packages/ui`.

Other differences from CI:

- A step's `if:`, `env:` and `continue-on-error:`: every step runs, and the run stops at the first failure also where CI goes on (CI runs the repo scripts' tests after a red unit run).
- The environment: each step gets this shell's. CI also sets `GITHUB_ACTIONS`, with which `check:a11y` fails on a missing token or on a 401, 403, 404 or 410 for an issue it links (here they are notices), and `LANG` and `LC_ALL` to `en_US.UTF-8` for every step (no check depends on the locale today).
- CI checks out the pull request merged into the current `master`; the gates check `HEAD`. When `master` has moved, merge `origin/master` first.

```bash
bun run gates                                     # the lint, typecheck and test jobs
GITHUB_TOKEN=$(gh auth token) bun run gates:full  # and the docs-build job
```

CI does not run the script; its spec runs with the repo scripts' tests in the `test` job of `unit.tests.yml`. Tests: `scripts/__specs__/gates.spec.ts` reads `quality-gates.yml` and `unit.tests.yml` and fails when a `run:` step of one of their jobs is in neither list (the `docs-build` job's in `FULL`, the others' in `FAST`) nor in `CI_ONLY`, when a list step matches no `run:` step, when a list leaves CI's order within a job or runs a step more or fewer times than CI, and when a `CI_ONLY` entry matches no `run:` step. A step matches on its `run:` text and its working directory: its own, else `defaults.run.working-directory` of its job, else that of the workflow. A job defined with `uses:` (a reusable workflow) has no steps there, and another workflow file is not read. The rows that prove the checker feed it small workflows of their own; one row reads today's workflows. The spec also tests the runner, the closing report and the exit codes.

## check-playwright-version.ts

Fails when the Playwright version differs between `@playwright/test` (packages/ui), `playwright` (apps/docs, and the root for `check-no-motion.ts`), the `mcr.microsoft.com/playwright` images in the workflows and the Docker recipe in `TESTING_STRATEGY.md`. Also fails on an image reference without a `v<version>` tag. It checks no digest: they are bumped with the tag by hand or by Renovate. It makes no network calls.

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

Fails on a physical direction class (`ml-*`, `left-*`, `text-left`, `object-left`, `origin-top-left`, `mask-l-from-*`, `bg-linear-to-r` and the like) in the docs source, so the docs mirror in RTL. It reads the `.js`, `.jsx`, `.mjs`, `.cjs`, `.ts`, `.tsx`, `.json`, `.md` and `.mdx` files in all of `apps/docs`, except `node_modules` and the build output. In the `.css` files there it reads each `@apply` (its continuation lines too, and past a quoted value such as `before:content-[';']`) and each `@source inline("…")` string. A class behind an `rtl:` or `ltr:` variant is set for one direction on purpose and passes. So does one behind `[&:dir(rtl)]:` or `[&:dir(ltr)]:`, the pair to use in a section whose direction differs from the page, as `rtl:` also matches inside an LTR section of an RTL page. A deliberate one carries a `direction: physical, <reason>` marker, on its line or in a comment directly above it (a run of `//` lines counts as one comment); a `.json` file has no comments, so its marker goes in a string on the class's line. The full class list, marker rules and limits: `TESTING_STRATEGY.md` › CI › Docs direction.

Left out on purpose:

- `translate-x-*`: centring with `left-1/2 -translate-x-1/2` is a physical idiom, so a translate is not a direction bug by itself.
- `space-x-*`, `space-x-reverse`, `divide-x-*` and `divide-x-reverse`: Tailwind 4 writes them with `margin-inline-*` and `border-inline-*-width`, so they mirror. A `-reverse` class only swaps those two logical sides for `flex-row-reverse`.
- `data-[side=left]:` and the like: Base UI sets the side from the real placement, so the variant already follows it.
- `slide-in-from-left` and the like: Tailwind does not generate them; they come from an animation plugin such as `tw-animate-css`, which the docs do not load.
- Braces in `@source inline`: they are not expanded, so a class built across them (`m{l,r}-4`, `ml-{1..4}`) is not read, and a variant before a brace does not reach the classes in it (`rtl:{ml-4,mr-4}` is flagged). The docs have no `@source inline`, so an expander waits until they do.
- Gradient and mask angles, print `break-before/after-left/right`, `touch-pan-left/right` and the resize cursors: the reasons are in the comment above `PHYSICAL` in `check-docs-direction.ts`.
- A marker for one class of a line: a marker exempts its whole line, which keeps the marker rule short.

```bash
bun run check:docs-direction
```

Runs in the `lint` job of `quality-gates.yml`. Tests: `scripts/__specs__/check-docs-direction.spec.ts`.

## check-tailwind-compat.ts

Compiles `packages/ui/dist` with Tailwind 4.0.0 and with the installed version, and fails when 4.0.0 does not generate a class the installed version does. Tailwind does not scan CSS files, so both versions also scan a file that lists the utilities `theme.css` defines with `@utility` (such as `touch-target`, which no component uses) and the className sizes of `CLASSNAME_SIZES`. The installed version must generate all the utilities. The utility scan also follows the theme's quoted `@import`s with Bun's resolver and fails on one it cannot resolve; the limits are in `resolveImport` in `scripts/check-tailwind-compat.ts`. It also fails when either version puts the touch size of `FIELD_TEXT_SIZE` before a size it must come after (`TOUCH_ORDER` in the script). 4.0.0 also compiles the opt-in that generates the CSS of only the components an app uses, `dist/theme.core.css` with `dist/sources/button.css`, and the run fails when that CSS lacks Button's class; `check:css-sources` in `packages/ui` checks the opt-in with the installed version. The installed version uses the Tailwind packages in `bun.lock`. 4.0.0 installs from the fixture in `tailwind-4.0/` with `bun install --frozen-lockfile` in a temporary directory. The fixture files are named `package.fixture.json` and `bun.fixture.lock` so that Renovate leaves them alone.

```bash
bun run check:tailwind   # builds chunks-ui first, needs the network
```

Runs in the `typecheck` job of `quality-gates.yml`. Tests: `scripts/__specs__/check-tailwind-compat.spec.ts`.

## check-no-motion.ts

Proves `motion` is an optional peer of chunks-ui. It packs the built package, installs it into two throwaway consumers, one without Motion and one with it, and builds each with two bundlers:

- **webpack** (Next.js in webpack mode) bundles an entry that imports chunks-ui. Without Motion, the build must succeed with exactly one `Can't resolve 'motion/react'` warning, and `tsc --noEmit` with `strict` and `skipLibCheck: false` must compile a file that imports `Button` and `useMotion` from `chunks-ui` and `cn` from `chunks-ui/utils`, once with `moduleResolution: bundler` and once with `node10` (`module: commonjs`, without `esModuleInterop`, so a default import of React in `dist/index.d.ts` fails with TS1259, #463). So the package types reference no `motion/react` (TS2307) and name no exports-only subpath of a dependency, which `node10` resolves through a directory or `typesVersions` only (#405). With Motion, the build must emit an async chunk holding Motion and leave no bare `import("motion/react")` in any output.
- **Turbopack** (`next build`, Next 16's default) builds the minimal app in `no-motion/next/` (`app/layout.jsx`, `app/page.jsx` with a `Dialog` and a `Tooltip`, the components that lazy-load Motion, and `next.config.mjs` with `output: "export"`) in a subdirectory of each consumer. The app is plain JavaScript, so Next has nothing to type-check, and only `app/` and `next.config.mjs` are copied, so a local `next build` in the fixture directory leaves nothing in a run. Without Motion, the build must pass and `out/index.html` must contain both trigger texts (`NEXT_TRIGGERS` in the script). That proves three things: Turbopack compiles the client and server graphs of chunks-ui without Motion, the server module (with Turbopack's stub for `motion/react`) evaluates without throwing, and the triggers prerender. The server render runs no Motion code: `loadMotion()` runs only in the browser, and the popups of `Dialog` and `Tooltip` sit in closed client-only portals, so it reaches `Root` and `Trigger` only. With Motion, a chunk under `out/_next/static/chunks` must contain `MotionGlobalConfig` (an export of `motion/react`, so it survives minification), `out/index.html` must not name that chunk (in a script or link tag, the Turbopack bootstrap or the inline flight payload), because a chunk it names is part of the initial load instead of an async chunk, and must name a chunk with the page's own code, and no chunk may keep a bare `import("motion/react")`.
- **Chromium** (Playwright) serves each consumer's `out/` on loopback, waits for the hydration marker (`html[data-hydrated="true"]`, set by `page.jsx`), clicks "Open the dialog" and waits for the dialog's title. A `pageerror` or a console error fails. With Motion, the chunk holding `MotionGlobalConfig` must be requested only after the page's own chunk has arrived. Needs `bunx playwright install chromium` (the CI image has it).

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

Runs in the `docs-build` job of `quality-gates.yml`, as its own step. Tests: `scripts/__specs__/check-no-motion.spec.ts` (the assertion helpers on fixture strings and the fixture files; no build or browser runs in the unit tests).

## check-peer-floors.ts

What it does and how to run it: `TESTING_STRATEGY.md` › CI › Peer floors. Tests: `scripts/__specs__/check-peer-floors.spec.ts`.

## Previewing the next version

Preview the next version with `bunx changeset status --output=<file>` (`releases[].newVersion`); the branch rules are in `CONTRIBUTING.md` › Changesets.
