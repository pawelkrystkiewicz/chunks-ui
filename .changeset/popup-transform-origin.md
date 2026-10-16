---
"chunks-ui": patch
---

Fixed: `Popover.Content` and `Menu.Content` (with Motion and on the CSS path), the `DatePicker` popup (CSS only), and `Tooltip.Popup`, `Select.Popup` opened below its trigger and `Combobox.Popup`, all three with Motion, scaled in and out from their own centre. They now scale from the point on their trigger's side that Base UI sets as `--transform-origin` (`origin-(--transform-origin)`), so they grow out of the trigger. On `Popover.Content`, `Menu.Content`, `Select.Popup`, `Combobox.Popup` and `Tooltip.Popup`, a `className` such as `origin-top` still replaces it.
