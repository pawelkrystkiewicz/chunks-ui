---
"chunks-ui": minor
---

`NumberField.ScrubAreaCursor` now shows while the user scrubs. It was always `display: none`, so the pointer vanished during a mouse drag: Base UI locks and hides the system pointer and renders this part in its place. It now renders a left-right arrow by default, or your `children` if you pass them. A `render` element gets no arrow, so it can be a void element such as `<img>`. As before, it only renders during a mouse or pen scrub, and not in Safari, where Base UI skips pointer lock.

The cursor portals to `<body>`, so it sits on a new top z-index layer, `--z-index-cursor: 900` (`z-cursor`), above dialogs, drawers and toasts. A NumberField scrubbed inside a Popover, Dialog or Drawer keeps its pointer.
