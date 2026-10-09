---
"chunks-ui": patch
---

Fixed: the `Tooltip` popup sat a fixed 6px from its trigger while the arrow scales with `--spacing`, so the arrow tip overlapped the trigger (by 1px at the default spacing, by more as spacing grows). The gap is now 2 spacing units, set as a margin on `Tooltip.Popup`, so the tip clears the trigger at any spacing. At the default spacing the popup sits 2px further out (8px). `Tooltip.Positioner` no longer sets a default `sideOffset`; a `sideOffset` you pass adds to the gap.
