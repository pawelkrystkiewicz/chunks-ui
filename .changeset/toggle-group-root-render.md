---
"chunks-ui": patch
---

Fixed: a `render` prop on `ToggleGroup.Root` was ignored, so the group always rendered as a `div`. It now reaches Base UI, so your element or function (with the group's state) renders the group. The selection indicator and a `ref` keep working.
