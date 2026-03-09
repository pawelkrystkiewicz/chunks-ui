---
"chunks-ui": patch
---

Refactor button, chip, loader, and input components for improved consistency and type safety.

- Consolidated shared prop types into `src/types.ts`
- Simplified `Button` and `Chip` variant definitions (CVA cleanup)
- `Loader` no longer exports `LoaderVariants` — use `LoaderProps` instead
- `ClearButton` enhanced with additional props and accessibility improvements
- `Tooltip` updated for better composition with Base UI render prop
- Fixed repository URL format in `package.json`
- Docs now included in the published package
