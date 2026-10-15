---
"chunks-ui": patch
---

Fixed: with Motion installed, a `Dialog.Popup` or `Drawer.Popup` with a `render` prop opened and closed with no animation: the element passed to `render` replaced the one the spring animates, and the CSS transition was off because Motion had loaded. Such a popup now uses the CSS transition.
