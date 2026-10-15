---
"chunks-ui": patch
---

Fixed: with Motion installed, a `Dialog.Backdrop`, `Drawer.Backdrop`, `Popover.Content`, `Menu.Content`, `Tooltip.Popup`, `Select.Popup` or `Combobox.Popup` with a `render` prop opened and closed with no animation, as `Dialog.Popup` and `Drawer.Popup` did: the element passed to `render` replaced the one the spring animates, and the CSS transition was off because Motion had loaded. Such a part now uses the CSS transition. An element passed to `render` that animates itself (for example a `motion.div`) now carries the library's CSS transition classes too; add `transition-none` to its `className` to turn that transition off.
