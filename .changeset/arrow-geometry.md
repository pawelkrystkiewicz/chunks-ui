---
"chunks-ui": patch
---

Fixed: an arrow near a popup's end stood in the rounded corner when `--radius`, `--spacing` or `rounded-*` made the corner or arrow larger. The default `arrowPadding` of `Popover.Content`, `Menu.Content` and `Tooltip.Positioner` is now read when the popup mounts (the corner radius plus 0.21 × the arrow's size) instead of a fixed 10px; a value you pass still wins.

Fixed: on a one-line `Tooltip` with the arrow on the left or right, the arrow's foot stood in the corner curves. The two arrow-edge corners now curve less far along the edge; they ignore `rounded-*`, so set the new `--tooltip-arrow-corner` variable on `Tooltip.Popup` to change them. `Tooltip.Arrow` now carries the `PopupArrow` class.

Fixed: the keyboard focus ring of a `Popover` or `Menu` with an arrow now follows the popup's border width (for example `border-2`).
