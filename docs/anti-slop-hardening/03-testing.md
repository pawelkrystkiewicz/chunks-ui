# 3. Anti-Mocking Testing Philosophy

**Grade: B** | **Priority: MEDIUM**

> "No mocks. Tests use real filesystems. Create temp directories with mkdtemp, write real config and JSONL files, assert against real file contents."

## Current State

### Testing Stack

| Tool | Status |
|------|--------|
| Vitest | Installed, configured |
| @testing-library/react | Installed, used in all tests |
| @testing-library/user-event | Installed, used in 3 tests |
| jsdom | Installed, test environment |
| @vitest/coverage-v8 | Installed, CI reports coverage |
| jest-axe | **Not installed** |
| @playwright/experimental-ct-react | **Not installed** |

### Mock Usage — Minimal

- `vi.fn()` used **3 times total** — only for user callback verification:
  - `Input.spec.tsx` — `onClear` callback
  - `Chip.spec.tsx` — `onRemove` callback
  - `ClearButton.spec.tsx` — `onClick` callback
- **Zero `vi.mock()`** — no module-level mocking anywhere
- **Zero `vi.stub()`** — no stubs
- All components render with real Base UI internals, real Floating UI positioning, real ARIA

### Test Coverage

| Metric | Value |
|--------|-------|
| Components with tests | 20 / 21 |
| Missing | ToggleGroup |
| Naming convention | `Component.spec.tsx` |
| Co-location | Next to source files |

### What Tests Actually Verify

1. Component renders without crashing
2. Custom `className` merging works
3. Sub-components render (compound pattern)
4. Disabled/loading states apply correct attributes
5. User callbacks fire on interaction

### What Tests Don't Verify

- Base UI internals (focus management, ARIA — trusted)
- Tailwind CSS output (trusted)
- CSS variable values (trusted)
- Motion animation timing/physics (trusted)
- Accessibility violations (not tested)
- Visual appearance (not tested)

## Gaps

### Moderate

1. **jest-axe not installed** — TESTING_STRATEGY.md recommends it, but it's not wired up
2. **Zero visual regression tests** — CI workflow exists (`visual-regression.tests.yml`), Playwright browsers install, but no `*.visual.spec.tsx` files exist
3. **ToggleGroup has no tests** — only component without coverage
4. **User interaction testing is thin** — only 3 files use `userEvent`, no keyboard navigation tests

### Minor

5. No coverage targets defined (80%? 90%?)
6. `passWithNoTests: true` in vitest config — silently passes if tests are deleted

## Recommendations

### Immediate

- Add tests for ToggleGroup
- Install `jest-axe` and add baseline a11y assertion to each component test:

```tsx
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

it("has no a11y violations", async () => {
  const { container } = render(<Button>Click</Button>);
  expect(await axe(container)).toHaveNoViolations();
});
```

### Short-term

- Create first visual regression tests for core components (Button, Input, Select)
- Add keyboard interaction tests for interactive components (Tabs, Select, Combobox)
- Set `passWithNoTests: false` to catch accidentally deleted test files

### Nice-to-have

- Define coverage targets in vitest config (`thresholds` option)
- Add Motion animation path tests (with/without Motion installed)
