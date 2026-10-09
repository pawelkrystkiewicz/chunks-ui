---
"chunks-ui": patch
---

Fixed: a `render` prop on `ToggleGroup.Root` was ignored, so the group always rendered as a `div`. It now renders your element or function (with the group's state), like other Base UI parts. The selection indicator and a `ref` keep working, and `aria-orientation` is still left off the `role="group"` element.
