---
"chunks-ui": patch
---

Fixed: after a `Menu` was opened from the keyboard, moving the mouse onto its padding, a separator or off the menu drew the keyboard focus ring around the popup. The ring now stays off from the first mouse move over the menu until the next key press.
