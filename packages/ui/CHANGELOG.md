# chunks-ui

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
