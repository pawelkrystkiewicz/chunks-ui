---
"chunks-ui": patch
---

`Popover.Arrow` and `Menu.Arrow` now draw an arrow. Before, they rendered an empty 0×0 element. The arrow is on the popup edge that faces the trigger, with the popup's `--popover` background and `--border` colour, on every side, logical sides included. With an arrow, the popup moves out by the arrow's length, so `sideOffset` stays the gap between the trigger and the arrow's tip. A long menu with an arrow still fits in the viewport.

`Popover.Content` and `Menu.Content` are now `position: relative`: content that you position absolutely inside them is placed against the popup's padding box, not its border box. Without Motion, `Popover.Content` now transitions only its opacity and scale, as `Menu.Content` does.
