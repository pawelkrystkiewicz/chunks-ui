---
"chunks-ui": minor
---

Fixed: for users with `prefers-reduced-motion: reduce`, server-rendered components that depend on `useReducedMotion()` (such as `ThemeToggle`) logged a hydration mismatch. `useReducedMotion()` now returns `false` on the server and while hydrating, then switches to the user's preference without remounting. Popups, which only render on the client, read the real preference from their first render.

A decision that must be right from the first paint belongs in CSS (`motion-reduce:`), not in `useReducedMotion()`.
