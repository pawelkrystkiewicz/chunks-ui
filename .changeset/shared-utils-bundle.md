---
"chunks-ui": patch
---

Changed: `chunks-ui` and `chunks-ui/utils` share one copy of `cn`, `cnState`, `springs`, the `ELEMENT_*` constants and the `button`, `chip`, `iconButton` and `input` variants. `dist/index.js` imports them from `dist/utils.js`, and `dist/index.cjs` requires them from `dist/utils.cjs`. An app that imports both entries loads these helpers once, and `cn` from `chunks-ui` is the same function as `cn` from `chunks-ui/utils`, with one tailwind-merge cache. Both entries export the same names as before, and `chunks-ui/utils` still has no `"use client"`.
