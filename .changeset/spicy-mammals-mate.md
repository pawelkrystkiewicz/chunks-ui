---
"chunks-ui": patch
---

Fix z-index stacking on portaled components (Menu, Popover, Tooltip, Combobox, Select, DatePicker)

The `z-index` classes were previously applied to the `Popup` element, which only stacks within its `Positioner` parent. Since the `Positioner` is the element actually portaled to `<body>` and competing in the root stacking context, popups could be hidden behind page sections with `position: relative`. Z-index classes are now applied to the `Positioner` so popups reliably stack above page content.

Also wraps `Select.Positioner` (previously a raw Base UI re-export) for consistency with other compound components.
