---
"chunks-ui": patch
---

Fixed: the `ToggleGroup` indicator of a group that was hidden with `display: none` and shown again grew from 0×0 to the pressed item, because the item measures as 0×0 while it is hidden. It now appears directly over the pressed item instead of growing from 0×0, also when another item was pressed while the group was hidden. Pressing another item still slides it.
