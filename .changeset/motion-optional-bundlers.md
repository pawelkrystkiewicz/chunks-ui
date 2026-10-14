---
"chunks-ui": patch
---

Fixed: an app without Motion installed failed to build with webpack, and so with Next.js in webpack mode, on `Module not found: Can't resolve 'motion/react'`. Motion is optional, and the import that loads it is now left to the browser, where it fails quietly and the components keep their CSS transitions. Nothing changes for apps that have Motion.
