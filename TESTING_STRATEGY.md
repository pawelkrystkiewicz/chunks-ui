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
3. **Accessibility** — `jest-axe` audit, no violations. With a portalled popup open, assert that the popup is in the document but outside `container` (`expect(container).not.toContainElement(screen.getByRole(…))`), then audit `document.body` (see **Accessibility Testing** below)
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

A popup (Combobox, DatePicker, Dialog, Drawer, Menu, Popover, Select, Tooltip) renders into a portal node in `document.body`, outside the `container` that `render` returns, so `axe(container)` does not see it. When the test opens a popup, audit `document.body`. Also assert that the popup is in the document, so that the audit cannot pass when the popup did not open. An open Menu also needs an `axe` that skips Base UI's focus guards, and a check that the rule left nothing in `incomplete`, as in this example (see **Focusable aria-hidden nodes** below):

```tsx
import { configureAxe } from "jest-axe";
import { undecided } from "../../AxeTest.utils";

// Skips Base UI's focus guards, which aria-hidden-focus fails in jsdom
const axe = configureAxe({
  globalOptions: {
    rules: [
      { id: "aria-hidden-focus", selector: '[aria-hidden="true"]:not([data-base-ui-focus-guard])' },
    ],
  },
});

it("has no a11y violations", async () => {
  const { container } = render(
    <Menu.Root open>
      <Menu.Trigger>Open</Menu.Trigger>
      <Menu.Content>
        <Menu.Item>Item</Menu.Item>
      </Menu.Content>
    </Menu.Root>,
  );
  // The popup is portalled out of the container RTL hands back, so audit the body
  expect(container).not.toContainElement(screen.getByRole("menu"));
  const results = await axe(document.body, { rules: { region: { enabled: false } } });
  expect(results).toHaveNoViolations();
  expect(undecided(results, "aria-hidden-focus")).toEqual([]);
});
```

The audit of `document.body` also runs axe's `region` rule (best practice: all content is in a landmark). The test page has no landmarks, and a portalled popup is outside them on a real page too. The rule does not flag a dialog, so the Dialog, Drawer and Popover audits keep it. For a popup with a different role (a menu, a listbox, a tooltip), disable `region` in that audit only. With the popup closed, and for parts that render in place, such as `Toast.Viewport`, `axe(container)` is correct.

Setup: `vitest.setup.ts` adds `toHaveNoViolations` to every `expect()`, and stubs `document.elementFromPoint` so that axe's `aria-hidden-focus` rule can fail in jsdom (see below).

A browser spec (`*.visual.spec.tsx`) imports `axe-core` directly and runs `axe.run(element, { runOnly: [...] })`, as `Toast.visual.spec.tsx` does, not jest-axe: its types pull `@types/jest` into the visual typecheck, where jest's `expect` replaces Vitest's. Add a dependency that only specs import to `optimizeDeps.include` in `vitest.visual.config.ts`, or Vite can find it mid-run and reload the test page.

### Focusable aria-hidden nodes

axe's `aria-hidden-focus` rule fails an element that is hidden from assistive tech but that Tab reaches. When no dialog is visible, the rule looks for a full-page overlay with axe's polyfill of `document.elementsFromPoint`, which calls `document.elementFromPoint`. jsdom has neither, so the rule threw. An errored rule lands in `incomplete`, which `toHaveNoViolations()` does not read, and every focusable `aria-hidden` node passed. `vitest.setup.ts` stubs `elementFromPoint` to return `null`: axe then finds no element at any point, sees no overlay, and fails the node. `src/AriaHiddenFocus.spec.tsx` checks that.

While a dialog is visible, the rule still can't fail a node, in a browser too. axe takes any visible `dialog`, `[role=dialog]` or `[aria-modal=true]` for an open modal and lists every focusable `aria-hidden` node under `incomplete`. The Drawer audit, the open DatePicker audit and a toast audit with a toast of the default `low` priority on screen (a `role="dialog"`) each show one. In such an audit, call `expectOnlyFocusGuardsUndecided(results)` from `src/AxeTest.utils.ts` after `toHaveNoViolations()`. It fails on every node that `aria-hidden-focus` left in `incomplete` that is not a Base UI focus guard.

Base UI renders focus guards around an open popup: `aria-hidden` spans that Tab reaches and that hand focus on. In a browser, axe takes the open dialog, or the full-page backdrop of a Menu or a Select, for an open modal and lists the guards under `incomplete`. In jsdom, an open-popup audit with no visible dialog fails them: Dialog and Popover popups are still at Motion's opacity 0 when the audit runs (and so is the Popover's positioner), and jsdom can't hit-test the Menu and Select backdrops. Skip the guards in those audits with the `configureAxe` call from the Menu example, as the Dialog, OverlayBody, Popover, Menu and Select specs do. The rule still checks every other `aria-hidden` node. Those audits also assert that `undecided(results, "aria-hidden-focus")` from `src/AxeTest.utils.ts` is empty. Without that check, a stray node passes once axe finds a modal, for example when a popup is no longer at opacity 0.

Base UI also aria-hides the page outside an open modal Dialog, so a trigger rendered beside the open Dialog fails the same way. Leave the trigger out of the audit, as the Dialog specs do. Don't widen the selector to `[data-base-ui-inert]`: that marker is on the hidden page too, so the rule would skip the whole page and any stray node in it, not only the guards.

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
- **A touch-screen spec goes in a `*.touch.visual.spec.tsx` file.** The `chromium-touch` project runs those files on a page created with a touch screen (Playwright `hasTouch`); the other Chromium projects exclude them. Don't turn on CDP touch emulation in a spec instead: turning it off leaves the Docker image's page with no hover for the later spec files (see `vitest.visual.config.ts`).
- **Only Linux baselines are committed** (`*-linux.png`), and CI compares against them. macOS baselines (`*-darwin.png`) are gitignored and exist only on your machine. With zero tolerance, a macOS baseline left over from an older checkout fails locally although nothing is wrong: refresh it with `bun run test:visual:update` (in `packages/ui`) before you treat a local failure as a regression. Both `bun run test:visual` and `bun run test:visual:update` take a path filter (a substring of the spec path): `bun run test:visual:update button` refreshes only the matching specs. In `packages/ui` the script passes `--update=true`, because a bare `--update` would take the filter as its value and refresh every spec.
- **An agent run hides a passing spec's `console.log`.** When Vitest 4.1 finds an AI agent in the environment (`AI_AGENT`, `CLAUDECODE` and others, read by `std-env`), it uses its `agent` reporter, which prints console output only for a failed test. `--silent=false` and `--printConsoleTrace` do not change that. To see a passing spec's `console.log`, add `--reporter=default`: `bun run test:visual tabs --reporter=default` in `packages/ui`. In `packages/ui`, the unit suite (`bun run test`) works the same way. A run from the repo root goes through Turbo, which does not pass the agent variables on, so Vitest uses its default reporter there and prints the output. In an agent run, Vite also copies the browser's `console.warn` and `console.error` to the terminal (`[vite] (client) [console.warn] …`), from passing specs too.
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

- **Geometry and paint, no screenshot baselines.** There is no second set of PNGs to keep up to date. A paint check reads a screenshot as data: it counts the pixels in an element's box that change when the element is hidden. 0 means that WebKit laid the element out but painted none of it in its box. A geometry check alone does not find that.
- **A known WebKit bug is asserted by a plain `it`** (W80, #341, filed as [WebKit bug 327820](https://bugs.webkit.org/show_bug.cgi?id=327820)).
  - **The bug.** WebKit paints an element that has its own composited layer and is laid out in a CSS multicol column after the first at its position in the unfragmented flow: column 1's x, below the grid (an ancestor's overflow clip can hide it), so nothing lands in its own box.
  - **The Tabs trigger.** A `Tabs.Contents` panel hits it when the slid track reaches over a composited layer that paints before it, because WebKit then gives the track a layer of its own. On `/create`, where TabsCard is on `Tabs.Contents` (#295), that layer is the sticky theme sidebar, composited while the page scrolls.
  - **The workaround and its limit.** Give the columns container, an ancestor of `Tabs.Contents`, its own composited layer (`will-change: opacity`). Its layer paints over the sidebar, the track no longer needs one of its own, and the panel paints in place. `/create` does that in `PreviewPanel.tsx`, and a spec checks it. It holds only while nothing inside the columns is composited explicitly: `will-change`, `translateZ(0)` or `translate3d` on `Tabs.Contents`, on a panel or on anything else in a later column gives that element its own layer, and WebKit misplaces it too, workaround or not. Tried and failed (#341 and the bug report): `contain`, `isolation`, `z-index`, clipping, the `translate` property, a margin or `left` instead of the transform. So none of the CSS changes tried on `Tabs.Contents` or its panels prevents the bug, and any composited descendant in a later column hits it, independent of Tabs.
  - **What the spec asserts.** The bug spec checks that the Note field is laid out and hit-tested in place, then asserts 0 pixels painted in the field's box. When it starts to fail, WebKit has fixed the bug: flip it to expect painted pixels and rename it. Keep the workaround spec: users' Safari lags behind WebKit.
- **Run it locally** from the repo root or `packages/ui`:

  ```bash
  bunx playwright install webkit   # once
  bun run test:webkit
  ```

  On macOS this runs Playwright's macOS WebKit. CI runs the Linux build from the Playwright image. The suite was run in the pinned `linux/amd64` image (v1.64.0-noble) too: all specs pass, and W80 reproduces there with 0 pixels painted in the field's box, as on macOS.
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
- **Visual regression** runs on every PR and master push (`visual-regression.tests.yml`); a master failure goes to Slack. On a pull request the job runs the suite only when the PR touches a `WATCH` path (the list is in the workflow); otherwise the install and test steps are skipped and the job still passes, so the required `visual-regression-test` check passes on a docs-only PR. Master pushes and manual runs always run the full suite. The WebKit smoke tests run in the same job and container after the Chromium suite, also when only the Chromium suite failed. On master and manual runs the Chromium suite also runs in a random order (`--sequence.shuffle`, seed = the run number, named in the Slack message), to catch a spec that leans on state an earlier one left. A failure there is an isolation bug in a spec or the harness, not a baseline to update. The Slack failure message names the failed suites: Chromium visual, WebKit smoke, shuffled; a failing checkout or decide step on master posts it too, as "setup or another step". A master run that is cancelled or times out (a manual cancel included), or whose job ended before naming a suite (the container failed to start, the runner was lost), also posts, naming what it can.
- **Lint + typecheck** run on every PR and master push (`quality-gates.yml`), and also cover the root `scripts/` (`lint:scripts`, `check-types:scripts`)
- **Changeset status** runs in the `lint` job of `quality-gates.yml`, on pull requests only: `bunx changeset status --since=origin/master`. It skips `changeset-release/master` and `renovate/` branches. Rules for authors: `CONTRIBUTING.md` › Changesets.
- **Version checks** run in `quality-gates.yml` (`check:playwright` and `check:bun` in the `lint` job, `check:tailwind` in the `typecheck` job):
  - `bun run check:playwright` fails when `@playwright/test`, the docs' or the root's `playwright`, a workflow `mcr.microsoft.com/playwright` image tag or the Docker recipe above name different versions. It also fails on a reference without a `v<version>` tag. It checks no digest: they are bumped with the tag by hand or by Renovate. It makes no network calls.
  - `bun run check:bun` fails when the Docker recipe's `bun@<version>` or a workflow's `bun-version:` differs from the root `packageManager`, when the recipe names no `bun@<version>`, and when a workflow's `bun-version-file:` is not `package.json`. It makes no network calls.
  - `bun run check:tailwind` builds `chunks-ui`, compiles `dist/theme.css` and the code it scans with Tailwind 4.0.0 (the oldest v4) and with the installed version, and fails when 4.0.0 does not generate a class the installed version does. A consumer on 4.0 would get no CSS for that class. The scan reads every word in `dist`, so a listed name can also come from a comment or string, not only from a class in use. Both versions also compile the theme's own static `@utility` names and the className sizes (`CLASSNAME_SIZES`) (through an extra `@source` list), and it fails when the installed version does not generate one. The utility scan also follows the theme's quoted `@import`s with Bun's resolver and fails on one it cannot resolve; the limits are in `resolveImport` in `scripts/check-tailwind-compat.ts`. It also fails when either version lacks a Button class (the scan broke), or puts the touch size of `FIELD_TEXT_SIZE` before a size it must come after (`TOUCH_ORDER` in the script). The installed version compiles with the Tailwind packages in `bun.lock`. 4.0.0 installs from `scripts/tailwind-4.0` (`bun install --frozen-lockfile` in a temporary directory), so every dependency is pinned and `bun.lock` does not change. To move the pin, change `package.fixture.json` there, run `bun install` in a temporary copy named `package.json`, and copy its `bun.lock` back as `bun.fixture.lock`. The install needs the network.
- **Peer floors** (`floors` job in `unit.tests.yml`): `scripts/check-peer-floors.ts --overrides` reads the lowest version each `^range` in `packages/ui/package.json` `peerDependencies` allows and merges those into `overrides` of the root `package.json` (the existing `zod` entry stays), then a plain `bun install` resolves every dependent of those packages at the floors, including the `packages/ui` devDependencies (`motion`, `@base-ui/react` and the React types), with no change to `node_modules` by hand. `@types/react` and `@types/react-dom` go in at `<major>.<minor>.x` of the `react` and `react-dom` floors (`19.2.x` for `19.2.0`, derived by the script, never hard-coded). The job then runs `check-peer-floors.ts --check`, which fails unless `packages/ui` resolves each peer to its floor and each types package to a patch of its minor, then the package's `check-types`, so a type error a consumer on 19.2 types would hit fails the job, and the ui unit suite. The job edits `package.json` and `bun.lock` in its own checkout only (it is not `--frozen-lockfile`, and its cache step restores but never saves), so nothing from it reaches the repo or the shared cache; run `--overrides` locally only in a throwaway copy (it refuses to run unless `CI` is set to something other than empty, `false` (any case) or `0`, or `--force` is passed). It is a required check since 2026-10-15. A moved peer range moves its floor automatically; the YAML is the recipe.
- **Optional Motion** (`bun run check:no-motion`) bundles chunks-ui with webpack with and without Motion installed, and fails when the build without it breaks or the build with it loses the Motion chunk. Without Motion it also type-checks a consumer with `skipLibCheck: false`, under `bundler` and under `node10` resolution, so the typings reach no exports-only subpath of a dependency. Both consumers also run `next build` with Turbopack on a minimal static-export app, which must build without Motion and keep Motion out of the initial load with it. Chromium (Playwright) then opens each export and clicks its dialog open with no error (details in `scripts/README.md`). Fixture recipe: [`scripts/README.md`](scripts/README.md).
- **Docs direction** (`bun run check:docs-direction`, in the `lint` job of `quality-gates.yml`) fails on a physical direction class (`ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right`, `rounded-l-*`, `rounded-r-*`, the `rounded-tl-*` corners, `border-l-*`, `border-r-*`, `float-left`, `float-right`, `clear-left`, `clear-right`, `scroll-ml-*`, `scroll-mr-*`, `scroll-pl-*`, `scroll-pr-*`, `object-left`, `object-right`, `bg-left`, `bg-right`, `origin-left`, `origin-right` and their corners; negative where Tailwind has one, and behind a variant too) in a `.ts`, `.tsx` or `.mdx` file anywhere in `apps/docs`, or in an `@apply` in a `.css` file there. It skips `node_modules` at any depth and the build output at the top of `apps/docs` (`.next`, `.turbo`, `out`, `public/_pagefind`). The docs use the logical classes (`ms-*`, `ps-*`, `start-*`, `text-start`, `rounded-s-*`, `border-s-*`, `float-start`, `clear-start`, `scroll-ms-*` and their `e` twins) and mirror in RTL. Object, background and origin positions have no logical class: mirror one with an `rtl:` twin and mark the line. It matches class tokens, not prose (`left-to-right` and `pl-PL` do not count). A deliberate physical class (art that must not mirror, such as the landing illustrations) carries `direction: physical, <reason>` in a comment on the same line as the class, or in a comment that ends on the line directly above and is alone on its lines: a `//` line, or a `/* … */` or `{/* … */}` on one line or several. A marker at the end of a code line exempts that line only, and a marker without a reason (the text after the comma must start with an ASCII letter, digit or `_`) does not count. Inline code in MDX prose and tables is flagged too. Limits: in a stylesheet only the classes on the same line as `@apply`, up to its `;` or `}` (continuation lines of a multi-line `@apply` are not read), no `.js` or `.md` file, no dynamically built class names, inline styles or arbitrary properties and values (`[margin-left:4px]`, `bg-position-[left_top]`), and a `/left-4/` URL path is flagged. What it leaves out on purpose, and why: `scripts/README.md`. A missing `apps/docs`, or one with no scanned file or no `.mdx` file, fails the run. It makes no network calls.
- **Docs snippets and axe** run on every PR and master push (`quality-gates.yml`), see below
- **Caches**: `quality-gates.yml`, `unit.tests.yml`, `visual-regression.tests.yml` and `update-screenshots.yml` restore and save bun's install cache (`~/.bun/install/cache`, keyed on `bun.lock`, with an older key as the fallback), so `bun install --frozen-lockfile` reads most packages from disk. `quality-gates.yml` also keeps Turbo's local cache (`.turbo`, one key per job and commit, the newest earlier run restored) in the `typecheck` job only, where a hit replays the `chunks-ui` build, and Next's compiler cache (`apps/docs/.next/cache`, keyed on `bun.lock` and the docs source) in `docs-build`.
- **Release** (`release-changeset.yml`, master pushes and `workflow_dispatch`, 15 minute timeout, job runs only on `refs/heads/master`): `bun run release` builds `chunks-ui`, then runs its `check:exports` (attw) and `check:dist` before `changeset publish`, so a broken `dist/` fails before anything reaches npm. Before that, the job fails when the runner's npm is older than 11.5.1, which npm trusted publishing (OIDC, no token) needs. Slack gets a message when a version is published, when the workflow fails, and when a run publishes nothing while master is at a version npm does not have (below). The npm publish runs before the tag push and the GitHub release (both with `PAT_TOKEN`), so a run can fail with the version on npm and no tag or release. What to do after a failed run:
  - Failed before the npm publish: use "Re-run jobs" on that run. It runs at the version commit, where no changesets are left. `workflow_dispatch` runs the flow at master HEAD instead: it refreshes the Version Packages PR when master has changesets, and does nothing useful for a missed tag.
  - Failed after the npm publish: `changeset publish` skips a version that is already on npm and prints no `New tag:` line, which the action reads to tag and release. No re-run repairs it. On the version commit, run `bunx changeset tag` (it creates `chunks-ui@<version>`), push the tag with `git push origin chunks-ui@<version>`, then run `gh release create chunks-ui@<version> --verify-tag --title chunks-ui@<version> --notes-file <file>`, with the version's section of `packages/ui/CHANGELOG.md` as the notes file.
  - Merge the Version Packages PR only after the Release run of the newest master push has refreshed it. The action publishes only when no changeset is left on master, empty ones count, so a Version Packages PR merged earlier leaves master at its bumped, unpublished version together with the changesets it did not consume, and no run publishes until they are gone. Every run that published nothing asks npm for the version at the run's commit (`npm view chunks-ui@<version> version`; the step reads `packages/ui/package.json` with `git show "$GITHUB_SHA:…"`, not from the workspace, which `changesets/action` leaves on its release branch with the versions bumped) and posts a Slack message when npm answers `E404` for it; any other npm failure is a workflow warning and no message, and a run that only refreshed the Version Packages PR posts nothing, because master is still at the published version. The step fails with `::error::` when it cannot read `.version`. What to do after the message: if the leftovers are empty, the action logs "All changesets are empty; not creating PR" and does nothing else, so delete them in a PR and the next run publishes. If they are real, that run refreshed the Version Packages PR, but the version the message names is never published: `changeset version` bumps again from it and `changeset publish` publishes only the version in `package.json`. Merging the PR publishes the next version; npm skips the stale one, `CHANGELOG.md` keeps its section, and it gets no tag or GitHub release. The message repeats on each master push until then.

### Docs checks

Three gates check the docs site in `apps/docs`:

- **Snippet type-check**, in the `typecheck` job. The docs `check-types` runs `tsc` on the app and on `scripts/`, then `check:snippets`. That compiles every ` ```tsx ` block in `apps/docs/content` against the built `chunks-ui` types and reports errors at the `.mdx` line. A block can use the `chunks-ui` and React exports, and lucide icons by their `XxxIcon` name, without an import. If a block uses a name from the code around it (state, or data from an earlier block on the page), declare that name with its real type in `apps/docs/scripts/check-snippets.fixtures.ts`, under the page's path.
- **axe**, in the `docs-build` job after the build. `check:a11y` serves the build with `next start` and runs axe (WCAG 2.2 A and AA) in light and dark mode on every page built from `content/**/*.mdx` (the landing page, `/create` and `/kitchen-sink` among them), on every other `page.*` under `apps/docs/app/`, and on the 404 page. It gets the 404 page by requesting a URL that no page answers on, and fails if that URL does not answer 404. An app page other than the MDX catch-all stops the run until you add its URLs to `pages()` in the script. Pages are audited with every popup closed, so the run also opens the popup of the first example on the Combobox, DatePicker, Menu, Popover and Select pages, audits the open popup alone in both themes, and closes it with Escape. It also asserts that the popup trigger has `aria-expanded="true"` and `aria-controls` set to the popup's id; `aria-activedescendant` (a Combobox or Select option highlight) is not covered. A popup's violations print as `<page> with <name> open`; scope an `ALLOWED` entry for them with the page's route in `pages`. To cover another popup, add its page, its trigger's role and accessible name, and the popup's role to `POPUPS` in the script. On the Toast page it also adds a default and a high-priority toast (`TOASTS` in the script) and audits each alone in both themes, with `aria-dialog-name` on top of the WCAG rules; the high-priority toast is audited again after F6 moves focus into its viewport and clears its `aria-hidden`. Each toast is closed with Escape, even when its audit throws. It does not fail on axe's `incomplete` results (checks axe could not decide).

  A page is audited only once React has hydrated it and its fonts have loaded, because Playwright's `networkidle` is not hydration and axe on a half-hydrated page gives false results. `app/HydrationMarker.tsx`, a client component in the root layout, sets `data-hydrated="true"` on `<html>` after the hydration commit; the script waits for it and then for `document.fonts.status === "loaded"`, each bounded to 10 s. A page whose served HTML has a Suspense boundary that is not empty, or one still pending, fails the run, because such a boundary hydrates after the marker is set.

- **Docs direction**, in the `lint` job. `bun run check:docs-direction` (repo root, no build, no browser) keeps the docs mirroring in RTL; see **Docs direction** in the CI list above.

To run the snippet and axe gates locally:

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
