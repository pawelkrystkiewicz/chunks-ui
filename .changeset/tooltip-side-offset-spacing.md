---
"chunks-ui": minor
---

Fixed: the `Tooltip` popup sat a fixed 6px from its trigger while the arrow scales with `--spacing`, so the arrow tip overlapped the trigger (by 1px at the default spacing, by more as spacing grows). The gap is now 2 spacing units, set as a margin on `Tooltip.Popup`, so the tip clears the trigger at any spacing. At the default spacing the popup sits 2px further out (8px). `Tooltip.Positioner` no longer sets a default `sideOffset`; a `sideOffset` you pass adds to the gap, so take 8px off it to keep the same distance. To keep the old 6px gap, pass `m-0!` in the `className` of `Tooltip.Popup` (its side margins carry a `data-[side]` variant, so a plain `m-0` loses to them) and `sideOffset={6}` to `Tooltip.Positioner`.
