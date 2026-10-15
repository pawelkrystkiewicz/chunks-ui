# Testing Strategy

## Tools

| Tool            | Purpose                         |
| --------------- | ------------------------------- |
| Vitest          | Unit tests + component tests    |
| Testing Library | DOM queries + user interactions |
| jest-axe        | Accessibility assertions        |

## Test Types

### Unit Tests (`*.spec.tsx`)

Co-located with components in `packages/ui/src/components/[name]/`.

Every component must have:

1. **Renders without crashing** — basic mount test
2. **Custom className forwarding** — `className` prop merges with internal classes
3. **Accessibility** — `jest-axe` audit, no violations
4. **Variants** — data-driven tests iterating over CVA variants
5. **Keyboard interaction** — Base UI handles most, but verify focus management
6. **Ref forwarding** — `ref` prop reaches the correct DOM element

```tsx
// Button.spec.tsx
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Button } from './Button'

const VARIANTS = ['contained', 'outlined', 'ghost', 'link'] as const
const COLORS = ['primary', 'destructive', 'success', 'warning'] as const

describe('Button', () => {
  it('renders', () => {
    const { getByRole } = render(<Button>Click</Button>)
    expect(getByRole('button')).toBeInTheDocument()
  })

  it('forwards className', () => {
    const { getByRole } = render(<Button className="custom">Click</Button>)
    expect(getByRole('button')).toHaveClass('custom')
  })

  it('has no a11y violations', async () => {
    const { container } = render(<Button>Click</Button>)
    expect(await axe(container)).toHaveNoViolations()
  })

  VARIANTS.forEach((variant) => {
    COLORS.forEach((color) => {
      it(`renders ${variant}/${color}`, () => {
        const { getByRole } = render(
          <Button variant={variant} color={color}>Click</Button>
        )
        expect(getByRole('button')).toBeInTheDocument()
      })
    })
  })
})
```

### Time zone

`packages/ui/vitest.config.ts` sets `TZ=Europe/Warsaw` (DST, a positive offset) before the workers start; the docs app has its own vitest config and no pin. `vitest.visual.config.ts` pins the Playwright context to the same zone (`timezoneId` in `playwrightProvider`), so the Chromium visual projects and the WebKit smoke project read local dates in Europe/Warsaw too, not in the runner's UTC. Three canaries fail when a pin is lost, each asserting that 15 January has a UTC offset of +1 hour (`getTimezoneOffset()` is -60). They live in `calendar/date.spec.ts` (unit `TZ`), `Calendar.visual.spec.tsx` (`timezoneId`; runs only in the reduced-motion `chromium` instance) and `Smoke.webkit.visual.spec.tsx` (WebKit).

Local midnight, which nearly every date chunks-ui handles is (`createDate`, `startOfDay`, every picked day), is the previous day in UTC there, so a spec that reads a local date through UTC fails on the UTC GitHub runner as it would for a user. Build dates with `new Date(y, m, d)` or `createDate` from `calendar/date.ts` and assert the local fields. The pin catches the midnight and early-morning reads (00:30 is the previous UTC day); a late-evening read (23:59 is the next UTC day) is guarded only when a developer runs west of UTC, so the date specs keep a 23:59 case beside the 00:30 one. The rule: never format or compare a local date through UTC (`toISOString`, `getUTC*`).

## Animation Testing

Components with Motion animations need two test paths:

1. **Without Motion** — verify CSS fallback works, component is functional
2. **With Motion** — verify animated elements render, transitions complete

## Accessibility Testing

Every component must include a jest-axe assertion:

```tsx
import { axe } from "jest-axe";

it("has no a11y violations", async () => {
  const { container } = render(<Button>Click me</Button>);
  expect(await axe(container)).toHaveNoViolations();
});
```

For form controls without visible labels, use `aria-label` in the a11y test render:

```tsx
it("has no a11y violations", async () => {
  const { container } = render(<Input aria-label="Email" />);
  expect(await axe(container)).toHaveNoViolations();
});
```

Setup: `jest-axe` is globally configured in `vitest.setup.ts` — `toHaveNoViolations` is available on all `expect()` calls.

### Accessible names in Chromium

The jsdom specs compute roles and names with Testing Library, which has its own implementation of the accessible-name spec. To check the name Chromium computes, which is what assistive tech gets, use `accessibilityTreeOf(element)` from `VisualTest.utils.tsx` in a visual spec.

It returns roles and names for the element and the nodes below it, with ignored nodes left out and `InlineTextBox` dropped; Chromium only. See `ChipRemoveName.visual.spec.tsx` for usage.

## Visual Regression Tests (`*.visual.spec.tsx`)

Browser specs (Vitest browser mode, Playwright Chromium) in `packages/ui`. They screenshot components and compare them with committed baselines, and they cover the geometry that jsdom can't measure (positions, sizes, overflow).

- **Mismatch tolerance is 0; the colour threshold is 0.02.** `toMatchScreenshot` runs with `allowedMismatchedPixelRatio: 0` (`vitest.visual.config.ts`), so one detected differing pixel fails the spec. "Detected" means a pixel's colour differs by more than pixelmatch's threshold, which the config sets to 0.02 instead of the default 0.1, and anti-aliased pixels are ignored. At 0.1, removing a `--border` line (oklch 0.922) on white leaves no pixel detected. 0.02 still ignores a shift of about 5 grey levels (a 0.97 fill at half opacity), and is not 0 so rounding noise between Chromium builds doesn't fail a run.
- **Content that overflows what a screenshot captures fails the spec.** `renderFixture` checks its fixture's descendants after the render, and `vitest.visual.setup.ts` runs the same check before every `toMatchScreenshot`, on the element the screenshot captures. So content that opens or grows after the render fails too: an expanded panel in a fixture, or a popup that reaches past the page in a page screenshot (`renderPage`). Give the spec a wider page with `withViewport(width)` at the top of its `describe` block, or pass `{ allowOverflow: true }` to `renderFixture` when the overflow is what the spec shows. The check counts the captured element's descendants and the content of every Base UI portal on the page outside it (a popup portals to `<body>`), so a popup that reaches past a fixture fails a fixture screenshot, and a part of the fixture fails for a popup outside that part. Wait for the popup to settle first: it sits at the page's top left until Floating UI positions it. A portal's own `<div>` and a modal popup's empty, transparent backdrop paint nothing and don't count. Don't call `page.viewport(...)` in a spec: `withViewport` restores the page after the block, so later specs keep the default page. The rules of the check are in the `overflowPast` JSDoc in `VisualTest.utils.tsx`.
- **Screenshots are at full size: one px per CSS px.** Vitest scales the test page down when it does not fit the runner's browser window. The window (`RUNNER_WINDOW` in `vitest.visual.config.ts`, 1280 × 1024) is larger than every page the specs set: the default 414 × 896 page and the `withViewport` pages. `withViewport` throws for a page that does not fit the window; raise `RUNNER_WINDOW` before setting a larger page. The WebKit project uses the same window.
- **Text renders in Manrope from local files.** Manrope is the theme's `--font-sans`. `vitest.visual.setup.ts` loads it from the `@fontsource-variable/manrope` devDependency before any spec runs: weights 200–800 and the subsets the docs app loads from Google Fonts. No request leaves the machine. A file that does not load fails the setup, and with it every spec. Without the font, text fell back to the machine's sans-serif, so text widths and overflow differed between macOS and the Docker image.
- **Every test starts with the pointer parked and in keyboard modality.** `vitest.visual.setup.ts` moves the mouse off the page and sends Escape in a `beforeEach`. The page keeps the last mouse position and the last input modality across tests and spec files, so a hover style or a `:focus-visible` ring (shown on programmatic focus only after a keyboard event) would otherwise depend on which spec ran before. A spec that wants mouse modality (no ring) clicks first.
- **Only Linux baselines are committed** (`*-linux.png`), and CI compares against them. macOS baselines (`*-darwin.png`) are gitignored and exist only on your machine. With zero tolerance, a macOS baseline left over from an older checkout fails locally although nothing is wrong: refresh it with `bun run test:visual:update` (in `packages/ui`) before you treat a local failure as a regression. Both `bun run test:visual` and `bun run test:visual:update` take a path filter (a substring of the spec path): `bun run test:visual:update button` refreshes only the matching specs. In `packages/ui` the script passes `--update=true`, because a bare `--update` would take the filter as its value and refresh every spec.
- **Regenerate Linux baselines in Docker** after you commit the change. CI renders on x86 in the same image, so force `linux/amd64`; an arm64 render can differ from the CI render. Under emulation on Apple silicon the run takes minutes, which is not a hang. `<wt>` is your checkout or worktree, `<scratchpad>` any scratch directory outside it:

  ```bash
  D=<scratchpad>/ui-visual; rm -rf $D && mkdir -p $D && git -C <wt> archive HEAD | tar -x -C $D
  docker run --rm --platform linux/amd64 -v $D:/work -w /work mcr.microsoft.com/playwright:v1.64.0-noble@sha256:bc72a8df40831ded821e3cbc79c318c21b44d6e51dff9fd89ace7a8249c5b462 bash -lc \
    'npm i -g bun@1.4.3 >/dev/null 2>&1 && bun install --frozen-lockfile >/dev/null 2>&1 && cd packages/ui && bun run test:visual:update'
  rsync -am --include='*/' --include='*-linux.png' --exclude='*' $D/packages/ui/src/ <wt>/packages/ui/src/
  ```

  - The tag is the version `bun run check:playwright` compares; Docker accepts it together with the digest and `--platform`.
  - The bun version is the root `packageManager`, which CI's setup-bun reads; `bun run check:bun` fails when the recipe names another. An older bun can fail to read `bun.lock`.
  - The digest in the command is the `linux/amd64` manifest of `mcr.microsoft.com/playwright:v1.64.0-noble`; CI pins the multi-arch index in the workflows' `container:`. The check compares no digest.
  - Bump the tag and both digests with `@playwright/test`. `docker buildx imagetools inspect` on the new `-noble` tag lists the manifests.
  - `bun run update:screenshots` does the same on GitHub Actions for the current branch.
- Look at every changed PNG before you commit it.

## WebKit Smoke Tests (`*.webkit.visual.spec.tsx`)

The visual suite runs in Chromium only, so a bug that only Safari has does not show there. A small set of browser specs runs in WebKit (Playwright's Safari engine) to catch such bugs: `src/Smoke.webkit.visual.spec.tsx`, in its own project (`vitest.webkit.config.ts`).

- **Geometry and paint, no screenshot baselines.** There is no second set of PNGs to keep up to date. A paint check reads a screenshot as data: it counts the pixels in an element's box that change when the element is hidden. 0 means that WebKit laid the element out but painted none of it. A geometry check alone does not find that.
- **A known WebKit bug is asserted by a plain `it`** (W80, #341). WebKit paints nothing of a `Tabs.Contents` panel when both conditions are true: the panel is in a CSS column after the first, and the slid track reaches over a composited layer that paints before it. On `/create`, where TabsCard is on `Tabs.Contents` (#295), that layer is the sticky theme sidebar, which is composited while the page scrolls. The bug is in WebKit's compositing inside CSS columns, and no change to `Tabs.Contents` or its panels prevents it (tried and failed: `will-change`, `contain`, `isolation`, clipping, a 3D transform, a margin or `left` instead of the transform). The page can work around it from outside: give the columns container, an ancestor of `Tabs.Contents`, its own composited layer (`will-change: opacity`), and the panel paints. `/create` does that in `PreviewPanel.tsx`, and a spec checks this workaround. The bug spec asserts that 0 pixels paint, so when it starts to fail, WebKit has fixed the bug: flip it to expect painted pixels and rename it. Keep the workaround spec: users' Safari lags behind WebKit.
- **Run it locally** from the repo root or `packages/ui`:

  ```bash
  bunx playwright install webkit   # once
  bun run test:webkit
  ```

  On macOS this runs Playwright's macOS WebKit. CI runs the Linux build from the Playwright image. The suite was run in the pinned `linux/amd64` image (v1.64.0-noble) too: all specs pass, and W80 reproduces there with 0 painted pixels, as on macOS.
- **Name new specs `*.webkit.visual.spec.tsx`.** The Chromium projects exclude them, and the unit run and `tsconfig.json` skip every `*.visual.spec.tsx` file. `check-types` compiles them with `tsconfig.visual.json`, and the Vitest and tsup configs with `tsconfig.node.json`. Keep the set small. It is a smoke test, not a second visual suite.

## Coverage Targets

No hard thresholds enforced yet. Current baseline:

- All components (except aspirational Tier 3) must have a spec file
- Each spec must cover: renders, className merging, a11y violations
- `passWithNoTests: false` in vitest config — deleted test files cause CI failure

## Mocking Philosophy

**Minimal mocking.** Tests render real components with real Base UI internals.

Allowed:

- `vi.fn()` for verifying user callbacks (e.g., `onClear`, `onRemove`)
- jsdom shims for browser APIs that jsdom doesn't implement, such as layout (`getBoundingClientRect`), `ResizeObserver` or `matchMedia`. This is the one exception to "no stubs": jsdom has no layout, so assert behaviour on top of the shim and cover the real geometry in a browser spec (`*.visual.spec.tsx`).

Not allowed:

- `vi.mock()` — no module-level mocking
- `vi.stub()` — no stubs
- Mocking Base UI, Floating UI, or Motion internals

## What NOT to Test

- Base UI internals (positioning, ARIA attributes it manages)
- Tailwind CSS output (trust the framework)
- Motion spring physics (trust the library)
- CSS variable values (that's the theme, not the component)

## Test File Organization

Tests are co-located with source files:

```text
button/
  Button.tsx
  Button.Variants.ts
  Button.spec.tsx      ← unit tests here
  index.ts
```

Naming: `Component.spec.tsx` (not `.test.tsx`, not in `__tests__/`).

## Commands

```bash
bun run test               # unit tests
bun run test:unit:coverage # with V8 coverage report
```

## CI

- **Unit tests + coverage** run on every PR and master push (`unit.tests.yml`), and so do the tests of the root `scripts/` and of the `check:dist` build check, `packages/ui/scripts/check-dist.spec.ts` (`bun test ./scripts ./packages/ui/scripts`)
- **Visual regression** runs on every PR and master push (`visual-regression.tests.yml`); the master result goes to Slack. On a pull request the job runs the suite only when the PR touches a `WATCH` path (the list is in the workflow); otherwise the install and test steps are skipped and the job still passes, so the required `visual-regression-test` check passes on a docs-only PR. Master pushes and manual runs always run the full suite. The WebKit smoke tests run in the same job and container after the Chromium suite, also when only the Chromium suite failed. On master and manual runs the Chromium suite also runs in a random order (`--sequence.shuffle`, seed = the run number, named in the Slack message), to catch a spec that leans on state an earlier one left. A failure there is an isolation bug in a spec or the harness, not a baseline to update. The Slack failure message names the failed suites: Chromium visual, WebKit smoke, shuffled; a failing checkout or decide step on master posts it too, as "setup or another step".
- **Lint + typecheck** run on every PR and master push (`quality-gates.yml`), and also cover the root `scripts/` (`lint:scripts`, `check-types:scripts`)
- **Changeset status** runs in the `lint` job of `quality-gates.yml`, on pull requests only: `bunx changeset status --since=origin/master`. It skips `changeset-release/master` and `renovate/` branches. Rules for authors: `CONTRIBUTING.md` › Changesets.
- **Version checks** run in `quality-gates.yml` (`check:playwright` and `check:bun` in the `lint` job, `check:tailwind` in the `typecheck` job):
  - `bun run check:playwright` fails when `@playwright/test`, the docs' `playwright`, a workflow `mcr.microsoft.com/playwright` image tag or the Docker recipe above name different versions. It also fails on a reference without a `v<version>` tag. It checks no digest: they are bumped with the tag by hand or by Renovate. It makes no network calls.
  - `bun run check:bun` fails when the Docker recipe's `bun@<version>` or a workflow's `bun-version:` differs from the root `packageManager`, when the recipe names no `bun@<version>`, and when a workflow's `bun-version-file:` is not `package.json`. It makes no network calls.
  - `bun run check:tailwind` builds `chunks-ui`, compiles `dist/theme.css` and the code it scans with Tailwind 4.0.0 (the oldest v4) and with the installed version, and fails when 4.0.0 does not generate a class the installed version does. A consumer on 4.0 would get no CSS for that class. The scan reads every word in `dist`, so a listed name can also come from a comment or string, not only from a class in use. Both versions also compile the theme's own static `@utility` names (through an extra `@source` list), and it fails when the installed version does not generate one. The utility scan also follows the theme's quoted `@import`s with Bun's resolver and fails on one it cannot resolve; the limits are in `resolveImport` in `scripts/check-tailwind-compat.ts`. It also fails when either version lacks a Button class (the scan broke). The installed version compiles with the Tailwind packages in `bun.lock`. 4.0.0 installs from `scripts/tailwind-4.0` (`bun install --frozen-lockfile` in a temporary directory), so every dependency is pinned and `bun.lock` does not change. To move the pin, change `package.fixture.json` there, run `bun install` in a temporary copy named `package.json`, and copy its `bun.lock` back as `bun.fixture.lock`. The install needs the network.
- **Peer floors** (`floors` job in `unit.tests.yml`): `scripts/check-peer-floors.ts --overrides` reads the lowest version each `^range` in `packages/ui/package.json` `peerDependencies` allows and merges those into `overrides` of the root `package.json` (the existing `zod` entry stays), then a plain `bun install` resolves every dependent of those packages at the floors, including the `packages/ui` devDependencies (`motion`, `@base-ui/react` and the React types), with no change to `node_modules` by hand. `@types/react` and `@types/react-dom` go in at `<major>.<minor>.x` of the `react` and `react-dom` floors (`19.2.x` for `19.2.0`, derived by the script, never hard-coded). The job then runs `check-peer-floors.ts --check`, which fails unless `packages/ui` resolves each peer to its floor and each types package to a patch of its minor, then the package's `check-types`, so a type error a consumer on 19.2 types would hit fails the job, and the ui unit suite. The job edits `package.json` and `bun.lock` in its own checkout only (it is not `--frozen-lockfile`, and its cache step restores but never saves), so nothing from it reaches the repo or the shared cache; run `--overrides` locally only in a throwaway copy (it refuses to run unless `CI` is set, and not to `false` or `0`, or `--force` is passed). It is a required check since 2026-10-15. A moved peer range moves its floor automatically; the YAML is the recipe.
- **Optional Motion** (`bun run check:no-motion`) bundles chunks-ui with webpack with and without Motion installed, and fails when the build without it breaks or the build with it loses the Motion chunk. Without Motion it also type-checks a consumer with `skipLibCheck: false`. Both consumers also run `next build` with Turbopack on a minimal static-export app, which must build without Motion and keep Motion out of the initial load with it. Fixture recipe: [`scripts/README.md`](scripts/README.md).
- **Docs snippets and axe** run on every PR and master push (`quality-gates.yml`), see below
- **Caches**: `quality-gates.yml`, `unit.tests.yml`, `visual-regression.tests.yml` and `update-screenshots.yml` restore and save bun's install cache (`~/.bun/install/cache`, keyed on `bun.lock`, with an older key as the fallback), so `bun install --frozen-lockfile` reads most packages from disk. `quality-gates.yml` also keeps Turbo's local cache (`.turbo`, one key per job and commit, the newest earlier run restored) in the `typecheck` job only, where a hit replays the `chunks-ui` build, and Next's compiler cache (`apps/docs/.next/cache`, keyed on `bun.lock` and the docs source) in `docs-build`.
- **Release** (`release-changeset.yml`, master pushes and `workflow_dispatch`, 15 minute timeout, job runs only on `refs/heads/master`): `bun run release` builds `chunks-ui`, then runs its `check:exports` (attw) and `check:dist` before `changeset publish`, so a broken `dist/` fails before anything reaches npm. Before that, the job fails when the runner's npm is older than 11.5.1, which npm trusted publishing (OIDC, no token) needs. Slack gets a message when a version is published, when the workflow fails, and when a run publishes nothing while master is at a version npm does not have (below). The npm publish runs before the tag push and the GitHub release (both with `PAT_TOKEN`), so a run can fail with the version on npm and no tag or release. What to do after a failed run:
  - Failed before the npm publish: use "Re-run jobs" on that run. It runs at the version commit, where no changesets are left. `workflow_dispatch` runs the flow at master HEAD instead: it refreshes the Version Packages PR when master has changesets, and does nothing useful for a missed tag.
  - Failed after the npm publish: `changeset publish` skips a version that is already on npm and prints no `New tag:` line, which the action reads to tag and release. No re-run repairs it. On the version commit, run `bunx changeset tag` (it creates `chunks-ui@<version>`), push the tag with `git push origin chunks-ui@<version>`, then run `gh release create chunks-ui@<version> --verify-tag --title chunks-ui@<version> --notes-file <file>`, with the version's section of `packages/ui/CHANGELOG.md` as the notes file.
  - Merge the Version Packages PR only after the Release run of the newest master push has refreshed it. The action publishes only when no changeset is left on master, empty ones count, so a Version Packages PR merged earlier leaves master at its bumped, unpublished version together with the changesets it did not consume, and no run publishes until they are gone. Every run that published nothing asks npm for the version at the run's commit (`npm view chunks-ui@<version> version`; the step reads `packages/ui/package.json` with `git show "$GITHUB_SHA:…"`, not from the workspace, which `changesets/action` leaves on its release branch with the versions bumped) and posts a Slack message when npm answers `E404` for it; any other npm failure is a workflow warning and no message, and a run that only refreshed the Version Packages PR posts nothing, because master is still at the published version. What to do after the message: if the leftovers are empty, the action logs "All changesets are empty; not creating PR" and does nothing else, so delete them in a PR and the next run publishes. If they are real, that run refreshed the Version Packages PR, but the version the message names is never published: `changeset version` bumps again from it and `changeset publish` publishes only the version in `package.json`. Merging the PR publishes the next version; npm skips the stale one, `CHANGELOG.md` keeps its section, and it gets no tag or GitHub release. The message repeats on each master push until then.

### Docs checks

Two gates check the docs site in `apps/docs`:

- **Snippet type-check**, in the `typecheck` job. The docs `check-types` runs `tsc` on the app and on `scripts/`, then `check:snippets`. That compiles every ` ```tsx ` block in `apps/docs/content` against the built `chunks-ui` types and reports errors at the `.mdx` line. A block can use the `chunks-ui` and React exports, and lucide icons by their `XxxIcon` name, without an import. If a block uses a name from the code around it (state, or data from an earlier block on the page), declare that name with its real type in `apps/docs/scripts/check-snippets.fixtures.ts`, under the page's path.
- **axe**, in the `docs-build` job after the build. `check:a11y` serves the build with `next start` and runs axe (WCAG 2.2 A and AA) in light and dark mode on every page built from `content/**/*.mdx` (the landing page, `/create` and `/kitchen-sink` among them), on every other `page.*` under `apps/docs/app/`, and on the 404 page. It gets the 404 page by requesting a URL that no page answers on, and fails if that URL does not answer 404. An app page other than the MDX catch-all stops the run until you add its URLs to `pages()` in the script. Pages are audited with every popup closed, so the run also opens the popup of the first example on the Combobox, DatePicker, Menu, Popover and Select pages, audits the open popup alone in both themes, and closes it with Escape. It also asserts that the popup trigger has `aria-expanded="true"` and `aria-controls` set to the popup's id; `aria-activedescendant` (a Combobox or Select option highlight) is not covered. A popup's violations print as `<page> with <name> open`; scope an `ALLOWED` entry for them with the page's route in `pages`. To cover another popup, add its page, its trigger's role and accessible name, and the popup's role to `POPUPS` in the script. It does not fail on axe's `incomplete` results (checks axe could not decide).

  A page is audited only once React has hydrated it and its fonts have loaded, because Playwright's `networkidle` is not hydration and axe on a half-hydrated page gives false results. `app/HydrationMarker.tsx`, a client component in the root layout, sets `data-hydrated="true"` on `<html>` after the hydration commit; the script waits for it and then for `document.fonts.status === "loaded"`, each bounded to 10 s. A page whose served HTML has a Suspense boundary that is not empty, or one still pending, fails the run, because such a boundary hydrates after the marker is set.

To run them locally:

```bash
bun run build --filter=@chunks-ui/docs  # builds chunks-ui (the snippets need its types) and the docs
cd apps/docs
bun run check:snippets
bunx playwright install chromium         # once, for check:a11y
bun run check:a11y                       # starts next start on port 3105; set PORT to change it
```

When axe flags something you can't fix in the docs, open an issue for the fix, then add an entry to `ALLOWED` in `apps/docs/scripts/check-a11y.ts`:

```ts
{
  rule: "color-contrast", // the axe rule id
  selector: '[role="grid"] button.opacity-50', // matched against the flagged element itself
  why: "#252: Calendar outside-month days, 2:1 light", // the issue, and the measured ratio
  pages: ["/components/calendar"], // optional: only on these routes
  themes: ["light"], // optional: only in this theme
},
```

Scope the entry to the pages and themes where the violation occurs. The run fails when an entry matches nothing, so remove the entry in the change that fixes its cause.

The run also fails when the issue an entry links (the `#NNN` that starts `why`) is closed as completed or as a duplicate: for completed, the fix landed, so the entry must go, or the issue must be reopened if the violation is still there; for a duplicate, link the canonical issue instead. An issue closed as not planned is an accepted exception, and its entry stays. The issue state lives outside the commit, so closing an issue as completed turns every branch red until the entry is gone: remove the entry in the PR that fixes the issue, and merge master into older branches. The script reads the issue states from the GitHub API with `GITHUB_TOKEN` (CI passes the job's token; locally, run `GITHUB_TOKEN=$(gh auth token) bun run check:a11y`). Outside CI an unreadable state is a notice. In CI a missing token or a 401, 403, 404 or 410 fails the run; the status-code rule is in the header of the script.

The docs also have unit specs (jsdom), with shared shims and cleanup in `apps/docs/vitest.setup.ts`. Run them from the repo root with `bunx turbo run test --filter=@chunks-ui/docs`: the `test` task depends on `^build` (`turbo.json`), so Turbo builds `chunks-ui`, which the specs import, first. `bun run test` inside `apps/docs` skips that build and fails in a fresh worktree until `chunks-ui` is built; `bun run test --filter=...` at the root does not work either. The smoke specs render the example modules and the kitchen-sink page under StrictMode and fail on a throw or a `console.error`.
