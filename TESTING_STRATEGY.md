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

## Visual Regression Tests (`*.visual.spec.tsx`)

Browser specs (Vitest browser mode, Playwright Chromium) in `packages/ui`. They screenshot components and compare them with committed baselines, and they cover the geometry that jsdom can't measure (positions, sizes, overflow).

- **Tolerance is 0.** `toMatchScreenshot` runs with `allowedMismatchedPixelRatio: 0` (`vitest.visual.config.ts`), so one detected differing pixel fails the spec. "Detected" uses pixelmatch's defaults: a pixel counts when its colour differs by more than the 0.1 threshold, and anti-aliased pixels are ignored (`SMALL_FEATURE_SCREENSHOT` lowers the threshold to 0.02 for thin parts).
- **Only Linux baselines are committed** (`*-linux.png`), and CI compares against them. macOS baselines (`*-darwin.png`) are gitignored and exist only on your machine. With zero tolerance, a macOS baseline left over from an older checkout fails locally although nothing is wrong: refresh it with `bun run test:visual:update` (in `packages/ui`) before you treat a local failure as a regression.
- **Regenerate Linux baselines in Docker** after you commit the change. CI renders on x86 in the same image, so force `linux/amd64`; an arm64 render can differ from the CI render. Under emulation on Apple silicon the run takes minutes, which is not a hang. `<wt>` is your checkout or worktree, `<scratchpad>` any scratch directory outside it:

  ```bash
  D=<scratchpad>/ui-visual; rm -rf $D && mkdir -p $D && git -C <wt> archive HEAD | tar -x -C $D
  docker run --rm --platform linux/amd64 -v $D:/work -w /work mcr.microsoft.com/playwright@sha256:bc72a8df40831ded821e3cbc79c318c21b44d6e51dff9fd89ace7a8249c5b462 bash -lc \
    'npm i -g bun@1.4.2 >/dev/null 2>&1 && bun install --frozen-lockfile >/dev/null 2>&1 && cd packages/ui && bun run test:visual:update'
  rsync -am --include='*/' --include='*-linux.png' --exclude='*' $D/packages/ui/src/ <wt>/packages/ui/src/
  ```

  The digest is the `linux/amd64` manifest of `mcr.microsoft.com/playwright:v1.64.0-noble@sha256:06a9939e…`, the multi-arch index CI pins in the workflows' `container:`; Docker rejects an index digest with `--platform` ("cannot overwrite digest"). Bump both with `@playwright/test` (`docker buildx imagetools inspect mcr.microsoft.com/playwright:v<version>-noble` lists the manifests). `bun run update:screenshots` does the same on GitHub Actions for the current branch.
- Look at every changed PNG before you commit it.

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

- **Unit tests + coverage** run on every PR and master push (`unit.tests.yml`)
- **Lint + typecheck** run on every PR and master push (`quality-gates.yml`)
- **Docs snippets and axe** run on every PR and master push (`quality-gates.yml`), see below

### Docs checks

Two gates check the docs site in `apps/docs`:

- **Snippet type-check**, in the `typecheck` job. The docs `check-types` runs `tsc` on the app and on `scripts/`, then `check:snippets`. That compiles every ` ```tsx ` block in `apps/docs/content` against the built `chunks-ui` types and reports errors at the `.mdx` line. A block can use the `chunks-ui` and React exports, and lucide icons by their `XxxIcon` name, without an import. If a block uses a name from the code around it (state, or data from an earlier block on the page), declare that name with its real type in `apps/docs/scripts/check-snippets.fixtures.ts`, under the page's path.
- **axe**, in the `docs-build` job after the build. `check:a11y` serves the build with `next start` and runs axe (WCAG 2.2 A and AA) on every page built from `content/**/*.mdx`, in light and dark mode. It does not visit other app routes or the 404 page, and it does not fail on axe's `incomplete` results (checks axe could not decide).

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
  selector: '[role="grid"] button.opacity-50', // the flagged element, or an ancestor of it
  why: "#252: Calendar outside-month days, 2:1 light", // the issue, and the measured ratio
  pages: ["/components/calendar"], // optional: only on these routes
  themes: ["light"], // optional: only in this theme
},
```

Scope the entry to the pages and themes where the violation occurs. The run fails when an entry matches nothing, so remove the entry in the change that fixes its cause.

The run also fails when the issue an entry links (the first `#NNN` in `why`) is closed as completed: the fix landed, so the entry must go, or the issue must be reopened if the violation is still there. An issue closed as not planned is an accepted exception, and its entry stays. The script reads the issue states from the GitHub API with `GITHUB_TOKEN`; CI passes the job's token (`issues: read`). Locally, run `GITHUB_TOKEN=$(gh auth token) bun run check:a11y`. Without a token, or when the API can't be reached, the run prints a notice and does not check the issue states.
