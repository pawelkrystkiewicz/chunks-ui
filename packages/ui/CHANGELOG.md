# chunks-ui

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
