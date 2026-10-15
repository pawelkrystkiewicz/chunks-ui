---
"chunks-ui": minor
---

`add()`, `update()` and `promise()` now take `closeProps` for the built-in close button, like `actionProps` for the action. `className` merges after the library classes, so `focus-visible:outline-offset-0` keeps a flush focus ring, and `aria-label` replaces `labels.close` for that toast. Before, the button took no props.

`onClose` now fires once per close, whichever way the toast closes. Before, a click on the built-in close button fired it twice: once from the button and once from Base UI. It never takes an argument. `event.preventBaseUIHandler()` in `closeProps.onClick` keeps the toast open, and `onClose` does not fire.
