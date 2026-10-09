---
"chunks-ui": patch
---

Fixed: with Motion installed, the `Switch` thumb, the `ToggleGroup` and `Tabs` indicators and the `Radio` and `Checkbox` indicators were replaced by a new element when Motion finished loading. A switch or toggle group changed during that moment jumped instead of sliding. Each control now keeps the same element: Motion animates it in place once it has loaded, after any CSS transition that is still running. With reduced motion, a running animation finishes at once. The CSS fallback is unchanged.
