---
"chunks-ui": minor
---

`useMotion()` now returns `MotionLike | null` instead of Motion's module type. `MotionLike` (exported) is chunks-ui's own interface with the members the components use: `motion.div`, `animate`, `frame`, `cancelFrame` and `flushKeyframeResolvers`, which is optional because Motion exports it only since 12.7.5. The package types no longer reference `motion/react`, so a project without Motion compiles with `skipLibCheck: false`.

If your code uses the full Motion module from `useMotion()`, cast it: `useMotion() as typeof import("motion/react") | null`.

`useMotion()` also returns the module on the first render of a component that mounts after Motion has loaded; in 0.1.4 it returned `null` on every first render. It still returns `null` on the server and while hydrating. A component of yours that branched on that first-render `null` no longer sees it. Apps that do not call `useMotion()` are unchanged, with and without Motion.
