---
"chunks-ui": patch
---

Fixed: apps without Motion failed to build with webpack and Next.js. They build now, with a harmless `Module not found` warning for `motion/react` under webpack (none under Turbopack). Apps with Motion are unchanged.
