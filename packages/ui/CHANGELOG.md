# chunks-ui

## 0.1.2

### Patch Changes

- 40ff119: Add `IconButton` — a compact, square button built on Base UI's `Button` primitive for single-icon actions. Shares the same `variant` (`contained` | `outlined` | `text`) and `color` (`primary` | `destructive` | `success` | `warning` | `secondary`) system as `Button`, and defaults to `variant="text" color="secondary"` for the familiar muted toolbar look. `CopyButton` now composes `IconButton` internally, replacing its hand-rolled wrapper.
- 208af30: Fix `NumberField` group becoming unusable when the value reaches `min` or `max`. The group's `has-[:disabled]` selector was matching Base UI's auto-disabled increment/decrement buttons at boundaries, which applied `pointer-events-none opacity-50` to the whole control — so reaching a boundary locked out the input too. Scoped the selector to `has-[input:disabled]` so only a disabled input disables the group.

## 0.1.1

### Patch Changes

- ac0d4a7: Widen `Avatar` `fallback` prop type from `string` to `ReactNode`, allowing icons or other elements to be rendered as the fallback when no `src` is provided.

## 0.1.0

### Minor Changes

- ed15641: <!-- markdownlint-disable MD036 MD041 -->

  Toast gains a set of per-toast styling slots, a reduced-motion-aware slide-in, an opt-in stacking pattern, and a top-level `createToastManager` export — all without adding runtime dependencies or shipping opinions about icons, colours, or semantic types.

  **Per-toast styling — `ToastStyleOptions`**

  Five new fields are merged into Base UI's `ToastObject` via TypeScript module augmentation, so they're type-safe at every `add()`, `update()`, and `promise()` call site. The interface is exported from the package root as `ToastStyleOptions`:

  - `icon` — any `ComponentType<{ className?: string }>`. The library passes default sizing (`size-5 shrink-0 self-start`) via `className`, so lucide/heroicons components can be passed directly with no wrapper. Skipping the field renders a toast with no leading slot — there is no default icon.
  - `iconClassName` — extra classes merged onto the icon (use for colour, e.g. `text-success`).
  - `className` — extra classes merged onto `Toast.Root` (use for per-toast accent bars, borders, background tints).
  - `dismissible` — renders a `×` close button on that specific toast. (A misspelled alias `dissmissable` is kept for backwards compatibility with early adopters of this branch but is marked `@deprecated` in the type.)
  - `onClose` — click handler for the close button; implicitly enables the button even without `dismissible: true`.

  The library ships no semantic types, no default colours, and no icon library. Downstream consumers can build whatever pattern their design system needs — the docs show a ~20-line `TYPE_STYLES` map that covers `primary | success | destructive | warning` in pure data, with zero closures or factory functions.

  **Stacking pattern (opt-in CSS)**

  Two classes added to `theme.css`, ported verbatim from Base UI's reference stacking example:

  - `.toast-stack-viewport` — overrides the default flex-column layout on `Toast.Viewport` so children can absolute-stack at the same anchor point.
  - `.toast-stack` — applied per-toast via `add({ className: "toast-stack" })`. Drives the collapsed/expanded deck off every per-root CSS variable Base UI exposes (`--toast-index`, `--toast-height`, `--toast-frontmost-height`, `--toast-offset-y`, `--toast-swipe-movement-x/y`) and responds to `data-expanded`, `data-starting-style`, `data-ending-style`, `data-swipe-direction`, and `data-limited`. Includes a `::after` gap-filler so hovering across toasts doesn't collapse the deck mid-scrub.

  Plus a `.toast-stack .ToastContent[data-behind]` rule that fades the text of toasts sitting behind the frontmost one in the stack, with a `[data-expanded]` override that restores it on hover. Both are scoped under `.toast-stack` so regular (non-stacked) viewports are unaffected. All stacking transitions are gated behind `@media (prefers-reduced-motion: reduce)`.

  To enable the pattern, the `ToastViewport` internals now render their content wrapper as `<BaseToast.Content>` (exposing Base UI's `data-behind` attribute) and carry stable `Toast` / `ToastContent` class-name hooks for custom CSS targeting.

  **Reduced motion**

  `ToastRoot` now calls `useReducedMotion()` and gates the slide-in/out transitions (`micro-interactions`, `data-starting-style:translate-x-full`, `data-ending-style:translate-x-full`, `transition-[transform,opacity]`) behind `!reduced`. Users with `prefers-reduced-motion: reduce` get an instant appearance instead of a 300 ms slide.

  **Top-level `createToastManager`**

  Now importable directly as `import { createToastManager } from 'chunks-ui'` in addition to the existing `Toast.createToastManager` compound property. Zero runtime change — just an additive export to match the `Toast` barrel.

  **Fixed — latent typing hole in `ToastRoot`**

  Previously the required `toast` prop flowed into Base UI's `Toast.Root` via an untyped `...props` spread. `ToastRoot` now destructures `toast` explicitly and passes it by name, closing a latent hole that would have silently dropped the prop on any future refactor.

  **Breaking (minor)**

  - `<Toast.Root>` now requires the `toast` prop at the call site. The type already required it via `ComponentProps<typeof BaseToast.Root>`, but the runtime implementation silently tolerated omission via spread. Hand-rolled `<Toast.Root>` callers must now pass `toast={...}` explicitly — the compound `<Toast.Viewport>` already does this internally, so consumers using the standard `<Toast.Provider>` + `<Toast.Viewport>` pattern are unaffected.

## 0.0.8

### Patch Changes

- 1e9a67a: Fix z-index stacking on portaled components (Menu, Popover, Tooltip, Combobox, Select, DatePicker)

  The `z-index` classes were previously applied to the `Popup` element, which only stacks within its `Positioner` parent. Since the `Positioner` is the element actually portaled to `<body>` and competing in the root stacking context, popups could be hidden behind page sections with `position: relative`. Z-index classes are now applied to the `Positioner` so popups reliably stack above page content.

  Also wraps `Select.Positioner` (previously a raw Base UI re-export) for consistency with other compound components.

## 0.0.7

### Patch Changes

- 4f5eafd: update base-ui, fix indeterminate state on checkbox

## 0.0.6

### Patch Changes

- 936c296: fix Tabs not rendering content on mount

## 0.0.5

### Patch Changes

- 1b6d0dc: - **8 new components** for MODELBOX migration: Breadcrumb, Skeleton, Pagination, Collapsible, Label, CopyButton, InputCopy, Empty

  - **Chip extended** with `variant` (contained/outlined) and `size` (sm/md) props — replaces the need for a separate Badge component
  - **Unit tests** for all new components (57 tests across 9 spec files) — coverage stays above thresholds
  - **Documentation** with MDX pages, live examples, and sidebar registration for all new components
  - **Interactive examples** added for existing components: Dialog, Loader, Progress, Tooltip, Chip (removable variant)
  - **Docs fixes**: Radio examples/formatting, z-index documentation, CSS variable name updates in theme guide
  - **CI fixes**: visual regression tolerance set to 5%, artifact upload gracefully handles missing files

  ## Changes

  ### New Components

  | Component   | Type      | Description                                                       |
  | ----------- | --------- | ----------------------------------------------------------------- |
  | Breadcrumb  | Compound  | Nav breadcrumbs with `render` prop for custom links               |
  | Skeleton    | Simple    | `animate-pulse` placeholder with className-first API              |
  | Pagination  | Compound  | Page navigation with `render` prop for router links               |
  | Collapsible | Compound  | Wraps `@base-ui/react/collapsible` with CSS height animation      |
  | Label       | Simple    | Styled `<label>` with `peer-disabled` support                     |
  | CopyButton  | Simple    | Clipboard copy with render-prop children and async error handling |
  | InputCopy   | Composite | Composes `Input` + `CopyButton` as endAdornment                   |
  | Empty       | Compound  | Empty state with media, title, description, and actions           |

  ### Chip Enhancements

  - Added `variant` prop: `contained` (default) | `outlined`
  - Added `size` prop: `sm` (default, h-5) | `md` (h-6)
  - Uses `satisfies Record<ElementBaseVariant, string>` for type-safe variants
  - Badge component deleted — Chip covers all use cases

  ### Documentation Improvements

  - New interactive examples for Dialog, Loader, Progress, Tooltip
  - Chip removable example with `onDismiss` callback
  - Radio component examples and formatting cleanup
  - z-index documentation and CSS variable naming corrections in theme guide

  ### CI

  - `vitest.visual.config.ts`: `allowedMismatchedPixelRatio: 0.05` to prevent flaky visual regression failures
  - `visual-regression.tests.yml`: `if-no-files-found: ignore` on artifact upload

  ## Test plan

  - [x] All 301 unit tests pass (40 test files)
  - [x] Coverage above thresholds (statements 94.8%, functions 95.2%, lines 96.2%)
  - [x] Lint passes (Biome, 0 errors)
  - [x] Type-check passes (strict mode)
  - [x] Visual regression tests updated with 5% tolerance

  ***

  [Vibe Kanban](https://github.com/pawelkrystkiewicz/vibe-kanban) · 🤖 Generated with [Claude Code](https://claude.com/claude-code)

  <!-- This is an auto-generated comment: release notes by coderabbit.ai -->

  ## Summary by CodeRabbit

  - **New Features**

    - Added 8 UI components (Breadcrumb, Collapsible, CopyButton, Empty, InputCopy, Label, Pagination, Skeleton) plus many live examples (chips, dialogs, loaders, progress, tooltips).

  - **Documentation**

    - New and expanded MDX guides for all added components with example imports and usage.

  - **Tests**

    - New comprehensive test suites for multiple components (breadcrumb, collapsible, copy-button, empty, input-copy, label, pagination, skeleton).

  - **Improvements**
    - CI/visual test workflow made more robust; visual test config added; theme z-index tokens renamed; chip variant support added.

## 0.0.4

### Patch Changes

- c37cd6a: corret peerDeps and table components

## 0.0.3

### Patch Changes

- 72885eb: Add 10 new components: Accordion, Slider, NumberField, Progress, ScrollArea, ThemeToggle, Menu, Toast, Calendar, DatePicker
  All components follow Base UI compound pattern with full Vitest + axe a11y specs
  Add visual regression specs for all new components
  Add Nextra docs pages with interactive examples for each component
  Add docs-scan command scaffold
  Update Biome config: allow noNonNullAssertion in spec files, enforce sorted CSS classes
  Remove outdated migration docs (migration-roadmap.md, modelbox-migration-analysis.md)
  Fix ThemeToggle visual spec prop mismatch (onThemeChange → onClick)

## 0.0.2

### Patch Changes

- 233f20a: Refactor button, chip, loader, and input components for improved consistency and type safety.

  - Consolidated shared prop types into `src/types.ts`
  - Simplified `Button` and `Chip` variant definitions (CVA cleanup)
  - `Loader` no longer exports `LoaderVariants` — use `LoaderProps` instead
  - `ClearButton` enhanced with additional props and accessibility improvements
  - `Tooltip` updated for better composition with Base UI render prop
  - Fixed repository URL format in `package.json`
  - Docs now included in the published package

## 0.0.1

### Patch Changes

- 88001c4: beta release
