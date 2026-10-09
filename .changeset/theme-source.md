---
"chunks-ui": patch
---

`theme.css` now includes `@source "./"`, so Tailwind CSS v4 generates the classes the components use from `@import "chunks-ui/theme.css"` alone. Before, Tailwind skipped `node_modules` and components rendered without those classes unless the app added its own `@source`. An existing `@source` for the package is harmless and can be removed.
