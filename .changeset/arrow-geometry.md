---
"chunks-ui": patch
---

Fixed: an arrow near a popup's end no longer stands in the rounded corner when `--radius`, `--spacing` or the popup's `rounded-*` class makes the corner or the arrow larger. The default `arrowPadding` of `Popover.Content`, `Menu.Content` and `Tooltip.Positioner` was a fixed 10px. It is now read when the popup mounts: the popup's corner radius plus 0.21 × the arrow's size (10.07px in the default theme). You no longer need to raise `arrowPadding` with a larger radius or spacing; a value you pass still wins.

Fixed: on a one-line `Tooltip` with the arrow on the left or right, the arrow's foot stood in the corner curves, because the popup is too short for the padding. The two corners on the arrow's edge now curve less far along it (about 4px instead of 8px), so the foot meets a straight edge. Taller tooltips keep their full corners.

Fixed: the keyboard focus ring of a `Popover` or `Menu` with an arrow was 1px inside the ring the browser draws on a popup with a border wider than 1px (for example `border-2`). The ring now follows the popup's border width.
