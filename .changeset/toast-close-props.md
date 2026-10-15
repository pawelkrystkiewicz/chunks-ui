---
"chunks-ui": minor
---

`add()`, `update()` and `promise()` now take `closeProps`: the props of the close button that `Toast.Viewport` renders for a dismissible toast, as `actionProps` are the action's. `className` merges after the library classes, so `focus-visible:outline-offset-0` keeps a flush focus ring; `aria-label` replaces `labels.close` for that toast; `onClick` runs first, then `onClose` with the same click, unless `onClick` called `event.preventDefault()`. Before, the button took no props.
