---
"chunks-ui": patch
---

Fixed: while a modal `Menu`, `Select`, `Popover` (with `modal`) or `Combobox` (with `modal`) was open (`Menu` and `Select` are modal by default), a press on a page element below the `z-dropdowns` layer (200), such as a `sticky z-10` header, reached that element: its `onClick` ran as the popup closed. Base UI's invisible backdrop, which takes presses outside a modal popup, had no z-index, so such elements painted over it. The backdrop now takes the popup's `z-dropdowns` layer, so the press closes the popup and reaches nothing, as anywhere else on the page. A positioner moved to another layer by its `className` (`z-50`, say), by an inline `z-index` or with a `!` class (`z-10!`) leaves the backdrop as before, so the backdrop does not cover the popup.
