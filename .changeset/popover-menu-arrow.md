---
"chunks-ui": patch
---

`Popover.Arrow` and `Menu.Arrow` now draw an arrow. Before, they rendered an empty 0×0 element. The arrow is on the popup edge that faces the trigger, with the popup's `--popover` background and `--border` colour, on every side, logical sides included. With an arrow, the popup moves out by the arrow's length, so `sideOffset` stays the gap between the trigger and the arrow's tip.

`Menu.Content` now scrolls its items in an inner element, so the popup does not clip the arrow while it opens or closes. A padding class on `Menu.Content` now pads outside that scroll area. `Popover.Content` and `Menu.Content` are now `position: relative`: content that you position absolutely inside them is placed against the popup's padding box, not its border box.
