---
"chunks-ui": minor
---

`Popover.Arrow` and `Menu.Arrow` now draw an arrow. Before, they rendered an empty 0×0 element. The arrow is on the popup edge that faces the trigger, with the popup's `--popover` background and `--border` colour, on every side, logical sides included. With an arrow, the popup moves out by the arrow's length, so `sideOffset` stays the gap between the trigger and the arrow's tip. A long menu with an arrow still fits in the viewport.

The arrow stays out of the popup's rounded corners: the default `arrowPadding` of `Popover.Content` and `Menu.Content` is read when the popup opens, the corner radius plus 0.21 × the arrow's size, so it follows `--radius`, `--spacing` and `rounded-*`; a value you pass still wins. A popover or menu with an arrow that is focused from the keyboard draws its focus ring above the arrow, not under it, and the ring follows the popup's border width (for example `border-2`).

`Popover.Content` and `Menu.Content` are now `position: relative`: content that you position absolutely inside them is placed against the popup's padding box, not its border box. Without Motion, `Popover.Content` now transitions only its opacity and scale, as `Menu.Content` does.

To keep the old behaviour: remove a `Popover.Arrow` or `Menu.Arrow` you rendered for nothing, if you do not want an arrow; move absolutely positioned content by the popup's border width (1px), or pass `static` to a Content without an arrow (an arrow needs the relative popup); and pass `[transition-property:all]` to `Popover.Content` to animate every property again without Motion.
