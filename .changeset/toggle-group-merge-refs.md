---
"chunks-ui": patch
---

Fixed: a `ref` passed to `ToggleGroup.Root` or `ToggleGroup.Item` (even `ref={undefined}`) replaced the component's own ref, and the selection indicator disappeared or stopped following the selected item. The refs are now merged, so your ref gets the element and the indicator still works, with and without Motion.
