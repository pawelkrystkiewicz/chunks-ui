---
"chunks-ui": patch
---

Fixed: `Popover.Content`, `Menu.Content`, `Select.Popup`, `Combobox.Popup`, `Tooltip.Popup` and the `DatePicker` popup scaled in and out from their own centre. They now scale from the point on their trigger's side that Base UI sets as `--transform-origin` (`origin-(--transform-origin)`), so they grow out of the trigger, with Motion and on the CSS path. A `className` such as `origin-top` still replaces it.
