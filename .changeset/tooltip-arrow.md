---
"chunks-ui": minor
---

`Tooltip.Arrow` now sits on the popup edge facing the trigger on every side, and keeps out of the popup's rounded corners.

- Fixed: on the logical sides (`side="inline-start"` or `"inline-end"`) the arrow had no offset and sat inside the popup. It now sits on the edge, the same as on the physical sides, in LTR and RTL.
- Fixed: the arrow scales with `--spacing` but its offset from the popup edge was a fixed 5px, so at other spacings it sat too far in or out (below 4px its corners showed past the popup edge). The offset now scales with the arrow.
- The default `arrowPadding` of `Tooltip.Positioner` is now read when the popup opens: the corner radius plus 0.21 × the arrow's size, so an arrow near a corner no longer stands in the curve. Pass `arrowPadding` to `Tooltip.Positioner` to change it.
- On a one-line tooltip with the arrow on the left or right, the two arrow-edge corners now curve less far along the edge, so the arrow's foot no longer stands in the curves. They ignore `rounded-*`; set the new `--tooltip-arrow-corner` variable on `Tooltip.Popup` to change them.
- `Tooltip.Arrow` now carries the `PopupArrow` class.
