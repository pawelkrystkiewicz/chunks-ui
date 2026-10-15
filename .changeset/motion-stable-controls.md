---
"chunks-ui": patch
---

Fixed: with Motion installed, the `Switch` thumb, the `ToggleGroup` and `Tabs` indicators and the `Radio` and `Checkbox` indicators were replaced by a new element when Motion finished loading. A switch or toggle group changed during that moment jumped instead of sliding. Each control now keeps the same element: Motion animates it in place once it has loaded, after any CSS transition that is still running. With reduced motion, a running animation finishes at once. The CSS fallback renders as before, except for two fixes on `Switch.Thumb`, `Tabs.Indicator`, `Radio.Indicator` and `Checkbox.Indicator`:

- A function `className`, called with the part's state, is now applied. It used to be dropped.
- A consumer's `render` prop now keeps the part's classes, children and animation. Before, `Checkbox.Indicator` lost its check mark, and with Motion all four lost their classes.
