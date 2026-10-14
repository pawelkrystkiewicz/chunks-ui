---
"chunks-ui": patch
---

Fixed: an app without Motion installed failed to build with webpack, and so with Next.js in webpack mode, on `Module not found: Can't resolve 'motion/react'`. Motion is optional, and these apps build again: webpack prints one expected "Module not found" warning for `motion/react` and the components keep their CSS transitions; Turbopack prints nothing. Nothing changes for apps that have Motion.
