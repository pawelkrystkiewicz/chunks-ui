---
"chunks-ui": patch
---

Fixed: the `Combobox` popup opened flush against the input, over the bottom edge of the input's focus ring. `Combobox.Positioner` now defaults `sideOffset` to 8, as `Popover.Content` and `Menu.Content` do; a `sideOffset` you pass still wins, so pass `sideOffset={0}` to keep the old position.
