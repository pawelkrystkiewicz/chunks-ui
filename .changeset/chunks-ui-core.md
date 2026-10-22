---
"chunks-ui-core": minor
"chunks-ui": patch
---

Added `chunks-ui-core`, the first release of chunks-ui's framework-free layer: `theme.css`, `cn` and `cnState`, the class sets (the component variants and the shared ring, focus and field classes), the English label defaults, and the date and layout helpers. It imports no React and has no `"use client"`, so React Server Components can import it.

Changed: chunks-ui now gets its theme and its React-free helpers from `chunks-ui-core`, a new dependency that installs with it. `chunks-ui` and `chunks-ui/utils` export the same names as before, and `@import "chunks-ui/theme.css"` is still the one import a Tailwind app needs.

Fixed: an app that uses `Resizable` shipped the layout maths twice in its client bundle (about 1.5 KB gzip), because the main entry held a copy beside the one in `chunks-ui/utils`, which it imports; both entries now share the copy in `chunks-ui-core`.
