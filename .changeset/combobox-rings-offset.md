---
"chunks-ui": patch
---

Fixed: the `Combobox` popup opened flush against the input, over the bottom edge of the input's focus ring. `Combobox.Positioner` now defaults `sideOffset` to 8, as `Popover.Content` and `Menu.Content` do; a `sideOffset` you pass still wins, so pass `sideOffset={0}` to keep the old position.

Fixed: a `Combobox.Chip` that the arrow keys focused showed the browser's default outline. It now draws the library focus ring (2px of `--ring`, 2px outside the chip), like the input, and the focused chip sits above the next one, so the ring shows whole.

Fixed: a focused `Combobox.Input` inside `Combobox.Control` drew two focus rings, its own and the Control's. The Control now turns the ring of its `Combobox.Input` off, so one ring shows around the Control; a `focus-visible:outline-none` you passed to the input for this is no longer needed. A standalone input keeps its ring.
