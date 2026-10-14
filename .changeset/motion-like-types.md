---
"chunks-ui": minor
---

`useMotion()` now returns `MotionLike | null` instead of Motion's module type. `MotionLike` (exported) is chunks-ui's own interface with the members the components use: `motion.div`, `animate`, `frame` and `cancelFrame`. The package types no longer reference `motion/react`, so a project without Motion compiles with `skipLibCheck: false` (it reported `TS2307: Cannot find module 'motion/react'` before, and the docs advised `skipLibCheck`).

If your code uses the full Motion module from `useMotion()`, cast it: `useMotion() as typeof import("motion/react") | null`. Apps that do not call `useMotion()` are unchanged, with and without Motion.
