# Testing Strategy

## Tools

| Tool            | Purpose                          |
| --------------- | -------------------------------- |
| Vitest          | Unit tests + component tests     |
| Playwright CT   | Visual regression tests          |
| Testing Library | DOM queries + user interactions  |
| jest-axe        | Accessibility assertions         |

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

### Visual Regression Tests (`*.visual.spec.tsx`)

Playwright Component Testing captures screenshots of component states.

```tsx
// Button.visual.spec.tsx
import { test, expect } from '@playwright/experimental-ct-react'
import { Button } from './Button'

test('default', async ({ mount }) => {
  const component = await mount(<Button>Click me</Button>)
  await expect(component).toHaveScreenshot()
})

test('loading state', async ({ mount }) => {
  const component = await mount(<Button loading>Saving</Button>)
  await expect(component).toHaveScreenshot()
})
```

Screenshots are committed to the repo. CI compares against baselines. Update locally with `bun run test:visual:update`.

## Animation Testing

Components with Motion animations need two test paths:

1. **Without Motion** — verify CSS fallback works, component is functional
2. **With Motion** — verify animated elements render, transitions complete

Use `prefers-reduced-motion: reduce` media query in visual tests to capture static snapshots without animation timing issues.

## What NOT to Test

- Base UI internals (positioning, ARIA attributes it manages)
- Tailwind CSS output (trust the framework)
- Motion spring physics (trust the library)
- CSS variable values (that's the theme, not the component)

## Commands

```bash
bun run test              # unit tests
bun run test:visual       # visual regression (requires Playwright browsers)
bun run test:visual:update # update visual snapshots
```

## CI

- Unit tests run on every PR
- Visual regression tests run on every PR, compare against `main` branch screenshots
- Screenshot updates are committed via a dedicated workflow (`update-screenshots.yml`)
