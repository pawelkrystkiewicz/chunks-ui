---
"chunks-ui": patch
---

Fixed: with Motion installed, `Switch`, `Tabs`, `ToggleGroup`, `Radio` and `Checkbox` rendered a plain element on their first render and swapped in a Motion element right after. Children of `Tabs.Contents` mounted twice, so their effects ran twice. `useMotion()` now returns the module from the first render of a component that mounts after Motion has loaded, and still returns `null` on the server and while hydrating.
