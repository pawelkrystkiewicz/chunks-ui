---
"chunks-ui": patch
---

Fixed: a `Popover.Arrow`, `Menu.Arrow` or `Tooltip.Arrow` rendered after the popup opened kept Base UI's default `arrowPadding` of 5px, so near a rounded corner its foot stood in the curve. The positioner now reads its default padding again when an arrow mounts or unmounts. A tooltip whose arrow unmounts while it is open is placed again, as a tooltip without an arrow.
