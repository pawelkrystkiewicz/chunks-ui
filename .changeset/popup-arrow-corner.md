---
"chunks-ui": minor
---

`Popover.Arrow` and `Menu.Arrow` now stay out of the popup's rounded corners: the default `arrowPadding` of `Popover.Content` and `Menu.Content` is read when the popup opens (the corner radius plus 0.21 × the arrow's size); set `arrowPadding` to change it. A popover or menu with an arrow that is focused from the keyboard now draws its focus ring above the arrow, not under it.
