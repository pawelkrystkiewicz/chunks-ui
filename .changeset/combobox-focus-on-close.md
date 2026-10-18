---
"chunks-ui": patch
---

Fixed: in a trigger-style `Combobox` (input inside the popup), focus moves to the trigger when the popup starts to close, so Tab no longer lands on the page during the exit animation, in Safari too. A mouse click outside, or a `finalFocus` other than `true`, keeps the previous behaviour.
