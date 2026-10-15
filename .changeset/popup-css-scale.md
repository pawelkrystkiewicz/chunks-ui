---
"chunks-ui": patch
---

Fixed: without Motion installed, `Select.Popup` and `Combobox.Popup` only faded in and out while the Motion spring also scales from `scale-95`, and while `Popover.Content`, `Menu.Content` and `Tooltip.Popup` scale on both paths. The CSS transition now scales and fades too, so the two paths match. The transition names `opacity` and `scale` only, so the `max-height` that `--available-height` drives on `Combobox.Popup` still changes at once.
