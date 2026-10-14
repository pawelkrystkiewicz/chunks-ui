---
"chunks-ui": patch
---

Fixed: after a `Menu` was opened from the keyboard, moving the mouse from an item onto the popup's padding, a separator or off the menu drew the keyboard focus ring around the popup (Base UI moves the focus to the popup there, and Chromium keeps keyboard modality until a mouse press). The popup now keeps its ring off from the first pointer move over it until the next key press; a menu that takes focus after a key press, as when a shortcut opens it, still shows the ring.
