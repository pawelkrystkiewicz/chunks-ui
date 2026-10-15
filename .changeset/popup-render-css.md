---
"chunks-ui": patch
---

Fixed: with Motion installed, a `Dialog.Backdrop`, `Drawer.Backdrop`, `Popover.Content`, `Menu.Content`, `Tooltip.Popup`, `Select.Popup` or `Combobox.Popup` with a `render` prop opened and closed with no animation, as `Dialog.Popup` and `Drawer.Popup` did: the element passed to `render` replaced the one the spring animates, and the CSS transition was off because Motion had loaded. Such a part now uses the CSS transition.
