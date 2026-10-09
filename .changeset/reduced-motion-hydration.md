---
"chunks-ui": patch
---

Fixed: for users with `prefers-reduced-motion: reduce`, server-rendered components that depend on `useReducedMotion()` (such as `ThemeToggle`) logged a hydration mismatch. `useReducedMotion()` now returns `false` on the server and while hydrating, then switches to the user's preference without remounting. Popups, which only render on the client, read the real preference from their first render.
