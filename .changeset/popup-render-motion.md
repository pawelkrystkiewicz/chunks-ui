---
"chunks-ui": patch
---

Fixed: with Motion installed, a `Dialog.Popup` or `Drawer.Popup` with a `render` prop opened and closed with no animation: the element passed to `render` replaced the one the spring animates, and the CSS transition was off because Motion had loaded. Such a popup now uses the CSS transition. The Motion spring animates only the popup's own element: to restyle the popup, pass `className`; to change the element of the content, put `render` on `Dialog.Body` or `Drawer.Body`.
