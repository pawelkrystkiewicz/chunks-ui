---
"chunks-ui": minor
---

`Popover.Arrow` and `Menu.Arrow` now stay at least 10px from the popup's ends, so an arrow near a corner no longer sticks out of the rounded corner; set `arrowPadding` on `Popover.Content` or `Menu.Content` to change it. A popover or menu with an arrow that is focused from the keyboard now draws its focus ring above the arrow, not under it, with the same look as before.
